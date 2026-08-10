import { useEffect, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  IconButton,
  MenuItem,
  Paper,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

import {
  Add,
  Delete,
  Description,
  Edit,
  PictureAsPdf,
  Refresh,
  Visibility,
} from "@mui/icons-material";

import { useNavigate } from "react-router-dom";

import jsPDF from "jspdf";

import api from "../api/axios";

import {
  deleteSale,
  filterSales,
  getDashboardSummary,
  getSales,
  searchSales,
  sortSales,
} from "../api/salesApi";
// ============================================================
// TYPES
// ============================================================

interface SaleItem {
  id?: number;
  product_id?: number;
  product_name?: string;
  name?: string;
  sku?: string;

  product?: {
    id?: number;
    name?: string;
    sku?: string;
    category?: {
      id?: number;
      name?: string;
    };
  };

  quantity?: number | string;
  unit_price?: number | string;
  line_total?: number | string;
  discount?: number | string;
  tax?: number | string;
}

interface Sale {
  id: number;

  invoice_number?: string;

  customer_id?: number;

  customer?: {
    id?: number;
    full_name?: string;
    name?: string;
  };

  customer_name?: string;

  sale_date?: string;

  items?: SaleItem[];

  number_of_items?: number;

  total_amount?: number | string;

  subtotal?: number | string;

  discount?: number | string;

  tax?: number | string;

  grand_total?: number | string;

  total?: number | string;

  payment_status?: string;

  status?: string;

  sales_channel?: string;

  payment_method?: string;

  notes?: string;
}

interface DashboardSummary {
  total_sales?: number;
  total_items_sold?: number;
  total_revenue?: number | string;
}

// ============================================================
// COMPONENT
// ============================================================

export default function Sales() {
  const navigate = useNavigate();

  // ==========================================================
  // SALES
  // ==========================================================

  const [sales, setSales] = useState<Sale[]>([]);

  // ==========================================================
  // DASHBOARD SUMMARY
  // ==========================================================

  const [summary, setSummary] =
    useState<DashboardSummary>({
      total_sales: 0,
      total_items_sold: 0,
      total_revenue: 0,
    });

  // ==========================================================
  // LOADING
  // ==========================================================

  const [loading, setLoading] =
    useState(false);

  // ==========================================================
  // SEARCH
  // ==========================================================

  const [searchKeyword, setSearchKeyword] =
    useState("");

  // ==========================================================
  // FILTERS
  // ==========================================================

  const [startDate, setStartDate] =
    useState("");

  const [endDate, setEndDate] =
    useState("");

  const [categoryId, setCategoryId] =
    useState("");

  const [salesChannel, setSalesChannel] =
    useState("");

  const [paymentMethod, setPaymentMethod] =
    useState("");

  const [paymentStatus, setPaymentStatus] =
    useState("");

  // ==========================================================
  // SORT
  // ==========================================================

  const [sortBy, setSortBy] =
    useState("sale_date");

  const [sortOrder, setSortOrder] =
    useState<"asc" | "desc">("desc");

  // ==========================================================
  // SNACKBAR
  // ==========================================================

  const [snackbar, setSnackbar] =
    useState<{
      open: boolean;
      message: string;
      type: "success" | "error";
    }>({
      open: false,
      message: "",
      type: "success",
    });

  // ==========================================================
  // TEXT FIELD STYLE
  // ==========================================================

  const textFieldStyle = {
    "& .MuiInputLabel-root": {
      color: "#cbd5e1",
    },

    "& .MuiInputLabel-root.Mui-focused": {
      color: "#60a5fa",
    },

    "& .MuiOutlinedInput-root": {
      color: "#fff",
      backgroundColor: "#1e293b",

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

    "& input[type='date']::-webkit-calendar-picker-indicator":
      {
        filter: "invert(1)",
      },
  };

  // ==========================================================
  // RESPONSE NORMALIZER
  // ==========================================================

  const extractSales = (
    response: any
  ): Sale[] => {
    const salesList =
      response?.data?.sales ??
      response?.data?.items ??
      response?.data?.data ??
      response?.sales ??
      response?.items ??
      response?.data ??
      response ??
      [];

    return Array.isArray(salesList)
      ? salesList
      : [];
  };

  // ==========================================================
  // LOAD SALES
  // ==========================================================

  const loadSales = async () => {
    try {
      setLoading(true);

      const response: any =
        await getSales();

      const salesList =
        extractSales(response);

      setSales(salesList);
    } catch (error: any) {
      console.error(
        "Load sales error:",
        error
      );

      setSnackbar({
        open: true,
        message:
          error?.response?.data?.detail ||
          "Failed to load sales",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // LOAD DASHBOARD SUMMARY
  // ==========================================================

  const loadSummary = async () => {
    try {
      const response: any =
        await getDashboardSummary();

      const summaryData =
        response?.data?.summary ??
        response?.data?.data ??
        response?.data ??
        response?.summary ??
        response ??
        {};

      setSummary({
        total_sales: Number(
          summaryData?.total_sales ??
            summaryData?.sales_count ??
            summaryData?.total_transactions ??
            0
        ),

        total_items_sold: Number(
          summaryData?.total_items_sold ??
            summaryData?.items_sold ??
            summaryData?.total_items ??
            0
        ),

        total_revenue: Number(
          summaryData?.total_revenue ??
            summaryData?.revenue ??
            summaryData?.total_amount ??
            0
        ),
      });
    } catch (error) {
      console.error(
        "Dashboard summary error:",
        error
      );
    }
  };

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    loadSales();
    loadSummary();
  }, []);

  // ==========================================================
  // REFRESH
  // ==========================================================

  const handleRefresh = async () => {
    await Promise.all([
      loadSales(),
      loadSummary(),
    ]);
  };

  // ==========================================================
  // SEARCH
  // ==========================================================

  const handleSearch = async () => {
    const keyword =
      searchKeyword.trim();

    if (!keyword) {
      await loadSales();
      return;
    }

    try {
      setLoading(true);

      const response: any =
        await searchSales(keyword);

      setSales(
        extractSales(response)
      );
    } catch (error: any) {
      console.error(
        "Search sales error:",
        error
      );

      setSnackbar({
        open: true,
        message:
          error?.response?.data?.detail ||
          "Failed to search sales",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // SEARCH ON ENTER
  // ==========================================================

  const handleSearchKeyDown = (
    event: React.KeyboardEvent
  ) => {
    if (event.key === "Enter") {
      handleSearch();
    }
  };

  // ==========================================================
  // FILTER
  // ==========================================================

  const handleFilter = async () => {
    try {
      setLoading(true);

      const params: Record<
        string,
        string | number
      > = {};

      if (startDate) {
        params.start_date =
          startDate;
      }

      if (endDate) {
        params.end_date =
          endDate;
      }

      if (categoryId) {
        params.category_id =
          Number(categoryId);
      }

      if (salesChannel) {
        params.sales_channel =
          salesChannel;
      }

      if (paymentMethod) {
        params.payment_method =
          paymentMethod;
      }

      if (paymentStatus) {
        params.payment_status =
          paymentStatus;
      }

      const hasFilters =
        Object.keys(params).length > 0;

      if (!hasFilters) {
        await loadSales();
        return;
      }

      const response: any =
        await filterSales(params);

      setSales(
        extractSales(response)
      );
    } catch (error: any) {
      console.error(
        "Filter sales error:",
        error
      );

      setSnackbar({
        open: true,
        message:
          error?.response?.data?.detail ||
          "Failed to filter sales",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // SORT
  // ==========================================================

  const handleSort = async (
    field = sortBy,
    order = sortOrder
  ) => {
    try {
      setLoading(true);

      const response: any =
        await sortSales(
          field,
          order
        );

      setSales(
        extractSales(response)
      );
    } catch (error: any) {
      console.error(
        "Sort sales error:",
        error
      );

      setSnackbar({
        open: true,
        message:
          error?.response?.data?.detail ||
          "Failed to sort sales",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // SORT BY CHANGE
  // ==========================================================

  const handleSortByChange = async (
    value: string
  ) => {
    setSortBy(value);

    await handleSort(
      value,
      sortOrder
    );
  };

  // ==========================================================
  // SORT ORDER CHANGE
  // ==========================================================

  const handleSortOrderChange = async (
    value: "asc" | "desc"
  ) => {
    setSortOrder(value);

    await handleSort(
      sortBy,
      value
    );
  };

  // ==========================================================
  // CLEAR FILTERS
  // ==========================================================

  const handleClearFilters =
    async () => {
      setSearchKeyword("");
      setStartDate("");
      setEndDate("");
      setCategoryId("");
      setSalesChannel("");
      setPaymentMethod("");
      setPaymentStatus("");
      setSortBy("sale_date");
      setSortOrder("desc");

      await loadSales();
    };

  // ==========================================================
  // DELETE SALE
  // ==========================================================

  const handleDelete = async (
    saleId: number
  ) => {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this sale?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setLoading(true);

      await deleteSale(saleId);

      setSnackbar({
        open: true,
        message:
          "Sale deleted successfully",
        type: "success",
      });

      await Promise.all([
        loadSales(),
        loadSummary(),
      ]);
    } catch (error: any) {
      console.error(
        "Delete sale error:",
        error
      );

      setSnackbar({
        open: true,
        message:
          error?.response?.data?.detail ||
          "Failed to delete sale",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================
  // FORMAT DATE
  // ==========================================================

  const formatDate = (
    date?: string
  ) => {
    if (!date) {
      return "-";
    }

    const parsed =
      new Date(date);

    if (
      Number.isNaN(
        parsed.getTime()
      )
    ) {
      return date;
    }

    return parsed.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  // ==========================================================
  // CUSTOMER NAME
  // ==========================================================

  const getCustomerName = (
    sale: Sale
  ) => {
    return (
      sale.customer?.full_name ||
      sale.customer?.name ||
      sale.customer_name ||
      "-"
    );
  };

  // ==========================================================
  // ITEM COUNT
  // ==========================================================

  const getItemCount = (
    sale: Sale
  ) => {
    if (
      typeof sale.number_of_items ===
      "number"
    ) {
      return sale.number_of_items;
    }

    if (
      Array.isArray(sale.items)
    ) {
      return sale.items.reduce(
        (
          total: number,
          item: SaleItem
        ) =>
          total +
          Number(
            item.quantity || 0
          ),
        0
      );
    }

    return 0;
  };

  // ==========================================================
  // TOTAL AMOUNT
  // ==========================================================

  const getTotalAmount = (
    sale: Sale
  ) => {
    return Number(
      sale.total_amount ??
        sale.grand_total ??
        sale.total ??
        0
    );
  };

  // ==========================================================
  // PAYMENT STATUS
  // ==========================================================

  const getPaymentStatus = (
    sale: Sale
  ) => {
    return (
      sale.payment_status ||
      sale.status ||
      "PAID"
    ).toUpperCase();
  };

  // ==========================================================
  // SUBTOTAL
  // ==========================================================

  const getSubtotal = (
    sale: Sale
  ) => {
    if (
      sale.subtotal !==
      undefined
    ) {
      return Number(
        sale.subtotal
      );
    }

    if (
      Array.isArray(sale.items)
    ) {
      return sale.items.reduce(
        (
          total: number,
          item: SaleItem
        ) => {
          const quantity =
            Number(
              item.quantity || 0
            );

          const unitPrice =
            Number(
              item.unit_price || 0
            );

          const lineTotal =
            Number(
              item.line_total ??
                quantity *
                  unitPrice
            );

          return (
            total + lineTotal
          );
        },
        0
      );
    }

    return 0;
  };

  // ==========================================================
  // DISCOUNT
  // ==========================================================

  const getDiscount = (
    sale: Sale
  ) => {
    return Number(
      sale.discount ?? 0
    );
  };

  // ==========================================================
  // TAX
  // ==========================================================

  const getTax = (
    sale: Sale
  ) => {
    return Number(
      sale.tax ?? 0
    );
  };

  // ==========================================================
  // CSV ESCAPE
  // ==========================================================

  const escapeCSV = (
    value: unknown
  ) => {
    return `"${String(
      value ?? ""
    ).replace(
      /"/g,
      '""'
    )}"`;
  };

  // ==========================================================
  // EXPORT CSV
  // ==========================================================

  const exportSaleCSV = (
    sale: Sale
  ) => {
    try {
      const invoiceNumber =
        sale.invoice_number ||
        `INV-${sale.id}`;

      const customerName =
        getCustomerName(sale);

      const saleDate =
        sale.sale_date || "";

      const paymentMethod =
        sale.payment_method ||
        "";

      const paymentStatus =
        getPaymentStatus(sale);

      const subtotal =
        getSubtotal(sale);

      const discount =
        getDiscount(sale);

      const tax =
        getTax(sale);

      const grandTotal =
        getTotalAmount(sale);

      const rows: string[][] =
        [];

      // CSV HEADER
      rows.push([
        "Invoice Number",
        "Customer Name",
        "Sale Date",
        "Payment Method",
        "Payment Status",
        "Product",
        "SKU",
        "Quantity",
        "Unit Price",
        "Line Total",
      ]);

      // ITEMS
      if (
        Array.isArray(
          sale.items
        ) &&
        sale.items.length > 0
      ) {
        sale.items.forEach(
          (
            item: SaleItem
          ) => {
            const quantity =
              Number(
                item.quantity ||
                  0
              );

            const unitPrice =
              Number(
                item.unit_price ||
                  0
              );

            const lineTotal =
              Number(
                item.line_total ??
                  quantity *
                    unitPrice
              );

            rows.push([
              invoiceNumber,
              customerName,
              saleDate,
              paymentMethod,
              paymentStatus,

              item.product
                ?.name ||
                item.product_name ||
                item.name ||
                "",

              item.product
                ?.sku ||
                item.sku ||
                "",

              String(quantity),

              unitPrice.toFixed(
                2
              ),

              lineTotal.toFixed(
                2
              ),
            ]);
          }
        );
      }

      // SUMMARY
      rows.push([]);

      rows.push([
        "",
        "",
        "",
        "",
        "",
        "Subtotal",
        "",
        "",
        "",
        subtotal.toFixed(2),
      ]);

      rows.push([
        "",
        "",
        "",
        "",
        "",
        "Discount",
        "",
        "",
        "",
        discount.toFixed(2),
      ]);

      rows.push([
        "",
        "",
        "",
        "",
        "",
        "Tax",
        "",
        "",
        "",
        tax.toFixed(2),
      ]);

      rows.push([
        "",
        "",
        "",
        "",
        "",
        "Grand Total",
        "",
        "",
        "",
        grandTotal.toFixed(
          2
        ),
      ]);

      const csvContent =
        rows
          .map((row) =>
            row
              .map(
                escapeCSV
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
        `${invoiceNumber}.csv`;

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
        type: "success",
      });
    } catch (error) {
      console.error(
        "CSV export error:",
        error
      );

      setSnackbar({
        open: true,
        message:
          "Failed to export CSV",
        type: "error",
      });
    }
  };



// ==========================================================
// EXPORT PDF
// ==========================================================

const exportSalePDF = async (sale: Sale) => {
  try {
    // Get complete export data from backend
    const response = await api.get(
      `/sales/${sale.id}/export`
    );

    const exportData = response.data;

    const doc = new jsPDF();

    const invoiceNumber =
      exportData.invoice_number ||
      `INV-${exportData.sale_id}`;

    const customerName =
      exportData.customer_name || "-";

    const saleDate = exportData.sale_date
      ? formatDate(exportData.sale_date)
      : "-";

    const paymentMethod =
      exportData.payment_method || "-";

    const paymentStatus =
      exportData.payment_status || "-";

    const subtotal = Number(
      exportData.subtotal || 0
    );

    const discount = Number(
      exportData.discount || 0
    );

    const tax = Number(
      exportData.tax || 0
    );

    const grandTotal = Number(
      exportData.total_amount || 0
    );

    // ======================================================
    // HEADER
    // ======================================================

    doc.setFontSize(20);

    doc.text(
      "SALES INVOICE",
      105,
      20,
      {
        align: "center",
      }
    );

    doc.setFontSize(11);

    doc.text(
      `Invoice Number: ${invoiceNumber}`,
      20,
      35
    );

    doc.text(
      `Sale Date: ${saleDate}`,
      20,
      43
    );

    doc.text(
      `Customer: ${customerName}`,
      20,
      51
    );

    doc.text(
      `Payment Method: ${paymentMethod}`,
      20,
      59
    );

    doc.text(
      `Payment Status: ${paymentStatus}`,
      20,
      67
    );

    // ======================================================
    // TABLE HEADER
    // ======================================================

    let y = 82;

    doc.setFontSize(10);

    doc.text(
      "Product",
      20,
      y
    );

    doc.text(
      "SKU",
      75,
      y
    );

    doc.text(
      "Qty",
      110,
      y
    );

    doc.text(
      "Unit Price",
      130,
      y
    );

    doc.text(
      "Line Total",
      165,
      y
    );

    doc.line(
      20,
      y + 2,
      195,
      y + 2
    );

    y += 10;

    // ======================================================
    // ITEMS
    // ======================================================

    if (
      Array.isArray(exportData.items) &&
      exportData.items.length > 0
    ) {
      exportData.items.forEach(
        (item: any) => {
          if (y > 270) {
            doc.addPage();
            y = 20;
          }

          const productName =
            item.product_name || "-";

          const sku =
            item.sku || "-";

          const quantity =
            Number(item.quantity || 0);

          const unitPrice =
            Number(item.unit_price || 0);

          const lineTotal =
            Number(item.line_total || 0);

          doc.text(
            String(productName).substring(
              0,
              25
            ),
            20,
            y
          );

          doc.text(
            String(sku).substring(
              0,
              15
            ),
            75,
            y
          );

          doc.text(
            String(quantity),
            110,
            y
          );

          doc.text(
            `Rs. ${unitPrice.toFixed(2)}`,
            130,
            y
          );

          doc.text(
            `Rs. ${lineTotal.toFixed(2)}`,
            165,
            y
          );

          y += 8;
        }
      );
    } else {
      doc.text(
        "No item details available",
        20,
        y
      );

      y += 10;
    }

    // ======================================================
    // PRICING SUMMARY
    // ======================================================

    if (y > 245) {
      doc.addPage();
      y = 30;
    }

    y += 8;

    doc.line(
      120,
      y,
      195,
      y
    );

    y += 10;

    doc.text(
      "Subtotal:",
      125,
      y
    );

    doc.text(
      `Rs. ${subtotal.toFixed(2)}`,
      165,
      y
    );

    y += 8;

    doc.text(
      "Discount:",
      125,
      y
    );

    doc.text(
      `Rs. ${discount.toFixed(2)}`,
      165,
      y
    );

    y += 8;

    doc.text(
      "Tax:",
      125,
      y
    );

    doc.text(
      `Rs. ${tax.toFixed(2)}`,
      165,
      y
    );

    y += 10;

    doc.setFontSize(12);

    doc.text(
      "Grand Total:",
      125,
      y
    );

    doc.text(
      `Rs. ${grandTotal.toFixed(2)}`,
      165,
      y
    );

    // ======================================================
    // FOOTER
    // ======================================================

    doc.setFontSize(9);

    doc.text(
      "Thank you for your business!",
      105,
      285,
      {
        align: "center",
      }
    );

    // ======================================================
    // SAVE
    // ======================================================

    doc.save(
      `${invoiceNumber}.pdf`
    );

    setSnackbar({
      open: true,
      message:
        "Invoice PDF exported successfully",
      type: "success",
    });
  } catch (error: any) {
    console.error(
      "PDF export error:",
      error
    );

    setSnackbar({
      open: true,
      message:
        error?.response?.data?.detail ||
        "Failed to export PDF",
      type: "error",
    });
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

        py: 4,
      }}
    >
      <Container
        maxWidth="xl"
        sx={{
          width: "100%",
        }}
      >
        {/* ==================================================
            HEADER
        ================================================== */}

        <Paper
          sx={{
            p: {
              xs: 3,
              md: 4,
            },

            mb: 3,

            background:
              "#111827",

            border:
              "1px solid #334155",

            borderRadius: 4,

            color: "#fff",

            boxShadow:
              "0 10px 30px rgba(0,0,0,0.35)",
          }}
        >
          <Typography
            variant="h3"
            sx={{
              fontSize: {
                xs: "2rem",
                md: "2.5rem",
              },

              fontWeight: 700,

              mb: 1,
            }}
          >
            Sales Management
          </Typography>

          <Typography
            sx={{
              color:
                "#cbd5e1",

              mb: 3,
            }}
          >
            Manage sales, invoices
            and transactions
          </Typography>

          <Box
            sx={{
              display: "flex",

              flexWrap: "wrap",

              gap: 2,
            }}
          >
            <Button
              variant="outlined"
              startIcon={
                <Refresh />
              }
              onClick={
                handleRefresh
              }
              disabled={loading}
              sx={{
                color: "#fff",

                borderColor:
                  "#64748b",

                textTransform:
                  "none",

                "&:hover": {
                  borderColor:
                    "#94a3b8",

                  background:
                    "#1e293b",
                },
              }}
            >
              Refresh
            </Button>

            <Button
              variant="contained"
              startIcon={
                <Add />
              }
              onClick={() =>
                navigate(
                  "/sales/add"
                )
              }
              sx={{
                textTransform:
                  "none",

                fontWeight: 700,

                background:
                  "#2563eb",

                "&:hover": {
                  background:
                    "#1d4ed8",
                },
              }}
            >
              Create Sale
            </Button>
          </Box>
        </Paper>

        {/* ==================================================
            SUMMARY CARDS
        ================================================== */}

        <Box
          sx={{
            display: "grid",

            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(3, 1fr)",
            },

            gap: 2,

            mb: 3,
          }}
        >
          {/* TOTAL SALES */}

          <Paper
            sx={{
              p: 3,

              background:
                "#111827",

              border:
                "1px solid #334155",

              borderRadius: 3,

              color: "#fff",
            }}
          >
            <Typography
              sx={{
                color:
                  "#cbd5e1",

                mb: 1,
              }}
            >
              Total Sales
            </Typography>

            <Typography
              variant="h4"
              fontWeight={700}
            >
              {summary.total_sales ??
                0}
            </Typography>
          </Paper>

          {/* TOTAL ITEMS */}

          <Paper
            sx={{
              p: 3,

              background:
                "#111827",

              border:
                "1px solid #334155",

              borderRadius: 3,

              color: "#fff",
            }}
          >
            <Typography
              sx={{
                color:
                  "#cbd5e1",

                mb: 1,
              }}
            >
              Total Items Sold
            </Typography>

            <Typography
              variant="h4"
              fontWeight={700}
            >
              {summary.total_items_sold ??
                0}
            </Typography>
          </Paper>

          {/* REVENUE */}

          <Paper
            sx={{
              p: 3,

              background:
                "#111827",

              border:
                "1px solid #334155",

              borderRadius: 3,

              color: "#fff",
            }}
          >
            <Typography
              sx={{
                color:
                  "#cbd5e1",

                mb: 1,
              }}
            >
              Total Revenue
            </Typography>

            <Typography
              variant="h4"
              fontWeight={700}
            >
              ₹
              {Number(
                summary.total_revenue ??
                  0
              ).toLocaleString(
                "en-IN",
                {
                  minimumFractionDigits:
                    2,

                  maximumFractionDigits:
                    2,
                }
              )}
            </Typography>
          </Paper>
        </Box>

        {/* ==================================================
            SEARCH & FILTER PANEL
        ================================================== */}

        <Paper
          sx={{
            p: {
              xs: 2,
              md: 3,
            },

            mb: 3,

            background:
              "#111827",

            border:
              "1px solid #334155",

            borderRadius: 3,

            color: "#fff",
          }}
        >
          <Typography
            variant="h6"
            fontWeight={700}
            mb={2}
          >
            Search & Filters
          </Typography>

          {/* SEARCH + SORT */}

          <Box
            sx={{
              display: "grid",

              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                lg: "2fr 1fr 1fr 1fr",
              },

              gap: 2,

              alignItems:
                "center",

              mb: 2,
            }}
          >
            <TextField
              label="Search Invoice / Customer"
              value={
                searchKeyword
              }
              onChange={(e) =>
                setSearchKeyword(
                  e.target.value
                )
              }
              onKeyDown={
                handleSearchKeyDown
              }
              placeholder="Enter invoice or customer"
              sx={
                textFieldStyle
              }
              fullWidth
            />

            <Button
              variant="contained"
              onClick={
                handleSearch
              }
              disabled={loading}
              sx={{
                minHeight: 56,

                textTransform:
                  "none",

                fontWeight: 700,

                background:
                  "#2563eb",

                "&:hover": {
                  background:
                    "#1d4ed8",
                },
              }}
            >
              Search
            </Button>

            <TextField
              select
              label="Sort By"
              value={sortBy}
              onChange={(e) =>
                handleSortByChange(
                  e.target.value
                )
              }
              sx={
                textFieldStyle
              }
              fullWidth
            >
              <MenuItem value="sale_date">
                Date
              </MenuItem>

              <MenuItem value="total_amount">
                Total Amount
              </MenuItem>

              <MenuItem value="invoice_number">
                Invoice Number
              </MenuItem>

              <MenuItem value="customer_name">
                Customer Name
              </MenuItem>
            </TextField>

            <TextField
              select
              label="Order"
              value={sortOrder}
              onChange={(e) =>
                handleSortOrderChange(
                  e.target.value as
                    | "asc"
                    | "desc"
                )
              }
              sx={
                textFieldStyle
              }
              fullWidth
            >
              <MenuItem value="desc">
                Descending
              </MenuItem>

              <MenuItem value="asc">
                Ascending
              </MenuItem>
            </TextField>
          </Box>

          {/* DATE + OTHER FILTERS */}

          <Box
            sx={{
              display: "grid",

              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                md: "repeat(3, 1fr)",
                lg: "repeat(4, 1fr)",
              },

              gap: 2,

              alignItems:
                "center",
            }}
          >
            <TextField
              label="Start Date"
              type="date"
              value={
                startDate
              }
              onChange={(e) =>
                setStartDate(
                  e.target.value
                )
              }
              InputLabelProps={{
                shrink: true,
              }}
              sx={
                textFieldStyle
              }
              fullWidth
            />

            <TextField
              label="End Date"
              type="date"
              value={
                endDate
              }
              onChange={(e) =>
                setEndDate(
                  e.target.value
                )
              }
              InputLabelProps={{
                shrink: true,
              }}
              sx={
                textFieldStyle
              }
              fullWidth
            />

            <TextField
              select
              label="Sales Channel"
              value={
                salesChannel
              }
              onChange={(e) =>
                setSalesChannel(
                  e.target.value
                )
              }
              sx={
                textFieldStyle
              }
              fullWidth
            >
              <MenuItem value="">
                All Channels
              </MenuItem>

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

            <TextField
              select
              label="Payment Method"
              value={
                paymentMethod
              }
              onChange={(e) =>
                setPaymentMethod(
                  e.target.value
                )
              }
              sx={
                textFieldStyle
              }
              fullWidth
            >
              <MenuItem value="">
                All Payment Methods
              </MenuItem>

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

            <TextField
              select
              label="Payment Status"
              value={
                paymentStatus
              }
              onChange={(e) =>
                setPaymentStatus(
                  e.target.value
                )
              }
              sx={
                textFieldStyle
              }
              fullWidth
            >
              <MenuItem value="">
                All Statuses
              </MenuItem>

              <MenuItem value="PAID">
                Paid
              </MenuItem>

              <MenuItem value="PENDING">
                Pending
              </MenuItem>

              <MenuItem value="PARTIAL">
                Partial
              </MenuItem>

              <MenuItem value="CANCELLED">
                Cancelled
              </MenuItem>
            </TextField>

            <TextField
              label="Category ID"
              type="number"
              value={
                categoryId
              }
              onChange={(e) =>
                setCategoryId(
                  e.target.value
                )
              }
              placeholder="Category ID"
              sx={
                textFieldStyle
              }
              fullWidth
            />

            <Button
              variant="contained"
              onClick={
                handleFilter
              }
              disabled={loading}
              sx={{
                minHeight: 56,

                textTransform:
                  "none",

                fontWeight: 700,

                background:
                  "#2563eb",

                "&:hover": {
                  background:
                    "#1d4ed8",
                },
              }}
            >
              Apply Filters
            </Button>

            <Button
              variant="outlined"
              onClick={
                handleClearFilters
              }
              disabled={loading}
              sx={{
                minHeight: 56,

                textTransform:
                  "none",

                fontWeight: 600,

                color: "#fff",

                borderColor:
                  "#64748b",

                "&:hover": {
                  borderColor:
                    "#94a3b8",

                  background:
                    "#1e293b",
                },
              }}
            >
              Clear Filters
            </Button>
          </Box>
        </Paper>

        {/* ==================================================
            SALES TABLE
        ================================================== */}

        <Paper
          sx={{
            background:
              "#111827",

            border:
              "1px solid #334155",

            borderRadius: 3,

            overflow: "hidden",
          }}
        >
          <TableContainer
            sx={{
              maxHeight: 600,
            }}
          >
            <Table
              stickyHeader
              sx={{
                minWidth: 1150,
              }}
            >
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{
                      background:
                        "#1e293b",

                      color: "#fff",

                      fontWeight: 700,
                    }}
                  >
                    Invoice Number
                  </TableCell>

                  <TableCell
                    sx={{
                      background:
                        "#1e293b",

                      color: "#fff",

                      fontWeight: 700,
                    }}
                  >
                    Customer Name
                  </TableCell>

                  <TableCell
                    sx={{
                      background:
                        "#1e293b",

                      color: "#fff",

                      fontWeight: 700,
                    }}
                  >
                    Sale Date
                  </TableCell>

                  <TableCell
                    align="center"
                    sx={{
                      background:
                        "#1e293b",

                      color: "#fff",

                      fontWeight: 700,
                    }}
                  >
                    Number of Items
                  </TableCell>

                  <TableCell
                    align="right"
                    sx={{
                      background:
                        "#1e293b",

                      color: "#fff",

                      fontWeight: 700,
                    }}
                  >
                    Total Amount
                  </TableCell>

                  <TableCell
                    align="center"
                    sx={{
                      background:
                        "#1e293b",

                      color: "#fff",

                      fontWeight: 700,
                    }}
                  >
                    Payment Status
                  </TableCell>

                  <TableCell
                    align="center"
                    sx={{
                      background:
                        "#1e293b",

                      color: "#fff",

                      fontWeight: 700,
                    }}
                  >
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {/* LOADING */}

                {loading &&
                sales.length ===
                  0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      align="center"
                      sx={{
                        color:
                          "#cbd5e1",

                        py: 5,
                      }}
                    >
                      Loading sales...
                    </TableCell>
                  </TableRow>
                ) : sales.length ===
                  0 ? (
                  /* EMPTY */

                  <TableRow>
                    <TableCell
                      colSpan={7}
                      align="center"
                      sx={{
                        color:
                          "#cbd5e1",

                        py: 5,
                      }}
                    >
                      No sales found
                    </TableCell>
                  </TableRow>
                ) : (
                  sales.map(
                    (
                      sale
                    ) => {
                      const status =
                        getPaymentStatus(
                          sale
                        );

                      return (
                        <TableRow
                          key={
                            sale.id
                          }
                          hover
                          sx={{
                            "&:hover":
                              {
                                background:
                                  "#172033",
                              },
                          }}
                        >
                          {/* INVOICE */}

                          <TableCell
                            sx={{
                              color:
                                "#60a5fa",

                              fontWeight:
                                700,

                              borderColor:
                                "#334155",
                            }}
                          >
                            {sale.invoice_number ||
                              `INV-${sale.id}`}
                          </TableCell>

                          {/* CUSTOMER */}

                          <TableCell
                            sx={{
                              color:
                                "#fff",

                              borderColor:
                                "#334155",
                            }}
                          >
                            {getCustomerName(
                              sale
                            )}
                          </TableCell>

                          {/* DATE */}

                          <TableCell
                            sx={{
                              color:
                                "#fff",

                              borderColor:
                                "#334155",
                            }}
                          >
                            {formatDate(
                              sale.sale_date
                            )}
                          </TableCell>

                          {/* ITEMS */}

                          <TableCell
                            align="center"
                            sx={{
                              color:
                                "#fff",

                              borderColor:
                                "#334155",
                            }}
                          >
                            {getItemCount(
                              sale
                            )}
                          </TableCell>

                          {/* TOTAL */}

                          <TableCell
                            align="right"
                            sx={{
                              color:
                                "#fff",

                              fontWeight:
                                700,

                              borderColor:
                                "#334155",
                            }}
                          >
                            ₹
                            {getTotalAmount(
                              sale
                            ).toLocaleString(
                              "en-IN",
                              {
                                minimumFractionDigits:
                                  2,

                                maximumFractionDigits:
                                  2,
                              }
                            )}
                          </TableCell>

                          {/* PAYMENT STATUS */}

                          <TableCell
                            align="center"
                            sx={{
                              borderColor:
                                "#334155",
                            }}
                          >
                            <Chip
                              label={
                                status
                              }
                              size="small"
                              sx={{
                                fontWeight:
                                  700,

                                background:
                                  status ===
                                  "PAID"
                                    ? "#16a34a"
                                    : status ===
                                      "PENDING"
                                    ? "#f59e0b"
                                    : status ===
                                      "CANCELLED"
                                    ? "#dc2626"
                                    : "#64748b",

                                color:
                                  "#fff",
                              }}
                            />
                          </TableCell>

                          {/* ACTIONS */}

                          <TableCell
                            align="center"
                            sx={{
                              borderColor:
                                "#334155",
                            }}
                          >
                            <Box
                              sx={{
                                display:
                                  "flex",

                                justifyContent:
                                  "center",

                                alignItems:
                                  "center",

                                gap: 0.5,
                              }}
                            >
                              {/* VIEW */}

                              <IconButton
                                size="small"
                                onClick={() =>
                                  navigate(
                                    `/sales/${sale.id}`
                                  )
                                }
                                title="View Sale"
                                sx={{
                                  color:
                                    "#60a5fa",
                                }}
                              >
                                <Visibility fontSize="small" />
                              </IconButton>

                              {/* EDIT */}

                              <IconButton
                                size="small"
                                onClick={() =>
                                  navigate(
                                    `/sales/${sale.id}/edit`
                                  )
                                }
                                title="Edit Sale"
                                sx={{
                                  color:
                                    "#fbbf24",
                                }}
                              >
                                <Edit fontSize="small" />
                              </IconButton>

                              {/* PDF */}

                              <IconButton
                                size="small"
                                onClick={() =>
                                  exportSalePDF(
                                    sale
                                  )
                                }
                                title="Export PDF"
                                sx={{
                                  color:
                                    "#f87171",
                                }}
                              >
                                <PictureAsPdf fontSize="small" />
                              </IconButton>

                              {/* CSV */}

                              <IconButton
                                size="small"
                                onClick={() =>
                                  exportSaleCSV(
                                    sale
                                  )
                                }
                                title="Export CSV"
                                sx={{
                                  color:
                                    "#34d399",
                                }}
                              >
                                <Description fontSize="small" />
                              </IconButton>

                              {/* DELETE */}

                              <IconButton
                                size="small"
                                onClick={() =>
                                  handleDelete(
                                    sale.id
                                  )
                                }
                                title="Delete Sale"
                                sx={{
                                  color:
                                    "#ef4444",
                                }}
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    }
                  )
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Container>

      {/* ==================================================
          SNACKBAR
      ================================================== */}

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
      >
        <Alert
          severity={
            snackbar.type
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
    </Box>
  );
}