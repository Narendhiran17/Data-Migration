from typing import Any, Optional

class AppException(Exception):
    def __init__(self, message: str, code: str = "INTERNAL_ERROR", status_code: int = 500, details: Optional[Any] = None):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details

class NotFoundException(AppException):
    def __init__(self, message: str = "Resource not found", code: str = "NOT_FOUND", details: Optional[Any] = None):
        super().__init__(message=message, code=code, status_code=404, details=details)

class BadRequestException(AppException):
    def __init__(self, message: str = "Bad request", code: str = "BAD_REQUEST", details: Optional[Any] = None):
        super().__init__(message=message, code=code, status_code=400, details=details)

class FileProcessingException(AppException):
    def __init__(self, message: str = "File processing failed", code: str = "FILE_PROCESSING_ERROR", details: Optional[Any] = None):
        super().__init__(message=message, code=code, status_code=422, details=details)
