from datetime import datetime, timedelta
from decimal import Decimal
import csv
import io

from sqlalchemy import func, desc
from sqlalchemy.orm import Session, joinedload

from app.models.sale import Sale
from app.models.sale_item import SaleItem
from app.models.product import Product
from app.models.demand_forecast import DemandForecast
from app.models.forecast_history import ForecastHistory
from app.models.user import User
from app.models.notification import Notification


# ==========================================================
# PDF
# ==========================================================

from reportlab.platypus import (
    SimpleDocTemplate,
    Table,
    TableStyle,
    Paragraph,
    Spacer,
)
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors


# ==========================================================
# CONSTANTS
# ==========================================================

FORECAST_PERIODS = {
    "7_DAYS": 7,
    "30_DAYS": 30,
    "90_DAYS": 90,
}

VALID_FORECAST_PERIODS = set(
    FORECAST_PERIODS.keys()
)

DEFAULT_FORECAST_DAYS = 30
HISTORICAL_DAYS = 30
DEFAULT_REORDER_LEVEL = 10


# ==========================================================
# RECOMMENDATIONS
# ==========================================================

IMMEDIATE_RESTOCK = "Immediate Restock Required"
REORDER_SOON = "Reorder Soon"
OVERSTOCK_RISK = "Overstock Risk"
STOCK_HEALTHY = "Stock Level Healthy"

STABLE_DEMAND = "Stable Demand"
HIGH_GROWTH = "High Growth"
DECLINING_DEMAND = "Declining Demand"


# ==========================================================
# NORMALIZE FORECAST PERIOD
# ==========================================================

def normalize_forecast_period(
    period: str | None,
) -> str | None:

    if not period:
        return None

    value = (
        str(period)
        .strip()
        .upper()
        .replace("-", "_")
        .replace(" ", "_")
    )

    aliases = {
        "7_DAYS": "7_DAYS",
        "7_DAY": "7_DAYS",
        "7": "7_DAYS",

        "30_DAYS": "30_DAYS",
        "30_DAY": "30_DAYS",
        "30": "30_DAYS",

        "90_DAYS": "90_DAYS",
        "90_DAY": "90_DAYS",
        "90": "90_DAYS",

        "CUSTOM": "CUSTOM",
    }

    return aliases.get(value)


# ==========================================================
# VALIDATE FORECAST PERIOD
# ==========================================================

def validate_forecast_period(
    forecast_period: str,
) -> str:

    normalized = normalize_forecast_period(
        forecast_period
    )

    if normalized not in VALID_FORECAST_PERIODS:

        raise ValueError(
            "Invalid forecast period. "
            "Allowed values: 7_DAYS, 30_DAYS, 90_DAYS"
        )

    return normalized


# ==========================================================
# DECIMAL
# ==========================================================

def format_decimal(value):

    if value is None:
        return Decimal("0.00")

    return Decimal(str(value))


# ==========================================================
# FORECAST DAYS
# ==========================================================

def get_forecast_days(
    forecast_period: str,
    start_date=None,
    end_date=None,
):

    normalized = normalize_forecast_period(
        forecast_period
    )

    if normalized == "CUSTOM":

        if start_date and end_date:
            return (
                end_date - start_date
            ).days + 1

        return DEFAULT_FORECAST_DAYS

    return FORECAST_PERIODS.get(
        normalized,
        DEFAULT_FORECAST_DAYS,
    )


# ==========================================================
# DATE RANGE
# ==========================================================

def get_date_range(
    forecast_period,
    start_date=None,
    end_date=None,
):

    normalized = normalize_forecast_period(
        forecast_period
    )

    if normalized == "CUSTOM":

        return start_date, end_date

    days = get_forecast_days(
        normalized
    )

    end = datetime.now()

    start = (
        end
        - timedelta(days=days)
    )

    return start, end


# ==========================================================
# MOVING AVERAGE
# ==========================================================

def calculate_moving_average(
    total_sales: int,
    days: int,
):

    if days <= 0:
        return 0

    return round(
        total_sales / days,
        2,
    )


# ==========================================================
# PREDICTION
# ==========================================================

def calculate_prediction(
    historical_sales: int,
    forecast_period: str,
    start_date=None,
    end_date=None,
):

    days = get_forecast_days(
        forecast_period,
        start_date,
        end_date,
    )

    daily_average = calculate_moving_average(
        historical_sales,
        HISTORICAL_DAYS,
    )

    prediction = (
        daily_average * days
    )

    return int(
        round(prediction)
    )


# ==========================================================
# GROWTH
# ==========================================================

def calculate_growth_percentage(
    historical_sales,
    predicted_demand,
):

    if not historical_sales:
        return 0.0

    growth = (
        (
            predicted_demand
            - historical_sales
        )
        / historical_sales
    ) * 100

    return round(
        growth,
        2,
    )


# ==========================================================
# CONFIDENCE
# ==========================================================

def calculate_confidence_score(
    historical_sales: int,
):

    if historical_sales >= 100:
        return 90.0

    if historical_sales >= 50:
        return 75.0

    if historical_sales >= 10:
        return 60.0

    return 40.0


# ==========================================================
# ACCURACY
# ==========================================================

