from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import Base, engine

# =========================
# Import Models
# =========================
from app.models import Company, User, RefreshToken, AuditLog
from app.models.category import Category
from app.models.product import Product
from app.models.sale import Sale
from app.models.sale_item import SaleItem

# =========================
# Import Routes
# =========================
from app.routes.auth import router as auth_router
from app.routes.profile import router as profile_router
from app.routes.admin import router as admin_router
from app.routes.token import router as token_router
from app.routes.logout import router as logout_router
from app.routes.password import router as password_router
from app.routes.category import router as category_router
from app.routes.product import router as product_router
from app.routes import sales

# =========================
# Create Database Tables
# =========================
Base.metadata.create_all(bind=engine)

# =========================
# FastAPI App
# =========================
app = FastAPI(
    title="RetailPulse Analytics API",
    version="1.0.0",
    description="Multi-Tenant Retail Analytics Platform API",
)

# =========================
# CORS
# =========================
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================
# Register Routes
# =========================
app.include_router(auth_router)
app.include_router(profile_router)
app.include_router(admin_router)
app.include_router(token_router)
app.include_router(logout_router)
app.include_router(password_router)
app.include_router(category_router)
app.include_router(product_router)
app.include_router(sales.router)

# =========================
# Root
# =========================
@app.get("/", tags=["Root"])
def root():
    return {
        "message": "RetailPulse Analytics API is running",
        "version": "1.0.0",
        "status": "success",
    }


# =========================
# Health Check
# =========================
@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "application": "RetailPulse Analytics API",
    }