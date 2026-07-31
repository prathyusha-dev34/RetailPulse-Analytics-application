# app/schemas/customer.py

from __future__ import annotations

from datetime import datetime, date

from typing import (
    Optional,
    List,
    Dict,
    Any,
)

from pydantic import (
    BaseModel,
    EmailStr,
    Field,
    ConfigDict,
)



# ==========================================================
# CUSTOMER CREATE SCHEMA
# ==========================================================

class CustomerCreate(BaseModel):

    full_name: str = Field(
        ...,
        min_length=2,
        max_length=100
    )

    email: Optional[EmailStr] = None

    phone_number: Optional[str] = None

    date_of_birth: Optional[date] = None

    gender: Optional[str] = None

    address: Optional[str] = None

    city: Optional[str] = None

    state: Optional[str] = None

    country: Optional[str] = None

    postal_code: Optional[str] = None

    customer_type: Optional[str] = "Regular"

    preferred_sales_channel: Optional[str] = None

    status: Optional[str] = "ACTIVE"





# ==========================================================
# CUSTOMER UPDATE SCHEMA
# ==========================================================

class CustomerUpdate(BaseModel):

    full_name: Optional[str] = None

    email: Optional[EmailStr] = None

    phone_number: Optional[str] = None

    date_of_birth: Optional[date] = None

    gender: Optional[str] = None

    address: Optional[str] = None

    city: Optional[str] = None

    state: Optional[str] = None

    country: Optional[str] = None

    postal_code: Optional[str] = None

    customer_type: Optional[str] = None

    preferred_sales_channel: Optional[str] = None

    status: Optional[str] = None





# ==========================================================
# CUSTOMER RESPONSE
# ==========================================================

class CustomerResponse(BaseModel):

    id: int

    customer_id: str

    company_id: int


    full_name: str


    email: Optional[str] = None

    phone_number: Optional[str] = None


    date_of_birth: Optional[date] = None

    gender: Optional[str] = None


    address: Optional[str] = None

    city: Optional[str] = None

    state: Optional[str] = None

    country: Optional[str] = None

    postal_code: Optional[str] = None



    customer_type: Optional[str] = None

    preferred_sales_channel: Optional[str] = None

    status: Optional[str] = None



    # Analytics

    customer_segment: Optional[str] = None

    total_orders: int = 0

    total_quantity_purchased: int = 0

    lifetime_revenue: float = 0.0

    average_order_value: float = 0.0

    purchase_frequency: float = 0.0



    first_purchase_date: Optional[date] = None

    last_purchase_date: Optional[date] = None



    favorite_product: Optional[str] = None

    favorite_category: Optional[str] = None


    is_vip: Optional[str] = "No"



    created_at: Optional[datetime] = None

    updated_at: Optional[datetime] = None



    model_config = ConfigDict(
        from_attributes=True
    )



# ==========================================================
# CUSTOMER PURCHASE SUMMARY
# ==========================================================

class CustomerPurchaseSummaryResponse(BaseModel):

    id: Optional[int] = None

    customer_id: int

    total_orders: int = 0

    total_quantity_purchased: int = 0

    total_revenue: float = 0.0

    average_order_value: float = 0.0


    first_purchase_date: Optional[date] = None

    last_purchase_date: Optional[date] = None


    purchase_frequency: float = 0.0


    favorite_product: Optional[str] = None

    favorite_category: Optional[str] = None


    customer_segment: Optional[str] = None


    is_vip: str = "No"


    model_config = ConfigDict(
        from_attributes=True
    )

    # ==========================================================
# CUSTOMER PROFILE RESPONSE
# ==========================================================

class CustomerProfileResponse(BaseModel):

    customer: CustomerResponse


    purchase_summary: Optional[
        CustomerPurchaseSummaryResponse
    ] = None



    recent_transactions: List[Any] = Field(
        default_factory=list
    )



    favourite_products: List[
        Dict[str, Any]
    ] = Field(
        default_factory=list
    )



    timeline: List[
        Dict[str, Any]
    ] = Field(
        default_factory=list
    )



    model_config = ConfigDict(
        from_attributes=True
    )





# ==========================================================
# CUSTOMER LIST RESPONSE
# ==========================================================

class CustomerListResponse(BaseModel):


    total: int = 0


    page: int = 1


    limit: int = 100



    data: List[
        CustomerResponse
    ] = Field(
        default_factory=list
    )



    model_config = ConfigDict(
        from_attributes=True
    )





# ==========================================================
# CUSTOMER BASIC RESPONSE
# ==========================================================

class CustomerBasicResponse(BaseModel):


    id: int


    customer_id: str


    full_name: str



    email: Optional[str] = None


    phone_number: Optional[str] = None


    customer_segment: Optional[str] = None



    model_config = ConfigDict(
        from_attributes=True
    )





