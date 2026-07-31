from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import Base, engine


# =====================================================
# IMPORT MODELS
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


# Customer Models
from app.models.customer import Customer
from app.models.customer_purchase_summary import (
    CustomerPurchaseSummary
)


# =====================================================
# IMPORT ROUTES
# =====================================================

from app.routes.auth import router as auth_router

from app.routes.profile import router as profile_router

from app.routes.admin import router as admin_router

from app.routes import audit

from app.routes.token import router as token_router

from app.routes.logout import router as logout_router

from app.routes.password import router as password_router

from app.routes.category import router as category_router

from app.routes.product import router as product_router

from app.routes.analytics import router as analytics_router


from app.routes import sales

from app.routes import inventory

from app.routes import notification

from app.routes import inventory_seed


# Customer Router
from app.routes.customer import (
    router as customer_router
)



# =====================================================
# CREATE DATABASE TABLES
# =====================================================

Base.metadata.create_all(
    bind=engine
)



# =====================================================
# FASTAPI APP
# =====================================================

app = FastAPI(

    title="RetailPulse Analytics API",

    version="1.0.0",

    description=
    "Multi-Tenant Retail Analytics Platform API"

)



# =====================================================
# CORS
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
# REGISTER ROUTES
# =====================================================


app.include_router(
    auth_router
)


app.include_router(
    profile_router
)


app.include_router(
    admin_router
)


app.include_router(
    token_router
)


app.include_router(
    audit.router
)


app.include_router(
    logout_router
)


app.include_router(
    password_router
)


app.include_router(
    category_router
)


app.include_router(
    product_router
)


app.include_router(
    sales.router
)


app.include_router(
    inventory.router
)


app.include_router(
    notification.router
)


app.include_router(
    inventory_seed.router
)


# Customer Module
app.include_router(
    customer_router
)


app.include_router(
    analytics_router
)



# =====================================================
# ROOT
# =====================================================

@app.get(
    "/",
    tags=["Root"]
)
def root():

    return {

        "message":
        "RetailPulse Analytics API is running",

        "version":
        "1.0.0",

        "status":
        "success",

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

        "status":
        "healthy",

        "application":
        "RetailPulse Analytics",

    }