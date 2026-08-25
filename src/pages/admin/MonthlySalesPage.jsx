/* SCR-020 / Monthly Sales */
import { useMemo, useState } from "react";
import AdminAsyncState from "../../components/admin/shared/AdminAsyncState.jsx";
import AdminTopHeader from "../../components/admin/shared/AdminTopHeader.jsx";
import AdminDatePicker from "../../components/admin/shared/AdminDatePicker.jsx";
import { useSalesQuery } from "../../hooks/useSalesQuery.js";
import { formatCurrency } from "../../utils/currency.js";
import {
  filterRowsByYearMonth,
  findMaxIndex,
  formatMd,
  formatMonthlyNavLabel,
  toBarHeights,
  toYearMonthKey,
  weekdayLabel,
} from "../../utils/salesDisplay.js";

const MOCK_YEAR = 2026;
const MOCK_MONTH = 7;

export default function MonthlySalesPage() {
  const [year, setYear] = useState(MOCK_YEAR);
  const [month, setMonth] = useState(MOCK_MONTH);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const monthKey = toYearMonthKey(year, month);
  const dailyFrom = `${monthKey}-01`;
  const dailyTo = `${monthKey}-${String(new Date(year, month, 0).getDate()).padStart(2, "0")}`;

  const {
    data: monthlyData,
    status: monthlyStatus,
    error,
    refetch,
  } = useSalesQuery({
    mode: "monthly",
    year,
    month,
  });
  const { data: dailyData, status: dailyStatus } = useSalesQuery({
    mode: "daily",
    from: dailyFrom,
    to: dailyTo,
  });

  const baseYear = monthlyData?.year ?? MOCK_YEAR;
  const label = formatMonthlyNavLabel(year, month, baseYear);

  const monthRow = useMemo(() => {
    return (monthlyData?.rows ?? []).find((row) => row.month === monthKey) ?? null;
  }, [monthlyData, monthKey]);

  const monthDays = useMemo(() => {
    return filterRowsByYearMonth(dailyData?.rows, year, month);
  }, [dailyData, year, month]);

  const salesValues = monthDays.map((row) => row.totalAmount);
  const orderValues = monthDays.map((row) => row.orderCount);
  const salesBars = toBarHeights(salesValues, 70);
  const orderBars = toBarHeights(orderValues, 40);
  const peakIndex = findMaxIndex(salesValues);
  const peakRow = peakIndex >= 0 ? monthDays[peakIndex] : null;

  const ranking = (monthlyData?.ranking?.[monthKey] ?? []).slice(0, 5);

  const weekdayStats = useMemo(() => {
    let weekdaySum = 0;
    let weekdayCount = 0;
    let weekendSum = 0;
    let weekendCount = 0;
    monthDays.forEach((row) => {
      const d = new Date(`${row.date}T00:00:00`);
      const day = d.getDay();
      const isWeekend = day === 0 || day === 6;
      if (isWeekend) {
        weekendSum += row.totalAmount;
        weekendCount += 1;
      } else {
        weekdaySum += row.totalAmount;
        weekdayCount += 1;
      }
    });
    const weekdayAvg = weekdayCount ? Math.round(weekdaySum / weekdayCount) : 0;
    const weekendAvg = weekendCount ? Math.round(weekendSum / weekendCount) : 0;
    const total = weekdaySum + weekendSum;
    const weekendShare = total ? Math.round((weekendSum / total) * 100) : 0;
    const maxAvg = Math.max(weekdayAvg, weekendAvg, 1);
    return {
      weekdayAvg,
      weekendAvg,
      weekendCount,
      weekendShare,
      weekdayWidth: `${Math.round((weekdayAvg / maxAvg) * 100)}%`,
      weekendWidth: `${Math.round((weekendAvg / maxAvg) * 100)}%`,
    };
  }, [monthDays]);

  const avgOrderCount = monthDays.length
    ? Math.round(
        monthDays.reduce((sum, row) => sum + row.orderCount, 0) / monthDays.length
      )
    : 0;

  const detailRows = [...monthDays].reverse().slice(0, 8);

  const handlePrevMonth = () => {
    if (month === 1) {
      setYear((y) => y - 1);
      setMonth(12);
      return;
    }
    setMonth((m) => m - 1);
  };

  const handleNextMonth = () => {
    if (month === 12) {
      setYear((y) => y + 1);
      setMonth(1);
      return;
    }
    setMonth((m) => m + 1);
  };

  if (monthlyStatus === "loading" || monthlyStatus === "idle") {
    return <AdminAsyncState status="loading" layout="page" />;
  }
  if (monthlyStatus === "error") {
    return (
      <AdminAsyncState
        status="error"
        layout="page"
        title="월별 매출을 불러오지 못했습니다"
        description={error?.message || "잠시 후 다시 시도해 주세요."}
        onRetry={refetch}
      />
    );
  }

  return (
    <section className="sales-monthly" data-figma-node="134:10957">
      <AdminTopHeader
        crumb="Admin / 월별 매출"
        title="월별 매출"
        description="월간 매출 추이 및 상세 분석"
      >
        <div className="sales-monthly__year">
          <button type="button" aria-label="이전 달" onClick={handlePrevMonth}>
            ‹
          </button>
          <AdminDatePicker
            mode="single"
            open={calendarOpen}
            value={`${year}-${String(month).padStart(2, "0")}-01`}
            minDate="2026-01-01"
            maxDate="2026-12-31"
            availableMonths={(monthlyData?.rows ?? []).map((row) => row.month)}
            onChange={(ymd) => {
              const [y, m] = ymd.split("-").map(Number);
              setYear(y);
              setMonth(m);
              setCalendarOpen(false);
            }}
            onClose={() => setCalendarOpen(false)}
          >
            <button
              type="button"
              className="sales-monthly__year-label"
              onClick={() => setCalendarOpen((v) => !v)}
            >
              {label}
            </button>
          </AdminDatePicker>
          <button type="button" aria-label="다음 달" onClick={handleNextMonth}>
            ›
          </button>
        </div>
      </AdminTopHeader>

      <div className="sales-monthly__kpis">
        <article>
          <span>{month}월 누적 매출</span>
          <strong>{formatCurrency(monthRow?.totalAmount)}</strong>
          <p className="is-ok">
            <small>선택 월 기준</small>
          </p>
        </article>
        <article>
          <span>주문 수</span>
          <strong>{monthRow ? `${monthRow.orderCount}건` : "-"}</strong>
          <p className="is-ok">
            <small>선택 월 기준</small>
          </p>
        </article>
        <article>
          <span>평균 객단가</span>
          <strong>{formatCurrency(monthRow?.avgAmount)}</strong>
          <p className="is-ok">
            <small>선택 월 기준</small>
          </p>
        </article>
      </div>

      <div className="sales-monthly__middle">
        <section className="sales-chart">
          <h2>일별 매출 추이</h2>
          {dailyStatus === "loading" || monthDays.length === 0 ? (
            <p className="sales-chart__peak">
              <span>{monthDays.length === 0 ? "해당 월 데이터가 없습니다." : "불러오는 중…"}</span>
            </p>
          ) : (
            <>
              <div className="sales-chart__body">
                <div className="sales-chart__bars">
                  {salesBars.map((height, index) => (
                    <i
                      key={monthDays[index].date}
                      className={index === peakIndex ? "is-peak" : ""}
                      style={{ height: `${height}px` }}
                    />
                  ))}
                </div>
                <div className="sales-chart__ticks">
                  {monthDays
                    .filter((_, index) => index % 3 === 0 || index === monthDays.length - 1)
                    .map((row) => (
                      <span key={row.date}>{Number(String(row.date).slice(8))}일</span>
                    ))}
                </div>
              </div>
              <p className="sales-chart__peak">
                <b>{formatCurrency(peakRow?.totalAmount)}</b>
                <span>
                  최고 매출일{" "}
                  {peakRow
                    ? `${Number(String(peakRow.date).slice(5, 7))}/${String(peakRow.date).slice(8)}`
                    : "-"}
                </span>
              </p>
            </>
          )}
        </section>

        <div className="sales-monthly__right">
          <section className="sales-compare-card">
            <h2>평일 vs 주말</h2>
            <div className="sales-compare-card__row">
              <p>
                <span>평일 평균 매출</span>
                <b>
                  {weekdayStats.weekdayAvg
                    ? `${formatCurrency(weekdayStats.weekdayAvg)}/일`
                    : "없음"}
                </b>
              </p>
              <i>
                <em className="is-primary" style={{ width: weekdayStats.weekdayWidth }} />
              </i>
            </div>
            <div className="sales-compare-card__row">
              <p>
                <span>주말 평균 매출</span>
                <b>
                  {weekdayStats.weekendCount
                    ? `${formatCurrency(weekdayStats.weekendAvg)}/일`
                    : "없음"}
                </b>
              </p>
              <i>
                <em style={{ width: weekdayStats.weekendWidth }} />
              </i>
            </div>
            <p className="sales-compare-card__note">
              주말 매출 비중 {weekdayStats.weekendShare}%
            </p>
          </section>

          <section className="sales-chart sales-chart--compact">
            <h2>일별 주문 수</h2>
            <div className="sales-chart__body">
              <div className="sales-chart__bars">
                {orderBars.map((height, index) => (
                  <i key={`order-${monthDays[index]?.date ?? index}`} style={{ height: `${height}px` }} />
                ))}
              </div>
            </div>
            <p className="sales-chart__peak">
              <span>일 평균 {avgOrderCount}건</span>
            </p>
          </section>
        </div>
      </div>

      <div className="sales-monthly__bottom">
        <section className="sales-table">
          <h2>일자별 상세</h2>
          <div className="sales-table__grid sales-table__grid--monthly">
            <div className="sales-table__head">
              <span>날짜</span>
              <span>요일</span>
              <span>주문 수</span>
              <span>순매출</span>
              <span>객단가</span>
            </div>
            {detailRows.length === 0 ? (
              <div className="sales-table__row">
                <span>—</span>
                <span>—</span>
                <span>—</span>
                <span>—</span>
                <span>—</span>
              </div>
            ) : (
              detailRows.map((row) => (
                <div className="sales-table__row" key={row.date}>
                  <span>{formatMd(row.date)}</span>
                  <span>{weekdayLabel(row.date)}</span>
                  <span>{row.orderCount}</span>
                  <span>{formatCurrency(row.totalAmount)}</span>
                  <span>{formatCurrency(row.avgAmount)}</span>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="sales-ranking">
          <h2>{month}월 인기 메뉴</h2>
          <div className="sales-ranking__rows">
            {ranking.length === 0 ? (
              <div className="sales-ranking__row">
                <span className="sales-ranking__name">데이터 없음</span>
              </div>
            ) : (
              ranking.map((row) => (
                <div className="sales-ranking__row" key={row.rank}>
                  <span className="sales-ranking__rank">{row.rank}</span>
                  <span className="sales-ranking__name">{row.name}</span>
                  <span className="sales-ranking__count">{row.count}건</span>
                  <b className="sales-ranking__amount">{formatCurrency(row.amount)}</b>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </section>
  );
}
