from fastapi import Depends

from app.dependencies.auth import get_current_user


def get_company_id(current_user=Depends(get_current_user)):
    return current_user.company_id