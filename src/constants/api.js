/**
 * Client-facing Admin API contract: `/api/admin` paths and camelCase JSON.
 * 현재 호출 구현: orders/menus/dashboard/soldOut/sales. 결제수단·인증·환불 경로는 호출 구현과 런타임 검증이 필요하다.
 * paymentMethods 정본 경로는 Screen Bible·Controller와 같은 camelCase `/api/admin/paymentMethods`다.
 */
export const API_BASE_PATH = "/admin";

export const API_ENDPOINTS = Object.freeze({
  // dashboard는 백엔드 집계 → adminApi → useDashboard 순서로 연결된다.
  login: `${API_BASE_PATH}/login`,
  dashboard: `${API_BASE_PATH}/dashboard`,

  orders: `${API_BASE_PATH}/orders`,
  order: (orderId) => `${API_BASE_PATH}/orders/${orderId}`,
  liveOrders: `${API_BASE_PATH}/orders/live`,
  orderStatus: (orderId, status) => `${API_BASE_PATH}/orders/${orderId}/${status}`,
  orderCancel: (orderId) => `${API_BASE_PATH}/orders/${orderId}/cancel`,
  orderRefund: (orderId) => `${API_BASE_PATH}/orders/${orderId}/refund`,
  refundReasons: `${API_BASE_PATH}/refund-reasons`,

  menus: `${API_BASE_PATH}/menus`,
  menu: (menuId) => `${API_BASE_PATH}/menus/${menuId}`,
  menuCategories: `${API_BASE_PATH}/menus/categories`,
  menuIngredients: `${API_BASE_PATH}/menus/ingredients`,
  optionGroups: `${API_BASE_PATH}/opts/groups`,

  // soldOut은 GET 카탈로그와 PATCH changes[]를 사용한다. 옵션 항목도 API에는 포함되지만 현 화면 탭은 숨긴다.
  // summary/monthly/daily/time-slots는 각 응답 shape에 맞는 별도 호출이다.
  // TODO-011~014 [코드 연결 완료 · 실 API 검증 대기]: 화면은 API DTO(active, sortNo)를 직접 사용한다.
  // 현재 API_BASE_PATH가 `/admin`이라 Backend의 `/api/admin/paymentMethods`와 경로가 다르므로,
  // API_BASE_PATH 정렬과 GET/PATCH 실응답 확인 전에는 결제수단 기능을 실연동 완료로 표시하지 않는다.
  paymentMethods: `${API_BASE_PATH}/paymentMethods`,
  paymentMethod: (methodId) => `${API_BASE_PATH}/paymentMethods/${methodId}`,
  soldOut: `${API_BASE_PATH}/soldOut`,
  salesSummary: `${API_BASE_PATH}/sales/summary`,
  salesMonthly: `${API_BASE_PATH}/sales/monthly`,
  salesDaily: `${API_BASE_PATH}/sales/daily`,
  salesDailyTimeSlots: `${API_BASE_PATH}/sales/daily/time-slots`,

  printReceipt: (orderId) => `${API_BASE_PATH}/orders/${orderId}/receipt-print-text`,
  deviceEvents: `${API_BASE_PATH}/device-events`,
});
