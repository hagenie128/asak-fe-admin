/*
 * SCR-009 / Live Order
 * API: GET /api/admin/orders/live
 * 응답: data.content[]의 orderId, orderNo, orderTypeLabel, orderStatus,
 * totalAmount, createdAt, elapsedSec, menus[]를 주문 카드에 표시한다.
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ordersApi } from "../../api/ordersApi.js";
import drinkIcon from "../../assets/figma/icon-order-drink.svg";
import excludeIcon from "../../assets/figma/icon-order-exclude.svg";
import plusIcon from "../../assets/figma/icon-order-plus.svg";
import chipBagIcon from "../../assets/figma/icon-order-side.svg";
import { formatCurrency } from "../../utils/currency.js";
import { formatDate, formatTime } from "../../utils/date.js";
import { toast } from "../../utils/toast.js";
import { createOrderCompletedMessage, speak } from "../../utils/ttsMessages.js";
import AdminAsyncState from "./shared/AdminAsyncState.jsx";
import AdminConfirmDialog from "./shared/AdminConfirmDialog.jsx";
import AdminSidebar from "./shared/AdminSidebar.jsx";

function optionIcon(tone) {
  if (tone === "exclude") return excludeIcon;
  if (tone === "plus") return plusIcon;
  if (tone === "drink") return drinkIcon;
  return chipBagIcon;
}

function optionClass(tone) {
  if (tone === "exclude") return "figma-order-option figma-order-option--exclude";
  if (tone === "plus") return "figma-order-option figma-order-option--plus";
  if (tone === "drink") return "figma-order-option figma-order-option--drink";
  return "figma-order-option figma-order-option--side";
}

const OPTION_TONE_ORDER = ["exclude", "plus", "side", "drink"];
const MENU_CARD_WIDTH = 340;
const MENU_CARD_GAP = 8;
const ORDER_CARD_HORIZONTAL_PADDING = 40;

const WIDE_LAYOUT_CLASS = "figma-order-card--wide";
// 상단바(72px)와 주문 영역 상·하단 여백(48px)
const CARD_VIEWPORT_MARGIN = 120;
// 임계값 근처에서 가로 확장이 켜졌다 꺼졌다 반복하지 않도록 둔 여유
const WIDE_LAYOUT_HYSTERESIS = 24;

// 카드에 min-height가 걸려 있어 scrollHeight는 내용과 무관하게 항상 그 값 이상이 된다.
// 자식 높이와 gap·padding을 직접 더해 메뉴를 1열로 쌓았을 때의 높이를 구한다.
function measureStackedHeight(card) {
  const style = window.getComputedStyle(card);
  const gap = Number.parseFloat(style.rowGap) || 0;
  const padding =
    (Number.parseFloat(style.paddingTop) || 0) + (Number.parseFloat(style.paddingBottom) || 0);
  const children = Array.from(card.children);
  const content = children.reduce((sum, child) => sum + child.getBoundingClientRect().height, 0);
  return padding + content + gap * Math.max(0, children.length - 1);
}

function sortOptionsByTone(options) {
  return options
    .map((option, index) => ({ option, index }))
    .sort((left, right) => {
      const leftOrder = OPTION_TONE_ORDER.indexOf(left.option.tone);
      const rightOrder = OPTION_TONE_ORDER.indexOf(right.option.tone);
      const leftPriority = leftOrder === -1 ? OPTION_TONE_ORDER.length : leftOrder;
      const rightPriority = rightOrder === -1 ? OPTION_TONE_ORDER.length : rightOrder;

      return leftPriority - rightPriority || left.index - right.index;
    })
    .map(({ option }) => option);
}

function formatElapsedTime(createdAt, now) {
  const elapsedSec = Math.max(0, Math.floor((now - new Date(createdAt).getTime()) / 1000));

  const day = Math.floor(elapsedSec / (60 * 60 * 24));

  const time = new Date((elapsedSec % (60 * 60 * 24)) * 1000).toISOString().slice(11, 19);

  return day > 0 ? `${day}일 ${time}` : time;
}

function MenuCard({ menu }) {
  const options = sortOptionsByTone(menu?.options ?? []);

  return (
    <section className="figma-order-menu">
      <div className="figma-order-menu__header">
        <div className="figma-order-menu__title">
          <strong>{menu?.menuName || "menu name"}</strong>
          <span>{menu?.quantity ?? 0}</span>
        </div>
        {menu?.base ? (
          <p className="figma-order-menu__base">
            <span>베이스:</span>
            <b>{menu.base}</b>
          </p>
        ) : null}
        <p className="figma-order-menu__dressing">
          <span>드레싱:</span>
          <b>{menu?.dressing || "발사믹"}</b>
        </p>
      </div>
      {options.length > 0 ? (
        <div className="figma-order-menu__options">
          <ul>
            {options.map((option, index) => (
              <li
                key={`${option.tone}-${option.label}-${index}`}
                className={optionClass(option.tone)}
              >
                <i aria-hidden="true">
                  <img alt="" src={optionIcon(option.tone)} />
                </i>
                <span>{option.label}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

function OrderCard({ order, now, onAction, actionPending = false }) {
  const menus = order.menus ?? [];
  const cardRef = useRef(null);
  const [requiresWideLayout, setRequiresWideLayout] = useState(false);
  const orderCardWidth =
    MENU_CARD_WIDTH * menus.length +
    MENU_CARD_GAP * (menus.length - 1) +
    ORDER_CARD_HORIZONTAL_PADDING;
  const liveOrderNo = String(order.orderNo ?? "").slice(-4);
  const actionByStatus = {
    READY: { label: "대기중", nextStatus: "PREPARING", disabled: true },
    RECEIVED: { label: "준비 시작", nextStatus: "PREPARING" },
    PREPARING: { label: "완료 처리", nextStatus: "COMPLETED" },
  };
  const actionConfig = actionByStatus[order.orderStatus];

  useLayoutEffect(() => {
    const card = cardRef.current;
    if (!card) return undefined;

    // 메뉴를 1열로 쌓았을 때 화면 높이를 넘는 경우에만 가로로 확장한다.
    // 확장 중에는 메뉴들이 가로로 나란히 배치돼 카드가 짧아지므로, 판정은 항상 --wide를 뗀 상태에서 잰다.
    // 그래야 확장 여부가 현재 모드에 의존하지 않아 켜짐/꺼짐이 반복되지 않는다.
    const syncWideLayout = () => {
      const hadWide = card.classList.contains(WIDE_LAYOUT_CLASS);
      if (hadWide) card.classList.remove(WIDE_LAYOUT_CLASS);
      const stackedHeight = measureStackedHeight(card);
      if (hadWide) card.classList.add(WIDE_LAYOUT_CLASS);

      const availableCardHeight = window.innerHeight - CARD_VIEWPORT_MARGIN;
      setRequiresWideLayout((current) =>
        current
          ? stackedHeight > availableCardHeight - WIDE_LAYOUT_HYSTERESIS
          : stackedHeight > availableCardHeight,
      );
    };

    syncWideLayout();
    window.addEventListener("resize", syncWideLayout);
    return () => window.removeEventListener("resize", syncWideLayout);
  }, [menus]);

  return (
    <article
      ref={cardRef}
      className={`figma-order-card${requiresWideLayout ? " figma-order-card--wide" : ""}`}
      style={
        requiresWideLayout
          ? {
              "--order-card-width": `${orderCardWidth}px`,
              "--order-menu-count": menus.length,
            }
          : undefined
      }
      aria-label={`${order.orderNo} 주문 미리보기`}
    >
      <header className="figma-order-card__header">
        <strong>{liveOrderNo}</strong>
        <time>경과 {formatElapsedTime(order.createdAt, now)}</time>
      </header>
      <span
        className={`figma-order-card__type${order.orderTypeLabel === "포장" ? " figma-order-card__type--takeout" : ""}`}
      >
        {order.orderTypeLabel}
      </span>
      <div className="figma-order-card__menus">
        {menus.map((menu, index) => (
          <MenuCard key={`${order.orderId}-${index}`} menu={menu} />
        ))}
      </div>
      <footer className="figma-order-card__footer">
        <div className="figma-order-card__total">
          <span>총액</span>
          <strong>{formatCurrency(order.totalAmount ?? 0)}</strong>
        </div>
        <div className="figma-order-card__actions">
          <button
            type="button"
            disabled={actionPending}
            onClick={() => onAction(order.orderId, "CANCELED")}
          >
            취소
          </button>
          <button
            className={
              order.orderStatus === "RECEIVED"
                ? "RECEIVED"
                : order.orderStatus === "PREPARING"
                  ? "PREPARING"
                  : order.orderStatus === "READY"
                    ? "READY"
                    : ""
            }
            type="button"
            disabled={actionPending || !actionConfig || actionConfig.disabled}
            onClick={() => {
              if (!actionConfig || actionConfig.disabled) return;
              onAction(order.orderId, actionConfig.nextStatus);
            }}
          >
            {actionConfig?.label ?? "상태 확인"}
          </button>
        </div>
      </footer>
    </article>
  );
}

export default function LiveOrderBoard() {
  const [status, setStatus] = useState("loading");
  const [orders, setOrders] = useState([]);
  const [actionPending, setActionPending] = useState(false);
  const [cancelOrderId, setCancelOrderId] = useState(null);
  const [now, setNow] = useState(() => Date.now());
  const boardRef = useRef(null);

  function moveToEdge(position) {
    const board = boardRef.current;
    if (!board) return;

    board.scrollTo({
      left: position === "start" ? 0 : board.scrollWidth,
      behavior: "smooth",
    });
  }

  const refresh = useCallback(async (options = {}) => {
    const showLoading = options.showLoading !== false;
    if (showLoading) setStatus("loading");

    try {
      const liveBoard = await ordersApi.liveOrderList();
      const content = liveBoard?.content ?? [];

      setOrders(content);
      setStatus(content.length === 0 ? "empty" : "success");
    } catch {
      setOrders([]);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(timerId);
  }, []);

  const runOrderAction = async (orderId, status) => {
    if (actionPending) return;
    const SUCCESS_MESSAGE = {
      PREPARING: "준비중으로 상태가 변경되었습니다.",
      COMPLETED: "호출이 완료되었습니다.",
      CANCELED: "삭제가 완료되었습니다.",
    };
    setActionPending(true);
    try {
      if (status == "CANCELED") {
        const result = await ordersApi.orderCancel(orderId);
        if (!result.isSuccess()) {
          toast.error(result.error.message || "처리에 실패했습니다.");
          return;
        }
      } else {
        await ordersApi.updateOrderStatus(orderId, status);
      }
      toast.success(SUCCESS_MESSAGE[status]);
      // TTS: COMPLETED 성공 후 speak 호출. 실패 시 toast만, 주문 상태는 유지 (명세 013a~d는 보류)
      if (status === "COMPLETED") {
        try {
          const order = orders.find((o) => o.orderId === orderId);
          if (status === "COMPLETED" && order?.orderNo) {
            await speak(createOrderCompletedMessage(order.orderNo));
          }
        } catch (err) {
          toast.error(err.message || "음성 안내에 실패했습니다."); // 주문은 이미 성공
        }
      }
      refresh({ showLoading: false });
    } catch (err) {
      if (err.status === 409) {
        if (err.code === "ORDER_STATUS_CONFLICT") {
          toast.error(err.message || "전이 충돌이 발생했습니다.");
        } else if (err.code === "INVALID_ORDER_STATUS_TRANSITION") {
          toast.error(err.message || "유효하지 않은 상태 전이입니다.");
        } else {
          toast.error(err.message || "처리에 실패했습니다.");
        }
      } else {
        toast.error(err.message || "처리에 실패했습니다.");
      }
      refresh({ showLoading: false });
    } finally {
      setActionPending(false);
    }
  };

  const handleOrder = (orderId, status) => {
    if (actionPending) return;
    if (status === "CANCELED") {
      setCancelOrderId(orderId);
      return;
    }
    runOrderAction(orderId, status);
  };

  function handleCancelConfirm() {
    const orderId = cancelOrderId;
    setCancelOrderId(null);
    if (orderId == null) return;
    runOrderAction(orderId, "CANCELED");
  }

  return (
    <section className="live-order-preview" aria-label="주문 현황" data-figma-node="235:6361">
      <header className="live-order-preview__topbar" data-figma-node="235:6372">
        <AdminSidebar model="logo" />
        <div className="live-order-preview__heading">
          <div className="live-order-preview__title-group">
            <h1>주문 현황</h1>
            <p>조리 완료 처리 및 TTS 알림을 관리합니다.</p>
          </div>
          <time>
            {formatDate(new Date(now))}
            {" | "}
            {formatTime(new Date(now))}
          </time>
        </div>
      </header>
      <main className="live-order-preview__content">
        {/* TODO-026: livePage를 제거하고 useRef 보드 + scrollBy 가로 스크롤로 전환한다.
            GET /api/admin/orders/live의 createdAt ASC 순서는 유지하며 orders 전체를 렌더하고,
            empty·loading·error와 좌우 버튼 disabled 조건을 함께 수동 QA한다. */}
        <button
          type="button"
          className="live-order-preview__arrow"
          disabled={status !== "success" || orders.length <= 0}
          aria-label="가장 오래된 주문"
          onClick={() => moveToEdge("start")}
        >
          ‹
        </button>
        {status === "loading" || status === "empty" || status === "error" ? (
          <div className="live-order-preview__board">
            <AdminAsyncState
              status={status}
              layout="page"
              title={
                status === "empty"
                  ? "진행 중 주문이 없습니다"
                  : status === "error"
                    ? "주문 현황을 불러오지 못했습니다"
                    : undefined
              }
              description={
                status === "empty"
                  ? "새 주문이 들어오면 여기에 표시됩니다."
                  : status === "error"
                    ? "잠시 후 다시 시도하거나, 네트워크 연결을 확인해 주세요."
                    : undefined
              }
              onRetry={status === "error" ? refresh : undefined}
            />
          </div>
        ) : (
          <div className="live-order-preview__board" ref={boardRef}>
            {orders.map((order) => (
              <OrderCard
                key={order.orderId}
                order={order}
                now={now}
                onAction={handleOrder}
                actionPending={actionPending}
              />
            ))}
          </div>
        )}
        <button
          type="button"
          className="live-order-preview__arrow"
          disabled={status !== "success" || orders.page >= orders.totalPages - 1}
          aria-label="가장 최근 주문"
          onClick={() => moveToEdge("end")}
        >
          ›
        </button>
      </main>
      <AdminConfirmDialog
        open={cancelOrderId != null}
        title="주문을 취소하시겠습니까?"
        description="취소된 주문은 조리 목록에서 사라집니다."
        confirmLabel="취소 처리"
        tone="danger"
        isBusy={actionPending}
        onConfirm={handleCancelConfirm}
        onCancel={() => setCancelOrderId(null)}
      />
    </section>
  );
}
