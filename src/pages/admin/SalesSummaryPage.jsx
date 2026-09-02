/* SCR-020 / Sales Summary — Page는 조합만 */
import { useMemo, useState } from "react";
import AdminAsyncState from "../../components/admin/shared/AdminAsyncState.jsx";
import AdminTopHeader from "../../components/admin/shared/AdminTopHeader.jsx";
import AdminDatePicker from "../../components/admin/shared/AdminDatePicker.jsx";
import SalesShareCard from "../../components/admin/SalesShareCard.jsx";
import { useSalesQuery } from "../../hooks/useSalesQuery.js";
import { PERIODS } from "../../constants/orderLabels.js";
import { formatCurrency } from "../../utils/currency.js";
import { calendarYearBounds } from "../../utils/date.js";
import {
  fillDailyRows,
  findMaxIndex,
  formatMd,
  kpisFromRows,
  sliceRowsByPeriod,
  todayYmd,
  toBarHeights,
  toShareRows,
} from "../../utils/salesDisplay.js";

function shouldShowChartTick(index, total) {
  return index === 0 || index === total - 1 || index % 3 === 0;
}

const { min: CALENDAR_MIN } = calendarYearBounds();

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
    from: CALENDAR_MIN,
    to: today,
  });

  const allDailyRows = useMemo(
    () =>
      fillDailyRows(dailyData?.rows ?? data?.dailySales, CALENDAR_MIN, today, {
        today,
        placeholders: true,
      }),
    [dailyData, data, today],
  );

  const periodRows = useMemo(
    () => sliceRowsByPeriod(allDailyRows, activePeriod, { today, customRange }),
    [allDailyRows, activePeriod, today, customRange],
  );

  /** 차트·표: 오늘 제외(「오늘」 탭 제외). 미완료 당일 데이터는 요약 차트에 넣지 않는다. */
  const displayRows = useMemo(() => {
    if (activePeriod === "today") return periodRows;
    return periodRows.filter((row) => row.date !== today && !row.isFuture);
  }, [periodRows, activePeriod, today]);

  const salesAvailableDates = useMemo(
    () =>
      allDailyRows
        .filter((row) => !row.isFuture && !row.isDummy && Number(row.totalAmount) > 0)
        .map((row) => row.date),
    [allDailyRows],
  );

  const handleActivePeriod = (period) => {
    if (period === activePeriod && !customRange) return;
    setActivePeriod(period);
    setCustomRange(null);
  };

  const localKpis = kpisFromRows(activePeriod === "today" ? periodRows : displayRows);
  const chartPoints = useMemo(() => {
    const values = displayRows.map((row) =>
      row.isPlaceholder || row.totalAmount <= 0 ? 0 : row.totalAmount,
    );
    const barHeights = toBarHeights(values, 120);
    return displayRows.map((row, index) => ({
      label: formatMd(row.date),
      value: row.totalAmount,
      barHeight: barHeights[index],
      isFuture: row.isFuture,
      isPlaceholder: row.isPlaceholder || row.totalAmount <= 0,
      showTick: shouldShowChartTick(index, displayRows.length),
      date: row.date,
    }));
  }, [displayRows]);

  const peakIndex = findMaxIndex(
    chartPoints.map((point) => (point.isPlaceholder ? 0 : point.value)),
  );
  const peakPoint = peakIndex >= 0 ? chartPoints[peakIndex] : null;
  const dailyRows = [...displayRows].reverse();

  const rangeLabel = customRange
    ? formatRangeLabel(customRange.from, customRange.to)
    : displayRows.length
      ? formatRangeLabel(displayRows[0].date, displayRows[displayRows.length - 1].date)
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
            minDate={CALENDAR_MIN}
            maxDate={today}
            availableDates={salesAvailableDates}
            onlyAvailableSelectable
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
            <div className="sales-chart__bars sales-chart__bars--columns">
              {chartPoints.map((point) => (
                <div key={`col-${point.date}`} className="sales-chart__bar-col">
                  <i
                    className={[
                      point.date === peakPoint?.date ? "is-peak" : "",
                      point.isFuture ? "is-future" : "",
                      point.isPlaceholder ? "is-placeholder" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    style={{ height: `${point.isPlaceholder ? 4 : point.barHeight}px` }}
                  />
                  <span className={`sales-chart__tick${point.showTick ? "" : " is-spacer"}`}>
                    {point.showTick ? point.label : ""}
                  </span>
                </div>
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
              <div
                key={row.date}
                className={`sales-table__row${row.isFuture ? " is-future" : ""}${row.isPlaceholder ? " is-placeholder" : ""}`}
              >
                <span>{formatMd(row.date)}</span>
                <span>{row.isPlaceholder ? "—" : `${row.orderCount}건`}</span>
                <span>{row.isPlaceholder ? "—" : formatCurrency(row.totalAmount)}</span>
                <span>{row.isPlaceholder ? "—" : formatCurrency(row.avgAmount)}</span>
              </div>
            ))
          )}
        </div>
      </section>
    </section>
  );
}
