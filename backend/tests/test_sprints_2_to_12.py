import pytest
import tempfile
from pathlib import Path
from sqlalchemy.orm import Session

from app.core.database import SessionLocal, engine, Base
from app.models.migration_project import MigrationProject
from app.connectors.zoho.factory import ZohoConnectorFactory
from app.engines.mapping.scorer import MappingScorer
from app.engines.mapping.engine import MappingEngine
from app.engines.transformation.executor import TransformationExecutor
from app.engines.validation.validator import RecordValidator
from app.engines.dependency.graph import DependencyEngine
from app.engines.export.generator import PackageGenerator
from app.engines.migration.executor import MigrationExecutor
from app.engines.audit.logger import AuditService

@pytest.fixture
def db():
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    yield session
    session.close()

def test_sprint_2_zoho_crm_metadata():
    connector = ZohoConnectorFactory.get_connector("CRM")
    modules = connector.discover_modules()
    assert any(m["api_name"] == "Leads" for m in modules)
    assert any(m["api_name"] == "Contacts" for m in modules)
    assert any(m["api_name"] == "Accounts" for m in modules)

    lead_fields = connector.discover_fields("Leads")
    field_names = [f["api_name"] for f in lead_fields]
    assert "Last_Name" in field_names
    assert "Company" in field_names
    assert "Email" in field_names

    # Check relationships
    deal_rels = connector.discover_relationships("Deals")
    assert any(r["parent_module"] == "Accounts" for r in deal_rels)

def test_sprint_7_zoho_creator_metadata():
    connector = ZohoConnectorFactory.get_connector("CREATOR")
    forms = connector.discover_modules()
    assert any(f["api_name"] == "Customer_Onboarding" for f in forms)

    fields = connector.discover_fields("Customer_Onboarding")
    field_names = [f["api_name"] for f in fields]
    assert "Customer_Name" in field_names
    assert "Company_Email" in field_names

def test_sprint_9_and_11_additional_connectors():
    books_conn = ZohoConnectorFactory.get_connector("BOOKS")
    assert any(m["api_name"] == "Customers" for m in books_conn.discover_modules())

    desk_conn = ZohoConnectorFactory.get_connector("DESK")
    assert any(m["api_name"] == "Tickets" for m in desk_conn.discover_modules())

def test_sprint_3_mapping_scorer_formula():
    # Exact name + type match
    score, reason = MappingScorer.calculate_score(
        src_name="Email",
        src_type="Email",
        samples=["user@zoho.com"],
        tgt_name="Email",
        tgt_type="email",
        constraints={}
    )
    assert score >= 0.90
    assert "Name match" in reason

    # Synonym match: Customer_Name -> Contact_Name
    score_syn, reason_syn = MappingScorer.calculate_score(
        src_name="Customer_Name",
        src_type="Text",
        samples=["Acme Corp"],
        tgt_name="Account_Name",
        tgt_type="text",
        constraints={}
    )
    assert score_syn >= 0.70

def test_sprint_4_transformation_dsl():
    raw_record = {
        "raw_name": "  acme corp  ",
        "raw_phone": " (987) 654-3210 ",
        "raw_date": "15-11-2026",
        "raw_status": "Cold"
    }
    rules = [
        {"target_field": "Account_Name", "rule_type": "trim", "configuration": {}, "execution_order": 1, "enabled": True},
        {"target_field": "Account_Name", "rule_type": "uppercase", "configuration": {}, "execution_order": 2, "enabled": True},
        {"target_field": "Phone", "rule_type": "phone_normalize", "configuration": {"country_code": "1"}, "execution_order": 1, "enabled": True},
        {"target_field": "Closing_Date", "rule_type": "date_format", "configuration": {"output_format": "%Y-%m-%d"}, "execution_order": 1, "enabled": True},
        {"target_field": "Stage", "rule_type": "picklist_map", "configuration": {"mapping": {"Cold": "Lost Lead"}}, "execution_order": 1, "enabled": True},
    ]
    mappings = {
        "Account_Name": "raw_name",
        "Phone": "raw_phone",
        "Closing_Date": "raw_date",
        "Stage": "raw_status"
    }

    results = TransformationExecutor.preview_transformations([raw_record], rules, mappings)
    transformed = results[0]

    assert transformed["Account_Name"] == "ACME CORP"
    assert "9876543210" in transformed["Phone"]
    assert transformed["Closing_Date"] == "2026-11-15"
    assert transformed["Stage"] == "Lost Lead"

