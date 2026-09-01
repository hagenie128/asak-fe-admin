/**
 * GET /api/admin/dashboard DTO를 SCR-022 표시 모델로 변환한다.
 * barHeight는 API 계약에 넣지 않는 렌더링 전용 값이다.
 */
const DASHBOARD_TREND_MAX_HEIGHT = 120;

function toWeeklySalesView(rows = []) {
  const maxAmount = Math.max(...rows.map((row) => Number(row.amount) || 0), 1);

  return rows.map((row) => ({
    ...row,
    amount: Number(row.amount) || 0,
    barHeight: Math.max(
      4,
      Math.round(((Number(row.amount) || 0) / maxAmount) * DASHBOARD_TREND_MAX_HEIGHT),
    ),
  }));
}

export function toDashboardViewModel(data = {}) {
  return {
    dateLabel: data.dateLabel ?? "-",
    kpis: data.kpis ?? [],
    recentOrders: data.recentOrders ?? [],
    statusSummary: data.statusSummary ?? [],
    orderTypeSummary: data.orderTypeSummary ?? {},
    inventoryAlerts: data.inventoryAlerts ?? [],
    weeklySales: toWeeklySalesView(data.weeklySales ?? []),
    previousWeekNetSales: Number(data.previousWeekNetSales) || 0,
  };
}
