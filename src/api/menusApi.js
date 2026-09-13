import { apiClient } from "./apiClient.js";
import { API_ENDPOINTS } from "../constants/api.js";

export const menusApi = {
  listMenus: (params) => apiClient.get(API_ENDPOINTS.menus, { params }),
  getMenu: (menuId) => apiClient.get(API_ENDPOINTS.menu(menuId)),
  listCategories: () => apiClient.get(API_ENDPOINTS.menuCategories),
  // BE에 /admin/menus/active 없음 — 필요 시 Controller 추가 후 함수 재도입
  uploadMenuImage: (file) => {
    const body = new FormData();
    body.append("file", file);
    return apiClient.post(API_ENDPOINTS.menuImages, body);
  },
  createMenu: (payload) => apiClient.post(API_ENDPOINTS.menus, payload),
  updateMenu: (menuId, payload) => apiClient.patch(API_ENDPOINTS.menu(menuId), payload),
  deleteMenu: (menuId) => apiClient.delete(API_ENDPOINTS.menu(menuId)),
  getIngredients: () => apiClient.get(API_ENDPOINTS.menuIngredients),
  listOptionGroups: () => apiClient.get(API_ENDPOINTS.optionGroups),
};
