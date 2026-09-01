/* SCR-020 / Sales Summary — Page는 조합만 */
import { useMemo, useState } from "react";
import AdminAsyncState from "../../components/admin/shared/AdminAsyncState.jsx";
import AdminTopHeader from "../../components/admin/shared/AdminTopHeader.jsx";
import AdminDatePicker from "../../components/admin/shared/AdminDatePicker.jsx";
import SalesShareCard from "../../components/admin/SalesShareCard.jsx";
import { useSalesQuery } from "../../hooks/useSalesQuery.js";
import { PERIODS } from "../../constants/orderLabels.js";
import { formatCurrency } from "../../utils/currency.js";
import { currentYearMonth } from "../../utils/date.js";
import {
  endOfMonthYmd,
  fillDailyRows,
  findMaxIndex,
  formatMd,
  kpisFromRows,
  sliceRowsByPeriod,
  startOfMonthYmd,
  todayYmd,
  toShareRows,
  tomorrowYmd,
} from "../../utils/salesDisplay.js";

const PERIOD_KEYS = ["today", "week", "month"];
const PERIOD_DELTA_LABEL = {
  today: "전일 대비",
  week: "전주 대비",
  month: "전월 대비",
};

function formatRangeLabel(from, to) {
  if (!from) return "-";
  const a = from.replaceAll("-", ".");
  const b = (to || from).replaceAll("-", ".");
  return a === b ? a : `${a} ~ ${b}`;
}