def calculate_forecast_accuracy(
    historical_sales: int,
    predicted_demand: int,
):

    if historical_sales == 0:
        return 0.0

    error = abs(
        historical_sales
        - predicted_demand
    )

    accuracy = (
        1
        - (
            error
            / historical_sales
        )
    ) * 100

    return round(
        max(
            accuracy,
            0,
        ),
        2,
    )


# ==========================================================
# INVENTORY RECOMMENDATION
# ==========================================================

def calculate_inventory_recommendations(
    current_stock: int,
    available_stock: int,
    reorder_level: int,
    predicted_demand: int,
):

    if predicted_demand > available_stock:

        if available_stock <= 0:
            return IMMEDIATE_RESTOCK

        return REORDER_SOON

    if available_stock > (
        predicted_demand * 3
    ):
        return OVERSTOCK_RISK

    if available_stock <= reorder_level:
        return REORDER_SOON

    return STOCK_HEALTHY


# ==========================================================
# CATEGORY RECOMMENDATION
# ==========================================================

def calculate_category_recommendation(
    growth_percentage: float,
):

    if growth_percentage >= 20:
        return HIGH_GROWTH

    if growth_percentage <= -20:
        return DECLINING_DEMAND

    return STABLE_DEMAND


# ==========================================================
# FORECAST VALUE
# ==========================================================

def calculate_forecast_value(
    predicted_demand,
    unit_price,
):

    return (
        format_decimal(unit_price)
        * Decimal(
            str(predicted_demand)
        )
    )


# ==========================================================
# HISTORICAL SALES
# ==========================================================

def get_historical_sales(
    db: Session,
    company_id: int,
    product_id: int,
    start_date=None,
    end_date=None,
):

    query = (
        db.query(
            func.coalesce(
                func.sum(
                    SaleItem.quantity
                ),
                0,
            )
        )
        .join(
            Sale,
            Sale.id == SaleItem.sale_id,
        )
        .filter(
            Sale.company_id == company_id,
            SaleItem.product_id == product_id,
        )
    )

    if hasattr(
        Sale,
        "is_deleted",
    ):

        query = query.filter(
            Sale.is_deleted == False
        )

    if start_date and end_date:

        query = query.filter(
            Sale.sale_date >= start_date,
            Sale.sale_date <= end_date,
        )

    else:

        query = query.filter(
            Sale.sale_date >= (
                datetime.now()
                - timedelta(
                    days=HISTORICAL_DAYS
                )
            )
        )

    result = query.scalar()

    return int(
        result or 0
    )


# ==========================================================
# DAILY SALES HISTORY
# ==========================================================

def get_daily_sales_history(
    db: Session,
    company_id: int,
    product_id: int,
):

    start_date = (
        datetime.now()
        - timedelta(
            days=HISTORICAL_DAYS
        )
    )

    query = (
        db.query(
            func.date(
                Sale.sale_date
            ).label("date"),

            func.sum(
                SaleItem.quantity
            ).label("quantity"),
        )
        .join(
            Sale,
            Sale.id == SaleItem.sale_id,
        )
        .filter(
            Sale.company_id == company_id,
            SaleItem.product_id == product_id,
            Sale.sale_date >= start_date,
        )
    )

    if hasattr(
        Sale,
        "is_deleted",
    ):

        query = query.filter(
            Sale.is_deleted == False
        )

    rows = (
        query
        .group_by(
            func.date(
                Sale.sale_date
            )
        )
        .order_by(
            func.date(
                Sale.sale_date
            )
        )
        .all()
    )

    return [
        {
            "date": row.date,
            "quantity": int(
                row.quantity or 0
            ),
        }
        for row in rows
    ]


# ==========================================================
# PRODUCT VALIDATION
# ==========================================================

def validate_product_for_forecast(
    db: Session,
    company_id: int,
    product_id: int,
):

    query = (
        db.query(Product)
        .options(
            joinedload(
                Product.category
            )
        )
        .filter(
            Product.id == product_id,
            Product.company_id == company_id,
        )
    )

    if hasattr(
        Product,
        "status",
    ):

        query = query.filter(
            Product.status == "ACTIVE"
        )

    product = query.first()

    if not product:

        raise ValueError(
            "Inactive or invalid product "
            "cannot generate forecast"
        )

    return product


# ==========================================================
# PREPARE FORECAST DATA
# ==========================================================

def prepare_forecast_data(
    db: Session,
    company_id: int,
    product_id: int,
    forecast_period: str,
):

    forecast_period = validate_forecast_period(
        forecast_period
    )

    product = validate_product_for_forecast(
        db=db,
        company_id=company_id,
        product_id=product_id,
    )

    historical_sales = get_historical_sales(
        db=db,
        company_id=company_id,
        product_id=product_id,
    )

    if historical_sales == 0:

        raise ValueError(
            "Forecast requires historical sales data"
        )

    predicted_demand = calculate_prediction(
        historical_sales,
        forecast_period,
    )

    growth_percentage = (
        calculate_growth_percentage(
            historical_sales,
            predicted_demand,
        )
    )

    confidence = (
        calculate_confidence_score(
            historical_sales
        )
    )

    accuracy = (
        calculate_forecast_accuracy(
            historical_sales,
            predicted_demand,
        )
    )

    current_stock = int(
        product.stock_quantity or 0
    )

    available_stock = current_stock

    reorder_level = DEFAULT_REORDER_LEVEL

    recommendation = (
        calculate_inventory_recommendations(
            current_stock=current_stock,
            available_stock=available_stock,
            reorder_level=reorder_level,
            predicted_demand=predicted_demand,
        )
    )

    forecast_value = (
        calculate_forecast_value(
            predicted_demand,
            product.unit_price,
        )
    )

    return {
        "product": product,

        "historical_sales":
            historical_sales,

        "predicted_demand":
            predicted_demand,

        "expected_growth_percentage":
            growth_percentage,

        "confidence_score":
            confidence,

        "forecast_accuracy":
            accuracy,

        "current_stock":
            current_stock,

        "available_stock":
            available_stock,

        "reorder_level":
            reorder_level,

        "recommendation":
            recommendation,

        "forecast_value":
            forecast_value,
    }


