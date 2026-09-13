/* 주문 목록 표 (SCR-010) */
import { formatDate } from "../../../utils/date.js";
import { formatCurrency } from "../../../utils/currency.js";
import { ORDER_TYPE_LABEL } from "../../../constants/orderLabels.js";
import AdminAsyncState from "../shared/AdminAsyncState.jsx";
import OrderStatusBadge from "./OrderStatusBadge.jsx";

export default function OrderTable({
  status,
  orders,
  onOrderDetail,
  selectedOrderId = null,
  onRetry,
}) {
  if (status === "loading" || status === "idle") {
    return (
      <AdminAsyncState
        status="loading"
        layout="section"
        loadingVariant="table"
        title="주문 내역을 불러오는 중"
      />
    );
  }

  if (status === "error") {
    return (
      <AdminAsyncState
        status="error"
        layout="section"
        title="주문 내역을 불러오지 못했습니다"
        description="잠시 후 다시 시도해 주세요."
        onRetry={onRetry}
      />
    );
  }

  if (status === "empty" || orders.length === 0) {
    return (
      <AdminAsyncState
        status="empty"
        layout="section"
        title="주문 내역이 없습니다"
        description="조건에 맞는 주문이 없습니다. 필터를 바꿔 보세요."
      />
    );
  }

  return (
    <table className="order-management__table">
      <thead>
        <tr>
          <th>주문번호</th>
          <th>주문일시</th>
          <th>주문유형</th>
          <th>메뉴 요약</th>
          <th>총 수량</th>
          <th>주문금액</th>
          <th>주문상태</th>
          <th>결제상태</th>
        </tr>
      </thead>
      <tbody>
        {orders.map((order) => {
          const selected = order.orderId === selectedOrderId;
          return (
            <tr
              key={order.orderId}
              className={selected ? "is-selected" : ""}
              tabIndex={0}
              role="button"
              aria-pressed={selected}
              aria-label={`${order.orderNo} 주문 상세 열기`}
              onClick={() => onOrderDetail(order.orderId)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onOrderDetail(order.orderId);
                }
              }}
            >
              <td>{order.orderNo}</td>
              <td>{formatDate(order.createdAt)}</td>
              <td>{ORDER_TYPE_LABEL[order.orderType] ?? order.orderType}</td>
              <td>{order.menuSummary}</td>
              <td>{order.itemCount}</td>
              <td>{formatCurrency(order.totalAmount)}</td>
              <td>
                <OrderStatusBadge orderStatus={order.orderStatus} />
              </td>
              <td>
                <OrderStatusBadge paymentStatus={order.paymentStatus} />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
