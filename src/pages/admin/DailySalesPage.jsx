/* SCR-021 / Daily Sales — Page는 조합만 */
import { useMemo, useState } from "react";
import AdminAsyncState from "../../components/admin/shared/AdminAsyncState.jsx";
import AdminTopHeader from "../../components/admin/shared/AdminTopHeader.jsx";
import AdminDatePicker from "../../components/admin/shared/AdminDatePicker.jsx";
import SalesShareCard from "../../components/admin/SalesShareCard.jsx";
import { useDailySalesTimeSlots } from "../../hooks/useDailySalesTimeSlots.js";
import { useSalesQuery } from "../../hooks/useSalesQuery.js";
import { formatCurrency } from "../../utils/currency.js";
import { calendarYearBounds } from "../../utils/date.js";
import {
  calcDeltaPercent,
  endOfMonthYmd,
  fillDailyRows,
  fillHourlySlots,
  findMaxIndex,
  formatYmdWeekday,
  shiftYmd,
  startOfMonthYmd,
  toBarHeights,
  todayYmd,
  toShareRows,
} from "../../utils/salesDisplay.js";

const { min: CALENDAR_MIN } = calendarYearBounds();

function formatDelta(delta) {
  if (delta == null) return { text: "—", dir: "" };
  if (delta > 0) return { text: `↑ ${delta}%`, dir: "up" };
  if (delta < 0) return { text: `↓ ${Math.abs(delta)}%`, dir: "down" };
  return { text: "—", dir: "" };
}

function toTimeSlot(slot) {
  const hour = slot.salesHour ?? slot.hour ?? 0;
  const minute = slot.salesMinute ?? slot.minute ?? 0;
  const orderCount = Number(slot.orderCount) || 0;
  const totalAmount = Number(slot.totalAmount) || 0;
  const avgAmount = Number(slot.avgAmount) || (orderCount ? Math.round(totalAmount / orderCount) : 0);
  return { hour, minute, orderCount, totalAmount, avgAmount };
}

function formatHourRange(startHour, startMinute, endHour, endMinute) {
  return `${String(startHour).padStart(2, "0")}:${String(startMinute).padStart(2, "0")}~${String(endHour).padStart(2, "0")}:${String(endMinute).padStart(2, "0")}`;
}

