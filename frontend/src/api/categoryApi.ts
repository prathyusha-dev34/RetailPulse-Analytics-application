import api from "./axios";

export interface CategoryData {
  id?: number;
  name: string;
  description?: string;
  status: string;
}

export const getCategories = (search?: string) => {
  return api.get("/categories", {
    params: { search },
  });
};

export const getCategory = (categoryId: number) => {
  return api.get(`/categories/${categoryId}`);
};

export const createCategory = (
  data: CategoryData
) => {
  return api.post("/categories", data);
};

export const updateCategory = (
  categoryId: number,
  data: Partial<CategoryData>
) => {
  return api.put(
    `/categories/${categoryId}`,
    data
  );
};

export const deleteCategory = (
  categoryId: number
) => {
  return api.delete(
    `/categories/${categoryId}`
  );
};