import { useEffect, useState } from "react";

import {
  Box,
  Button,
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
    setForm(emptyCategory);
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
    try {
      if (editingId) {
        await updateCategory(editingId, form);
      } else {
        await createCategory(form);
      }

      setOpen(false);
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
          ml: "260px",
        }}
      >
        <Topbar />

        <Container
          maxWidth="xl"
          sx={{
            mt: 12,
            pb: 4,
          }}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            mb={3}
          >
            <Typography
              variant="h4"
              fontWeight={700}
              color="white"
            >
              Categories
            </Typography>

            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleAdd}
              sx={{
                borderRadius: 2,
                px: 3,
              }}
            >
              Add Category
            </Button>
          </Stack>

          <TextField
            fullWidth
            placeholder="Search Category..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            sx={{
              mb: 3,
              "& .MuiOutlinedInput-root": {
                bgcolor: "#1E293B",
                color: "white",
                borderRadius: 2,
              },
              "& input": {
                color: "white",
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: "#94A3B8" }} />
                </InputAdornment>
              ),
            }}
          />

                    <Paper
            elevation={0}
            sx={{
              bgcolor: "#1E293B",
              borderRadius: 3,
              border: "1px solid #334155",
              overflow: "hidden",
            }}
          >
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell
                      sx={{
                        color: "white",
                        fontWeight: 700,
                      }}
                    >
                      Category Name
                    </TableCell>

                    <TableCell
                      sx={{
                        color: "white",
                        fontWeight: 700,
                      }}
                    >
                      Description
                    </TableCell>

                    <TableCell
                      sx={{
                        color: "white",
                        fontWeight: 700,
                      }}
                    >
                      Status
                    </TableCell>

                    <TableCell
                      align="right"
                      sx={{
                        color: "white",
                        fontWeight: 700,
                      }}
                    >
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {categories.map((category) => (
                    <TableRow
                      key={category.id}
                      hover
                    >
                      <TableCell
                        sx={{ color: "white" }}
                      >
                        {category.name}
                      </TableCell>

                      <TableCell
                        sx={{
                          color: "#CBD5E1",
                        }}
                      >
                        {category.description}
                      </TableCell>

                      <TableCell
                        sx={{
                          color:
                            category.status ===
                            "ACTIVE"
                              ? "#22C55E"
                              : "#EF4444",
                          fontWeight: 600,
                        }}
                      >
                        {category.status}
                      </TableCell>

                      <TableCell align="right">
                        <IconButton
                          color="primary"
                          onClick={() =>
                            handleEdit(category)
                          }
                        >
                          <Edit />
                        </IconButton>

                        <IconButton
                          color="error"
                          onClick={() =>
                            handleDelete(
                              category.id
                            )
                          }
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

                    <Dialog
            open={open}
            onClose={() => setOpen(false)}
            fullWidth
            maxWidth="sm"
          >
            <DialogTitle>
              {editingId
                ? "Edit Category"
                : "Add Category"}
            </DialogTitle>

            <DialogContent>
              <Stack
                spacing={2}
                sx={{ mt: 1 }}
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
                />

                <TextField
                  label="Description"
                  fullWidth
                  multiline
                  rows={3}
                  value={form.description}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      description: e.target.value,
                    })
                  }
                />

                <TextField
                  select
                  label="Status"
                  value={form.status}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      status: e.target.value,
                    })
                  }
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

            <DialogActions>
              <Button
                onClick={() => setOpen(false)}
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
              >
                {editingId
                  ? "Update"
                  : "Save"}
              </Button>
            </DialogActions>
          </Dialog>
        </Container>
      </Box>
    </Box>
  );
}