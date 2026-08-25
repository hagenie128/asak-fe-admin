/*
 * 결제수단 행 (SCR-018)
 * mock: getPaymentMethods().data[] — methodId, name, description, iconUrl, isActive, isMaintenance, sortOrder
 */
import arrowUpIcon from "../../assets/figma/icon-arrow-up.svg";
import arrowDownIcon from "../../assets/figma/icon-arrow-down.svg";
import { getPaymentMethodIconUrl } from "../../constants/paymentMethodGlyphs.js";

export default function AdminPaymentMethodRow({
  method,
  onToggle,
  onMoveUp,
  onMoveDown,
  canMoveUp = false,
  canMoveDown = false,
  disabled = false,
}) {
  const iconUrl = getPaymentMethodIconUrl(method.methodCode);

  return (
    <article className="payment-method-row">
      <span className="payment-method-row__icon" aria-hidden="true">
        {iconUrl ? <img src={iconUrl} alt="" /> : null}
      </span>
      <div className="payment-method-row__info">
        <strong>
          {method.methodName}
          {method.isMaintenance ? (
            <span className="payment-method-row__badge">점검중</span>
          ) : null}
        </strong>
        <span>{method.description}</span>
      </div>
      <div className="payment-method-row__reorder">
        <button
          type="button"
          disabled={disabled || !canMoveUp}
          aria-label={`${method.methodName} 위로 이동`}
          onClick={onMoveUp}
        >
          <img alt="" aria-hidden="true" src={arrowUpIcon} />
        </button>
        <button
          type="button"
          disabled={disabled || !canMoveDown}
          aria-label={`${method.methodName} 아래로 이동`}
          onClick={onMoveDown}
        >
          <img alt="" aria-hidden="true" src={arrowDownIcon} />
        </button>
      </div>
      <button
        type="button"
        className={`payment-toggle${method.active ? "" : " payment-toggle--off"}`}
        role="switch"
        aria-checked={method.active}
        aria-label={`${method.methodName} ${method.active ? "활성" : "비활성"}`}
        disabled={disabled}
        onClick={onToggle}
      >
        <i />
      </button>
    </article>
  );
}
