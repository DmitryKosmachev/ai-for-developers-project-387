"""Доменные ошибки, отображаемые в формат контракта { code, message }."""


class ApiException(Exception):
    def __init__(self, status_code: int, code: str, message: str):
        super().__init__(message)
        self.status_code = status_code
        self.code = code
        self.message = message


def not_found(message: str) -> ApiException:
    return ApiException(404, "not_found", message)


def slot_taken(message: str) -> ApiException:
    return ApiException(409, "slot_taken", message)


def validation_error(message: str) -> ApiException:
    return ApiException(422, "validation_error", message)
