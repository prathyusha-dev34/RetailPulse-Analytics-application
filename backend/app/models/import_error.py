from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship

from app.core.database import Base


class ImportError(Base):
    __tablename__ = "import_errors"

    id = Column(Integer, primary_key=True, index=True)
    import_id = Column(Integer, ForeignKey("import_history.id", ondelete="CASCADE"), nullable=False, index=True)
    row_number = Column(Integer, nullable=False)
    error_type = Column(String(30), nullable=False)
    field = Column(String(100), nullable=True)
    message = Column(String(500), nullable=False)
    raw_data = Column(Text, nullable=True)

    import_history = relationship("ImportHistory", back_populates="errors")
