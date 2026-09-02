// ASAK-Admin/src/utils/receiptFormat.js (신규 제안)
// OrderDetailPanel.jsx의 getPositiveQuantity/getOptionLineAmount/getItemTotalAmount와
// 동일 계산 로직을 공용 유틸로 뽑아 여기서 재사용 (화면 표시와 출력물 금액이 어긋나지 않도록).
import {
  ORDER_STATUS,
  PAYMENT_METHOD_LABEL,
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

export function buildReceiptText(order) {
  const lines = [];
  const W = 40;
  const rule = "-".repeat(W);

  lines.push("+" + "-".repeat(W - 2) + "+");
  lines.push(" ASAK RECEIPT".padEnd(W));
  lines.push("+" + "-".repeat(W - 2) + "+");
  lines.push(`주문번호: ${order.orderNo}`);
  lines.push(`주문일시: ${formatDateTime(order.createdAt)}`);
  lines.push(`결제상태: ${PAYMENT_STATUS_LABEL[order.paymentStatus] ?? "-"}`);
  lines.push(`결제수단: ${formatPaymentMethodLabel(order.paymentMethod)}`);
  const orderStatus = order.orderStatus ?? order.status;
  if (orderStatus === ORDER_STATUS.REFUNDED || orderStatus === ORDER_STATUS.CANCELED) {
    lines.push(`취소/환불 금액: -${formatCurrency(order.totalAmount)}`);
  } else {
    lines.push(`결제금액: ${formatCurrency(order.totalAmount)}`);
  }
  lines.push(rule);

  for (const item of order.items ?? []) {
    lines.push(`${item.menuName} x${item.quantity}  ${formatCurrency(item.unitPrice)}`);
    for (const opt of item.optionItems ?? []) {
      lines.push(`  + ${opt.name}  ${formatCurrency(opt.price)}`);
    }
    for (const ex of item.excludedIngredients ?? []) {
      lines.push(`  - ${ex.name} 빼기`);
    }
  }
  lines.push(rule);
  lines.push(`요청사항: ${order.requestNote || "없음"}`);
  lines.push(rule);
  lines.push(`총 결제 금액: ${formatCurrency(order.totalAmount)}`);
  lines.push("+" + "-".repeat(W - 2) + "+");

  return lines.join("\n");
}
