import { useEffect, useState } from "react";

import {
  Box,
  Button,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  InputAdornment,
  IconButton,
} from "@mui/material";

import {
  Add,
  Delete,
  Edit,
  Search,
} from "@mui/icons-material";

import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../api/categoryApi";

interface Category {
  id: number;
  name: string;
  description: string;
  status: string;
}

const emptyCategory = {
  name: "",
  description: "",
  status: "ACTIVE",
};

export default function Categories() {
  const [categories, setCategories] =
    useState<Category[]>([]);

  const [search, setSearch] =
    useState("");

  const [open, setOpen] =
    useState(false);

  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [form, setForm] =
    useState(emptyCategory);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadCategories();
  }, [search]);

  async function loadCategories() {
    try {
      const res = await getCategories(search);
      setCategories(res.data);
    } catch (err) {
      console.log(err);
    }
  }

  function handleAdd() {
    setEditingId(null);

    setForm({
      ...emptyCategory,
    });

    setOpen(true);
  }

  function handleEdit(category: Category) {
    setEditingId(category.id);

    setForm({
      name: category.name,
      description: category.description,
      status: category.status,
    });

    setOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) {
      alert("Category Name is required");
      return;
    }

    try {
      if (editingId) {
        await updateCategory(editingId, form);
      } else {
        await createCategory(form);
      }

      setOpen(false);

      setForm({
        ...emptyCategory,
      });

      loadCategories();
    } catch (err) {
      console.log(err);
    }
  }

  async function handleDelete(id: number) {
    const ok = window.confirm(
      "Are you sure you want to delete this category?"
    );

    if (!ok) return;

    try {
      await deleteCategory(id);
      loadCategories();
    } catch (err) {
      console.log(err);
    }
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
          {/* Header */}

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
                Categories
              </Typography>

              <Typography
                sx={{
                  color: "#64748B",
                  fontSize: 14,
                  mt: 0.5,
                }}
              >
                Manage product categories and their status
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
              Add Category
            </Button>
          </Stack>

          {/* Search */}

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
              Search Categories
            </Typography>

            <TextField
              fullWidth
              placeholder="Search category..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
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
          </Paper>

          {/* Category Table */}

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
                width: "100%",
                overflowX: "auto",

                "&::-webkit-scrollbar": {
                  height: 7,
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
              <Table
                sx={{
                  minWidth: 700,
                  tableLayout: "fixed",
                }}
              >
                <TableHead>
                  <TableRow>
                    <TableCell
                      sx={{
                        width: "30%",
                        bgcolor: "#172033",
                        color: "#94A3B8",
                        fontWeight: 700,
                        fontSize: 13,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                        borderBottom:
                          "1px solid #334155",
                        borderRight:
                          "1px solid #263449",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Category Name
                    </TableCell>

                    <TableCell
                      sx={{
                        width: "40%",
                        bgcolor: "#172033",
                        color: "#94A3B8",
                        fontWeight: 700,
                        fontSize: 13,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                        borderBottom:
                          "1px solid #334155",
                        borderRight:
                          "1px solid #263449",
                      }}
                    >
                      Description
                    </TableCell>

                    <TableCell
                      sx={{
                        width: "15%",
                        bgcolor: "#172033",
                        color: "#94A3B8",
                        fontWeight: 700,
                        fontSize: 13,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                        borderBottom:
                          "1px solid #334155",
                        borderRight:
                          "1px solid #263449",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Status
                    </TableCell>

                    <TableCell
                      sx={{
                        width: "15%",
                        bgcolor: "#172033",
                        color: "#94A3B8",
                        fontWeight: 700,
                        fontSize: 13,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                        borderBottom:
                          "1px solid #334155",
                        whiteSpace: "nowrap",
                        textAlign: "left",
                      }}
                    >
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {categories.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        align="center"
                        sx={{
                          py: 8,
                          color: "#64748B",
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
                          No categories found
                        </Typography>

                        <Typography
                          sx={{
                            fontSize: 13,
                            mt: 0.5,
                            color: "#64748B",
                          }}
                        >
                          Try changing your search.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    categories.map((category) => (
                      <TableRow
                        key={category.id}
                        hover
                        sx={{
                          "&:hover": {
                            bgcolor: "#172033",
                          },
                        }}
                      >
                        {/* Category Name */}

                        <TableCell
                          sx={{
                            width: "30%",
                            color: "#F8FAFC",
                            fontWeight: 600,
                            fontSize: 14,
                            borderBottom:
                              "1px solid #263449",
                            borderRight:
                              "1px solid #263449",
                          }}
                        >
                          {category.name}
                        </TableCell>

                        {/* Description */}

                        <TableCell
                          sx={{
                            width: "40%",
                            color: "#CBD5E1",
                            fontSize: 13,
                            borderBottom:
                              "1px solid #263449",
                            borderRight:
                              "1px solid #263449",
                            whiteSpace: "normal",
                            wordBreak: "break-word",
                          }}
                        >
                          {category.description ||
                            "—"}
                        </TableCell>

                        {/* Status */}

                        <TableCell
                          sx={{
                            width: "15%",
                            borderBottom:
                              "1px solid #263449",
                            borderRight:
                              "1px solid #263449",
                          }}
                        >
                          <Chip
                            label={category.status}
                            size="small"
                            sx={{
                              fontWeight: 700,
                              fontSize: 10,

                              bgcolor:
                                category.status ===
                                "ACTIVE"
                                  ? "rgba(34,197,94,0.12)"
                                  : "rgba(239,68,68,0.12)",

                              color:
                                category.status ===
                                "ACTIVE"
                                  ? "#4ADE80"
                                  : "#F87171",

                              border:
                                category.status ===
                                "ACTIVE"
                                  ? "1px solid rgba(34,197,94,0.25)"
                                  : "1px solid rgba(239,68,68,0.25)",
                            }}
                          />
                        </TableCell>

                        {/* Actions */}

                        <TableCell
                          sx={{
                            width: "15%",
                            borderBottom:
                              "1px solid #263449",
                            whiteSpace: "nowrap",
                            textAlign: "left",
                            pl: 1,
                          }}
                        >
                          <Stack
                            direction="row"
                            alignItems="center"
                            spacing={0.5}
                          >
                            <IconButton
                              size="small"
                              onClick={() =>
                                handleEdit(category)
                              }
                              sx={{
                                color: "#60A5FA",
                                bgcolor:
                                  "rgba(59,130,246,0.08)",

                                "&:hover": {
                                  bgcolor:
                                    "rgba(59,130,246,0.18)",
                                },
                              }}
                            >
                              <Edit fontSize="small" />
                            </IconButton>

                            <IconButton
                              size="small"
                              onClick={() =>
                                handleDelete(
                                  category.id
                                )
                              }
                              sx={{
                                color: "#F87171",
                                bgcolor:
                                  "rgba(239,68,68,0.08)",

                                "&:hover": {
                                  bgcolor:
                                    "rgba(239,68,68,0.18)",
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

          {/* Add / Edit Dialog */}

          <Dialog
            open={open}
            onClose={() => setOpen(false)}
            fullWidth
            maxWidth="sm"
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
                borderBottom:
                  "1px solid #263449",
              }}
            >
              {editingId
                ? "Edit Category"
                : "Add Category"}
            </DialogTitle>

            <DialogContent>
              <Stack
                spacing={2.2}
                sx={{
                  mt: 2,
                }}
              >
                <TextField
                  label="Category Name"
                  fullWidth
                  value={form.name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      name: e.target.value,
                    })
                  }
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      bgcolor: "#0F172A",
                      color: "#F8FAFC",

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

                <TextField
                  label="Description"
                  fullWidth
                  multiline
                  rows={4}
                  value={form.description}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      description:
                        e.target.value,
                    })
                  }
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      bgcolor: "#0F172A",
                      color: "#F8FAFC",

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

                <TextField
                  select
                  label="Status"
                  fullWidth
                  value={form.status}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      status: e.target.value,
                    })
                  }
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      bgcolor: "#0F172A",
                      color: "#F8FAFC",

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

                    "& .MuiSvgIcon-root": {
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
                </TextField>
              </Stack>
            </DialogContent>

            <DialogActions
              sx={{
                px: 3,
                py: 2,
                borderTop:
                  "1px solid #263449",
              }}
            >
              <Button
                onClick={() =>
                  setOpen(false)
                }
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
                startIcon={
                  editingId ? (
                    <Edit />
                  ) : (
                    <Add />
                  )
                }
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
                {editingId
                  ? "Update Category"
                  : "Save Category"}
              </Button>
            </DialogActions>
          </Dialog>
        </Container>
      </Box>
    </Box>
  );
}