from fastapi import Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse


def register_exception_handlers(app):

    @app.exception_handler(RequestValidationError)
    async def validation_error_handler(
        request: Request,
        exc: RequestValidationError
    ):
        return JSONResponse(
            status_code=422,
            content={
                "status": "error",
                "type": "validation_error",
                "message": "Invalid request data.",
                "details": exc.errors()
            }
        )

    @app.exception_handler(Exception)
    async def general_error_handler(
        request: Request,
        exc: Exception
    ):
        print(f"Unexpected error: {exc}")

        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "type": "internal_server_error",
                "message":
                    "An unexpected server error occurred."
            }
        )