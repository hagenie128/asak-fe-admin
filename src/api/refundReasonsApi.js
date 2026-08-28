import { apiClient } from "./apiClient.js";
import { API_ENDPOINTS } from "../constants/api.js";

export const refundReasonsApi = {
  listRefundReasons() {
    return apiClient.get(API_ENDPOINTS.refundReasons);
  },
};