def test_sprint_5_dependency_dag_and_validation():
    # 1. Dependency DAG test
    entities = ["Deals", "Accounts", "Contacts"]
    relationships = [
        {"parent": "Accounts", "child": "Contacts"},
        {"parent": "Contacts", "child": "Deals"}
    ]
    order, has_cycle, _ = DependencyEngine.build_dependency_order(entities, relationships)
    assert has_cycle is False
    assert order.index("Accounts") < order.index("Contacts")
    assert order.index("Contacts") < order.index("Deals")

    # 2. Validation Engine test
    target_fields = [
        {"api_name": "Last_Name", "data_type": "text", "is_mandatory": True, "constraints": {}},
        {"api_name": "Email", "data_type": "email", "is_mandatory": False, "constraints": {}},
        {"api_name": "Lead_Status", "data_type": "picklist", "is_mandatory": False, "constraints": {"allowed_values": ["Qualified", "Lost"]}}
    ]

    invalid_records = [
        {"Last_Name": "", "Email": "not_an_email", "Lead_Status": "InvalidChoice"},  # multiple errors
        {"Last_Name": "Valid Name", "Email": "test@zoho.com", "Lead_Status": "Qualified"}  # valid
    ]

    val_res = RecordValidator.validate_dataset(invalid_records, target_fields)
    assert val_res["total_records"] == 2
    assert val_res["valid_records"] == 1
    assert val_res["invalid_records"] == 1
    assert len(val_res["errors"]) >= 3

def test_sprint_6_package_generator(tmp_path):
    output_zip = tmp_path / "test_package.zip"
    transformed_data = {
        "Leads": [
            {"Last_Name": "Doe", "Email": "doe@example.com", "Company": "Acme Inc"},
            {"Last_Name": "Smith", "Email": "smith@example.com", "Company": "Tech Corp"}
        ]
    }
    pkg_res = PackageGenerator.generate_zip_package(
        project_name="Acme Package Test",
        target_product="CRM",
        transformed_modules=transformed_data,
        mappings={"Last_Name": "src_name"},
        dependency_order=["Leads"],
        validation_summary={"valid_records": 2, "invalid_records": 0},
        output_path=output_zip
    )

    assert output_zip.exists()
    assert pkg_res["record_count"] == 2
    assert len(pkg_res["checksum"]) == 64

def test_sprint_10_and_12_migration_and_audit(db: Session):
    # Create test project
    proj = MigrationProject(name="Migration Test Suite Project", target_product="CRM")
    db.add(proj)
    db.commit()
    db.refresh(proj)

    records = [
        {"Customer_ID": "C1001", "Last_Name": "Wayne", "Company": "Wayne Enterprises"},
        {"Customer_ID": "C1002", "Last_Name": "Kent", "Company": "Daily Planet"}
    ]

    executor = MigrationExecutor(db)
    result = executor.execute_migration(
        project_id=proj.id,
        target_product="CRM",
        target_module="Leads",
        records=records,
        execution_mode="dry_run"
    )

    assert result["status"] == "completed"
    assert result["successful_records"] == 2
    assert result["id_mappings_created"] == 2

    # Verify Audit Logging
    audit_log = AuditService.log_action(
        db=db,
        action="test_audit_event",
        resource_type="migration",
        project_id=proj.id,
        metadata={"detail": "Passed all sprint test suites"}
    )
    assert audit_log.id is not None