# ==========================================================
# CUSTOMER ANALYTICS RESPONSE
# ==========================================================

class CustomerAnalyticsResponse(BaseModel):


    customer_id: int



    total_orders: int = 0


    total_spent: float = 0.0


    average_order_value: float = 0.0


    total_items_purchased: int = 0



    first_purchase_date: Optional[date] = None


    last_purchase_date: Optional[date] = None



    purchase_frequency: float = 0.0


    customer_segment: Optional[str] = None



    model_config = ConfigDict(
        from_attributes=True
    )





# ==========================================================
# CUSTOMER PURCHASE TIMELINE RESPONSE
# ==========================================================

class CustomerPurchaseTimelineResponse(BaseModel):

    event: str


    description: Optional[str] = None


    date: Optional[datetime] = None



    model_config = ConfigDict(
        from_attributes=True
    )





# ==========================================================
# CUSTOMER ACTIVITY TIMELINE RESPONSE
# ==========================================================

class CustomerActivityTimelineResponse(BaseModel):


    event: str


    description: Optional[str] = None


    date: Optional[datetime] = None



    model_config = ConfigDict(
        from_attributes=True
    )


    # ==========================================================
# CUSTOMER FILTER SCHEMA
# ==========================================================

class CustomerFilter(BaseModel):


    customer_type: Optional[str] = None


    status: Optional[str] = None


    city: Optional[str] = None


    state: Optional[str] = None


    country: Optional[str] = None



    from_date: Optional[date] = None


    to_date: Optional[date] = None



    search: Optional[str] = None



    sort_by: Optional[str] = "created_at"


    order: Optional[str] = "desc"






# ==========================================================
# CUSTOMER EXPORT RESPONSE
# ==========================================================

class CustomerExportResponse(BaseModel):


    file_name: str


    file_type: str


    total_records: int = 0


    generated_at: datetime



    model_config = ConfigDict(
        from_attributes=True
    )






# ==========================================================
# CUSTOMER CHART DATA RESPONSE
# ==========================================================

class CustomerChartDataResponse(BaseModel):


    label: str


    value: float



    model_config = ConfigDict(
        from_attributes=True
    )






# ==========================================================
# CUSTOMER DASHBOARD RESPONSE
# ==========================================================

class CustomerDashboardResponse(BaseModel):


    total_customers: int = 0


    active_customers: int = 0


    inactive_customers: int = 0


    new_customers: int = 0


    regular_customers: int = 0


    loyal_customers: int = 0


    vip_customers: int = 0


    returning_customers: int = 0



    average_customer_spend: float = 0.0


    total_revenue_generated: float = 0.0


    average_purchase_frequency: float = 0.0




    top_customers: List[Any] = Field(
        default_factory=list
    )



    recent_customers: List[Any] = Field(
        default_factory=list
    )



    growth: List[Any] = Field(
        default_factory=list
    )



    revenue_contribution: List[Any] = Field(
        default_factory=list
    )



    customer_segments: Dict[str, Any] = Field(
        default_factory=dict
    )



    model_config = ConfigDict(
        from_attributes=True
    )






# ==========================================================
# CUSTOMER MESSAGE CREATE
# ==========================================================

class CustomerMessageCreate(BaseModel):


    customer_id: int



    subject: str = Field(
        ...,
        min_length=2,
        max_length=200
    )



    message: str = Field(
        ...,
        min_length=1
    )



    channel: Optional[str] = "Email"


    # ==========================================================
# CUSTOMER MESSAGE RESPONSE
# ==========================================================

class CustomerMessageResponse(BaseModel):


    id: int


    customer_id: int



    subject: str



    message: str



    channel: Optional[str] = None



    status: Optional[str] = None



    sent_at: Optional[datetime] = None



    model_config = ConfigDict(
        from_attributes=True
    )







# ==========================================================
# CUSTOMER SEARCH RESPONSE
# ==========================================================

class CustomerSearchResponse(BaseModel):


    id: int


    customer_id: str


    full_name: str



    email: Optional[str] = None



    phone_number: Optional[str] = None



    customer_segment: Optional[str] = None



    model_config = ConfigDict(
        from_attributes=True
    )







# ==========================================================
# CUSTOMER STATUS RESPONSE
# ==========================================================

class CustomerStatusResponse(BaseModel):


    id: int


    customer_id: str


    full_name: str



    status: str



    message: str



    model_config = ConfigDict(
        from_attributes=True
    )






# ==========================================================
# FINAL FORWARD REFERENCE FIX
# ==========================================================

CustomerProfileResponse.model_rebuild()