# ==========================================================
# EXISTING FORECAST
# ==========================================================

def check_existing_forecast(
    db: Session,
    company_id: int,
    product_id: int,
    forecast_period: str,
):

    forecast_period = validate_forecast_period(
        forecast_period
    )

    return (
        db.query(DemandForecast)
        .filter(
            DemandForecast.company_id
            == company_id,

            DemandForecast.product_id
            == product_id,

            DemandForecast.forecast_period
            == forecast_period,
        )
        .order_by(
            desc(
                DemandForecast.generated_at
            ),
            desc(
                DemandForecast.id
            ),
        )
        .first()
    )


# ==========================================================
# SAVE FORECAST HISTORY
# ==========================================================

def save_forecast_history(
    db: Session,
    forecast_id: int,
    historical_sales: int,
    prediction: int,
    accuracy: float,
):

    history = ForecastHistory(
        forecast_id=forecast_id,
        historical_sales=historical_sales,
        prediction=prediction,
        accuracy=accuracy,
    )

    db.add(history)

    return history


# ==========================================================
# CREATE / UPDATE FORECAST
# ==========================================================

def create_or_update_forecast(
    db: Session,
    company_id: int,
    product_id: int,
    forecast_period: str,
):

    forecast_period = validate_forecast_period(
        forecast_period
    )

    try:

        data = prepare_forecast_data(
            db=db,
            company_id=company_id,
            product_id=product_id,
            forecast_period=forecast_period,
        )

        product = data["product"]

        existing = check_existing_forecast(
            db=db,
            company_id=company_id,
            product_id=product_id,
            forecast_period=forecast_period,
        )

        if existing:

            forecast = existing

            forecast.predicted_demand = (
                data["predicted_demand"]
            )

            forecast.historical_sales = (
                data["historical_sales"]
            )

            forecast.expected_growth_percentage = (
                data[
                    "expected_growth_percentage"
                ]
            )

            forecast.confidence_score = (
                data["confidence_score"]
            )

            forecast.forecast_accuracy = (
                data["forecast_accuracy"]
            )

            forecast.current_stock = (
                data["current_stock"]
            )

            forecast.available_stock = (
                data["available_stock"]
            )

            forecast.reorder_level = (
                data["reorder_level"]
            )

            forecast.recommendation = (
                data["recommendation"]
            )

            forecast.forecast_value = (
                data["forecast_value"]
            )

            forecast.forecast_period = (
                forecast_period
            )

        else:

            forecast = DemandForecast(

                company_id=company_id,

                product_id=product.id,

                category_id=product.category_id,

                forecast_period=forecast_period,

                historical_sales=
                    data["historical_sales"],

                predicted_demand=
                    data["predicted_demand"],

                expected_growth_percentage=
                    data[
                        "expected_growth_percentage"
                    ],

                confidence_score=
                    data["confidence_score"],

                forecast_accuracy=
                    data["forecast_accuracy"],

                current_stock=
                    data["current_stock"],

                available_stock=
                    data["available_stock"],

                reorder_level=
                    data["reorder_level"],

                recommendation=
                    data["recommendation"],

                forecast_value=
                    data["forecast_value"],
            )

            db.add(forecast)

            db.flush()

        save_forecast_history(
            db=db,
            forecast_id=forecast.id,
            historical_sales=
                data["historical_sales"],
            prediction=
                data["predicted_demand"],
            accuracy=
                data["forecast_accuracy"],
        )

        db.commit()

        db.refresh(forecast)

        return forecast

    except Exception:

        db.rollback()

        raise


# ==========================================================
# GENERATE ALL FORECASTS
# ==========================================================

def generate_all_forecasts(
    db: Session,
    company_id: int,
    forecast_period: str,
):

    """
    IMPORTANT:
    This function is intentionally defined at module level.

    forecast.py imports this function directly.
    """

    forecast_period = validate_forecast_period(
        forecast_period
    )

    query = (
        db.query(Product)
        .filter(
            Product.company_id == company_id
        )
    )

    if hasattr(
        Product,
        "status",
    ):

        query = query.filter(
            Product.status == "ACTIVE"
        )

    products = query.all()

    forecasts = []

    for product in products:

        try:

            forecast = (
                create_or_update_forecast(
                    db=db,
                    company_id=company_id,
                    product_id=product.id,
                    forecast_period=forecast_period,
                )
            )

            forecasts.append(
                forecast
            )

        except ValueError:

            # Product has no historical sales.
            continue

    return forecasts


# ==========================================================
# GET COMPANY FORECASTS
# ==========================================================

