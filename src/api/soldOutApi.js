import { apiClient } from "./apiClient.js";
import { API_ENDPOINTS } from "../constants/api.js";

// GET 카탈로그와 PATCH changes[]를 같은 soldOut endpoint로 호출한다.
// TODO: ApiResponse unwrap 뒤 available/soldOut 배열 shape, 4xx 오류 전달, 실제 네트워크 요청을 확인한다.
export const soldOutApi = {
  listSoldOutCatalog: () => apiClient.get(API_ENDPOINTS.soldOut),
  patchSoldOut: (changes) => apiClient.patch(API_ENDPOINTS.soldOut, { changes }),
};
