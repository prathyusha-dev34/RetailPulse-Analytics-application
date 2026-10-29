
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import Base, engine


# ============================================================
# DATABASE MODELS
# ============================================================

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
from app.models.import_history import ImportHistory
from app.models.import_error import ImportError
from app.models.report_history import ReportHistory
from app.models.scheduled_report import ScheduledReport

# Task 16: Data Quality Models
from app.models.data_quality import (
    DataQualityIssue,
    ReconciliationRun,
)


# ============================================================
# EXISTING ROUTERS
# ============================================================

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
from app.routes.data_import import router as data_import_router

# Task 15: Reports
from app.routes.reports import router as reports_router

# Task 16: Data Quality
from app.routes.data_quality import router as data_quality_router


# ============================================================
# DATABASE INITIALIZATION
# ============================================================

Base.metadata.create_all(bind=engine)


# ============================================================
# FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title="RetailPulse Analytics API",
    version="1.0.0",
    description=(
        "RetailPulse Analytics API with Sales, Inventory, "
        "Customers, Reports, Scheduled Reports, and "
        "Data Quality Reconciliation."
    ),
)


# ============================================================
# CORS
# ============================================================

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


# ============================================================
# REGISTER EXISTING ROUTERS
# ============================================================

app.include_router(auth_router, prefix=API_PREFIX)
app.include_router(profile_router, prefix=API_PREFIX)
app.include_router(admin_router, prefix=API_PREFIX)
app.include_router(token_router, prefix=API_PREFIX)
app.include_router(audit.router, prefix=API_PREFIX)
app.include_router(logout_router, prefix=API_PREFIX)
app.include_router(password_router, prefix=API_PREFIX)
app.include_router(category_router, prefix=API_PREFIX)
app.include_router(product_router, prefix=API_PREFIX)
app.include_router(sales.router, prefix=API_PREFIX)
app.include_router(inventory.router, prefix=API_PREFIX)
app.include_router(notification.router, prefix=API_PREFIX)
app.include_router(inventory_seed.router, prefix=API_PREFIX)
app.include_router(customer_router, prefix=API_PREFIX)
app.include_router(analytics_router, prefix=API_PREFIX)
app.include_router(forecast_router, prefix=API_PREFIX)
app.include_router(data_import_router, prefix=API_PREFIX)


# ============================================================
# TASK 15: REPORTING & SCHEDULED REPORTS
# ============================================================

app.include_router(
    reports_router,
    prefix=API_PREFIX,
)


# ============================================================
# TASK 16: DATA QUALITY & RECONCILIATION
# ============================================================

app.include_router(
    data_quality_router,
    prefix=API_PREFIX,
)


# ============================================================
# ROOT ENDPOINT
# ============================================================

@app.get("/")
def root():
    return {
        "message": "RetailPulse Analytics API is running",
        "version": "1.0.0",
        "status": "success",
    }


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "application": "RetailPulse Analytics",
        "version": "1.0.0",
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
            "data_import",
            "reports",
            "scheduled_reports",
            "data_quality",
        ],
    }