def _get_company_forecasts(
    db: Session,
    company_id: int,
):

    return (
        db.query(DemandForecast)
        .options(
            joinedload(
                DemandForecast.product
            ),
            joinedload(
                DemandForecast.category
            ),
        )
        .filter(
            DemandForecast.company_id
            == company_id
        )
        .all()
    )


# ==========================================================
# LATEST FORECAST PER PRODUCT
# ==========================================================

def _latest_forecast_per_product(
    forecasts,
):

    latest = {}

    for item in forecasts:

        normalized_period = (
            normalize_forecast_period(
                item.forecast_period
            )
        )

        if (
            normalized_period
            not in VALID_FORECAST_PERIODS
        ):
            continue

        product_id = item.product_id

        if product_id not in latest:

            latest[product_id] = item

            continue

        current = latest[product_id]

        current_date = (
            current.generated_at
        )

        item_date = (
            item.generated_at
        )

        if (
            item_date
            and current_date
        ):

            if item_date > current_date:
                latest[product_id] = item

        elif item.id > current.id:

            latest[product_id] = item

    return list(
        latest.values()
    )


# ==========================================================
# LATEST FORECAST PER PRODUCT + PERIOD
# ==========================================================

def _latest_forecast_per_product_period(
    forecasts,
):

    latest = {}

    for item in forecasts:

        normalized_period = (
            normalize_forecast_period(
                item.forecast_period
            )
        )

        if (
            normalized_period
            not in VALID_FORECAST_PERIODS
        ):
            continue

        key = (
            item.product_id,
            normalized_period,
        )

        if key not in latest:

            latest[key] = item

            continue

        current = latest[key]

        if (
            item.generated_at
            and current.generated_at
            and item.generated_at
            > current.generated_at
        ):

            latest[key] = item

        elif item.id > current.id:

            latest[key] = item

    return list(
        latest.values()
    )


# ==========================================================
# PRODUCT FORECASTS
# ==========================================================

def get_product_forecasts(
    db: Session,
    company_id: int,
    forecast_period: str | None = None,
    search: str | None = None,
    category_id: int | None = None,
    brand: str | None = None,
    sort_by: str = "highest_demand",
):

    normalized_period = (
        normalize_forecast_period(
            forecast_period
        )
    )

    if (
        forecast_period
        and normalized_period
        not in VALID_FORECAST_PERIODS
    ):

        raise ValueError(
            "Invalid forecast period. "
            "Use 7_DAYS, 30_DAYS or 90_DAYS."
        )

    forecasts = _get_company_forecasts(
        db,
        company_id,
    )

    forecasts = [
        item
        for item in forecasts
        if normalize_forecast_period(
            item.forecast_period
        ) in VALID_FORECAST_PERIODS
    ]

    # ------------------------------------------------------
    # Period filter
    # ------------------------------------------------------

    if normalized_period:

        forecasts = [
            item
            for item in forecasts
            if normalize_forecast_period(
                item.forecast_period
            ) == normalized_period
        ]

    # ------------------------------------------------------
    # ONE ROW PER PRODUCT
    # ------------------------------------------------------

    forecasts = (
        _latest_forecast_per_product(
            forecasts
        )
    )

    # ------------------------------------------------------
    # SEARCH
    # ------------------------------------------------------

    if search:

        search_value = (
            search.strip().lower()
        )

        forecasts = [
            item
            for item in forecasts
            if (
                item.product
                and search_value
                in (
                    item.product.name
                    or ""
                ).lower()
            )
        ]

    # ------------------------------------------------------
    # CATEGORY
    # ------------------------------------------------------

    if category_id is not None:

        forecasts = [
            item
            for item in forecasts
            if item.category_id
            == category_id
        ]

    # ------------------------------------------------------
    # BRAND
    # ------------------------------------------------------

    if brand:

        brand_value = (
            brand.strip().lower()
        )

        forecasts = [
            item
            for item in forecasts
            if (
                item.product
                and item.product.brand
                and brand_value
                in item.product.brand.lower()
            )
        ]

    # ------------------------------------------------------
    # SORT
    # ------------------------------------------------------

    if sort_by == "highest_demand":

        forecasts.sort(
            key=lambda x:
                x.predicted_demand or 0,
            reverse=True,
        )

    elif sort_by == "lowest_stock":

        forecasts.sort(
            key=lambda x:
                x.available_stock or 0
        )

    elif sort_by == "highest_growth":

        forecasts.sort(
            key=lambda x:
                x.expected_growth_percentage
                or 0,
            reverse=True,
        )

    elif sort_by == "accuracy":

        forecasts.sort(
            key=lambda x:
                x.forecast_accuracy or 0,
            reverse=True,
        )

    elif sort_by == "lowest_demand":

        forecasts.sort(
            key=lambda x:
                x.predicted_demand or 0
        )

    else:

        forecasts.sort(
            key=lambda x:
                x.predicted_demand or 0,
            reverse=True,
        )

    # ------------------------------------------------------
    # RESPONSE
    # ------------------------------------------------------

    result = []

    for item in forecasts:

        result.append(
            {
                "id":
                    item.id,

                "product_id":
                    item.product_id,

                "category_id":
                    item.category_id,

                "product_name":
                    (
                        item.product.name
                        if item.product
                        else ""
                    ),

                "category_name":
                    (
                        item.category.name
                        if item.category
                        else ""
                    ),

                "brand":
                    (
                        item.product.brand
                        if item.product
                        else None
                    ),

                "current_stock":
                    int(
                        item.current_stock
                        or 0
                    ),

                "available_stock":
                    int(
                        item.available_stock
                        or 0
                    ),

                "reorder_level":
                    int(
                        item.reorder_level
                        or 0
                    ),

                "historical_sales":
                    int(
                        item.historical_sales
                        or 0
                    ),

                "predicted_demand":
                    int(
                        item.predicted_demand
                        or 0
                    ),

                "expected_growth_percentage":
                    float(
                        item.expected_growth_percentage
                        or 0
                    ),

                "confidence_score":
                    float(
                        item.confidence_score
                        or 0
                    ),

                "forecast_accuracy":
                    float(
                        item.forecast_accuracy
                        or 0
                    ),

                "forecast_period":
                    normalize_forecast_period(
                        item.forecast_period
                    ),

                "recommendation":
                    item.recommendation
                    or "",

                "forecast_value":
                    float(
                        item.forecast_value
                        or 0
                    ),

                "generated_at":
                    item.generated_at,
            }
        )

    return result


