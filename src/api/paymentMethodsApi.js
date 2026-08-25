import { apiClient } from "./apiClient.js";
import { API_ENDPOINTS } from "../constants/api.js";
/**
 * 결제수단 API — GET/PATCH 호출 구현됨, 실 API 검증 대기.
 * 화면: usePaymentMethodDraft → paymentMethodsApi → apiClient
 * Backend Controller·Service·Mapper 구현과 Admin build는 확인했다.
 * 단, 현재 API_BASE_PATH(`/admin`)와 Backend 경로(`/api/admin/paymentMethods`)가 달라
 * 경로 정렬 및 GET/PATCH 실응답 확인 전에는 실연동 완료가 아니다.
 */
export const paymentMethodsApi = {
  // TODO-013 [코드 연결 완료 · 실 API 검증 대기]: GET 목록과 PATCH /{paymentMethodId}는 API_ENDPOINTS를 사용한다.
  // PATCH body는 active, sortNo다. 없는 id·유효하지 않은 요청·0건 갱신의 오류 전달과
  // 여러 행 순서 변경의 순차 PATCH 결과는 실제 Backend 응답으로 확인해야 한다.
  listPaymentMethods() {
    return apiClient.get(API_ENDPOINTS.paymentMethods);
  },
  updatePaymentMethod(methodId, { active, sortNo }) {
    return apiClient
      .patch(API_ENDPOINTS.paymentMethod(methodId), { active, sortNo })
      .then(() => ({ success: true }));
  },
};
