/*
 * SCR-022 / Dashboard
 * Page = 조합만. 섹션 UI는 DashboardPanels.
 */
import AdminAsyncState from "../../components/admin/shared/AdminAsyncState.jsx";
import AdminTopHeader from "../../components/admin/shared/AdminTopHeader.jsx";
import {
  DashboardInventoryAlerts,
  DashboardKpis,
  DashboardRecentOrders,
  DashboardStatusSummary,
  DashboardWeeklyTrend,
  buildWeeklyTrendStats,
} from "../../components/admin/DashboardPanels.jsx";
import { useDashboard } from "../../hooks/useDashboard.js";

export default function DashboardPage() {
  const { data, status, refetch } = useDashboard();

  if (status === "error") {
    return (
      <section className="admin-dashboard">
        <AdminTopHeader
          crumb="Admin / 대시보드"
          title="대시보드"
          description="오늘의 매출 현황 및 핵심 지표"
        />
        <AdminAsyncState
          status="error"
          layout="page"
          title="대시보드를 불러오지 못했습니다"
          onRetry={refetch}
        />
      </section>
    );
  }

  if (status === "loading" || !data) {
    return (
      <section className="admin-dashboard">
        <AdminTopHeader
          crumb="Admin / 대시보드"
          title="대시보드"
          description="오늘의 매출 현황 및 핵심 지표"
        />
        <AdminAsyncState status="loading" layout="page" loadingVariant="card" />
      </section>
    );
  }

  const trendStats = buildWeeklyTrendStats(data.weeklySales, data.previousWeekNetSales);

  return (
    <section className="admin-dashboard" aria-label="대시보드">
      <AdminTopHeader crumb="Admin / 대시보드" title="대시보드" description="오늘의 매출 현황 및 핵심 지표">
        <div className="admin-dashboard__date">
          <b>오늘</b>
          <span>{data.dateLabel}</span>
        </div>
      </AdminTopHeader>
      <DashboardKpis kpis={data.kpis} />
      <div className="admin-dashboard__middle">
        <DashboardRecentOrders orders={data.recentOrders} />
        <DashboardStatusSummary
          statusSummary={data.statusSummary}
          orderTypeSummary={data.orderTypeSummary}
        />
      </div>
      <div className="admin-dashboard__bottom">
        <DashboardInventoryAlerts alerts={data.inventoryAlerts} />
        <DashboardWeeklyTrend weeklySales={data.weeklySales} stats={trendStats} />
      </div>
    </section>
  );
}
