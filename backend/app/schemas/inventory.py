from datetime import datetime
from typing import Optional

from pydantic import BaseModel



# -----------------------------
# Product Mini Response
# -----------------------------

class ProductMini(BaseModel):

    id: int

    name: str

    sku: str

    brand: Optional[str] = None

    category_id: Optional[int] = None


    class Config:
        from_attributes = True





# -----------------------------
# Inventory
# -----------------------------

class InventoryBase(BaseModel):

    reorder_level: int = 10





class InventoryResponse(InventoryBase):

    id: int

    company_id: int

    product_id: int


    current_stock: int

    reserved_stock: int

    available_stock: int


    stock_status: str


    product: Optional[ProductMini] = None


    updated_at: datetime



    class Config:
        from_attributes = True





# -----------------------------
# Stock Adjustment
# -----------------------------

class StockAdjustment(BaseModel):

    inventory_id: int

    quantity: int

    reason: str

    remarks: Optional[str] = None





# -----------------------------
# Reorder Level
# -----------------------------

class ReorderLevelUpdate(BaseModel):

    reorder_level: int





# -----------------------------
# Movement History
# -----------------------------

class InventoryMovementResponse(BaseModel):

    id: int


    inventory_id: int


    movement_type: str


    quantity_changed: int


    previous_quantity: int


    updated_quantity: int


    reason: str


    remarks: Optional[str] = None


    performed_by: int


    created_at: datetime



    class Config:
        from_attributes = True





# -----------------------------
# Dashboard
# -----------------------------

class InventoryDashboard(BaseModel):

    total_products: int


    total_inventory_quantity: int


    low_stock_products: int


    out_of_stock_products: int