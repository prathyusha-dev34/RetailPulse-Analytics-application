from datetime import (
    datetime,
    timedelta,
)

from decimal import Decimal

import csv
import io


from sqlalchemy import (
    func,
    desc,
    asc,
)


from sqlalchemy.orm import (
    Session,
    joinedload,
)


from app.models.sale import Sale

from app.models.sale_item import SaleItem

from app.models.product import Product

from app.models.category import Category


from app.models.demand_forecast import (
    DemandForecast,
)


from app.models.forecast_history import (
    ForecastHistory,
)

from app.models.user import User
from app.models.notification import Notification

# ==========================================================
# PDF EXPORT IMPORTS
# ==========================================================

from reportlab.platypus import (
    SimpleDocTemplate,
    Table,
    TableStyle,
    Paragraph,
)


from reportlab.lib.styles import (
    getSampleStyleSheet,
)




# ==========================================================
# CONSTANTS
# ==========================================================


FORECAST_PERIODS = {

    "7_DAYS": 7,

    "30_DAYS": 30,

    "90_DAYS": 90,

}



DEFAULT_FORECAST_DAYS = 30


HISTORICAL_DAYS = 30


DEFAULT_REORDER_LEVEL = 10





# ==========================================================
# INVENTORY RECOMMENDATION CONSTANTS
# ==========================================================


IMMEDIATE_RESTOCK = (
    "Immediate Restock Required"
)


REORDER_SOON = (
    "Reorder Soon"
)


OVERSTOCK_RISK = (
    "Overstock Risk"
)


STOCK_HEALTHY = (
    "Stock Level Healthy"
)





# ==========================================================
# FORMAT DECIMAL
# ==========================================================


def format_decimal(value):


    if value is None:

        return Decimal("0.00")



    return Decimal(
        str(value)
    )





# ==========================================================
# GET FORECAST DAYS
# ==========================================================


def get_forecast_days(
    forecast_period: str,
    start_date=None,
    end_date=None,
):


    if forecast_period == "CUSTOM":


        if start_date and end_date:

            return (
                end_date - start_date
            ).days + 1



    return FORECAST_PERIODS.get(

        forecast_period,

        DEFAULT_FORECAST_DAYS

    )





# ==========================================================
# GET DATE RANGE
# ==========================================================


def get_date_range(
    forecast_period,
    start_date=None,
    end_date=None,
):


    if forecast_period == "CUSTOM":

        return (
            start_date,
            end_date,
        )



    days = get_forecast_days(
        forecast_period
    )



    end = datetime.now()



    start = (
        end -
        timedelta(
            days=days
        )
    )



    return (
        start,
        end,
    )





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

        2

    )





# ==========================================================
# CALCULATE PREDICTION
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

        daily_average

        *

        days

    )



    return int(

        round(

            prediction

        )

    )





# ==========================================================
# GROWTH PERCENTAGE
# ==========================================================


def calculate_growth_percentage(
    historical_sales,
    predicted_demand,
):


    if historical_sales == 0:

        return 0



    growth = (

        (

            predicted_demand

            -

            historical_sales

        )

        /

        historical_sales

    ) * 100



    return round(

        growth,

        2

    )





# ==========================================================
# CONFIDENCE SCORE
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
# FORECAST ACCURACY
# ==========================================================


def calculate_forecast_accuracy(
    historical_sales: int,
    predicted_demand: int,
):


    if historical_sales == 0:

        return 0.0



    error = abs(

        historical_sales

        -

        predicted_demand

    )



    accuracy = (

        1

        -

        (

            error

            /

            historical_sales

        )

    ) * 100



    return round(

        max(

            accuracy,

            0

        ),

        2

    )


# ==========================================================
# GET HISTORICAL SALES
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

                0

            )

        )

        .join(

            Sale,

            Sale.id == SaleItem.sale_id

        )

        .filter(

            Sale.company_id == company_id,

            SaleItem.product_id == product_id,

        )

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

                -

                timedelta(

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

        -

        timedelta(

            days=HISTORICAL_DAYS

        )

    )



    sales = (

        db.query(

            func.date(

                Sale.sale_date

            ).label(

                "date"

            ),


            func.sum(

                SaleItem.quantity

            ).label(

                "quantity"

            )

        )

        .join(

            Sale,

            Sale.id == SaleItem.sale_id

        )

        .filter(

            Sale.company_id == company_id,

            SaleItem.product_id == product_id,

            Sale.sale_date >= start_date,

        )

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

            "date":

                row.date,


            "quantity":

                int(

                    row.quantity or 0

                ),

        }

        for row in sales

    ]





