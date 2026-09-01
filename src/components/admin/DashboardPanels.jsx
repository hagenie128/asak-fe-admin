/* SCR-022 대시보드 섹션들 — Page는 조립만 */
import { formatCurrency } from "../../utils/currency.js";
import { ORDER_TYPE_LABEL, ORDER_STATUS_LABEL } from "../../constants/orderLabels.js";

const STATUS_CLASS = {
  READY: "waiting",
  RECEIVED: "waiting",
  PREPARING: "preparing",
  COMPLETED: "complete",
  CANCELED: "cancelled",
};

export function DashboardKpis({ kpis = [] }) {
  return (
    <div className="admin-dashboard__kpis">
      {kpis.map((kpi) => (
        <article key={kpi.label}>
          <span>{kpi.label}</span>
          <strong>{kpi.display}</strong>
        </article>
      ))}
    </div>
  );
}

export function DashboardRecentOrders({ orders = [] }) {
  return (
    <section className="dashboard-panel dashboard-orders">
      <h2>최근 주문</h2>
      {orders.length === 0 ? (
        <p className="dashboard-orders__empty">오늘 표시할 주문이 없습니다.</p>
      ) : (
      <div className="dashboard-orders__table">
        <div className="dashboard-orders__head">
          <span>주문번호</span>
          <span>유형</span>
          <span>메뉴</span>
          <span>금액</span>
          <span>상태</span>
          <span>시간</span>
        </div>
        {orders.slice(0, 3).map((order) => (
          <div key={order.orderNo} className="dashboard-orders__row">
            <b>{order.orderNo}</b>
            <span>{ORDER_TYPE_LABEL[order.orderType] ?? order.orderType}</span>
            <span>{order.menuSummary}</span>
            <span>{formatCurrency(order.totalAmount)}</span>
            <em
              className={`dashboard-status dashboard-status--${STATUS_CLASS[order.orderStatus] ?? "waiting"}`}
            >
              {ORDER_STATUS_LABEL[order.orderStatus] ?? order.orderStatus}
            </em>
            <span>{order.createdAtLabel}</span>
          </div>
        ))}
      </div>
      )}
    </section>
  );
}

export function DashboardStatusSummary({ statusSummary = [], orderTypeSummary = {} }) {
  const total = statusSummary.reduce((sum, row) => sum + row.count, 0) || 1;

  return (
    <section className="dashboard-panel dashboard-status-summary">
      <h2>주문 상태 요약</h2>
      {statusSummary.map((row) => (
        <div key={row.label} className="dashboard-status-summary__row">
          <p>
            <span>{row.label}</span>
            <b>{row.count}건</b>
          </p>
          <i>
            <em
              className={`dashboard-status-fill dashboard-status-fill--${row.tone}`}
              style={{ width: `${(row.count / total) * 100}%` }}
            />
          </i>
        </div>
      ))}
      <div className="dashboard-order-type">
        <div>
          <span>매장</span>
          <b>{orderTypeSummary.eatIn ?? 0}건</b>
        </div>
        <div>
          <span>포장</span>
          <b>{orderTypeSummary.takeOut ?? 0}건</b>
        </div>
      </div>
    </section>
  );
}

export function DashboardInventoryAlerts({ alerts = [] }) {
  return (
    <section className="dashboard-panel dashboard-inventory">
      <h2>품절 / 재고 알림</h2>
      {alerts.map((alert) => (
        <div key={alert.label} className="dashboard-inventory__row">
          <span>{alert.label}</span>
          <b className={`dashboard-badge dashboard-badge--${alert.tone}`}>{alert.badge}</b>
        </div>
      ))}
      <p className="dashboard-inventory__note">품절 항목은 키오스크에서 자동 비활성화됩니다</p>
    </section>
  );
}

export function DashboardWeeklyTrend({ weeklySales = [], stats = {} }) {
  return (
    <section className="dashboard-panel dashboard-trend">
      <h2>매출 추이 요약</h2>
      <div className="dashboard-trend__chart">
        {weeklySales.map((bar, index) => (
          <div key={`${bar.label}-${index}`}>
            <i
              className={bar.isCurrent ? "is-current" : ""}
              style={{ height: `${bar.barHeight}px` }}
            />
            <span>{bar.label}</span>
          </div>
        ))}
      </div>
      <div className="dashboard-trend__stats">
        <div>
          <span>이번 주 매출</span>
          <b>{stats.weekTotal ?? "-"}</b>
        </div>
        <div>
          <span>일 평균</span>
          <b>{stats.dailyAverage ?? "-"}</b>
        </div>
        <div>
          <span>전주 대비</span>
          <b className={stats.weekDeltaTone === "down" ? "is-down" : ""}>
            {stats.weekDelta ?? "-"}
          </b>
        </div>
      </div>
    </section>
  );
}

export function buildWeeklyTrendStats(weeklySales = [], previousWeekTotal = null) {
  const amounts = weeklySales.map((row) => row.amount).filter((value) => value > 0);
  const weekTotal = amounts.reduce((sum, value) => sum + value, 0);
  const dailyAverage = amounts.length ? Math.round(weekTotal / amounts.length) : 0;
  const previous = Number(previousWeekTotal);
  const hasPrevious = Number.isFinite(previous) && previous > 0;
  let weekDelta = "—";
  let weekDeltaTone = "neutral";

  if (hasPrevious) {
    const percent = Math.round(((weekTotal - previous) / previous) * 100);
    weekDelta = `${percent > 0 ? "+" : ""}${percent}%`;
    weekDeltaTone = percent < 0 ? "down" : "up";
  } else if (weekTotal > 0 && previous === 0) {
    weekDelta = "+100%";
    weekDeltaTone = "up";
  }

  return {
    weekTotal: formatCurrency(weekTotal),
    dailyAverage: formatCurrency(dailyAverage),
    weekDelta,
    weekDeltaTone,
  };
}