# ==========================================================
# CATEGORY FORECASTS
# ==========================================================

def get_category_forecasts(
    db: Session,
    company_id: int,
):

    forecasts = _get_company_forecasts(
        db,
        company_id,
    )

    forecasts = [
        item
        for item in forecasts
        if normalize_forecast_period(
            item.forecast_period
        ) in VALID_FORECAST_PERIODS
    ]

    # One latest forecast per product.
    # This prevents duplicate product counting.
    forecasts = (
        _latest_forecast_per_product(
            forecasts
        )
    )

    category_data = {}

    for item in forecasts:

        category_id = (
            item.category_id
        )

        category_name = (
            item.category.name
            if item.category
            else ""
        )

        if category_id not in category_data:

            category_data[
                category_id
            ] = {
                "category_id":
                    category_id,

                "category_name":
                    category_name,

                "historical":
                    0,

                "prediction":
                    0,

                "forecast_value":
                    Decimal("0"),

                "confidence_values":
                    [],

                "accuracy_values":
                    [],
            }

        data = category_data[
            category_id
        ]

        data["historical"] += int(
            item.historical_sales
            or 0
        )

        data["prediction"] += int(
            item.predicted_demand
            or 0
        )

        data["forecast_value"] += (
            format_decimal(
                item.forecast_value
            )
        )

        data[
            "confidence_values"
        ].append(
            float(
                item.confidence_score
                or 0
            )
        )

        data[
            "accuracy_values"
        ].append(
            float(
                item.forecast_accuracy
                or 0
            )
        )

    result = []

    for data in category_data.values():

        historical = data[
            "historical"
        ]

        prediction = data[
            "prediction"
        ]

        if historical:

            growth = (
                (
                    (
                        prediction
                        - historical
                    )
                    / historical
                )
                * 100
            )

        else:

            growth = 0

        confidence_values = data[
            "confidence_values"
        ]

        accuracy_values = data[
            "accuracy_values"
        ]

        confidence = (
            sum(
                confidence_values
            )
            / len(
                confidence_values
            )
            if confidence_values
            else 0
        )

        accuracy = (
            sum(
                accuracy_values
            )
            / len(
                accuracy_values
            )
            if accuracy_values
            else 0
        )

        recommendation = (
            calculate_category_recommendation(
                growth
            )
        )

        result.append(
            {
                "category_id":
                    data["category_id"],

                "category_name":
                    data["category_name"],

                "total_historical_sales":
                    historical,

                "predicted_demand":
                    prediction,

                "expected_growth_percentage":
                    round(
                        growth,
                        2,
                    ),

                "confidence_score":
                    round(
                        confidence,
                        2,
                    ),

                "forecast_accuracy":
                    round(
                        accuracy,
                        2,
                    ),

                "recommendation":
                    recommendation,

                "forecast_value":
                    float(
                        data[
                            "forecast_value"
                        ]
                    ),
            }
        )

    result.sort(
        key=lambda x:
            x["predicted_demand"],
        reverse=True,
    )

    return result


# ==========================================================
# INVENTORY RECOMMENDATIONS
# ==========================================================

def get_inventory_recommendations(
    db: Session,
    company_id: int,
):

    forecasts = _get_company_forecasts(
        db,
        company_id,
    )

    forecasts = [
        item
        for item in forecasts
        if normalize_forecast_period(
            item.forecast_period
        ) in VALID_FORECAST_PERIODS
    ]

    forecasts = (
        _latest_forecast_per_product(
            forecasts
        )
    )

    result = []

    for item in forecasts:

        if (
            item.recommendation
            == STOCK_HEALTHY
        ):
            continue

        result.append(
            {
                "product_id":
                    item.product_id,

                "product_name":
                    (
                        item.product.name
                        if item.product
                        else ""
                    ),

                "category_name":
                    (
                        item.category.name
                        if item.category
                        else ""
                    ),

                "current_stock":
                    int(
                        item.current_stock
                        or 0
                    ),

                "available_stock":
                    int(
                        item.available_stock
                        or 0
                    ),

                "predicted_demand":
                    int(
                        item.predicted_demand
                        or 0
                    ),

                "recommendation":
                    item.recommendation
                    or "",

                "confidence_score":
                    float(
                        item.confidence_score
                        or 0
                    ),
            }
        )

    return result