# ==========================================================
# INVENTORY RECOMMENDATION CALCULATION
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





    if available_stock > predicted_demand * 3:


        return OVERSTOCK_RISK





    if available_stock <= reorder_level:


        return REORDER_SOON





    return STOCK_HEALTHY





# ==========================================================
# FORECAST VALUE
# ==========================================================


def calculate_forecast_value(
    predicted_demand,
    unit_price,
):


    return (

        format_decimal(

            unit_price

        )

        *

        Decimal(

            str(

                predicted_demand

            )

        )

    )





# ==========================================================
# PRODUCT VALIDATION
# ==========================================================


def validate_product_for_forecast(
    db: Session,
    company_id: int,
    product_id: int,
):


    product = (

        db.query(Product)

        .options(

            joinedload(

                Product.category

            )

        )

        .filter(

            Product.id == product_id,

            Product.company_id == company_id,

            Product.status == "ACTIVE",

        )

        .first()

    )



    if not product:


        raise ValueError(

            "Inactive or invalid product cannot generate forecast"

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



    growth_percentage = calculate_growth_percentage(

        historical_sales,

        predicted_demand,

    )



    confidence = calculate_confidence_score(

        historical_sales

    )



    accuracy = calculate_forecast_accuracy(

        historical_sales,

        predicted_demand,

    )



    available_stock = product.stock_quantity


    reorder_level = DEFAULT_REORDER_LEVEL



    recommendation = calculate_inventory_recommendations(

        current_stock=product.stock_quantity,

        available_stock=available_stock,

        reorder_level=reorder_level,

        predicted_demand=predicted_demand,

    )



    forecast_value = calculate_forecast_value(

        predicted_demand,

        product.unit_price,

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

            product.stock_quantity,


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
# DUPLICATE FORECAST CHECK
# ==========================================================


def check_existing_forecast(
    db: Session,
    company_id: int,
    product_id: int,
    forecast_period: str,
):


    return (

        db.query(DemandForecast)

        .filter(

            DemandForecast.company_id == company_id,

            DemandForecast.product_id == product_id,

            DemandForecast.forecast_period == forecast_period,

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

                data["expected_growth_percentage"]

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

                    data["expected_growth_percentage"],


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
# GENERATE ALL COMPANY FORECASTS
# ==========================================================


def generate_all_forecasts(
    db: Session,
    company_id: int,
    forecast_period: str,
):


    products = (

        db.query(Product)

        .filter(

            Product.company_id == company_id,

            Product.status == "ACTIVE",

        )

        .all()

    )



    forecasts = []



    for product in products:


        try:


            forecast = create_or_update_forecast(

                db=db,

                company_id=company_id,

                product_id=product.id,

                forecast_period=forecast_period,

            )


            forecasts.append(forecast)



        except ValueError:


            # products without sales history ignored

            continue



    return forecasts


# ==========================================================
# GET PRODUCT LEVEL FORECASTS
# ==========================================================


def get_product_forecasts(
    db: Session,
    company_id: int,
    forecast_period: str | None = None,
    search: str | None = None,
    sort_by: str = "predicted_demand",
):


    query = (

        db.query(DemandForecast)

        .options(

            joinedload(

                DemandForecast.product

            ),

            joinedload(

                DemandForecast.category

            )

        )

        .filter(

            DemandForecast.company_id == company_id

        )

    )



    # ------------------------------
    # FILTER BY FORECAST PERIOD
    # ------------------------------

    if forecast_period:


        query = query.filter(

            DemandForecast.forecast_period == forecast_period

        )



    # ------------------------------
    # SEARCH PRODUCT NAME
    # ------------------------------

    if search:


        query = (

            query

            .join(Product)

            .filter(

                Product.name.ilike(

                    f"%{search}%"

                )

            )

        )



    # ------------------------------
    # SORTING
    # ------------------------------

    if sort_by == "highest_demand":


        query = query.order_by(

            desc(

                DemandForecast.predicted_demand

            )

        )



    elif sort_by == "lowest_stock":


        query = query.order_by(

            asc(

                DemandForecast.available_stock

            )

        )



    elif sort_by == "highest_growth":


        query = query.order_by(

            desc(

                DemandForecast.expected_growth_percentage

            )

        )



    elif sort_by == "accuracy":


        query = query.order_by(

            desc(

                DemandForecast.forecast_accuracy

            )

        )



    else:


        query = query.order_by(

            desc(

                DemandForecast.predicted_demand

            )

        )





    forecasts = query.all()



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

                    item.product.name

                    if item.product

                    else "",



                "category_name":

                    item.category.name

                    if item.category

                    else "",



                "brand":

                    item.product.brand

                    if item.product

                    else None,



                "current_stock":

                    item.current_stock or 0,



                "available_stock":

                    item.available_stock or 0,



                "reorder_level":

                    item.reorder_level or 0,



                "historical_sales":

                    item.historical_sales or 0,



                "predicted_demand":

                    item.predicted_demand or 0,



                "expected_growth_percentage":

                    item.expected_growth_percentage or 0,



                "forecast_period":

                    item.forecast_period,



                "confidence_score":

                    item.confidence_score or 0,



                "forecast_accuracy":

                    item.forecast_accuracy or 0,



                "recommendation":

                    item.recommendation or "",



                "forecast_value":

                    item.forecast_value or 0,



                "generated_at":

                    item.generated_at,

            }

        )



    return result


# ==========================================================
# GET PRODUCT LEVEL FORECASTS
# ==========================================================

def get_product_forecasts(
    db: Session,
    company_id: int,
    forecast_period: str | None = None,
    search: str | None = None,
    sort_by: str = "predicted_demand",
):

    query = (
        db.query(DemandForecast)
        .options(
            joinedload(DemandForecast.product),
            joinedload(DemandForecast.category),
        )
        .filter(
            DemandForecast.company_id == company_id
        )
    )


    if forecast_period:

        query = query.filter(
            DemandForecast.forecast_period == forecast_period
        )


    if search:

        query = (
            query
            .join(Product)
            .filter(
                Product.name.ilike(
                    f"%{search}%"
                )
            )
        )


    if sort_by == "highest_demand":

        query = query.order_by(
            desc(
                DemandForecast.predicted_demand
            )
        )


    elif sort_by == "lowest_stock":

        query = query.order_by(
            asc(
                DemandForecast.available_stock
            )
        )


    elif sort_by == "highest_growth":

        query = query.order_by(
            desc(
                DemandForecast.expected_growth_percentage
            )
        )


    elif sort_by == "accuracy":

        query = query.order_by(
            desc(
                DemandForecast.forecast_accuracy
            )
        )


    forecasts = query.all()


    result = []


    for item in forecasts:

        result.append(

            {
                "id": item.id,

                "product_id": item.product_id,

                "category_id": item.category_id,


                "product_name":
                    item.product.name
                    if item.product
                    else "",


                "category_name":
                    item.category.name
                    if item.category
                    else "",


                "brand":
                    item.product.brand
                    if item.product
                    else None,


                "current_stock":
                    item.current_stock or 0,


                "available_stock":
                    item.available_stock or 0,


                "reorder_level":
                    item.reorder_level or 0,


                "historical_sales":
                    item.historical_sales or 0,


                "predicted_demand":
                    item.predicted_demand or 0,


                "expected_growth_percentage":
                    item.expected_growth_percentage or 0,


                "forecast_period":
                    item.forecast_period,


                "confidence_score":
                    item.confidence_score or 0,


                "forecast_accuracy":
                    item.forecast_accuracy or 0,


                "recommendation":
                    item.recommendation or "",


                "forecast_value":
                    float(item.forecast_value or 0),


                "generated_at":
                    item.generated_at,

            }

        )


    return result



# ==========================================================
# CATEGORY LEVEL FORECAST
# ==========================================================


def get_category_forecasts(
    db: Session,
    company_id: int,
):

    categories = (

        db.query(

            Category.id.label(
                "category_id"
            ),

            Category.name.label(
                "category_name"
            ),

            func.sum(
                DemandForecast.historical_sales
            ).label(
                "historical"
            ),

            func.sum(
                DemandForecast.predicted_demand
            ).label(
                "prediction"
            ),

            func.avg(
                DemandForecast.expected_growth_percentage
            ).label(
                "growth"
            ),

            func.avg(
                DemandForecast.confidence_score
            ).label(
                "confidence"
            ),

            func.avg(
                DemandForecast.forecast_accuracy
            ).label(
                "accuracy"
            ),

        )

        .join(
            DemandForecast,
            DemandForecast.category_id == Category.id
        )

        .filter(
            DemandForecast.company_id == company_id
        )

        .group_by(
            Category.id,
            Category.name,
        )

        .all()

    )


    return [

        {

            "category_id":
                row.category_id,


            "category_name":
                row.category_name,


            "total_historical_sales":
                int(row.historical or 0),


            "predicted_demand":
                int(row.prediction or 0),


            "expected_growth_percentage":
                float(row.growth or 0),


            "confidence_score":
                float(row.confidence or 0),


            "forecast_accuracy":
                float(row.accuracy or 0),


            # FIX for Pydantic validation
            "forecast_value":
                0,

        }

        for row in categories

    ]


# ==========================================================
# INVENTORY RECOMMENDATIONS
# ==========================================================

def get_inventory_recommendations(
    db: Session,
    company_id: int,
):


    forecasts = (

        db.query(DemandForecast)

        .options(
            joinedload(
                DemandForecast.product
            )
        )

        .filter(

            DemandForecast.company_id == company_id,

            DemandForecast.recommendation.isnot(None)

        )

        .all()

    )


    result = []


    for item in forecasts:


        # ignore healthy products

        if item.recommendation == STOCK_HEALTHY:
            continue


        result.append(

            {

                "product_id":
                    item.product_id,


                "product_name":
                    item.product.name
                    if item.product
                    else "",


                "current_stock":
                    item.current_stock or 0,


                "predicted_demand":
                    item.predicted_demand or 0,


                "recommendation":
                    item.recommendation or "",


                "confidence_score":
                    item.confidence_score or 0,


                # FIX Pydantic missing field

                "category_name":
                    item.product.category.name
                    if (
                        item.product
                        and item.product.category
                    )
                    else "",

            }

        )


    return result





# ==========================================================
# FORECAST DASHBOARD KPI
# ==========================================================


def get_forecast_dashboard(
    db: Session,
    company_id: int,
):


    total_predicted_demand = (

        db.query(

            func.sum(
                DemandForecast.predicted_demand
            )

        )

        .filter(

            DemandForecast.company_id == company_id

        )

        .scalar()

        or 0

    )



    total_forecasts = (

        db.query(

            func.count(
                DemandForecast.id
            )

        )

        .filter(

            DemandForecast.company_id == company_id

        )

        .scalar()

        or 0

    )



    products_expected_to_run_out = (

        db.query(

            func.count(
                DemandForecast.id
            )

        )

        .filter(

            DemandForecast.company_id == company_id,


            DemandForecast.predicted_demand >

            DemandForecast.available_stock

        )

        .scalar()

        or 0

    )



    high_growth_products = (

        db.query(

            func.count(
                DemandForecast.id
            )

        )

        .filter(

            DemandForecast.company_id == company_id,


            DemandForecast.expected_growth_percentage >= 20

        )

        .scalar()

        or 0

    )



    slow_moving_products = (

        db.query(

            func.count(
                DemandForecast.id
            )

        )

        .filter(

            DemandForecast.company_id == company_id,


            DemandForecast.predicted_demand <

            DemandForecast.historical_sales

        )

        .scalar()

        or 0

    )



    accuracy = (

        db.query(

            func.avg(
                DemandForecast.forecast_accuracy
            )

        )

        .filter(

            DemandForecast.company_id == company_id

        )

        .scalar()

        or 0

    )


    return {


        "total_predicted_demand":

            int(total_predicted_demand),



        "products_expected_to_run_out":

            int(products_expected_to_run_out),



        "high_growth_products":

            int(high_growth_products),



        "slow_moving_products":

            int(slow_moving_products),



        "forecast_accuracy":

            round(
                float(accuracy),
                2
            ),



        "total_forecasts":

            int(total_forecasts),

    }





# ==========================================================
# HISTORICAL VS FORECAST
# ==========================================================


def get_historical_vs_forecast(
    db: Session,
    company_id: int,
):


    forecasts = (

        db.query(DemandForecast)

        .filter(

            DemandForecast.company_id == company_id

        )

        .all()

    )


    return [

        {

            "period":
                item.forecast_period,


            "historical_sales":
                item.historical_sales or 0,


            "predicted_sales":
                item.predicted_demand or 0,

        }

        for item in forecasts

    ]


# ==========================================================
# PRODUCT DEMAND TREND
# ==========================================================

def get_product_trend(
    db: Session,
    company_id: int,
):


    products = (

        db.query(

            Product.name.label(
                "product"
            ),


            func.sum(
                DemandForecast.predicted_demand
            ).label(
                "demand"
            )

        )

        .join(

            DemandForecast,

            DemandForecast.product_id == Product.id

        )

        .filter(

            DemandForecast.company_id == company_id

        )

        .group_by(

            Product.name

        )

        .order_by(

            desc(
                func.sum(
                    DemandForecast.predicted_demand
                )
            )

        )

        .limit(10)

        .all()

    )



    return [

        {

            "product":

                row.product,


            "demand":

                int(
                    row.demand or 0
                )

        }

        for row in products

    ]






# ==========================================================
# CATEGORY DEMAND TREND
# ==========================================================


def get_category_trend(
    db: Session,
    company_id: int,
):


    categories = (

        db.query(

            Category.name.label(
                "category"
            ),


            func.sum(

                DemandForecast.predicted_demand

            ).label(

                "demand"

            )

        )

        .join(

            DemandForecast,

            DemandForecast.category_id == Category.id

        )

        .filter(

            DemandForecast.company_id == company_id

        )

        .group_by(

            Category.name

        )

        .order_by(

            desc(

                func.sum(

                    DemandForecast.predicted_demand

                )

            )

        )

        .all()

    )


    return [

        {

            "category":

                row.category,


            "demand":

                int(
                    row.demand or 0
                )

        }

        for row in categories

    ]







# ==========================================================
# SEASONAL SALES PATTERN
# ==========================================================


def get_seasonal_pattern(
    db: Session,
    company_id: int,
):


    forecasts = (

        db.query(
            DemandForecast
        )

        .filter(

            DemandForecast.company_id == company_id

        )

        .all()

    )


    result = []


    for item in forecasts:


        month = ""


        if item.generated_at:

            month = (

                item.generated_at.strftime(
                    "%B"
                )

            )


        result.append(

            {

                "month":
                    month,


                "sales":
                    item.historical_sales or 0,


                "forecast":
                    item.predicted_demand or 0,

            }

        )


    return result






# ==========================================================
# COMPLETE FORECAST ANALYTICS
# ==========================================================


def get_forecast_analytics(
    db: Session,
    company_id: int,
):


    product_forecasts = (

        get_product_forecasts(

            db,

            company_id

        )

        or []

    )



    category_forecasts = (

        get_category_forecasts(

            db,

            company_id

        )

        or []

    )



    recommendations = (

        get_inventory_recommendations(

            db,

            company_id

        )

        or []

    )



    return {


        "dashboard":

            get_forecast_dashboard(

                db,

                company_id

            ),



        "product_forecasts":

            product_forecasts,



        "category_forecasts":

            category_forecasts,



        "recommendations":

            recommendations,



        "historical_vs_forecast":

            get_historical_vs_forecast(

                db,

                company_id

            ),



        "product_trend":

            get_product_trend(

                db,

                company_id

            ),



        "category_trend":

            get_category_trend(

                db,

                company_id

            ),



        "seasonal_pattern":

            get_seasonal_pattern(

                db,

                company_id

            ),

    }


# ==========================================================
# EXPORT PRODUCT FORECAST CSV
# ==========================================================

import csv
import io



def export_product_forecast_csv(
    db: Session,
    company_id: int,
):


    forecasts = (

        get_product_forecasts(

            db=db,

            company_id=company_id,

        )

        or []

    )


    output = io.StringIO()


    writer = csv.writer(output)



    writer.writerow(

        [

            "Product",

            "Category",

            "Brand",

            "Current Stock",

            "Historical Sales",

            "Predicted Demand",

            "Forecast Period",

            "Growth %",

            "Confidence Score",

            "Accuracy",

            "Recommendation",

            "Forecast Value",

        ]

    )



    for item in forecasts:


        writer.writerow(

            [

                item.get(
                    "product_name",
                    ""
                ),


                item.get(
                    "category_name",
                    ""
                ),


                item.get(
                    "brand",
                    ""
                ),


                item.get(
                    "current_stock",
                    0
                ),


                item.get(
                    "historical_sales",
                    0
                ),


                item.get(
                    "predicted_demand",
                    0
                ),


                item.get(
                    "forecast_period",
                    ""
                ),


                item.get(
                    "expected_growth_percentage",
                    0
                ),


                item.get(
                    "confidence_score",
                    0
                ),


                item.get(
                    "forecast_accuracy",
                    0
                ),


                item.get(
                    "recommendation",
                    ""
                ),


                item.get(
                    "forecast_value",
                    0
                ),

            ]

        )


    return output.getvalue()






# ==========================================================
# EXPORT CATEGORY FORECAST CSV
# ==========================================================


def export_category_forecast_csv(
    db: Session,
    company_id: int,
):


    categories = (

        get_category_forecasts(

            db=db,

            company_id=company_id,

        )

        or []

    )


    output = io.StringIO()


    writer = csv.writer(output)



    writer.writerow(

        [

            "Category",

            "Historical Sales",

            "Predicted Demand",

            "Growth Percentage",

            "Confidence Score",

            "Accuracy",

            "Forecast Value",

        ]

    )



    for item in categories:


        writer.writerow(

            [

                item.get(
                    "category_name",
                    ""
                ),


                item.get(
                    "total_historical_sales",
                    0
                ),


                item.get(
                    "predicted_demand",
                    0
                ),


                item.get(
                    "expected_growth_percentage",
                    0
                ),


                item.get(
                    "confidence_score",
                    0
                ),


                item.get(
                    "forecast_accuracy",
                    0
                ),


                item.get(
                    "forecast_value",
                    0
                ),

            ]

        )


    return output.getvalue()



# ==========================================================
# GET PRODUCT LEVEL FORECASTS
# SEARCH + FILTER + SORT
# ==========================================================

def get_product_forecasts(
    db: Session,
    company_id: int,
    forecast_period: str | None = None,
    search: str | None = None,
    category_id: int | None = None,
    brand: str | None = None,
    sort_by: str = "predicted_demand",
):


    query = (

        db.query(DemandForecast)

        .options(

            joinedload(
                DemandForecast.product
            ),

            joinedload(
                DemandForecast.category
            )

        )

        .filter(

            DemandForecast.company_id == company_id

        )

    )



    # ==============================
    # FORECAST PERIOD FILTER
    # ==============================

    if forecast_period:

        query = query.filter(

            DemandForecast.forecast_period ==
            forecast_period

        )



    # ==============================
    # PRODUCT SEARCH
    # ==============================

    if search:


        query = (

            query

            .join(Product)

            .filter(

                Product.name.ilike(
                    f"%{search}%"
                )

            )

        )



    # ==============================
    # CATEGORY FILTER
    # ==============================

    if category_id:


        query = query.filter(

            DemandForecast.category_id ==
            category_id

        )



    # ==============================
    # BRAND FILTER
    # ==============================

    if brand:


        query = (

            query

            .join(Product)

            .filter(

                Product.brand.ilike(
                    f"%{brand}%"
                )

            )

        )



    # ==============================
    # SORTING
    # ==============================


    if sort_by == "highest_demand":


        query = query.order_by(

            desc(

                DemandForecast.predicted_demand

            )

        )


    elif sort_by == "lowest_stock":


        query = query.order_by(

            asc(

                DemandForecast.available_stock

            )

        )


    elif sort_by == "highest_growth":


        query = query.order_by(

            desc(

                DemandForecast.expected_growth_percentage

            )

        )


    elif sort_by == "accuracy":


        query = query.order_by(

            desc(

                DemandForecast.forecast_accuracy

            )

        )


    else:


        query = query.order_by(

            desc(

                DemandForecast.predicted_demand

            )

        )



    forecasts = query.all()



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

                    item.product.name

                    if item.product

                    else "",



                "category_name":

                    item.category.name

                    if item.category

                    else "",



                "brand":

                    item.product.brand

                    if item.product

                    else None,



                "current_stock":

                    item.current_stock,



                "available_stock":

                    item.available_stock,



                "reorder_level":

                    item.reorder_level,



                "historical_sales":

                    item.historical_sales,



                "predicted_demand":

                    item.predicted_demand,



                "expected_growth_percentage":

                    item.expected_growth_percentage,



                "forecast_period":

                    item.forecast_period,



                "confidence_score":

                    item.confidence_score,



                "forecast_accuracy":

                    item.forecast_accuracy,



                "recommendation":

                    item.recommendation,



                "forecast_value":

                    item.forecast_value,



                "generated_at":

                    item.generated_at,

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


    products = (

        db.query(DemandForecast)

        .options(

            joinedload(
                DemandForecast.product
            )

        )

        .filter(

            DemandForecast.company_id ==
            company_id

        )

        .order_by(

            desc(

                DemandForecast.predicted_demand

            )

        )

        .limit(limit)

        .all()

    )


    return [

        {

            "product_id":

                item.product_id,


            "product_name":

                item.product.name

                if item.product

                else "",


            "predicted_demand":

                item.predicted_demand,


            "historical_sales":

                item.historical_sales,


            "confidence_score":

                item.confidence_score,


            "forecast_period":

                item.forecast_period,

        }


        for item in products

    ]


# ==========================================================
# FORECAST AUDIT LOG
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


    return audit


# ==========================================================
# EXPORT PRODUCT FORECAST PDF
# ==========================================================

def export_product_forecast_pdf(
    db: Session,
    company_id: int,
):


    forecasts = get_product_forecasts(

        db=db,

        company_id=company_id,

    )


    if forecasts is None:

        forecasts = []



    buffer = io.BytesIO()



    pdf = SimpleDocTemplate(

        buffer

    )


    elements = []



    styles = getSampleStyleSheet()



    elements.append(

        Paragraph(

            "Demand Forecast Report",

            styles["Heading2"]

        )

    )



    data = [

        [

            "Product",

            "Category",

            "Historical",

            "Prediction",

            "Confidence",

            "Accuracy",

        ]

    ]



    for item in forecasts:


        data.append(

            [

                item.get(
                    "product_name",
                    ""
                ),


                item.get(
                    "category_name",
                    ""
                ),


                item.get(
                    "historical_sales",
                    0
                ),


                item.get(
                    "predicted_demand",
                    0
                ),


                item.get(
                    "confidence_score",
                    0
                ),


                item.get(
                    "forecast_accuracy",
                    0
                ),

            ]

        )



    table = Table(data)



    table.setStyle(

        TableStyle(

            [

                (

                    "GRID",

                    (0,0),

                    (-1,-1),

                    0.5,

                    None

                )

            ]

        )

    )



    elements.append(table)



    pdf.build(elements)



    buffer.seek(0)



    return buffer


# ==========================================================
# FORECAST NOTIFICATIONS
# ==========================================================

def create_forecast_notifications(
    db: Session,
    company_id: int,
):

    from app.models.notification import Notification
    from app.models.user import User

    forecasts = (
        db.query(DemandForecast)
        .options(joinedload(DemandForecast.product))
        .filter(
            DemandForecast.company_id == company_id
        )
        .all()
    )

    company_users = (
        db.query(User)
        .filter(User.company_id == company_id)
        .all()
    )

    if not company_users:
        return []

    notifications = []

    for item in forecasts:

        # ----------------------------------
        # STOCK OUT WARNING
        # ----------------------------------
        if item.predicted_demand > item.available_stock:

            for user in company_users:

                notification = Notification(
                    company_id=company_id,
                    user_id=user.id,
                    title="Forecast Stock Alert",
                    message=(
                        f"{item.product.name} forecast demand "
                        f"{item.predicted_demand} is higher than "
                        f"available stock {item.available_stock}"
                    ),
                    notification_type="FORECAST",
                    is_read=False,
                )

                db.add(notification)
                notifications.append(notification)

        # ----------------------------------
        # LOW STOCK
        # ----------------------------------
        elif item.available_stock <= item.reorder_level:

            for user in company_users:

                notification = Notification(
                    company_id=company_id,
                    user_id=user.id,
                    title="Reorder Recommendation",
                    message=f"{item.product.name} needs stock replenishment.",
                    notification_type="FORECAST",
                    is_read=False,
                )

                db.add(notification)
                notifications.append(notification)

        # ----------------------------------
        # HIGH GROWTH
        # ----------------------------------
        if (
            item.expected_growth_percentage
            and item.expected_growth_percentage >= 20
        ):

            for user in company_users:

                notification = Notification(
                    company_id=company_id,
                    user_id=user.id,
                    title="High Demand Growth",
                    message=f"{item.product.name} shows significant demand growth.",
                    notification_type="FORECAST",
                    is_read=False,
                )

                db.add(notification)
                notifications.append(notification)

    db.commit()

    return notifications