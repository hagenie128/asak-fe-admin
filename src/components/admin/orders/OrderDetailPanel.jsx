/* Figma Admin/DetailPanel (150:5418) — 주문 상세 우측 패널 */
import emptyBoxOpen from "../../../assets/figma/empty-box-open.svg";
import {
  ORDER_STATUS,
  PAYMENT_METHOD_LABEL,
  PAYMENT_STATUS,
} from "../../../constants/orderLabels.js";
import { formatCurrency } from "../../../utils/currency.js";
import { formatDateTime } from "../../../utils/date.js";

function getPositiveQuantity(value) {
  const quantity = Number(value);
  return Number.isFinite(quantity) && quantity > 0 ? quantity : 1;
}

function getOptionLineAmount(item, option) {
  const itemQuantity = getPositiveQuantity(item.quantity);
  const optionQuantity = getPositiveQuantity(option.quantity);
  return Number(option.price) * itemQuantity * optionQuantity;
}

function getItemTotalAmount(item) {
  const itemQuantity = getPositiveQuantity(item.quantity);
  const baseAmount = Number(item.unitPrice) * itemQuantity;
  const optionAmount = (item.optionItems ?? []).reduce(
    (sum, option) => sum + getOptionLineAmount(item, option),
    0,
  );

  return baseAmount + optionAmount;
}

function formatItemPrice(unitPrice, asNegative) {
  if (unitPrice == null || Number.isNaN(Number(unitPrice))) return "-";
  const signed = asNegative ? -Math.abs(Number(unitPrice)) : Number(unitPrice);
  return formatCurrency(signed);
}

export default function OrderDetailPanel({ selectedOrder, onClose, onRefund, onPrintReceipt }) {
  const hasOrder = Boolean(selectedOrder?.orderId);
  const isCancelledView =
    selectedOrder?.orderStatus === ORDER_STATUS.CANCELED ||
    selectedOrder?.orderStatus === ORDER_STATUS.REFUNDED ||
    selectedOrder?.paymentStatus === PAYMENT_STATUS.REFUNDED ||
    selectedOrder?.paymentStatus === PAYMENT_STATUS.CANCELED;

  const canRefund =
    hasOrder && !isCancelledView && selectedOrder?.paymentStatus === PAYMENT_STATUS.APPROVED;

  const canPrintReceipt =
    hasOrder &&
    (selectedOrder?.paymentStatus === PAYMENT_STATUS.APPROVED ||
      selectedOrder?.paymentStatus === PAYMENT_STATUS.REFUNDED) &&
    selectedOrder?.orderStatus !== ORDER_STATUS.READY;

  if (!hasOrder) {
    return (
      <aside className="order-management__detail order-detail-panel" aria-label="주문 상세">
        <div className="order-detail-panel__empty">
          <img
            className="order-detail-panel__empty-icon"
            src={emptyBoxOpen}
            alt=""
            width={80}
            height={80}
          />
          <p className="order-detail-panel__empty-title">선택된 주문 내역이 없습니다</p>
          <p className="order-detail-panel__empty-desc">주문 목록에서 선택해주세요</p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="order-management__detail order-detail-panel" aria-label="주문 상세">
      <div className="order-detail-panel__content">
        <h2 className="order-detail-panel__title">주문 상세</h2>

        <dl className="order-detail-panel__info">
          <div>
            <dt>주문번호</dt>
            <dd>{selectedOrder.orderNo}</dd>
          </div>
          <div>
            <dt>주문일시</dt>
            <dd>{formatDateTime(selectedOrder.createdAt)}</dd>
          </div>
          {isCancelledView ? (
            <div>
              <dt>취소/환불일시</dt>
              <dd>{formatDateTime(selectedOrder.cancelledAt ?? selectedOrder.refundedAt)}</dd>
            </div>
          ) : null}
          <div>
            <dt>결제수단</dt>
            <dd>
              {PAYMENT_METHOD_LABEL[selectedOrder.paymentMethod.methodName] ??
                selectedOrder.paymentMethod.methodName ??
                "-"}
            </dd>
          </div>
        </dl>

        <div className="order-detail-panel__divider" />

        <div className="order-detail-panel__items">
          {(selectedOrder.items ?? []).map((item) => (
            <div key={`${item.menuId}-${item.menuName}`} className="order-detail-panel__item">
              <div className="order-detail-panel__item-row">
                <strong>{item.menuName}</strong>
                <span className="order-detail-panel__qty">{item.quantity}개</span>
                <b className="order-detail-panel__price">
                  {formatItemPrice(item.unitPrice, isCancelledView)}
                </b>
              </div>
              {item.optionItems?.length > 0 || item.excludedIngredients?.length > 0 ? (
                <div className="order-detail-panel__meta">
                  <section className="order-detail-panel__detail-group">
                    <h3>옵션</h3>
                    {item.optionItems?.length > 0 ? (
                      <ul>
                        {item.optionItems.map((option) => (
                          <li key={option.optionItemId}>
                            <span>
                              {option.name}
                              {getPositiveQuantity(option.quantity) > 1
                                ? ` × ${getPositiveQuantity(option.quantity)}`
                                : ""}
                            </span>
                            <b>
                              {formatItemPrice(getOptionLineAmount(item, option), isCancelledView)}
                            </b>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>없음</p>
                    )}
                  </section>

                  <section className="order-detail-panel__detail-group">
                    <h3>제외</h3>
                    {item.excludedIngredients?.length > 0 ? (
                      <p>
                        {item.excludedIngredients.map((ingredient) => ingredient.name).join(", ")}
                      </p>
                    ) : (
                      <p>없음</p>
                    )}
                  </section>

                  <div className="order-detail-panel__item-total">
                    <span>메뉴 합계</span>
                    <b>{formatItemPrice(getItemTotalAmount(item), isCancelledView)}</b>
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </div>

        <div className="order-detail-panel__divider" />

        <section className="order-detail-panel__note">
          <h3>요청사항</h3>
          <p>{selectedOrder.requestNote || "요청사항 없음"}</p>
        </section>
      </div>

      <footer className="order-detail-panel__footer">
        <div className="order-detail-panel__total">
          <span>{isCancelledView ? "총 취소 금액" : "총 결제 금액"}</span>
          <b>{formatCurrency(selectedOrder.totalAmount)}</b>
        </div>

        <div
          className={`order-detail-panel__actions${
            isCancelledView ? " order-detail-panel__actions--refunded" : ""
          }`}
        >
          <button
            type="button"
            className="order-detail-panel__btn order-detail-panel__btn--close"
            onClick={onClose}
          >
            닫기
          </button>
          {canRefund ? (
            <button
              type="button"
              className="order-detail-panel__btn order-detail-panel__btn--refund"
              onClick={() => onRefund(selectedOrder.orderId)}
            >
              환불
            </button>
          ) : null}
          {canPrintReceipt ? (
            <button
              type="button"
              className={`order-detail-panel__btn ${
                isCancelledView
                  ? "order-detail-panel__btn--print-outline"
                  : "order-detail-panel__btn--print"
              }`}
              onClick={() => onPrintReceipt(selectedOrder)}
            >
              영수증 출력
            </button>
          ) : null}
        </div>
      </footer>
    </aside>
  );
}
