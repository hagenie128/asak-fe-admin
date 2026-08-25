/**
 * 대시보드·로그인 API.
 * apiClient interceptor가 ApiResponse envelope를 해제하므로 각 메서드는 data만 반환한다.
 */
import { apiClient } from "./apiClient.js";
import { API_ENDPOINTS } from "../constants/api.js";

// dashboard는 이 모듈의 단일 GET 호출로 제한하고 실패 표시는 hook이 처리한다.
// QA: 응답 DTO와 widget 값, 4xx/5xx 오류 전달을 실제 서버에서 확인한다.
export const adminApi = {
  getDashboard() {
    return apiClient.get(API_ENDPOINTS.dashboard);
  },

  // TODO-031 [코드 연결 완료 · 실 API 검증 대기]: { storeNumber }를 POST하고 approved 결과만 LoginPage에 반환한다.
  // 현재 API_BASE_PATH(`/admin`)와 Backend 경로(`/api/admin/login`)가 달라 경로 정렬 뒤
  // "0001"·잘못된 값·빈 입력의 실제 응답을 확인해야 한다. JWT token·만료 정보는 이번 범위가 아니다.
  login(storeNumber) {
    return apiClient.post(API_ENDPOINTS.login, { storeNumber });
  },
};
