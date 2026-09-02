// ASAK-Admin/src/utils/receiptFormat.js (신규 제안)
// OrderDetailPanel.jsx의 getPositiveQuantity/getOptionLineAmount/getItemTotalAmount와
// 동일 계산 로직을 공용 유틸로 뽑아 여기서 재사용 (화면 표시와 출력물 금액이 어긋나지 않도록).
import {
  ORDER_STATUS,
  PAYMENT_METHOD_LABEL,
  PAYMENT_STATUS,
  PAYMENT_STATUS_LABEL,
} from "../constants/orderLabels.js";
import { formatCurrency } from "./currency.js";
import { formatDateTime } from "./date.js";

/** mock 문자열 코드 · BE association `{ methodName }` 모두 처리 */
export function formatPaymentMethodLabel(paymentMethod) {
  if (paymentMethod == null) return "-";
  if (typeof paymentMethod === "string") {
    return PAYMENT_METHOD_LABEL[paymentMethod] ?? paymentMethod;
  }
  const name =
    paymentMethod.methodName ?? paymentMethod.methodCode ?? paymentMethod.code;
  if (name == null) return "-";
  return PAYMENT_METHOD_LABEL[name] ?? name;
}

/** OrderDetailPanel isCancelledView와 동일 — COMPLETED+REFUNDED(제공 후 환불) 포함 */
export function isRefundReceipt(order) {
  const orderStatus = order?.orderStatus ?? order?.status;
  return (
    orderStatus === ORDER_STATUS.CANCELED ||
    orderStatus === ORDER_STATUS.REFUNDED ||
    order?.paymentStatus === PAYMENT_STATUS.REFUNDED ||
    order?.paymentStatus === PAYMENT_STATUS.CANCELED
  );
}

function formatReceiptAmount(amount, asNegative = false) {
  const value = Number(amount);
  if (!Number.isFinite(value)) return "-";
  const signed = asNegative ? -Math.abs(value) : value;
  return formatCurrency(signed);
}

export function buildReceiptText(order) {
  const lines = [];
  const W = 40;
  const rule = "-".repeat(W);
  const refundReceipt = isRefundReceipt(order);
  const refundAt = order.refundedAt ?? order.cancelledAt;

  lines.push("+" + "-".repeat(W - 2) + "+");
  lines.push((refundReceipt ? " ASAK REFUND RECEIPT" : " ASAK RECEIPT").padEnd(W));
  lines.push("+" + "-".repeat(W - 2) + "+");
  lines.push(`주문번호: ${order.orderNo}`);
  lines.push(`주문일시: ${formatDateTime(order.createdAt)}`);
  if (refundReceipt && refundAt) {
    lines.push(`환불일시: ${formatDateTime(refundAt)}`);
  }
  if (refundReceipt) {
    lines.push("결제상태: 환불");
  } else {
    lines.push(`결제상태: ${PAYMENT_STATUS_LABEL[order.paymentStatus] ?? "-"}`);
  }
  lines.push(`결제수단: ${formatPaymentMethodLabel(order.paymentMethod)}`);
  if (refundReceipt) {
    lines.push(`환불금액: ${formatReceiptAmount(order.totalAmount, true)}`);
  } else {
    lines.push(`결제금액: ${formatCurrency(order.totalAmount)}`);
  }
  lines.push(rule);

  for (const item of order.items ?? []) {
    lines.push(
      `${item.menuName} x${item.quantity}  ${formatReceiptAmount(item.unitPrice, refundReceipt)}`,
    );
    for (const opt of item.optionItems ?? []) {
      lines.push(`  + ${opt.name}  ${formatReceiptAmount(opt.price, refundReceipt)}`);
    }
    for (const ex of item.excludedIngredients ?? []) {
      lines.push(`  - ${ex.name} 빼기`);
    }
  }
  lines.push(rule);
  lines.push(`요청사항: ${order.requestNote || "없음"}`);
  lines.push(rule);
  lines.push(
    refundReceipt
      ? `총 환불 금액: ${formatReceiptAmount(order.totalAmount, true)}`
      : `총 결제 금액: ${formatCurrency(order.totalAmount)}`,
  );
  lines.push("+" + "-".repeat(W - 2) + "+");

  return lines.join("\n");
}
