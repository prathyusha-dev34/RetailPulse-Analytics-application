import {
  useEffect,
  useState,
} from "react";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Grid,
  Paper,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import PrintIcon from "@mui/icons-material/Print";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import DownloadIcon from "@mui/icons-material/Download";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import { getSale } from "../api/salesApi";

// ============================================================
// TYPES
// ============================================================

interface SaleItem {
  id?: number;
  product_id?: number;

  product_name?: string;
  category_name?: string;
  sku?: string;

  quantity?: number;
  unit_price?: number;

  discount?: number;
  tax?: number;

  total?: number;
  line_total?: number;

  product?: {
    name?: string;
    sku?: string;

    category?: {
      name?: string;
    };
  };
}

interface Sale {
  id: number;

  invoice_number?: string;

  customer_id?: number;
  customer_name?: string;

  sale_date?: string;

  sales_channel?: string;
  payment_method?: string;

  salesperson?: string;
  salesperson_name?: string;

  payment_status?: string;
  status?: string;

  subtotal?: number;
  discount?: number;
  tax?: number;
  total_amount?: number;

  notes?: string;

  items?: SaleItem[];
}

// ============================================================
// COMPONENT
// ============================================================

export default function SaleDetails() {
  const { id } = useParams();

  const navigate = useNavigate();

  // ==========================================================
  // STATE
  // ==========================================================

  const [sale, setSale] =
    useState<Sale | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [snackbar, setSnackbar] =
    useState({
      open: false,
      message: "",
      severity:
        "success" as
          | "success"
          | "error"
          | "info",
    });

  // ==========================================================
  // LOAD SALE
  // ==========================================================

  useEffect(() => {
    loadSale();
  }, [id]);

  const loadSale = async () => {
    try {
      setLoading(true);

      const response: any =
        await getSale(
          Number(id)
        );

      console.log(
        "SALE DETAILS RESPONSE 👉",
        response
      );

      const saleData =
        response?.data?.sale ??
        response?.data?.data ??
        response?.data ??
        response;

      setSale(saleData);
    } catch (error) {
      console.error(
        "Sale details error:",
        error
      );

      setSnackbar({
        open: true,
        message:
          "Unable to load sale details",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // FORMAT CURRENCY
  // ==========================================================

  const formatCurrency = (
    value: any
  ) => {
    return Number(
      value || 0
    ).toLocaleString(
      "en-IN",
      {
        style: "currency",
        currency: "INR",
      }
    );
  };

  // ==========================================================
  // FORMAT DATE
  // ==========================================================

  const formatDate = (
    value: any
  ) => {
    if (!value) {
      return "-";
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "-";
    }

    return date.toLocaleString(
      "en-IN"
    );
  };

  // ==========================================================
  // GET ITEM PRODUCT NAME
  // ==========================================================

  const getProductName = (
    item: SaleItem
  ) => {
    return (
      item.product_name ??
      item.product?.name ??
      `Product #${item.product_id ?? "-"}`
    );
  };

  // ==========================================================
  // GET CATEGORY
  // ==========================================================

  const getCategory = (
    item: SaleItem
  ) => {
    return (
      item.category_name ??
      item.product?.category?.name ??
      "-"
    );
  };

  // ==========================================================
  // GET SKU
  // ==========================================================

  const getSKU = (
    item: SaleItem
  ) => {
    return (
      item.sku ??
      item.product?.sku ??
      "-"
    );
  };

  // ==========================================================
  // GET LINE TOTAL
  // ==========================================================

  const getLineTotal = (
    item: SaleItem
  ) => {
    if (
      item.line_total !==
      undefined
    ) {
      return Number(
        item.line_total
      );
    }

    if (
      item.total !==
      undefined
    ) {
      return Number(
        item.total
      );
    }

    const quantity =
      Number(
        item.quantity || 0
      );

    const unitPrice =
      Number(
        item.unit_price || 0
      );

    const discount =
      Number(
        item.discount || 0
      );

    const tax =
      Number(
        item.tax || 0
      );

    return (
      quantity *
        unitPrice -
      discount +
      tax
    );
  };

  // ==========================================================
  // GET PAYMENT STATUS
  // ==========================================================

  const getPaymentStatus = () => {
    if (!sale) {
      return "PENDING";
    }

    return (
      sale.payment_status ??
      sale.status ??
      "PENDING"
    )
      .toString()
      .toUpperCase();
  };

  // ==========================================================
  // ITEMS
  // ==========================================================

  const items =
    sale?.items ?? [];

  // ==========================================================
  // CALCULATIONS
  // ==========================================================

  const calculatedSubtotal =
    items.reduce(
      (
        sum,
        item
      ) =>
        sum +
        Number(
          item.quantity || 0
        ) *
          Number(
            item.unit_price || 0
          ),
      0
    );

  const itemDiscount =
    items.reduce(
      (
        sum,
        item
      ) =>
        sum +
        Number(
          item.discount || 0
        ),
      0
    );

  const itemTax =
    items.reduce(
      (
        sum,
        item
      ) =>
        sum +
        Number(
          item.tax || 0
        ),
      0
    );

  const subtotal =
    sale?.subtotal !==
    undefined
      ? Number(
          sale.subtotal
        )
      : calculatedSubtotal;

  const discount =
    sale?.discount !==
    undefined
      ? Number(
          sale.discount
        )
      : itemDiscount;

  const tax =
    sale?.tax !==
    undefined
      ? Number(
          sale.tax
        )
      : itemTax;

  const calculatedGrandTotal =
    subtotal -
    discount +
    tax;

  const grandTotal =
    sale?.total_amount !==
    undefined
      ? Number(
          sale.total_amount
        )
      : calculatedGrandTotal;

  const totalQuantity =
    items.reduce(
      (
        sum,
        item
      ) =>
        sum +
        Number(
          item.quantity || 0
        ),
      0
    );

  // ==========================================================
  // PDF EXPORT / PRINT
  // ==========================================================

  const handlePDFExport = () => {
    window.print();
  };

  // ==========================================================
  // CSV EXPORT
  // ==========================================================

  const handleCSVExport = () => {
    if (!sale) {
      return;
    }

    const header = [
      "Invoice Number",
      "Sale Date",
      "Customer",
      "Product",
      "SKU",
      "Quantity",
      "Unit Price",
      "Discount",
      "Tax",
      "Line Total",
    ];

    const rows = items.map(
      (item) => [
        sale.invoice_number ??
          "",
        sale.sale_date ??
          "",
        sale.customer_name ??
          "",
        getProductName(
          item
        ),
        getSKU(item),
        Number(
          item.quantity || 0
        ),
        Number(
          item.unit_price || 0
        ),
        Number(
          item.discount || 0
        ),
        Number(
          item.tax || 0
        ),
        getLineTotal(item),
      ]
    );

    const summaryRows = [
      [],
      [
        "Subtotal",
        subtotal,
      ],
      [
        "Discount",
        discount,
      ],
      [
        "Tax",
        tax,
      ],
      [
        "Grand Total",
        grandTotal,
      ],
    ];

    const csvRows = [
      header,
      ...rows,
      ...summaryRows,
    ];

    const csvContent =
      csvRows
        .map((row) =>
          row
            .map(
              (value) =>
                `"${String(
                  value ?? ""
                ).replace(
                  /"/g,
                  '""'
                )}"`
            )
            .join(",")
        )
        .join("\n");

    const blob =
      new Blob(
        [csvContent],
        {
          type:
            "text/csv;charset=utf-8;",
        }
      );

    const url =
      URL.createObjectURL(
        blob
      );

    const link =
      document.createElement(
        "a"
      );

    link.href = url;

    link.download =
      `${
        sale.invoice_number ||
        `sale-${sale.id}`
      }.csv`;

    document.body.appendChild(
      link
    );

    link.click();

    document.body.removeChild(
      link
    );

    URL.revokeObjectURL(
      url
    );

    setSnackbar({
      open: true,
      message:
        "Invoice CSV exported successfully",
      severity: "success",
    });
  };

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <Box
        sx={{
          minHeight:
            "100vh",
          bgcolor:
            "#0F172A",
          display: "flex",
          alignItems:
            "center",
          justifyContent:
            "center",
        }}
      >
        <Typography
          color="white"
          variant="h6"
        >
          Loading sale details...
        </Typography>
      </Box>
    );
  }

  // ==========================================================
  // NOT FOUND
  // ==========================================================

  if (!sale) {
    return (
      <Box
        sx={{
          minHeight:
            "100vh",
          bgcolor:
            "#0F172A",
          display: "flex",
          alignItems:
            "center",
          justifyContent:
            "center",
        }}
      >
        <Box textAlign="center">
          <Typography
            color="white"
            variant="h5"
            mb={2}
          >
            Sale not found
          </Typography>

          <Button
            variant="contained"
            onClick={() =>
              navigate(
                "/sales"
              )
            }
          >
            Back To Sales
          </Button>
        </Box>
      </Box>
    );
  }

  // ==========================================================
  // CARD STYLE
  // ==========================================================

  const cardStyle = {
    background:
      "#111827",
    color: "#fff",
    borderRadius: 3,
    border:
      "1px solid #1E293B",
    height: "100%",
  };

  const paymentStatus =
    getPaymentStatus();

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <Box
      className="invoice-page"
      sx={{
        minHeight:
          "100vh",
        background:
          "linear-gradient(135deg,#020617,#0F172A,#1E293B)",
        py: 5,
      }}
    >
      <Container
        maxWidth="xl"
      >
        {/* ==================================================
            HEADER
        ================================================== */}

        <Paper
          sx={{
            p: 4,
            mb: 4,
            background:
              "#111827",
            color: "#fff",
            borderRadius: 4,
            border:
              "1px solid #1E293B",
          }}
        >
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            flexWrap="wrap"
            gap={3}
          >
            <Box>
              <Box
                display="flex"
                alignItems="center"
                gap={2}
                mb={2}
              >
                <ReceiptLongIcon
                  sx={{
                    fontSize: 42,
                    color:
                      "#60A5FA",
                  }}
                />

                <Typography
                  variant="h4"
                  fontWeight={700}
                >
                  Invoice Preview
                </Typography>
              </Box>

              <Typography
                color="#94A3B8"
              >
                Invoice Number:{" "}
                <b
                  style={{
                    color:
                      "#FFFFFF",
                  }}
                >
                  {sale.invoice_number ||
                    `SALE-${sale.id}`}
                </b>
              </Typography>

              <Typography
                color="#94A3B8"
                mt={1}
              >
                Sale Date:{" "}
                <b
                  style={{
                    color:
                      "#FFFFFF",
                  }}
                >
                  {formatDate(
                    sale.sale_date
                  )}
                </b>
              </Typography>
            </Box>

            <Chip
              label={
                paymentStatus
              }
              color={
                paymentStatus ===
                "PAID"
                  ? "success"
                  : paymentStatus ===
                    "CANCELLED"
                  ? "error"
                  : "warning"
              }
              sx={{
                fontWeight: 700,
                fontSize: 15,
              }}
            />
          </Box>
        </Paper>

        {/* ==================================================
            SUMMARY CARDS
        ================================================== */}

        <Grid
          container
          spacing={3}
          mb={4}
        >
          {/* TOTAL */}

          <Grid
            size={{
              xs: 12,
              md: 3,
            }}
          >
            <Card
              sx={cardStyle}
            >
              <CardContent>
                <Typography
                  color="#94A3B8"
                >
                  Grand Total
                </Typography>

                <Typography
                  variant="h5"
                  fontWeight={700}
                  mt={1}
                >
                  {formatCurrency(
                    grandTotal
                  )}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* PRODUCTS */}

          <Grid
            size={{
              xs: 12,
              md: 3,
            }}
          >
            <Card
              sx={cardStyle}
            >
              <CardContent>
                <Typography
                  color="#94A3B8"
                >
                  Products
                </Typography>

                <Typography
                  variant="h5"
                  fontWeight={700}
                  mt={1}
                >
                  {items.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* QUANTITY */}

          <Grid
            size={{
              xs: 12,
              md: 3,
            }}
          >
            <Card
              sx={cardStyle}
            >
              <CardContent>
                <Typography
                  color="#94A3B8"
                >
                  Quantity Sold
                </Typography>

                <Typography
                  variant="h5"
                  fontWeight={700}
                  mt={1}
                >
                  {totalQuantity}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* PAYMENT */}

          <Grid
            size={{
              xs: 12,
              md: 3,
            }}
          >
            <Card
              sx={cardStyle}
            >
              <CardContent>
                <Typography
                  color="#94A3B8"
                >
                  Payment Method
                </Typography>

                <Typography
                  variant="h6"
                  fontWeight={700}
                  mt={1}
                >
                  {sale.payment_method ||
                    "-"}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* ==================================================
            INFORMATION CARDS
        ================================================== */}

        <Grid
          container
          spacing={3}
          mb={4}
        >
          {/* CUSTOMER */}

          <Grid
            size={{
              xs: 12,
              md: 4,
            }}
          >
            <Card
              sx={cardStyle}
            >
              <CardContent>
                <Typography
                  variant="h6"
                  fontWeight={700}
                >
                  Customer Information
                </Typography>

                <Divider
                  sx={{
                    my: 2,
                    borderColor:
                      "#334155",
                  }}
                />

                <Typography>
                  Customer:{" "}
                  <b>
                    {sale.customer_name ||
                      "-"}
                  </b>
                </Typography>

                <Typography
                  mt={2}
                >
                  Customer ID:{" "}
                  {sale.customer_id ??
                    "-"}
                </Typography>

                <Typography
                  mt={2}
                >
                  Invoice:{" "}
                  {sale.invoice_number ||
                    `SALE-${sale.id}`}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* PAYMENT */}

          <Grid
            size={{
              xs: 12,
              md: 4,
            }}
          >
            <Card
              sx={cardStyle}
            >
              <CardContent>
                <Typography
                  variant="h6"
                  fontWeight={700}
                >
                  Payment Details
                </Typography>

                <Divider
                  sx={{
                    my: 2,
                    borderColor:
                      "#334155",
                  }}
                />

                <Typography>
                  Sales Channel:{" "}
                  {sale.sales_channel ||
                    "-"}
                </Typography>

                <Typography
                  mt={2}
                >
                  Payment Method:{" "}
                  {sale.payment_method ||
                    "-"}
                </Typography>

                <Box
                  mt={2}
                  display="flex"
                  alignItems="center"
                  gap={1}
                  flexWrap="wrap"
                >
                  <Typography component="span">
                    Payment Status:
                  </Typography>

                  <Chip
                    size="small"
                    label={
                      paymentStatus
                    }
                    color={
                      paymentStatus ===
                      "PAID"
                        ? "success"
                        : paymentStatus ===
                          "CANCELLED"
                        ? "error"
                        : "warning"
                    }
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* SALESPERSON */}

          <Grid
            size={{
              xs: 12,
              md: 4,
            }}
          >
            <Card
              sx={cardStyle}
            >
              <CardContent>
                <Typography
                  variant="h6"
                  fontWeight={700}
                >
                  Salesperson
                </Typography>

                <Divider
                  sx={{
                    my: 2,
                    borderColor:
                      "#334155",
                  }}
                />

                <Typography>
                  Salesperson:{" "}
                  {sale.salesperson_name ??
                    sale.salesperson ??
                    "-"}
                </Typography>

                <Typography
                  mt={2}
                >
                  Sale Date:{" "}
                  {formatDate(
                    sale.sale_date
                  )}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* ==================================================
            PURCHASED PRODUCTS
        ================================================== */}

        <Paper
          sx={{
            p: 3,
            mb: 4,
            background:
              "#111827",
            borderRadius: 3,
          }}
        >
          <Typography
            variant="h6"
            fontWeight={700}
            color="white"
            mb={3}
          >
            Purchased Products
          </Typography>

          <Table>
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    color:
                      "#CBD5E1",
                    fontWeight: 700,
                  }}
                >
                  Product
                </TableCell>

                <TableCell
                  sx={{
                    color:
                      "#CBD5E1",
                    fontWeight: 700,
                  }}
                >
                  SKU
                </TableCell>

                <TableCell
                  sx={{
                    color:
                      "#CBD5E1",
                    fontWeight: 700,
                  }}
                >
                  Category
                </TableCell>

                <TableCell
                  sx={{
                    color:
                      "#CBD5E1",
                    fontWeight: 700,
                  }}
                >
                  Quantity
                </TableCell>

                <TableCell
                  sx={{
                    color:
                      "#CBD5E1",
                    fontWeight: 700,
                  }}
                >
                  Unit Price
                </TableCell>

                <TableCell
                  sx={{
                    color:
                      "#CBD5E1",
                    fontWeight: 700,
                  }}
                >
                  Discount
                </TableCell>

                <TableCell
                  sx={{
                    color:
                      "#CBD5E1",
                    fontWeight: 700,
                  }}
                >
                  Tax
                </TableCell>

                <TableCell
                  sx={{
                    color:
                      "#CBD5E1",
                    fontWeight: 700,
                  }}
                >
                  Line Total
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {items.length ===
              0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    align="center"
                    sx={{
                      color:
                        "#94A3B8",
                      py: 5,
                    }}
                  >
                    No products found
                  </TableCell>
                </TableRow>
              ) : (
                items.map(
                  (
                    item,
                    index
                  ) => (
                    <TableRow
                      key={
                        item.id ??
                        index
                      }
                    >
                      <TableCell
                        sx={{
                          color:
                            "#FFFFFF",
                        }}
                      >
                        {getProductName(
                          item
                        )}
                      </TableCell>

                      <TableCell
                        sx={{
                          color:
                            "#CBD5E1",
                        }}
                      >
                        {getSKU(
                          item
                        )}
                      </TableCell>

                      <TableCell
                        sx={{
                          color:
                            "#CBD5E1",
                        }}
                      >
                        {getCategory(
                          item
                        )}
                      </TableCell>

                      <TableCell
                        sx={{
                          color:
                            "#CBD5E1",
                        }}
                      >
                        {Number(
                          item.quantity ||
                            0
                        )}
                      </TableCell>

                      <TableCell
                        sx={{
                          color:
                            "#CBD5E1",
                        }}
                      >
                        {formatCurrency(
                          item.unit_price
                        )}
                      </TableCell>

                      <TableCell
                        sx={{
                          color:
                            "#F87171",
                        }}
                      >
                        -
                        {formatCurrency(
                          item.discount
                        )}
                      </TableCell>

                      <TableCell
                        sx={{
                          color:
                            "#4ADE80",
                        }}
                      >
                        +
                        {formatCurrency(
                          item.tax
                        )}
                      </TableCell>

                      <TableCell
                        sx={{
                          color:
                            "#FFFFFF",
                          fontWeight: 700,
                        }}
                      >
                        {formatCurrency(
                          getLineTotal(
                            item
                          )
                        )}
                      </TableCell>
                    </TableRow>
                  )
                )
              )}
            </TableBody>
          </Table>
        </Paper>

        {/* ==================================================
            PRICING SUMMARY
        ================================================== */}

        <Card
          sx={{
            background:
              "#111827",
            color: "#fff",
            borderRadius: 3,
            mb: 4,
          }}
        >
          <CardContent>
            <Typography
              variant="h6"
              fontWeight={700}
              mb={3}
            >
              Pricing Summary
            </Typography>

            <Divider
              sx={{
                borderColor:
                  "#334155",
                mb: 3,
              }}
            />

            <Box
              display="flex"
              justifyContent="space-between"
              mb={2}
            >
              <Typography>
                Subtotal
              </Typography>

              <Typography>
                {formatCurrency(
                  subtotal
                )}
              </Typography>
            </Box>

            <Box
              display="flex"
              justifyContent="space-between"
              mb={2}
            >
              <Typography>
                Discount
              </Typography>

              <Typography
                color="#F87171"
              >
                -
                {formatCurrency(
                  discount
                )}
              </Typography>
            </Box>

            <Box
              display="flex"
              justifyContent="space-between"
              mb={2}
            >
              <Typography>
                Tax
              </Typography>

              <Typography
                color="#4ADE80"
              >
                +
                {formatCurrency(
                  tax
                )}
              </Typography>
            </Box>

            <Divider
              sx={{
                borderColor:
                  "#334155",
                my: 3,
              }}
            />

            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography
                variant="h6"
                fontWeight={700}
              >
                Grand Total
              </Typography>

              <Typography
                variant="h4"
                fontWeight={700}
                color="#60A5FA"
              >
                {formatCurrency(
                  grandTotal
                )}
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* ==================================================
            NOTES
        ================================================== */}

        {sale.notes && (
          <Card
            sx={{
              ...cardStyle,
              mb: 4,
            }}
          >
            <CardContent>
              <Typography
                variant="h6"
                fontWeight={700}
                mb={2}
              >
                Notes
              </Typography>

              <Typography
                color="#CBD5E1"
              >
                {sale.notes}
              </Typography>
            </CardContent>
          </Card>
        )}

        {/* ==================================================
            ACTION BUTTONS
        ================================================== */}

        <Box
          display="flex"
          gap={2}
          flexWrap="wrap"
          mb={3}
        >
          {/* BACK */}

          <Button
            variant="contained"
            startIcon={
              <ArrowBackIcon />
            }
            onClick={() =>
              navigate(
                "/sales"
              )
            }
            sx={{
              textTransform:
                "none",
              fontWeight: 700,
            }}
          >
            Back To Sales
          </Button>

          {/* EDIT */}

          <Button
            variant="contained"
            color="warning"
            startIcon={
              <EditIcon />
            }
            onClick={() =>
            navigate(`/sales/edit/${sale.id}`)

            }
            sx={{
              textTransform:
                "none",
              fontWeight: 700,
            }}
          >
            Edit Sale
          </Button>

          {/* PDF */}

          <Button
            variant="contained"
            color="error"
            startIcon={
              <PictureAsPdfIcon />
            }
            onClick={
              handlePDFExport
            }
            sx={{
              textTransform:
                "none",
              fontWeight: 700,
            }}
          >
            Export PDF
          </Button>

          {/* CSV */}

          <Button
            variant="contained"
            color="success"
            startIcon={
              <DownloadIcon />
            }
            onClick={
              handleCSVExport
            }
            sx={{
              textTransform:
                "none",
              fontWeight: 700,
            }}
          >
            Export CSV
          </Button>

          {/* PRINT */}

          <Button
            variant="outlined"
            startIcon={
              <PrintIcon />
            }
            onClick={() =>
              window.print()
            }
            sx={{
              color: "#fff",
              borderColor:
                "#64748B",
              textTransform:
                "none",
              fontWeight: 700,
            }}
          >
            Print Invoice
          </Button>
        </Box>
      </Container>

      {/* ======================================================
          SNACKBAR
      ====================================================== */}

      <Snackbar
        open={
          snackbar.open
        }
        autoHideDuration={
          3000
        }
        onClose={() =>
          setSnackbar({
            ...snackbar,
            open: false,
          })
        }
        anchorOrigin={{
          vertical:
            "bottom",
          horizontal:
            "right",
        }}
      >
        <Alert
          severity={
            snackbar.severity
          }
          variant="filled"
          onClose={() =>
            setSnackbar({
              ...snackbar,
              open: false,
            })
          }
        >
          {
            snackbar.message
          }
        </Alert>
      </Snackbar>

      {/* ======================================================
          PRINT STYLES
      ====================================================== */}

      <style>
        {`
          @media print {

            body {
              background: white !important;
              margin: 0;
            }

            .invoice-page {
              background: white !important;
              padding: 0 !important;
            }

            button,
            .MuiButton-root,
            .MuiSnackbar-root {
              display: none !important;
            }

            .MuiPaper-root,
            .MuiCard-root {
              box-shadow: none !important;
              border: 1px solid #ddd !important;
              background: white !important;
              color: black !important;
            }

            .MuiTypography-root,
            .MuiTableCell-root {
              color: black !important;
            }
          }
        `}
      </style>
    </Box>
  );
}
