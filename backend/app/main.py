from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import Base, engine


# =====================================================
# IMPORT ALL MODELS
# =====================================================

from app.models import (
    Company,
    User,
    RefreshToken,
    AuditLog,
)

from app.models.category import Category
from app.models.product import Product

from app.models.sale import Sale
from app.models.sale_item import SaleItem

from app.models.inventory import Inventory
from app.models.inventory_movement import InventoryMovement

from app.models.notification import Notification


# =====================================================
# CUSTOMER MODELS (TASK 8)
# =====================================================

from app.models.customer import Customer

from app.models.customer_purchase_summary import (
    CustomerPurchaseSummary
)


# =====================================================
# FORECAST MODELS (TASK 7)
# =====================================================

from app.models.demand_forecast import (
    DemandForecast
)

from app.models.forecast_history import (
    ForecastHistory
)


# =====================================================
# IMPORT ROUTERS
# =====================================================

from app.routes.auth import (
    router as auth_router
)

from app.routes.profile import (
    router as profile_router
)

from app.routes.admin import (
    router as admin_router
)

from app.routes import audit

from app.routes.token import (
    router as token_router
)

from app.routes.logout import (
    router as logout_router
)

from app.routes.password import (
    router as password_router
)


# =====================================================
# CATEGORY & PRODUCT ROUTERS
# =====================================================

from app.routes.category import (
    router as category_router
)

from app.routes.product import (
    router as product_router
)


# =====================================================
# ANALYTICS ROUTER
# =====================================================

from app.routes.analytics import (
    router as analytics_router
)


# =====================================================
# SALES / INVENTORY / NOTIFICATION ROUTERS
# =====================================================

from app.routes import sales
from app.routes import inventory
from app.routes import notification
from app.routes import inventory_seed


# =====================================================
# CUSTOMER ROUTER (TASK 8)
# =====================================================

from app.routes.customer import (
    router as customer_router
)


# =====================================================
# FORECAST ROUTER (TASK 7)
# =====================================================

from app.routes.forecast import (
    router as forecast_router
)


# =====================================================
# DATABASE INITIALIZATION
# =====================================================

Base.metadata.create_all(
    bind=engine
)


# =====================================================
# FASTAPI APPLICATION
# =====================================================

app = FastAPI(
    title="RetailPulse Analytics API",
    version="1.0.0",
    description="""
Multi Tenant Retail Analytics Platform API

Modules:

- Authentication
- Profile Management
- Admin Management
- Token Management
- Audit Logs
- Category Management
- Product Management
- Sales Analytics
- Inventory Management
- Notifications
- Customer Management & Customer Analytics (Task 8)
- Business Analytics Dashboard
- Demand Forecasting (Task 7)
"""
)


# =====================================================
# CORS CONFIGURATION
# =====================================================

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


# =====================================================
# REGISTER ROUTERS
# =====================================================


# -----------------------------------------------------
# Authentication
# -----------------------------------------------------

app.include_router(
    auth_router
)


# -----------------------------------------------------
# Profile
# -----------------------------------------------------

app.include_router(
    profile_router
)


# -----------------------------------------------------
# Admin
# -----------------------------------------------------

app.include_router(
    admin_router
)


# -----------------------------------------------------
# Tokens
# -----------------------------------------------------

app.include_router(
    token_router
)


# -----------------------------------------------------
# Audit Logs
# -----------------------------------------------------

app.include_router(
    audit.router
)


# -----------------------------------------------------
# Logout
# -----------------------------------------------------

app.include_router(
    logout_router
)


# -----------------------------------------------------
# Password
# -----------------------------------------------------

app.include_router(
    password_router
)


# -----------------------------------------------------
# Categories
# -----------------------------------------------------

app.include_router(
    category_router
)


# -----------------------------------------------------
# Products
# -----------------------------------------------------

app.include_router(
    product_router
)


# -----------------------------------------------------
# Sales
# -----------------------------------------------------

app.include_router(
    sales.router
)


# -----------------------------------------------------
# Inventory
# -----------------------------------------------------

app.include_router(
    inventory.router
)


# -----------------------------------------------------
# Notifications
# -----------------------------------------------------

app.include_router(
    notification.router
)


# -----------------------------------------------------
# Inventory Seed
# -----------------------------------------------------

app.include_router(
    inventory_seed.router
)


# =====================================================
# CUSTOMER MODULE (TASK 8)
# =====================================================

app.include_router(
    customer_router
)


# =====================================================
# ANALYTICS MODULE
# =====================================================

app.include_router(
    analytics_router
)


# =====================================================
# FORECAST MODULE (TASK 7)
# =====================================================

app.include_router(
    forecast_router
)


# =====================================================
# ROOT API
# =====================================================

@app.get(
    "/",
    tags=["Root"]
)
def root():

    return {
        "message": "RetailPulse Analytics API is running",
        "version": "1.0.0",
        "status": "success",
    }


# =====================================================
# HEALTH CHECK
# =====================================================

@app.get(
    "/health",
    tags=["Health"]
)
def health_check():

    return {
        "status": "healthy",
        "application": "RetailPulse Analytics",
        "modules": [
            "auth",
            "products",
            "sales",
            "inventory",
            "customers",
            "analytics",
            "forecast",
        ]
    }