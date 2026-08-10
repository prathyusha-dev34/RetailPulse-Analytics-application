import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Alert,
  Box,
  Button,
  Container,
  MenuItem,
  Paper,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";

import {
  useNavigate,
} from "react-router-dom";

import {
  createSale,
} from "../api/salesApi";

import {
  getProducts,
} from "../api/productApi";

import api from "../api/axios";

// ============================================================
// TYPES
// ============================================================

interface Customer {
  id: number;
  customer_id?: string;
  full_name: string;
  email?: string;
  phone_number?: string;
  status?: string;
  company_id?: number;
}

// ============================================================
// ADD SALE
// ============================================================

export default function AddSale() {

  const navigate = useNavigate();

  // ==========================================================
  // PRODUCTS
  // ==========================================================

  const [products, setProducts] =
    useState<any[]>([]);

  // ==========================================================
  // CUSTOMERS
  // ==========================================================

  const [customers, setCustomers] =
    useState<Customer[]>([]);

  const [customerId, setCustomerId] =
    useState("");

  // ==========================================================
  // SALE DETAILS
  // ==========================================================

  const [saleDate, setSaleDate] =
    useState(
      new Date()
        .toISOString()
        .slice(0, 16)
    );

  const [productId, setProductId] =
    useState("");

  const [productName, setProductName] =
    useState("");

  const [category, setCategory] =
    useState("");

  const [sku, setSku] =
    useState("");

  const [availableStock, setAvailableStock] =
    useState(0);

  const [quantity, setQuantity] =
    useState(1);

  const [unitPrice, setUnitPrice] =
    useState(0);

  const [discount, setDiscount] =
    useState(0);

  const [tax, setTax] =
    useState(0);

  const [salesChannel, setSalesChannel] =
    useState("STORE");

  const [paymentMethod, setPaymentMethod] =
    useState("CASH");

  // ==========================================================
  // LOADING
  // ==========================================================

  const [loading, setLoading] =
    useState(false);

  const [loadingCustomers, setLoadingCustomers] =
    useState(false);

  const [loadingProducts, setLoadingProducts] =
    useState(false);

  // ==========================================================
  // SNACKBAR
  // ==========================================================

  const [snackbar, setSnackbar] =
    useState({
      open: false,
      message: "",
      type: "success" as
        "success" | "error",
    });

  // ==========================================================
  // TEXT FIELD STYLE
  // ==========================================================

  const textFieldStyle = {

    width: "100%",

    "& .MuiInputLabel-root": {
      color: "#cbd5e1",
    },

    "& .MuiOutlinedInput-root": {

      color: "#fff",

      background: "#1e293b",

      "& fieldset": {
        borderColor: "#475569",
      },

      "&:hover fieldset": {
        borderColor: "#60a5fa",
      },

      "&.Mui-focused fieldset": {
        borderColor: "#3b82f6",
      },
    },

    "& .MuiSelect-icon": {
      color: "#fff",
    },
  };

  // ==========================================================
  // LOAD CUSTOMERS
  // ==========================================================

  useEffect(() => {

    const loadCustomers =
      async () => {

        try {

          setLoadingCustomers(true);

          const response =
            await api.get(
              "/customers/"
            );

          const responseData =
            response.data;

          const customerList =
            responseData?.data ??
            responseData?.customers ??
            responseData?.items ??
            responseData ??
            [];

          const activeCustomers =
            Array.isArray(customerList)
              ? customerList.filter(
                  (customer: Customer) =>
                    !customer.status ||
                    customer.status.toUpperCase() ===
                      "ACTIVE"
                )
              : [];

          setCustomers(
            activeCustomers
          );

        } catch (error) {

          console.error(
            "Customer loading error:",
            error
          );

          setSnackbar({
            open: true,
            message:
              "Failed to load customers",
            type: "error",
          });

        } finally {

          setLoadingCustomers(false);

        }

      };

    loadCustomers();

  }, []);

  // ==========================================================
  // LOAD PRODUCTS
  // ==========================================================

  useEffect(() => {

    const loadProducts =
      async () => {

        try {

          setLoadingProducts(true);

          const response: any =
            await getProducts();

          const productList =
            response?.data?.products ??
            response?.data?.data ??
            response?.data?.items ??
            response?.data ??
            response ??
            [];

          setProducts(
            Array.isArray(productList)
              ? productList
              : []
          );

        } catch (error) {

          console.error(
            "Product loading error:",
            error
          );

          setSnackbar({
            open: true,
            message:
              "Failed to load products",
            type: "error",
          });

        } finally {

          setLoadingProducts(false);

        }

      };

    loadProducts();

  }, []);

  // ==========================================================
  // PRODUCT CHANGE
  // ==========================================================

  const handleProductChange =
    (id: string) => {

      setProductId(id);

      const product =
        products.find(
          (item: any) =>
            item.id === Number(id)
        );

      if (!product) {

        setProductName("");
        setCategory("");
        setSku("");
        setUnitPrice(0);
        setAvailableStock(0);

        return;
      }

      // Product name

      setProductName(
        product.name ||
        product.product_name ||
        "-"
      );

      // Category

      setCategory(
        product.category?.name ||
        product.category_name ||
        String(
          product.category_id ||
          "-"
        )
      );

      // SKU

      setSku(
        product.sku ||
        product.SKU ||
        "-"
      );

      // Unit price

      setUnitPrice(
        Number(
          product.unit_price ??
          product.price ??
          product.selling_price ??
          0
        )
      );

      // Available stock

      setAvailableStock(
        Number(
          product.stock_quantity ??
          product.stock ??
          product.available_stock ??
          product.quantity_in_stock ??
          0
        )
      );

      // Reset quantity

      setQuantity(1);

    };

  // ==========================================================
  // BILLING CALCULATIONS
  // ==========================================================

  const subtotal =
    useMemo(() => {

      return (
        Number(quantity) *
        Number(unitPrice)
      );

    }, [
      quantity,
      unitPrice,
    ]);

  // ----------------------------------------------------------
  // DISCOUNT AMOUNT
  // ----------------------------------------------------------

  const discountAmount =
    useMemo(() => {

      return (
        subtotal *
        Number(discount)
      ) / 100;

    }, [
      subtotal,
      discount,
    ]);

  // ----------------------------------------------------------
  // TAX AMOUNT
  // ----------------------------------------------------------

  const taxAmount =
    useMemo(() => {

      return (
        (
          subtotal -
          discountAmount
        ) *
        Number(tax)
      ) / 100;

    }, [
      subtotal,
      discountAmount,
      tax,
    ]);

  // ----------------------------------------------------------
  // GRAND TOTAL
  // ----------------------------------------------------------

  const totalAmount =
    useMemo(() => {

      return (
        subtotal -
        discountAmount +
        taxAmount
      );

    }, [
      subtotal,
      discountAmount,
      taxAmount,
    ]);

  // ==========================================================
  // SUBMIT SALE
  // ==========================================================

  const handleSubmit =
    async () => {

      // ------------------------------------------------------
      // CUSTOMER VALIDATION
      // ------------------------------------------------------

      if (!customerId) {

        setSnackbar({
          open: true,
          message:
            "Please select a customer",
          type: "error",
        });

        return;
      }

      // ------------------------------------------------------
      // PRODUCT VALIDATION
      // ------------------------------------------------------

      if (!productId) {

        setSnackbar({
          open: true,
          message:
            "Please select a product",
          type: "error",
        });

        return;
      }

      // ------------------------------------------------------
      // QUANTITY VALIDATION
      // ------------------------------------------------------

      if (
        !Number.isInteger(
          Number(quantity)
        ) ||
        Number(quantity) <= 0
      ) {

        setSnackbar({
          open: true,
          message:
            "Quantity must be greater than zero",
          type: "error",
        });

        return;
      }

      // ------------------------------------------------------
      // STOCK VALIDATION
      // ------------------------------------------------------

      if (
        Number(quantity) >
        Number(availableStock)
      ) {

        setSnackbar({
          open: true,
          message:
            `Insufficient stock. Available stock: ${availableStock}`,
          type: "error",
        });

        return;
      }

      // ------------------------------------------------------
      // PRICE VALIDATION
      // ------------------------------------------------------

      if (
        Number(unitPrice) <= 0
      ) {

        setSnackbar({
          open: true,
          message:
            "Unit price must be greater than zero",
          type: "error",
        });

        return;
      }

      // ------------------------------------------------------
      // DISCOUNT VALIDATION
      // ------------------------------------------------------

      if (
        Number(discount) < 0 ||
        Number(discount) > 100
      ) {

        setSnackbar({
          open: true,
          message:
            "Discount must be between 0 and 100",
          type: "error",
        });

        return;
      }

      // ------------------------------------------------------
      // TAX VALIDATION
      // ------------------------------------------------------

      if (
        Number(tax) < 0
      ) {

        setSnackbar({
          open: true,
          message:
            "Tax cannot be negative",
          type: "error",
        });

        return;
      }

      // ------------------------------------------------------
      // DISCOUNT VALUE VALIDATION
      // ------------------------------------------------------

      if (
        discountAmount >
        subtotal
      ) {

        setSnackbar({
          open: true,
          message:
            "Discount cannot exceed product value",
          type: "error",
        });

        return;
      }

      try {

        setLoading(true);

        // ----------------------------------------------------
        // BACKEND PAYLOAD
        // ----------------------------------------------------

        const payload = {

          customer_id:
            Number(customerId),

          sale_date:
            saleDate,

          sales_channel:
            salesChannel,

          payment_method:
            paymentMethod,

          items: [

            {

              product_id:
                Number(productId),

              quantity:
                Number(quantity),

              unit_price:
                Number(unitPrice),

              discount:
                Number(discount),

              tax:
                Number(tax),

            },

          ],

        };

        console.log(
          "CREATE SALE PAYLOAD:",
          payload
        );

        const createdSale =
          await createSale(
            payload
          );

        console.log(
          "SALE CREATED:",
          createdSale
        );

        setSnackbar({
          open: true,
          message:
            "Sale created successfully",
          type: "success",
        });

        // ----------------------------------------------------
        // NAVIGATE TO SALES
        // ----------------------------------------------------

        setTimeout(() => {

          navigate("/sales");

        }, 1000);

      } catch (error: any) {

        console.error(
          "Create sale error:",
          error
        );

        // ----------------------------------------------------
        // BACKEND ERROR MESSAGE
        // ----------------------------------------------------

        const backendMessage =
          error?.response?.data?.detail;

        setSnackbar({
          open: true,

          message:
            backendMessage ||
            "Failed to create sale",

          type: "error",
        });

      } finally {

        setLoading(false);

      }

    };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <Box
      sx={{
        minHeight: "100vh",

        background:
          "linear-gradient(135deg,#020617,#0f172a,#1e293b)",

        py: 5,
      }}
    >

      <Container
        maxWidth="lg"
        sx={{
          py: 2,
        }}
      >

        <Paper
          sx={{
            p: 5,

            background: "#111827",

            borderRadius: 4,

            color: "#fff",

            border:
              "1px solid #334155",

            boxShadow:
              "0 10px 30px rgba(0,0,0,0.35)",
          }}
        >

          {/* ==================================================
              TITLE
          ================================================== */}

          <Typography
            variant="h4"
            fontWeight="700"
            mb={4}
          >
            Add Sale
          </Typography>

          {/* ==================================================
              FORM
          ================================================== */}

          <Box
            display="grid"
            gridTemplateColumns={{
              xs: "1fr",
              md: "repeat(2,1fr)",
            }}
            gap={3}
          >

            {/* ------------------------------------------------
                INVOICE NUMBER
            ------------------------------------------------ */}

            <TextField
              label="Invoice Number"
              value="Auto Generated"
              fullWidth
              InputProps={{
                readOnly: true,
              }}
              sx={textFieldStyle}
            />

            {/* ------------------------------------------------
                SALE DATE
            ------------------------------------------------ */}

            <TextField
              label="Sale Date & Time"
              type="datetime-local"
              value={saleDate}
              fullWidth
              onChange={(e) =>
                setSaleDate(
                  e.target.value
                )
              }
              InputLabelProps={{
                shrink: true,
              }}
              sx={textFieldStyle}
            />

            {/* ------------------------------------------------
                CUSTOMER
            ------------------------------------------------ */}

            <TextField
              select
              label="Customer"
              value={customerId}
              fullWidth
              onChange={(e) =>
                setCustomerId(
                  e.target.value
                )
              }
              disabled={
                loadingCustomers
              }
              sx={textFieldStyle}
            >

              <MenuItem value="">
                Select Customer
              </MenuItem>

              {customers.length > 0 ? (

                customers.map(
                  (customer) => (

                    <MenuItem
                      key={customer.id}
                      value={customer.id}
                    >

                      {customer.full_name}

                      {customer.customer_id
                        ? ` (${customer.customer_id})`
                        : ""}

                    </MenuItem>

                  )
                )

              ) : (

                <MenuItem disabled>
                  {loadingCustomers
                    ? "Loading customers..."
                    : "No active customers available"}
                </MenuItem>

              )}

            </TextField>

            {/* ------------------------------------------------
                PRODUCT
            ------------------------------------------------ */}

            <TextField
              select
              label="Product"
              value={productId}
              fullWidth
              onChange={(e) =>
                handleProductChange(
                  e.target.value
                )
              }
              disabled={
                loadingProducts
              }
              sx={textFieldStyle}
            >

              <MenuItem value="">
                Select Product
              </MenuItem>

              {products.length > 0 ? (

                products.map(
                  (product: any) => (

                    <MenuItem
                      key={product.id}
                      value={product.id}
                    >
                      {product.name ||
                        product.product_name}
                    </MenuItem>

                  )
                )

              ) : (

                <MenuItem disabled>
                  {loadingProducts
                    ? "Loading products..."
                    : "No products available"}
                </MenuItem>

              )}

            </TextField>

            {/* ------------------------------------------------
                CATEGORY
            ------------------------------------------------ */}

            <TextField
              label="Category"
              value={category}
              fullWidth
              InputProps={{
                readOnly: true,
              }}
              sx={textFieldStyle}
            />

            {/* ------------------------------------------------
                SKU
            ------------------------------------------------ */}

            <TextField
              label="SKU"
              value={sku}
              fullWidth
              InputProps={{
                readOnly: true,
              }}
              sx={textFieldStyle}
            />

            {/* ------------------------------------------------
                AVAILABLE STOCK
            ------------------------------------------------ */}

            <TextField
              label="Available Stock"
              value={availableStock}
              fullWidth
              InputProps={{
                readOnly: true,
              }}
              sx={textFieldStyle}
            />

            {/* ------------------------------------------------
                QUANTITY
            ------------------------------------------------ */}

            <TextField
              label="Quantity"
              type="number"
              value={quantity}
              fullWidth
              onChange={(e) =>
                setQuantity(
                  Number(
                    e.target.value
                  )
                )
              }
              inputProps={{
                min: 1,
                max: availableStock,
              }}
              error={
                quantity > availableStock &&
                productId !== ""
              }
              helperText={
                productId &&
                quantity > availableStock
                  ? `Only ${availableStock} available`
                  : ""
              }
              sx={textFieldStyle}
            />

            {/* ------------------------------------------------
                UNIT PRICE
            ------------------------------------------------ */}

            <TextField
              label="Unit Price"
              type="number"
              value={unitPrice}
              fullWidth
              InputProps={{
                readOnly: true,
              }}
              inputProps={{
                min: 0,
              }}
              sx={textFieldStyle}
            />

            {/* ------------------------------------------------
                DISCOUNT
            ------------------------------------------------ */}

            <TextField
              label="Discount (%)"
              type="number"
              value={discount}
              fullWidth
              onChange={(e) =>
                setDiscount(
                  Number(
                    e.target.value
                  )
                )
              }
              inputProps={{
                min: 0,
                max: 100,
              }}
              sx={textFieldStyle}
            />

            {/* ------------------------------------------------
                TAX
            ------------------------------------------------ */}

            <TextField
              label="Tax (%)"
              type="number"
              value={tax}
              fullWidth
              onChange={(e) =>
                setTax(
                  Number(
                    e.target.value
                  )
                )
              }
              inputProps={{
                min: 0,
              }}
              sx={textFieldStyle}
            />

            {/* ------------------------------------------------
                SALES CHANNEL
            ------------------------------------------------ */}

            <TextField
              select
              label="Sales Channel"
              value={salesChannel}
              fullWidth
              onChange={(e) =>
                setSalesChannel(
                  e.target.value
                )
              }
              sx={textFieldStyle}
            >

              <MenuItem value="STORE">
                Store
              </MenuItem>

              <MenuItem value="ONLINE">
                Online
              </MenuItem>

              <MenuItem value="MARKETPLACE">
                Marketplace
              </MenuItem>

            </TextField>

            {/* ------------------------------------------------
                PAYMENT METHOD
            ------------------------------------------------ */}

            <TextField
              select
              label="Payment Method"
              value={paymentMethod}
              fullWidth
              onChange={(e) =>
                setPaymentMethod(
                  e.target.value
                )
              }
              sx={textFieldStyle}
            >

              <MenuItem value="CASH">
                Cash
              </MenuItem>

              <MenuItem value="CARD">
                Card
              </MenuItem>

              <MenuItem value="UPI">
                UPI
              </MenuItem>

              <MenuItem value="BANK_TRANSFER">
                Bank Transfer
              </MenuItem>

            </TextField>

          </Box>

          {/* ==================================================
              INVOICE SUMMARY
          ================================================== */}

          <Paper
            sx={{
              mt: 5,
              p: 4,

              background: "#1e293b",

              border:
                "1px solid #334155",

              borderRadius: 3,

              color: "#fff",

              boxShadow:
                "0 8px 20px rgba(0,0,0,0.25)",
            }}
          >

            <Typography
              variant="h6"
              fontWeight="700"
              mb={3}
            >
              Invoice Summary
            </Typography>

            <Box
              display="grid"
              gridTemplateColumns={{
                xs: "1fr",
                md: "repeat(2,1fr)",
              }}
              gap={2}
            >

              <Typography>
                <strong>
                  Customer :
                </strong>{" "}
                {
                  customers.find(
                    (customer) =>
                      customer.id ===
                      Number(customerId)
                  )?.full_name ||
                  "-"
                }
              </Typography>

              <Typography>
                <strong>
                  Product :
                </strong>{" "}
                {productName || "-"}
              </Typography>

              <Typography>
                <strong>
                  Category :
                </strong>{" "}
                {category || "-"}
              </Typography>

              <Typography>
                <strong>
                  SKU :
                </strong>{" "}
                {sku || "-"}
              </Typography>

              <Typography>
                <strong>
                  Quantity :
                </strong>{" "}
                {quantity}
              </Typography>

              <Typography>
                <strong>
                  Unit Price :
                </strong>{" "}
                ₹
                {unitPrice.toFixed(2)}
              </Typography>

              <Typography>
                <strong>
                  Subtotal :
                </strong>{" "}
                ₹
                {subtotal.toFixed(2)}
              </Typography>

              <Typography>
                <strong>
                  Discount :
                </strong>{" "}
                ₹
                {discountAmount.toFixed(2)}
              </Typography>

              <Typography>
                <strong>
                  Tax :
                </strong>{" "}
                ₹
                {taxAmount.toFixed(2)}
              </Typography>

            </Box>

            <Box
              mt={3}
              pt={2}
              borderTop="1px solid #475569"
            >

              <Typography
                variant="h5"
                fontWeight="700"
                color="#60a5fa"
              >
                Total Amount : ₹
                {totalAmount.toFixed(2)}
              </Typography>

            </Box>

          </Paper>

          {/* ==================================================
              BUTTONS
          ================================================== */}

          <Box
            display="flex"
            justifyContent="flex-end"
            gap={2}
            mt={4}
          >

            <Button
              variant="outlined"
              onClick={() =>
                navigate("/sales")
              }
              disabled={loading}
              sx={{
                px: 4,
                textTransform:
                  "none",
                fontWeight: 600,

                borderColor:
                  "#64748b",

                color: "#fff",

                "&:hover": {
                  borderColor:
                    "#94a3b8",
                  background:
                    "#1e293b",
                },
              }}
            >
              Cancel
            </Button>

            <Button
              variant="contained"
              disabled={
                loading ||
                loadingCustomers ||
                loadingProducts ||
                !customerId ||
                !productId ||
                quantity <= 0 ||
                quantity >
                  availableStock ||
                unitPrice <= 0
              }
              onClick={
                handleSubmit
              }
              sx={{
                px: 4,
                textTransform:
                  "none",
                fontWeight: 700,

                background:
                  "#2563eb",

                "&:hover": {
                  background:
                    "#1d4ed8",
                },

                "&.Mui-disabled": {
                  background:
                    "#334155",
                  color:
                    "#94a3b8",
                },
              }}
            >

              {loading
                ? "Saving..."
                : "Save Sale"}

            </Button>

          </Box>

        </Paper>

      </Container>

      {/* ======================================================
          SNACKBAR
      ====================================================== */}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() =>
          setSnackbar({
            ...snackbar,
            open: false,
          })
        }
      >

        <Alert
          severity={
            snackbar.type
          }
          onClose={() =>
            setSnackbar({
              ...snackbar,
              open: false,
            })
          }
        >
          {snackbar.message}
        </Alert>

      </Snackbar>

    </Box>
  );
}