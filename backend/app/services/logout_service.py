from sqlalchemy.orm import Session

from app.models.refresh_token import RefreshToken


def logout_user(db: Session, user_id: int):

    db.query(RefreshToken).filter(
        RefreshToken.user_id == user_id
    ).delete()

    db.commit()

    return {
        "message": "Logged out successfully"
    }