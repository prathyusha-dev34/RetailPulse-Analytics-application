import { useEffect, useState } from "react";

import {
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Chip,
} from "@mui/material";

import {
  Add,
  Delete,
  Edit,
  Search,
  ToggleOff,
  ToggleOn,
} from "@mui/icons-material";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  activateProduct,
  deactivateProduct,
} from "../api/productApi";

import { getCategories } from "../api/categoryApi";

interface Category {
  id: number;
  name: string;
}

interface Product {
  id: number;
  category_id: number;
  category_name?: string;
  name: string;
  sku: string;
  brand: string;
  description: string;
  unit_price: number;
  cost_price: number;
  stock_quantity: number;
  unit_of_measure: string;
  status: string;
}

const emptyProduct = {
  category_id: 0,
  name: "",
  sku: "",
  brand: "",
  description: "",
  unit_price: 0,
  cost_price: 0,
  stock_quantity: 0,
  unit_of_measure: "",
  status: "ACTIVE",
};

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [form, setForm] = useState(emptyProduct);

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [search, categoryFilter, brandFilter, statusFilter]);

  async function loadProducts() {
    try {
      const res = await getProducts({
        search,
        category_id: categoryFilter
          ? Number(categoryFilter)
          : undefined,
        brand: brandFilter || undefined,
        status: statusFilter || undefined,
      });

      setProducts(res.data);
    } catch (err) {
      console.log(err);
    }
  }

  async function loadCategories() {
    try {
      const res = await getCategories();
      setCategories(res.data);
    } catch (err) {
      console.log(err);
    }
  }

  function handleAdd() {
    setEditingId(null);
    setForm({
      ...emptyProduct,
    });
    setOpen(true);
  }

  function handleEdit(product: Product) {
    setEditingId(product.id);

    setForm({
      category_id: product.category_id,
      name: product.name,
      sku: product.sku,
      brand: product.brand,
      description: product.description,
      unit_price: product.unit_price,
      cost_price: product.cost_price,
      stock_quantity: product.stock_quantity,
      unit_of_measure: product.unit_of_measure,
      status: product.status,
    });

    setOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) {
      alert("Product Name is required");
      return;
    }

    if (!form.sku.trim()) {
      alert("SKU is required");
      return;
    }

    if (form.category_id === 0) {
      alert("Category is required");
      return;
    }

    if (form.unit_price <= 0) {
      alert("Unit Price must be greater than zero");
      return;
    }

    if (form.cost_price > form.unit_price) {
      alert("Cost Price cannot exceed Unit Price");
      return;
    }

    if (form.stock_quantity < 0) {
      alert("Stock Quantity cannot be negative");
      return;
    }

    try {
      if (editingId) {
        await updateProduct(editingId, form);
      } else {
        await createProduct(form);
      }

      setOpen(false);
      setForm({
        ...emptyProduct,
      });

      loadProducts();
    } catch (err) {
      console.log(err);
    }
  }

  async function handleToggle(product: Product) {
    try {
      if (product.status === "ACTIVE") {
        await deactivateProduct(product.id);
      } else {
        await activateProduct(product.id);
      }

      loadProducts();
    } catch (err) {
      console.log(err);
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteProduct(id);
      loadProducts();
    } catch (err) {
      console.log(err);
    }
  }

  function getCategoryName(product: Product) {
    if (product.category_name) {
      return product.category_name;
    }

    const category = categories.find(
      (cat) => cat.id === product.category_id
    );

    return category?.name || "—";
  }

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        bgcolor: "#0F172A",
      }}
    >
      <Sidebar />

      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          ml: "280px",
        }}
      >
        <Topbar />

        <Container
          maxWidth="xl"
          sx={{
            mt: "72px",
            py: 4,
            px: {
              xs: 2,
              sm: 3,
              lg: 4,
            },
          }}
        >
          <Stack
            direction={{
              xs: "column",
              sm: "row",
            }}
            justifyContent="space-between"
            alignItems={{
              xs: "flex-start",
              sm: "center",
            }}
            spacing={2}
            mb={3}
          >
            <Box>
              <Typography
                sx={{
                  color: "#F8FAFC",
                  fontSize: {
                    xs: 28,
                    md: 32,
                  },
                  fontWeight: 800,
                  letterSpacing: "-0.5px",
                }}
              >
                Products
              </Typography>

              <Typography
                sx={{
                  color: "#64748B",
                  fontSize: 14,
                  mt: 0.5,
                }}
              >
                Manage products, categories, pricing and inventory
              </Typography>
            </Box>

            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleAdd}
              sx={{
                px: 2.5,
                py: 1.2,
                borderRadius: 2.5,
                textTransform: "none",
                fontWeight: 700,
                background:
                  "linear-gradient(135deg,#2563EB,#4F46E5)",
                boxShadow:
                  "0 8px 20px rgba(37,99,235,0.25)",
              }}
            >
              Add Product
            </Button>
          </Stack>

          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              mb: 3,
              borderRadius: 3.5,
              bgcolor: "#111827",
              border: "1px solid #263449",
            }}
          >
            <Typography
              sx={{
                color: "#F8FAFC",
                fontSize: 16,
                fontWeight: 700,
                mb: 2,
              }}
            >
              Search & Filters
            </Typography>

            <Stack
              direction={{
                xs: "column",
                md: "row",
              }}
              spacing={2}
            >
              <TextField
                placeholder="Search by Product / SKU / Brand"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search
                        sx={{
                          color: "#64748B",
                        }}
                      />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  flex: 1,
                  "& .MuiOutlinedInput-root": {
                    bgcolor: "#0F172A",
                    color: "#F8FAFC",
                    borderRadius: 2.5,

                    "& fieldset": {
                      borderColor: "#334155",
                    },

                    "&:hover fieldset": {
                      borderColor: "#475569",
                    },

                    "&.Mui-focused fieldset": {
                      borderColor: "#3B82F6",
                    },
                  },

                  "& input::placeholder": {
                    color: "#64748B",
                    opacity: 1,
                  },
                }}
              />

              <FormControl
                sx={{
                  minWidth: {
                    xs: "100%",
                    md: 190,
                  },
                }}
              >
                <InputLabel
                  sx={{
                    color: "#94A3B8",

                    "&.Mui-focused": {
                      color: "#60A5FA",
                    },
                  }}
                >
                  Category
                </InputLabel>

                <Select
                  value={categoryFilter}
                  label="Category"
                  onChange={(e) =>
                    setCategoryFilter(e.target.value)
                  }
                  sx={{
                    bgcolor: "#0F172A",
                    color: "#F8FAFC",
                    borderRadius: 2.5,

                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#334155",
                    },

                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#475569",
                    },

                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#3B82F6",
                    },

                    ".MuiSvgIcon-root": {
                      color: "#94A3B8",
                    },
                  }}
                >
                  <MenuItem value="">All Categories</MenuItem>

                  {categories.map((cat) => (
                    <MenuItem
                      key={cat.id}
                      value={cat.id}
                    >
                      {cat.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Brand"
                value={brandFilter}
                onChange={(e) =>
                  setBrandFilter(e.target.value)
                }
                sx={{
                  minWidth: {
                    xs: "100%",
                    md: 170,
                  },

                  "& .MuiOutlinedInput-root": {
                    bgcolor: "#0F172A",
                    color: "#F8FAFC",
                    borderRadius: 2.5,

                    "& fieldset": {
                      borderColor: "#334155",
                    },

                    "&:hover fieldset": {
                      borderColor: "#475569",
                    },

                    "&.Mui-focused fieldset": {
                      borderColor: "#3B82F6",
                    },
                  },

                  "& .MuiInputLabel-root": {
                    color: "#94A3B8",
                  },

                  "& .MuiInputLabel-root.Mui-focused": {
                    color: "#60A5FA",
                  },
                }}
              />

              <FormControl
                sx={{
                  minWidth: {
                    xs: "100%",
                    md: 170,
                  },
                }}
              >
                <InputLabel
                  sx={{
                    color: "#94A3B8",

                    "&.Mui-focused": {
                      color: "#60A5FA",
                    },
                  }}
                >
                  Status
                </InputLabel>

                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) =>
                    setStatusFilter(e.target.value)
                  }
                  sx={{
                    bgcolor: "#0F172A",
                    color: "#F8FAFC",
                    borderRadius: 2.5,

                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#334155",
                    },

                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#475569",
                    },

                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#3B82F6",
                    },

                    ".MuiSvgIcon-root": {
                      color: "#94A3B8",
                    },
                  }}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="ACTIVE">Active</MenuItem>
                  <MenuItem value="INACTIVE">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              bgcolor: "#111827",
              borderRadius: 3.5,
              border: "1px solid #263449",
              overflow: "hidden",
            }}
          >
            <TableContainer
              sx={{
                maxHeight: 620,

                "&::-webkit-scrollbar": {
                  height: 7,
                  width: 7,
                },

                "&::-webkit-scrollbar-track": {
                  background: "#0F172A",
                },

                "&::-webkit-scrollbar-thumb": {
                  background: "#334155",
                  borderRadius: 10,
                },
              }}
            >
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    {[
                      "Product",
                      "SKU",
                      "Category",
                      "Brand",
                      "Price",
                      "Stock",
                      "Status",
                      "Actions",
                    ].map((item) => (
                      <TableCell
                        key={item}
                        sx={{
                          bgcolor: "#172033",
                          color: "#94A3B8",
                          fontWeight: 700,
                          fontSize: 12,
                          textTransform: "uppercase",
                          letterSpacing: 0.5,
                          borderBottom:
                            "1px solid #263449",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>

                <TableBody>
                  {products.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        align="center"
                        sx={{
                          color: "#64748B",
                          py: 8,
                          borderBottom: "none",
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: 16,
                            fontWeight: 600,
                            color: "#94A3B8",
                          }}
                        >
                          No products found
                        </Typography>

                        <Typography
                          sx={{
                            fontSize: 13,
                            mt: 0.5,
                            color: "#64748B",
                          }}
                        >
                          Try changing your search or filters.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    products.map((product) => (
                      <TableRow
                        key={product.id}
                        hover
                        sx={{
                          "&:hover": {
                            bgcolor: "#172033",
                          },

                          "& td": {
                            borderBottom:
                              "1px solid #1E293B",
                          },
                        }}
                      >
                        <TableCell
                          sx={{
                            color: "#F8FAFC",
                            fontWeight: 600,
                            fontSize: 14,
                          }}
                        >
                          {product.name}
                        </TableCell>

                        <TableCell
                          sx={{
                            color: "#CBD5E1",
                            fontSize: 13,
                          }}
                        >
                          {product.sku}
                        </TableCell>

                        <TableCell
                          sx={{
                            color: "#CBD5E1",
                            fontSize: 13,
                          }}
                        >
                          {getCategoryName(product)}
                        </TableCell>

                        <TableCell
                          sx={{
                            color: "#CBD5E1",
                            fontSize: 13,
                          }}
                        >
                          {product.brand || "—"}
                        </TableCell>

                        <TableCell
                          sx={{
                            color: "#F8FAFC",
                            fontWeight: 600,
                          }}
                        >
                          ₹{product.unit_price}
                        </TableCell>

                        <TableCell
                          sx={{
                            color: "#CBD5E1",
                          }}
                        >
                          {product.stock_quantity}
                        </TableCell>

                        <TableCell>
                          <Chip
                            label={product.status}
                            size="small"
                            sx={{
                              fontWeight: 700,
                              fontSize: 10,
                              bgcolor:
                                product.status === "ACTIVE"
                                  ? "rgba(34,197,94,0.12)"
                                  : "rgba(239,68,68,0.12)",
                              color:
                                product.status === "ACTIVE"
                                  ? "#4ADE80"
                                  : "#F87171",
                              border: `1px solid ${
                                product.status === "ACTIVE"
                                  ? "rgba(34,197,94,0.25)"
                                  : "rgba(239,68,68,0.25)"
                              }`,
                            }}
                          />
                        </TableCell>

                        <TableCell align="right">
                          <Stack
                            direction="row"
                            justifyContent="flex-end"
                            spacing={0.5}
                          >
                            <IconButton
                              size="small"
                              onClick={() =>
                                handleEdit(product)
                              }
                              sx={{
                                color: "#60A5FA",
                                "&:hover": {
                                  bgcolor:
                                    "rgba(59,130,246,0.12)",
                                },
                              }}
                            >
                              <Edit fontSize="small" />
                            </IconButton>

                            <IconButton
                              size="small"
                              onClick={() =>
                                handleToggle(product)
                              }
                              sx={{
                                color:
                                  product.status === "ACTIVE"
                                    ? "#F59E0B"
                                    : "#22C55E",
                                "&:hover": {
                                  bgcolor:
                                    "rgba(245,158,11,0.12)",
                                },
                              }}
                            >
                              {product.status === "ACTIVE" ? (
                                <ToggleOff fontSize="small" />
                              ) : (
                                <ToggleOn fontSize="small" />
                              )}
                            </IconButton>

                            <IconButton
                              size="small"
                              onClick={() =>
                                handleDelete(product.id)
                              }
                              sx={{
                                color: "#F87171",
                                "&:hover": {
                                  bgcolor:
                                    "rgba(239,68,68,0.12)",
                                },
                              }}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          <Dialog
            open={open}
            onClose={() => setOpen(false)}
            fullWidth
            maxWidth="md"
            PaperProps={{
              sx: {
                bgcolor: "#111827",
                color: "#F8FAFC",
                borderRadius: 3.5,
                border: "1px solid #263449",
              },
            }}
          >
            <DialogTitle
              sx={{
                fontSize: 22,
                fontWeight: 800,
                borderBottom: "1px solid #263449",
              }}
            >
              {editingId ? "Edit Product" : "Add Product"}
            </DialogTitle>

            <DialogContent>
              <Stack
                spacing={2.2}
                sx={{
                  mt: 2,
                }}
              >
                <TextField
                  label="Product Name"
                  fullWidth
                  value={form.name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      name: e.target.value,
                    })
                  }
                  sx={dialogFieldStyles}
                />

                <TextField
                  label="SKU"
                  fullWidth
                  value={form.sku}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      sku: e.target.value,
                    })
                  }
                  sx={dialogFieldStyles}
                />

                <FormControl fullWidth>
                  <InputLabel
                    sx={{
                      color: "#94A3B8",
                      "&.Mui-focused": {
                        color: "#60A5FA",
                      },
                    }}
                  >
                    Category
                  </InputLabel>

                  <Select
                    value={form.category_id}
                    label="Category"
                    onChange={(e) =>
                      setForm({
                        ...form,
                        category_id: Number(e.target.value),
                      })
                    }
                    sx={{
                      bgcolor: "#0F172A",
                      color: "#F8FAFC",
                      borderRadius: 2,

                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#334155",
                      },

                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#475569",
                      },

                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#3B82F6",
                      },

                      ".MuiSvgIcon-root": {
                        color: "#94A3B8",
                      },
                    }}
                  >
                    <MenuItem value={0} disabled>
                      Select Category
                    </MenuItem>

                    {categories.map((cat) => (
                      <MenuItem
                        key={cat.id}
                        value={cat.id}
                      >
                        {cat.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  label="Brand"
                  fullWidth
                  value={form.brand}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      brand: e.target.value,
                    })
                  }
                  sx={dialogFieldStyles}
                />

                <TextField
                  label="Description"
                  fullWidth
                  multiline
                  minRows={3}
                  value={form.description}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      description: e.target.value,
                    })
                  }
                  sx={dialogFieldStyles}
                />

                <Stack
                  direction={{
                    xs: "column",
                    sm: "row",
                  }}
                  spacing={2}
                >
                  <TextField
                    label="Unit Price"
                    type="number"
                    fullWidth
                    value={form.unit_price}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        unit_price: Number(
                          e.target.value
                        ),
                      })
                    }
                    sx={dialogFieldStyles}
                  />

                  <TextField
                    label="Cost Price"
                    type="number"
                    fullWidth
                    value={form.cost_price}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        cost_price: Number(
                          e.target.value
                        ),
                      })
                    }
                    sx={dialogFieldStyles}
                  />
                </Stack>

                <Stack
                  direction={{
                    xs: "column",
                    sm: "row",
                  }}
                  spacing={2}
                >
                  <TextField
                    label="Stock Quantity"
                    type="number"
                    fullWidth
                    value={form.stock_quantity}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        stock_quantity: Number(
                          e.target.value
                        ),
                      })
                    }
                    sx={dialogFieldStyles}
                  />

                  <TextField
                    label="Unit of Measure"
                    fullWidth
                    value={form.unit_of_measure}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        unit_of_measure:
                          e.target.value,
                      })
                    }
                    sx={dialogFieldStyles}
                  />
                </Stack>

                <FormControl fullWidth>
                  <InputLabel
                    sx={{
                      color: "#94A3B8",
                      "&.Mui-focused": {
                        color: "#60A5FA",
                      },
                    }}
                  >
                    Status
                  </InputLabel>

                  <Select
                    value={form.status}
                    label="Status"
                    onChange={(e) =>
                      setForm({
                        ...form,
                        status: e.target.value,
                      })
                    }
                    sx={{
                      bgcolor: "#0F172A",
                      color: "#F8FAFC",
                      borderRadius: 2,

                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#334155",
                      },

                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#475569",
                      },

                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#3B82F6",
                      },

                      ".MuiSvgIcon-root": {
                        color: "#94A3B8",
                      },
                    }}
                  >
                    <MenuItem value="ACTIVE">
                      Active
                    </MenuItem>

                    <MenuItem value="INACTIVE">
                      Inactive
                    </MenuItem>
                  </Select>
                </FormControl>
              </Stack>
            </DialogContent>

            <DialogActions
              sx={{
                px: 3,
                py: 2,
                borderTop: "1px solid #263449",
              }}
            >
              <Button
                onClick={() => setOpen(false)}
                sx={{
                  color: "#94A3B8",
                  textTransform: "none",
                  fontWeight: 600,
                }}
              >
                Cancel
              </Button>

              <Button
                variant="contained"
                onClick={handleSave}
                sx={{
                  px: 3,
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 700,
                  background:
                    "linear-gradient(135deg,#2563EB,#4F46E5)",
                }}
              >
                {editingId ? "Update Product" : "Save Product"}
              </Button>
            </DialogActions>
          </Dialog>
        </Container>
      </Box>
    </Box>
  );
}

const dialogFieldStyles = {
  "& .MuiOutlinedInput-root": {
    bgcolor: "#0F172A",
    color: "#F8FAFC",
    borderRadius: 2,

    "& fieldset": {
      borderColor: "#334155",
    },

    "&:hover fieldset": {
      borderColor: "#475569",
    },

    "&.Mui-focused fieldset": {
      borderColor: "#3B82F6",
    },
  },

  "& .MuiInputLabel-root": {
    color: "#94A3B8",
  },

  "& .MuiInputLabel-root.Mui-focused": {
    color: "#60A5FA",
  },
};