# ==========================================================
# FORECAST DASHBOARD
# ==========================================================

def get_forecast_dashboard(
    db: Session,
    company_id: int,
):

    forecasts = _get_company_forecasts(
        db,
        company_id,
    )

    forecasts = [
        item
        for item in forecasts
        if normalize_forecast_period(
            item.forecast_period
        ) in VALID_FORECAST_PERIODS
    ]

    # IMPORTANT:
    # Dashboard uses latest forecast per product.
    # So one product does not become 3 forecasts
    # just because 7/30/90 day records exist.

    latest_forecasts = (
        _latest_forecast_per_product(
            forecasts
        )
    )

    total_predicted_demand = sum(
        int(
            item.predicted_demand
            or 0
        )
        for item in latest_forecasts
    )

    total_forecasts = len(
        latest_forecasts
    )

    products_expected_to_run_out = sum(
        1
        for item in latest_forecasts
        if (
            item.predicted_demand
            or 0
        )
        > (
            item.available_stock
            or 0
        )
    )

    high_growth_products = sum(
        1
        for item in latest_forecasts
        if (
            item.expected_growth_percentage
            or 0
        ) >= 20
    )

    slow_moving_products = sum(
        1
        for item in latest_forecasts
        if (
            item.predicted_demand
            or 0
        )
        < (
            item.historical_sales
            or 0
        )
    )

    accuracy_values = [
        float(
            item.forecast_accuracy
            or 0
        )
        for item in latest_forecasts
    ]

    accuracy = (
        sum(
            accuracy_values
        )
        / len(
            accuracy_values
        )
        if accuracy_values
        else 0
    )

    return {
        "total_predicted_demand":
            int(
                total_predicted_demand
            ),

        "products_expected_to_run_out":
            int(
                products_expected_to_run_out
            ),

        "high_growth_products":
            int(
                high_growth_products
            ),

        "slow_moving_products":
            int(
                slow_moving_products
            ),

        "forecast_accuracy":
            round(
                float(
                    accuracy
                ),
                2,
            ),

        "total_forecasts":
            int(
                total_forecasts
            ),
    }


# ==========================================================
# HISTORICAL VS FORECAST
# ==========================================================

def get_historical_vs_forecast(
    db: Session,
    company_id: int,
):

    forecasts = _get_company_forecasts(
        db,
        company_id,
    )

    forecasts = (
        _latest_forecast_per_product_period(
            forecasts
        )
    )

    period_data = {}

    for item in forecasts:

        period = (
            normalize_forecast_period(
                item.forecast_period
            )
        )

        if period not in VALID_FORECAST_PERIODS:
            continue

        if period not in period_data:

            period_data[period] = {
                "historical_sales": 0,
                "predicted_sales": 0,
            }

        period_data[
            period
        ]["historical_sales"] += int(
            item.historical_sales
            or 0
        )

        period_data[
            period
        ]["predicted_sales"] += int(
            item.predicted_demand
            or 0
        )

    result = []

    for period in [
        "7_DAYS",
        "30_DAYS",
        "90_DAYS",
    ]:

        if period not in period_data:
            continue

        result.append(
            {
                "period":
                    period,

                "historical_sales":
                    period_data[
                        period
                    ]["historical_sales"],

                "predicted_sales":
                    period_data[
                        period
                    ]["predicted_sales"],
            }
        )

    return result


# ==========================================================
# PRODUCT TREND
# ==========================================================

def get_product_trend(
    db: Session,
    company_id: int,
):

    forecasts = _get_company_forecasts(
        db,
        company_id,
    )

    forecasts = [
        item
        for item in forecasts
        if normalize_forecast_period(
            item.forecast_period
        ) in VALID_FORECAST_PERIODS
    ]

    forecasts = (
        _latest_forecast_per_product(
            forecasts
        )
    )

    result = []

    for item in forecasts:

        result.append(
            {
                "product":
                    (
                        item.product.name
                        if item.product
                        else ""
                    ),

                "demand":
                    int(
                        item.predicted_demand
                        or 0
                    ),
            }
        )

    result.sort(
        key=lambda x:
            x["demand"],
        reverse=True,
    )

    return result[:10]


# ==========================================================
# CATEGORY TREND
# ==========================================================

def get_category_trend(
    db: Session,
    company_id: int,
):

    categories = get_category_forecasts(
        db,
        company_id,
    )

    categories.sort(
        key=lambda x:
            x["predicted_demand"],
        reverse=True,
    )

    return [
        {
            "category":
                item["category_name"],

            "demand":
                item["predicted_demand"],
        }
        for item in categories
    ]


# ==========================================================
# SEASONAL PATTERN
# ==========================================================

def get_seasonal_pattern(
    db: Session,
    company_id: int,
):

    forecasts = _get_company_forecasts(
        db,
        company_id,
    )

    forecasts = (
        _latest_forecast_per_product_period(
            forecasts
        )
    )

    result = []

    for item in forecasts:

        if (
            normalize_forecast_period(
                item.forecast_period
            )
            not in VALID_FORECAST_PERIODS
        ):
            continue

        month = ""

        if item.generated_at:

            month = (
                item.generated_at
                .strftime("%B")
            )

        result.append(
            {
                "month":
                    month,

                "sales":
                    int(
                        item.historical_sales
                        or 0
                    ),

                "forecast":
                    int(
                        item.predicted_demand
                        or 0
                    ),

                "period":
                    normalize_forecast_period(
                        item.forecast_period
                    ),
            }
        )

    return result


