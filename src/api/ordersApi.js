// 주문 API (SCR-009/010) — 실연동됨
import { API_ENDPOINTS } from "../constants/api.js";
import { buildReceiptText } from "../utils/receiptFormat.js";
import { createUuid } from "../utils/uuid.js";
import { apiClient } from "./apiClient.js";

export const ordersApi = {
  orderList: (params) => apiClient.get(API_ENDPOINTS.orders, { params }),
  orderDetail: (orderId) => apiClient.get(API_ENDPOINTS.order(orderId)),
  liveOrderList: () => apiClient.get(API_ENDPOINTS.liveOrders),
  updateOrderStatus: (orderId, status) =>
    apiClient.patch(API_ENDPOINTS.orderStatus(orderId, status)),
  orderCancel: (orderId) => apiClient.patch(API_ENDPOINTS.orderCancel(orderId)),
  orderRefund: (orderId, { refundReasonCode, refundReasonDetail } = {}) =>
    apiClient.patch(API_ENDPOINTS.orderRefund(orderId), {
      refundReasonCode,
      ...(refundReasonDetail ? { refundReasonDetail } : {}),
    }),
  // TODO-040: API_ENDPOINTS.orderRefund와 이 orderRefund 래퍼는 선언돼 있다. backend TODO-038/039 계약 검증 후
  // 화면의 mock 환불 호출을 이 래퍼로 교체한다. 카드/신용카드는 이번 범위이며, 토스페이는 실제 통합 테스트 성공 시만 포함한다.
  // TODO-041: 영수증 출력은 backend의 출력 책임(브라우저 인쇄/서버 발급)과 응답 형식이 확정된 뒤
  // API_ENDPOINTS.printReceipt와 printReceipt를 추가하고, 재시도 시 중복 출력 규칙을 검증한다.
  printReceipt: (order) =>
    apiClient.post(API_ENDPOINTS.printReceipt(order.orderId), {
      eventType: "PRINT_RECEIPT_TEXT",
      payload: buildReceiptText(order),
      requestId: createUuid(),
    }),
  listDeviceEvents: () => apiClient.get(API_ENDPOINTS.deviceEvents),
};