export default function SalesSummaryPage() {
  const today = todayYmd();
  const tomorrow = tomorrowYmd();
  const { year, month } = currentYearMonth();
  const monthFrom = startOfMonthYmd(year, month);
  const monthTo = endOfMonthYmd(year, month);

  const [activePeriod, setActivePeriod] = useState("month");
  const [customRange, setCustomRange] = useState(null);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const { data, status, error, refetch } = useSalesQuery({
    mode: "summary",
    period: customRange ? null : activePeriod,
    startDate: customRange?.from,
    endDate: customRange?.to,
  });
  const { data: dailyData } = useSalesQuery({
    mode: "daily",
    from: monthFrom,
    to: monthTo,
  });

  const monthRows = useMemo(
    () => fillDailyRows(dailyData?.rows ?? data?.dailySales, monthFrom, monthTo, { dummyThrough: tomorrow, today }),
    [dailyData, data, monthFrom, monthTo, tomorrow, today],
  );

  const periodRows = useMemo(
    () => sliceRowsByPeriod(monthRows, activePeriod, { today, customRange }),
    [monthRows, activePeriod, today, customRange],
  );

  const handleActivePeriod = (period) => {
    if (period === activePeriod && !customRange) return;
    setActivePeriod(period);
    setCustomRange(null);
  };

  const localKpis = kpisFromRows(periodRows);
  const chartPoints = useMemo(() => {
    const values = periodRows.map((row) => row.totalAmount);
    const max = Math.max(...values, 1);
    return periodRows.map((row) => {
      const value = row.totalAmount;
      const barHeight = value <= 0 || row.isFuture ? 0 : Math.max(4, Math.round((value / max) * 120));
      return {
        label: formatMd(row.date),
        value,
        barHeight,
        isFuture: row.isFuture,
        date: row.date,
      };
    });
  }, [periodRows]);

  const peakIndex = findMaxIndex(chartPoints.map((point) => (point.isFuture ? 0 : point.value)));
  const peakPoint = peakIndex >= 0 ? chartPoints[peakIndex] : null;
  const dailyRows = [...periodRows].reverse();

  const rangeLabel = customRange
    ? formatRangeLabel(customRange.from, customRange.to)
    : periodRows.length
      ? formatRangeLabel(periodRows[0].date, periodRows[periodRows.length - 1].date)
      : data?.dateRange || data?.label || "-";

  if ((status === "loading" || status === "idle") && !data && !dailyData) {
    return <AdminAsyncState status="loading" layout="page" />;
  }
  if (status === "error" && !dailyData) {
    return (
      <AdminAsyncState
        status="error"
        layout="page"
        title="매출 요약을 불러오지 못했습니다"
        description={error?.message || "잠시 후 다시 시도해 주세요."}
        onRetry={refetch}
      />
    );
  }

  const kpis = [
    {
      label: "총매출",
      value: localKpis.totalAmount,
      display: formatCurrency(localKpis.totalAmount),
      delta: customRange ? null : data?.kpis?.[0]?.delta,
      deltaLabel: customRange ? "선택 기간" : PERIOD_DELTA_LABEL[activePeriod],
    },
    {
      label: "주문 수",
      value: localKpis.orderCount,
      display: `${localKpis.orderCount}건`,
      delta: customRange ? null : data?.kpis?.[1]?.delta,
      deltaLabel: customRange ? "선택 기간" : PERIOD_DELTA_LABEL[activePeriod],
    },
    {
      label: "평균 객단가",
      value: localKpis.avgAmount,
      display: formatCurrency(localKpis.avgAmount),
      delta: customRange ? null : data?.kpis?.[2]?.delta,
      deltaLabel: customRange ? "선택 기간" : PERIOD_DELTA_LABEL[activePeriod],
    },
  ];

  const chartTitle =
    activePeriod === "today"
      ? "오늘 매출"
      : activePeriod === "week"
        ? "이번 주 일별 매출"
        : customRange
          ? "선택 기간 일별 매출"
          : "이번 달 일별 매출";

  const tickPoints = chartPoints.filter(
    (_, index, items) => index === 0 || index === items.length - 1 || index % 3 === 0,
  );

  return (
    <section className="sales-summary">
      <AdminTopHeader
        crumb="Admin / 매출 관리"
        title="매출 요약"
        description="전체 매출 현황 및 핵심 지표"
      >
        <div className="sales-summary__filters">
          {PERIOD_KEYS.map((periodKey) => (
            <button
              key={periodKey}
              type="button"
              className={periodKey === activePeriod && !customRange ? "is-selected" : ""}
              onClick={() => handleActivePeriod(periodKey)}
            >
              {PERIODS[periodKey]}
            </button>
          ))}
          <AdminDatePicker
            mode="range"
            open={calendarOpen}
            value={
              customRange ||
              (periodRows.length
                ? { from: periodRows[0].date, to: periodRows[periodRows.length - 1].date }
                : { from: today, to: today })
            }
            minDate={monthFrom}
            maxDate={today}
            onChange={(range) => {
              setCustomRange(range);
              setCalendarOpen(false);
            }}
            onClose={() => setCalendarOpen(false)}
          >
            <button
              type="button"
              className={customRange ? "is-selected" : ""}
              onClick={() => setCalendarOpen((v) => !v)}
            >
              {rangeLabel}
            </button>
          </AdminDatePicker>
        </div>
      </AdminTopHeader>

      <div className="sales-summary__kpis">
        {kpis.map((kpi) => (
          <article key={kpi.label}>
            <span>{kpi.label}</span>
            <strong>{kpi.display ?? formatCurrency(kpi.value)}</strong>
            <p>
              <b>
                {kpi.delta == null
                  ? "—"
                  : kpi.delta > 0
                    ? `↑ ${kpi.delta}%`
                    : kpi.delta < 0
                      ? `↓ ${Math.abs(kpi.delta)}%`
                      : "—"}
              </b>
              <small>{kpi.deltaLabel}</small>
            </p>
          </article>
        ))}
      </div>

      <div className="sales-summary__middle">
        <section className="sales-chart">
          <h2>{chartTitle}</h2>
          <div className="sales-chart__body">
            <div className="sales-chart__bars">
              {chartPoints.map((point) => (
                <i
                  key={`bar-${point.date}`}
                  className={`${point.date === peakPoint?.date ? "is-peak" : ""}${point.isFuture ? " is-future" : ""}`.trim()}
                  style={{ height: `${point.barHeight}px` }}
                />
              ))}
            </div>
            <div className="sales-chart__ticks">
              {tickPoints.map((point) => (
                <span key={`tick-${point.date}`}>{point.label}</span>
              ))}
            </div>
          </div>
          <p className="sales-chart__peak">
            <b>{peakPoint ? formatCurrency(peakPoint.value) : "-"}</b>
            <span>{peakPoint ? `최고 매출일 ${peakPoint.label}` : "데이터 없음"}</span>
          </p>
        </section>

        <div className="sales-summary__right">
          <SalesShareCard title="결제수단별 매출" rows={toShareRows(data?.paymentShare)} />
          <SalesShareCard title="주문유형별 매출" rows={toShareRows(data?.orderShare)} />
        </div>
      </div>

      <section className="sales-table">
        <h2>일별 매출</h2>
        <div className="sales-table__grid">
          <div className="sales-table__head">
            <span>날짜</span>
            <span>주문 수</span>
            <span>총매출</span>
            <span>평균 객단가</span>
          </div>
          {dailyRows.length === 0 ? (
            <p className="sales-table__empty">표시할 일별 매출이 없습니다.</p>
          ) : (
            dailyRows.map((row) => (
              <div key={row.date} className={`sales-table__row${row.isFuture ? " is-future" : ""}`}>
                <span>{formatMd(row.date)}</span>
                <span>{row.isFuture ? "—" : `${row.orderCount}건`}</span>
                <span>{row.isFuture ? "—" : formatCurrency(row.totalAmount)}</span>
                <span>{row.isFuture ? "—" : formatCurrency(row.avgAmount)}</span>
              </div>
            ))
          )}
        </div>
      </section>
    </section>
  );
}