# ==========================================================
# TOP PREDICTED PRODUCTS
# ==========================================================

def get_top_predicted_products(
    db: Session,
    company_id: int,
    limit: int = 10,
):

    forecasts = _get_company_forecasts(
        db,
        company_id,
    )

    forecasts = [
        item
        for item in forecasts
        if normalize_forecast_period(
            item.forecast_period
        ) in VALID_FORECAST_PERIODS
    ]

    forecasts = (
        _latest_forecast_per_product(
            forecasts
        )
    )

    forecasts.sort(
        key=lambda x:
            x.predicted_demand or 0,
        reverse=True,
    )

    forecasts = forecasts[:limit]

    return [
        {
            "product_id":
                item.product_id,

            "product_name":
                (
                    item.product.name
                    if item.product
                    else ""
                ),

            "predicted_demand":
                int(
                    item.predicted_demand
                    or 0
                ),

            "historical_sales":
                int(
                    item.historical_sales
                    or 0
                ),

            "confidence_score":
                float(
                    item.confidence_score
                    or 0
                ),

            "forecast_period":
                normalize_forecast_period(
                    item.forecast_period
                ),
        }
        for item in forecasts
    ]


# ==========================================================
# COMPLETE FORECAST ANALYTICS
# ==========================================================

def get_forecast_analytics(
    db: Session,
    company_id: int,
):

    return {
        "dashboard":
            get_forecast_dashboard(
                db,
                company_id,
            ),

        "product_forecasts":
            get_product_forecasts(
                db,
                company_id,
            ),

        "category_forecasts":
            get_category_forecasts(
                db,
                company_id,
            ),

        "recommendations":
            get_inventory_recommendations(
                db,
                company_id,
            ),

        "historical_vs_forecast":
            get_historical_vs_forecast(
                db,
                company_id,
            ),

        "product_trend":
            get_product_trend(
                db,
                company_id,
            ),

        "category_trend":
            get_category_trend(
                db,
                company_id,
            ),

        "seasonal_pattern":
            get_seasonal_pattern(
                db,
                company_id,
            ),
    }


# ==========================================================
# AUDIT LOG
# ==========================================================

def create_forecast_audit_log(
    db: Session,
    company_id: int,
    user_id: int,
    action: str,
    forecast_period: str | None = None,
    product_id: int | None = None,
):

    from app.models.audit_log import AuditLog

    audit = AuditLog(
        company_id=company_id,
        user_id=user_id,
        action=action,
        created_at=datetime.now(),
    )

    db.add(audit)
    db.commit()
    db.refresh(audit)

    return audit


# ==========================================================
# CSV - PRODUCT
# ==========================================================

def export_product_forecast_csv(
    db: Session,
    company_id: int,
):

    forecasts = get_product_forecasts(
        db=db,
        company_id=company_id,
    )

    output = io.StringIO()

    writer = csv.writer(
        output
    )

    writer.writerow(
        [
            "Product",
            "Category",
            "Brand",
            "Current Stock",
            "Available Stock",
            "Reorder Level",
            "Historical Sales",
            "Predicted Demand",
            "Forecast Period",
            "Growth %",
            "Confidence Score",
            "Accuracy %",
            "Recommendation",
            "Forecast Value",
        ]
    )

    for item in forecasts:

        writer.writerow(
            [
                item.get(
                    "product_name",
                    "",
                ),

                item.get(
                    "category_name",
                    "",
                ),

                item.get(
                    "brand",
                    "",
                ),

                item.get(
                    "current_stock",
                    0,
                ),

                item.get(
                    "available_stock",
                    0,
                ),

                item.get(
                    "reorder_level",
                    0,
                ),

                item.get(
                    "historical_sales",
                    0,
                ),

                item.get(
                    "predicted_demand",
                    0,
                ),

                item.get(
                    "forecast_period",
                    "",
                ),

                item.get(
                    "expected_growth_percentage",
                    0,
                ),

                item.get(
                    "confidence_score",
                    0,
                ),

                item.get(
                    "forecast_accuracy",
                    0,
                ),

                item.get(
                    "recommendation",
                    "",
                ),

                item.get(
                    "forecast_value",
                    0,
                ),
            ]
        )

    return output.getvalue()


# ==========================================================
# CSV - CATEGORY
# ==========================================================

def export_category_forecast_csv(
    db: Session,
    company_id: int,
):

    categories = get_category_forecasts(
        db=db,
        company_id=company_id,
    )

    output = io.StringIO()

    writer = csv.writer(
        output
    )

    writer.writerow(
        [
            "Category",
            "Historical Sales",
            "Predicted Demand",
            "Growth %",
            "Confidence Score",
            "Accuracy %",
            "Recommendation",
            "Forecast Value",
        ]
    )

    for item in categories:

        writer.writerow(
            [
                item.get(
                    "category_name",
                    "",
                ),

                item.get(
                    "total_historical_sales",
                    0,
                ),

                item.get(
                    "predicted_demand",
                    0,
                ),

                item.get(
                    "expected_growth_percentage",
                    0,
                ),

                item.get(
                    "confidence_score",
                    0,
                ),

                item.get(
                    "forecast_accuracy",
                    0,
                ),

                item.get(
                    "recommendation",
                    "",
                ),

                item.get(
                    "forecast_value",
                    0,
                ),
            ]
        )

    return output.getvalue()


