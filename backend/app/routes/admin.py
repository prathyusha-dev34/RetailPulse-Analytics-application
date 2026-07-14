from fastapi import APIRouter, Depends

from app.dependencies.roles import require_roles

router = APIRouter(
    prefix="/admin",
    tags=["Admin"]
)


@router.get("/dashboard")
def admin_dashboard(
    current_user=Depends(
        require_roles(
            "SUPER_ADMIN",
            "COMPANY_ADMIN",
        )
    )
):
    return {
        "message": "Welcome Admin",
        "user": current_user.name,
        "role": current_user.role,
    }