export default function DailySalesPage() {
  const today = todayYmd();
  const [selectedDate, setSelectedDate] = useState(today);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [intervalMinutes, setIntervalMinutes] = useState(60);

  const selectedYear = Number(selectedDate.slice(0, 4));
  const selectedMonth = Number(selectedDate.slice(5, 7));
  const monthFrom = startOfMonthYmd(selectedYear, selectedMonth);
  const monthTo = endOfMonthYmd(selectedYear, selectedMonth);
  const monthQueryTo = monthTo > today ? today : monthTo;

  const prevDate = selectedDate ? shiftYmd(selectedDate, -1) : null;
  const canFetchPrev = Boolean(prevDate && prevDate >= CALENDAR_MIN);

  // API-017: daily는 하루(from=to) 단위. 랭킹·비중은 해당 일자 기준.
  const { data, status, error, refetch } = useSalesQuery({
    mode: "daily",
    from: selectedDate,
    to: selectedDate,
  });

  const { data: prevDayData } = useSalesQuery({
    mode: "daily",
    from: prevDate ?? selectedDate,
    to: prevDate ?? selectedDate,
    enabled: canFetchPrev,
  });

  // 월간 미니 차트만 summary(기간) API로 일별 행을 가져온다.
  const { data: monthSummary, status: monthStatus } = useSalesQuery({
    mode: "summary",
    period: null,
    startDate: monthFrom,
    endDate: monthQueryTo,
  });

  const monthDays = useMemo(
    () =>
      fillDailyRows(monthSummary?.dailySales, monthFrom, monthTo, { today }),
    [monthSummary, monthFrom, monthTo, today],
  );

  const selectedRow = useMemo(() => {
    const rows = fillDailyRows(data?.rows, selectedDate, selectedDate, { today });
    return rows[0] ?? null;
  }, [data, selectedDate, today]);

  const prevRow = useMemo(() => {
    if (!canFetchPrev) return null;
    const rows = fillDailyRows(prevDayData?.rows, prevDate, prevDate, { today });
    return rows[0] ?? null;
  }, [canFetchPrev, prevDayData, prevDate, today]);

  const {
    data: timeSlotData,
    status: timeSlotStatus,
    error: timeSlotError,
    refetch: refetchTimeSlots,
  } = useDailySalesTimeSlots({ date: selectedDate, intervalMinutes });

  const hourly = fillHourlySlots(
    (timeSlotStatus === "success" ? timeSlotData : []).map(toTimeSlot),
    { intervalMinutes },
  ).map(toTimeSlot);

  const ranking = ((selectedDate && data?.ranking?.[selectedDate]) || []).slice(0, 5);
  const breakdown = (selectedDate && data?.breakdown?.[selectedDate]) || {
    paymentShare: [],
    orderShare: [],
  };
  const hasDayData = Boolean(selectedRow && !selectedRow.isFuture && selectedRow.totalAmount > 0);

  const monthAmounts = monthDays.map((row) => (row.isFuture ? 0 : row.totalAmount));
  const monthBars = toBarHeights(monthAmounts, 70);
  const monthPeakIndex = findMaxIndex(monthAmounts);

  const hourlyAmounts = hourly.map((h) => h.totalAmount);
  const hourlyBars = toBarHeights(hourlyAmounts, 70);
  const peakIndex = findMaxIndex(hourlyAmounts);
  const peakHour = peakIndex >= 0 ? hourly[peakIndex] : null;

  const totalDelta = formatDelta(
    calcDeltaPercent(selectedRow?.totalAmount, prevRow?.totalAmount),
  );
  const orderDelta = formatDelta(
    calcDeltaPercent(selectedRow?.orderCount, prevRow?.orderCount),
  );
  const avgDelta = formatDelta(
    calcDeltaPercent(selectedRow?.avgAmount, prevRow?.avgAmount),
  );

  const canGoPrev = Boolean(prevDate && prevDate >= CALENDAR_MIN);
  const canGoNext = Boolean(selectedDate && selectedDate < today);

  const availableDates = monthDays.filter((row) => !row.isFuture).map((row) => row.date);

  if (status === "loading" || status === "idle" || monthStatus === "loading" || monthStatus === "idle") {
    return <AdminAsyncState status="loading" layout="page" />;
  }
  if (status === "error") {
    return (
      <AdminAsyncState
        status="error"
        layout="page"
        title="일별 매출을 불러오지 못했습니다"
        description={error?.message || "잠시 후 다시 시도해 주세요."}
        onRetry={refetch}
      />
    );
  }

  return (
    <section className="sales-daily" data-figma-node="134:10957">
      <AdminTopHeader
        crumb="Admin / 일별 매출"
        title="일별 매출"
        description="일별 매출 추이 및 시간대별 분석"
      >
        <div className="sales-daily__date">
          <button
            type="button"
            aria-label="이전 날"
            disabled={!canGoPrev}
            onClick={() => canGoPrev && setSelectedDate(prevDate)}
          >
            ‹
          </button>
          <AdminDatePicker
            mode="single"
            open={calendarOpen}
            value={selectedDate}
            minDate={CALENDAR_MIN}
            maxDate={today}
            availableDates={availableDates}
            onChange={(ymd) => {
              setSelectedDate(ymd);
              setCalendarOpen(false);
            }}
            onClose={() => setCalendarOpen(false)}
          >
            <button
              type="button"
              className="sales-daily__date-label"
              onClick={() => setCalendarOpen((v) => !v)}
            >
              {selectedDate ? formatYmdWeekday(selectedDate) : "-"}
            </button>
          </AdminDatePicker>
          <button
            type="button"
            aria-label="다음 날"
            disabled={!canGoNext}
            onClick={() => canGoNext && setSelectedDate(shiftYmd(selectedDate, 1))}
          >
            ›
          </button>
        </div>
      </AdminTopHeader>

      <section className="sales-chart sales-chart--month-overview">
        <h2>{selectedMonth}월 일별 매출</h2>
        <div className="sales-chart__body">
          <div className="sales-chart__bars">
            {monthBars.map((height, index) => {
              const row = monthDays[index];
              const isSelected = row?.date === selectedDate;
              return (
                <button
                  key={row.date}
                  type="button"
                  className={`sales-chart__bar-btn${index === monthPeakIndex ? " is-peak" : ""}${row.isFuture ? " is-future" : ""}${isSelected ? " is-selected" : ""}`}
                  style={{ height: `${height}px` }}
                  disabled={row.isFuture}
                  aria-label={`${row.date} 매출 ${formatCurrency(row.totalAmount)}`}
                  onClick={() => !row.isFuture && setSelectedDate(row.date)}
                />
              );
            })}
          </div>
          <div className="sales-chart__ticks">
            {monthDays
              .filter((_, index) => index % 3 === 0 || index === monthDays.length - 1)
              .map((row) => (
                <span key={row.date}>{Number(String(row.date).slice(8))}일</span>
              ))}
          </div>
        </div>
      </section>

      <div className="sales-daily__kpis">
        <article>
          <span>총매출</span>
          <strong>{selectedRow ? formatCurrency(selectedRow.totalAmount) : "-"}</strong>
          <p className={totalDelta.dir === "up" ? "is-ok" : totalDelta.dir === "down" ? "is-down" : ""}>
            <b>{totalDelta.text}</b>
            <small>전일 대비</small>
          </p>
        </article>
        <article>
          <span>주문 수</span>
          <strong>{selectedRow ? `${selectedRow.orderCount}건` : "-"}</strong>
          <p className={orderDelta.dir === "up" ? "is-ok" : orderDelta.dir === "down" ? "is-down" : ""}>
            <b>{orderDelta.text}</b>
            <small>전일 대비</small>
          </p>
        </article>
        <article>
          <span>평균 객단가</span>
          <strong>{selectedRow ? formatCurrency(selectedRow.avgAmount) : "-"}</strong>
          <p className={avgDelta.dir === "up" ? "is-ok" : avgDelta.dir === "down" ? "is-down" : ""}>
            <b>{avgDelta.text}</b>
            <small>전일 대비</small>
          </p>
        </article>
      </div>

      <div className="sales-daily__middle">
        <section className="sales-chart">
          <div className="sales-chart__header">
            <h2>시간대별 매출</h2>
            <div className="sales-daily__interval">
              {[60, 30].map((minutes) => (
                <button
                  key={minutes}
                  type="button"
                  className={intervalMinutes === minutes ? "is-selected" : ""}
                  onClick={() => setIntervalMinutes(minutes)}
                >
                  {minutes}분
                </button>
              ))}
            </div>
          </div>
          {timeSlotStatus === "loading" ? (
            <p className="sales-chart__peak">
              <span>불러오는 중…</span>
            </p>
          ) : timeSlotStatus === "error" ? (
            <AdminAsyncState
              status="error"
              layout="inline"
              title="시간대별 매출을 불러오지 못했습니다"
              description={timeSlotError?.message}
              onRetry={refetchTimeSlots}
            />
          ) : !hasDayData ? (
            <p className="sales-chart__peak">
              <span>선택한 날짜의 매출 데이터가 없습니다.</span>
            </p>
          ) : (
            <>
              <div className="sales-chart__body">
                <div className="sales-chart__bars">
                  {hourlyBars.map((height, index) => (
                    <i
                      key={`${hourly[index].hour}-${hourly[index].minute}`}
                      className={index === peakIndex ? "is-peak" : ""}
                      style={{ height: `${height}px` }}
                    />
                  ))}
                </div>
                <div className="sales-chart__ticks">
                  {hourly
                    .filter((_, index) => index % 2 === 0 || index === hourly.length - 1)
                    .map((slot) => (
                      <span key={`${slot.hour}-${slot.minute}`}>
                        {String(slot.hour).padStart(2, "0")}:{String(slot.minute).padStart(2, "0")}
                      </span>
                    ))}
                </div>
              </div>
              <p className="sales-chart__peak">
                <b>{peakHour ? formatCurrency(peakHour.totalAmount) : "-"}</b>
                <span>
                  최고 매출 시간대{" "}
                  {peakHour
                    ? formatHourRange(
                        peakHour.hour,
                        peakHour.minute,
                        peakHour.hour + (intervalMinutes >= 60 ? 1 : 0),
                        peakHour.minute + (intervalMinutes >= 60 ? 0 : intervalMinutes),
                      )
                    : "-"}
                </span>
              </p>
            </>
          )}
        </section>

        <div className="sales-daily__right">
          <SalesShareCard title="결제수단별 매출" rows={toShareRows(breakdown.paymentShare)} />
          <SalesShareCard title="주문유형별 매출" rows={toShareRows(breakdown.orderShare)} />
        </div>
      </div>

      <section className="sales-table">
        <h2>메뉴별 매출 TOP 5</h2>
        <div className="sales-table__grid sales-table__grid--hourly">
          <div className="sales-table__head">
            <span>메뉴명</span>
            <span>판매 수</span>
            <span>매출</span>
            <span>비중</span>
          </div>
          {ranking.length === 0 ? (
            <p className="sales-table__empty">메뉴별 매출 데이터가 없습니다.</p>
          ) : (
            ranking.map((row) => (
              <div key={row.menuId ?? row.name} className="sales-table__row">
                <span>{row.name}</span>
                <span>{row.count ?? row.quantity ?? row.orderCount ?? 0}개</span>
                <span>{formatCurrency(row.amount ?? row.totalAmount ?? row.salesAmount)}</span>
                <span>{row.share != null ? `${row.share}%` : "-"}</span>
              </div>
            ))
          )}
        </div>
      </section>
    </section>
  );
}
