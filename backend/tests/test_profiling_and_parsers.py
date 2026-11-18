import pytest
import os
import openpyxl
from pathlib import Path
from app.connectors.sources.csv.parser import CSVParser
from app.connectors.sources.json.parser import JSONParser
from app.connectors.sources.excel.parser import ExcelParser
from app.engines.profiling.profiler import DataProfiler

@pytest.fixture
def tmp_dir(tmp_path):
    return tmp_path

def test_csv_parser_with_quoted_commas_and_utf8(tmp_dir):
    csv_file = tmp_dir / "test_tamil.csv"
    # Content with UTF-8 Tamil text, quoted commas, and normal strings
    content = 'ID,Name,Description,Amount\n1,"சரவணன், குமார்",Tamil Name Test,150.50\n2,John Doe,"Normal, quoted description",200\n'
    csv_file.write_text(content, encoding="utf-8")

    parser = CSVParser()
    result = parser.parse(csv_file)

    assert "default" in result
    sheet = result["default"]
    assert sheet["total_rows"] == 2
    assert sheet["columns"] == ["ID", "Name", "Description", "Amount"]
    assert sheet["records"][0]["Name"] == "சரவணன், குமார்"
    assert sheet["records"][1]["Description"] == "Normal, quoted description"

def test_json_parser_record_array(tmp_dir):
    json_file = tmp_dir / "test.json"
    content = '[{"id": 1, "email": "user1@example.com"}, {"id": 2, "email": "user2@example.com"}]'
    json_file.write_text(content, encoding="utf-8")

    parser = JSONParser()
    result = parser.parse(json_file)

    assert "default" in result
    sheet = result["default"]
    assert sheet["total_rows"] == 2
    assert "email" in sheet["columns"]
    assert "id" in sheet["columns"]

def test_excel_regression_fixture_customers(tmp_dir):
    """
    Validates Section 22.8 Sample regression fixture:
    customers.xlsx
    Customer_ID | Customer_Name    | Email         | Phone      | Created_Date
    C001        | ABC Technologies | abc@gmail.com | 9876543210 | 12-11-2026
    C002        | XYZ Solutions    | xyz@gmail.com | 9876543211 | 10-11-2026
    C003        | ABC Technologies | abc@gmail.com | 9876543210 | 12-11-2026
    C004        | Global Systems   | InvalidEmail  | 9876543212 | 15-11-2026
    """
    xlsx_file = tmp_dir / "customers.xlsx"
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Customers"

    headers = ["Customer_ID", "Customer_Name", "Email", "Phone", "Created_Date"]
    ws.append(headers)

    rows = [
        ["C001", "ABC Technologies", "abc@gmail.com", "9876543210", "12-11-2026"],
        ["C002", "XYZ Solutions", "xyz@gmail.com", "9876543211", "10-11-2026"],
        ["C003", "ABC Technologies", "abc@gmail.com", "9876543210", "12-11-2026"],
        ["C004", "Global Systems", "InvalidEmail", "9876543212", "15-11-2026"],
    ]
    for r in rows:
        ws.append(r)
    wb.save(xlsx_file)

    # 1. Parse Excel
    parser = ExcelParser()
    parsed = parser.parse(xlsx_file)

    assert "Customers" in parsed
    sheet_data = parsed["Customers"]
    assert sheet_data["total_rows"] == 4
    assert sheet_data["columns"] == headers

    # 2. Run DataProfiler
    profile = DataProfiler.profile_sheet(
        sheet_name="Customers",
        records=sheet_data["records"],
        columns=sheet_data["columns"]
    )

    assert profile.total_rows == 4
    assert profile.total_columns == 5
    # 1 duplicate row (C003 is identical to C001 in values except ID? Wait, C003 has C003 as ID, but Name/Email/Phone/Date duplicate)
    # Check column profiles
    col_map = {c.column_name: c for c in profile.columns}

    # Customer_ID
    assert col_map["Customer_ID"].null_count == 0
    assert col_map["Customer_ID"].is_candidate_identifier is True

    # Email
    assert col_map["Email"].inferred_type == "Email"
    assert col_map["Email"].invalid_format_count == 1  # "InvalidEmail" is invalid
    assert col_map["Email"].is_candidate_email is True

    # Phone
    assert col_map["Phone"].inferred_type == "Phone"
    assert col_map["Phone"].is_candidate_phone is True

    # Created_Date
    assert col_map["Created_Date"].inferred_type == "Date"
    assert col_map["Created_Date"].is_candidate_date is True

    # Customer_Name has 1 duplicate
    assert col_map["Customer_Name"].duplicate_count == 1
