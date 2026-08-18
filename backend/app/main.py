from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import Base, engine

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

from app.models.customer import Customer
from app.models.customer_purchase_summary import CustomerPurchaseSummary

from app.models.demand_forecast import DemandForecast
from app.models.forecast_history import ForecastHistory


from app.routes.auth import router as auth_router
from app.routes.profile import router as profile_router
from app.routes.admin import router as admin_router
from app.routes import audit
from app.routes.token import router as token_router
from app.routes.logout import router as logout_router
from app.routes.password import router as password_router

from app.routes.category import router as category_router
from app.routes.product import router as product_router

from app.routes import sales
from app.routes import inventory
from app.routes import notification
from app.routes import inventory_seed

from app.routes.customer import router as customer_router
from app.routes.analytics import router as analytics_router
from app.routes.forecast import router as forecast_router


Base.metadata.create_all(
    bind=engine
)


app = FastAPI(
    title="RetailPulse Analytics API",
    version="1.0.0"
)


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


API_PREFIX = "/api"


app.include_router(
    auth_router,
    prefix=API_PREFIX
)

app.include_router(
    profile_router,
    prefix=API_PREFIX
)

app.include_router(
    admin_router,
    prefix=API_PREFIX
)

app.include_router(
    token_router,
    prefix=API_PREFIX
)

app.include_router(
    audit.router,
    prefix=API_PREFIX
)

app.include_router(
    logout_router,
    prefix=API_PREFIX
)

app.include_router(
    password_router,
    prefix=API_PREFIX
)

app.include_router(
    category_router,
    prefix=API_PREFIX
)

app.include_router(
    product_router,
    prefix=API_PREFIX
)

app.include_router(
    sales.router,
    prefix=API_PREFIX
)

app.include_router(
    inventory.router,
    prefix=API_PREFIX
)

app.include_router(
    notification.router,
    prefix=API_PREFIX
)

app.include_router(
    inventory_seed.router,
    prefix=API_PREFIX
)

app.include_router(
    customer_router,
    prefix=API_PREFIX
)

app.include_router(
    analytics_router,
    prefix=API_PREFIX
)

app.include_router(
    forecast_router,
    prefix=API_PREFIX
)


@app.get("/")
def root():
    return {
        "message": "RetailPulse Analytics API is running",
        "version": "1.0.0",
        "status": "success",
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "application": "RetailPulse Analytics",
        "modules": [
            "auth",
            "profile",
            "admin",
            "token",
            "audit",
            "logout",
            "password",
            "categories",
            "products",
            "sales",
            "inventory",
            "notifications",
            "customers",
            "analytics",
            "forecast",
        ]
    }