# ==========================================================
# PDF - PRODUCT
# ==========================================================

def export_product_forecast_pdf(
    db: Session,
    company_id: int,
):

    forecasts = get_product_forecasts(
        db=db,
        company_id=company_id,
    )

    buffer = io.BytesIO()

    pdf = SimpleDocTemplate(
        buffer,
        rightMargin=25,
        leftMargin=25,
        topMargin=30,
        bottomMargin=30,
    )

    styles = getSampleStyleSheet()

    elements = []

    elements.append(
        Paragraph(
            "Demand Forecast Report",
            styles["Title"],
        )
    )

    elements.append(
        Spacer(
            1,
            12,
        )
    )

    data = [
        [
            "Product",
            "Category",
            "Stock",
            "Historical",
            "Predicted",
            "Growth %",
            "Confidence",
            "Recommendation",
        ]
    ]

    for item in forecasts:

        data.append(
            [
                item.get(
                    "product_name",
                    "",
                ),

                item.get(
                    "category_name",
                    "",
                ),

                item.get(
                    "current_stock",
                    0,
                ),

                item.get(
                    "historical_sales",
                    0,
                ),

                item.get(
                    "predicted_demand",
                    0,
                ),

                f'{item.get("expected_growth_percentage", 0):.2f}%',

                f'{item.get("confidence_score", 0):.2f}%',

                item.get(
                    "recommendation",
                    "",
                ),
            ]
        )

    table = Table(
        data,
        repeatRows=1,
    )

    table.setStyle(
        TableStyle(
            [
                (
                    "GRID",
                    (0, 0),
                    (-1, -1),
                    0.5,
                    colors.grey,
                ),

                (
                    "BACKGROUND",
                    (0, 0),
                    (-1, 0),
                    colors.lightgrey,
                ),

                (
                    "FONTNAME",
                    (0, 0),
                    (-1, 0),
                    "Helvetica-Bold",
                ),

                (
                    "VALIGN",
                    (0, 0),
                    (-1, -1),
                    "MIDDLE",
                ),

                (
                    "ALIGN",
                    (2, 1),
                    (-2, -1),
                    "CENTER",
                ),

                (
                    "FONTSIZE",
                    (0, 0),
                    (-1, -1),
                    8,
                ),

                (
                    "BOTTOMPADDING",
                    (0, 0),
                    (-1, 0),
                    8,
                ),
            ]
        )
    )

    elements.append(table)

    pdf.build(
        elements
    )

    buffer.seek(0)

    return buffer


# ==========================================================
# FORECAST NOTIFICATIONS
# ==========================================================

def create_forecast_notifications(
    db: Session,
    company_id: int,
):

    forecasts = _get_company_forecasts(
        db,
        company_id,
    )

    forecasts = [
        item
        for item in forecasts
        if normalize_forecast_period(
            item.forecast_period
        ) in VALID_FORECAST_PERIODS
    ]

    forecasts = (
        _latest_forecast_per_product(
            forecasts
        )
    )

    company_users = (
        db.query(User)
        .filter(
            User.company_id
            == company_id
        )
        .all()
    )

    if not company_users:
        return []

    notifications = []

    for item in forecasts:

        if not item.product:
            continue

        # --------------------------------------------------
        # STOCK OUT / DEMAND EXCEEDS STOCK
        # --------------------------------------------------

        if (
            item.predicted_demand or 0
        ) > (
            item.available_stock or 0
        ):

            title = (
                "Forecast Stock Alert"
            )

            message = (
                f"{item.product.name} "
                f"forecast demand "
                f"{item.predicted_demand} "
                f"is higher than available "
                f"stock "
                f"{item.available_stock}."
            )

        # --------------------------------------------------
        # LOW STOCK
        # --------------------------------------------------

        elif (
            item.available_stock or 0
        ) <= (
            item.reorder_level or 0
        ):

            title = (
                "Reorder Recommendation"
            )

            message = (
                f"{item.product.name} "
                "needs stock replenishment."
            )

        else:

            title = None
            message = None

        if title:

            for user in company_users:

                notification = Notification(
                    company_id=company_id,
                    user_id=user.id,
                    title=title,
                    message=message,
                    notification_type="FORECAST",
                    is_read=False,
                )

                db.add(
                    notification
                )

                notifications.append(
                    notification
                )

        # --------------------------------------------------
        # HIGH GROWTH
        # --------------------------------------------------

        if (
            item.expected_growth_percentage
            or 0
        ) >= 20:

            for user in company_users:

                notification = Notification(
                    company_id=company_id,
                    user_id=user.id,
                    title="High Demand Growth",
                    message=(
                        f"{item.product.name} "
                        "shows significant "
                        "demand growth."
                    ),
                    notification_type="FORECAST",
                    is_read=False,
                )

                db.add(
                    notification
                )

                notifications.append(
                    notification
                )

    db.commit()

    return notifications