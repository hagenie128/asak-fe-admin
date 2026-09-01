// 매출 화면 공통 표시 헬퍼 (Page에서만 사용)
import { todayYmd as todayYmdFromDate } from "./date.js";

export { todayYmd } from "./date.js";

const WEEKDAY_LABEL = ["일", "월", "화", "수", "목", "금", "토"];

/** "2026-07-10" → Date */
export function parseYmd(ymd) {
  if (!ymd) return null;
  const d = new Date(`${ymd}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Date → "YYYY-MM-DD" */
export function toYmd(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** "YYYY-MM-DD" ± days → "YYYY-MM-DD" */
export function shiftYmd(ymd, days) {
  const date = parseYmd(ymd);
  if (!date) return null;
  date.setDate(date.getDate() + Number(days || 0));
  return toYmd(date);
}

/** "2026-07-10" → "07.10" */
export function formatMd(ymd) {
  const d = parseYmd(ymd);
  if (!d) return "-";
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${mm}.${dd}`;
}

/** "2026-07-10" → "2026.07.10 (금)" */
export function formatYmdWeekday(ymd) {
  const d = parseYmd(ymd);
  if (!d) return "-";
  const y = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}.${mm}.${dd} (${WEEKDAY_LABEL[d.getDay()]})`;
}

/**
 * 일별 내비 라벨
 * - 기준과 같은 해·같은 달 → "10일 (금)"
 * - 같은 해·다른 달 → "07.10 (금)"
 * - 다른 해 → "2026.07.10 (금)"
 * @param {string} ymd 선택일
 * @param {string} [baseYmd] 기준일 (보통 data.from / 첫 row)
 */
export function formatDailyNavLabel(ymd, baseYmd) {
  const d = parseYmd(ymd);
  if (!d) return "-";
  const base = parseYmd(baseYmd) || d;
  const wd = WEEKDAY_LABEL[d.getDay()];
  const sameYear = d.getFullYear() === base.getFullYear();
  const sameMonth = sameYear && d.getMonth() === base.getMonth();
  if (sameMonth) return `${d.getDate()}일 (${wd})`;
  if (sameYear) {
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${mm}.${dd} (${wd})`;
  }
  return formatYmdWeekday(ymd);
}

/**
 * 월별 내비 라벨
 * - 기준과 같은 해 → "7월"
 * - 다른 해 → "2026년 7월"
 */
export function formatMonthlyNavLabel(year, month, baseYear) {
  const y = Number(year);
  const m = Number(month);
  if (y === Number(baseYear)) return `${m}월`;
  return `${y}년 ${m}월`;
}

/** "2026-07-10" → "금" */
export function weekdayLabel(ymd) {
  const d = parseYmd(ymd);
  if (!d) return "-";
  return WEEKDAY_LABEL[d.getDay()];
}

/** year=2026, month=7 → "2026-07" */
export function toYearMonthKey(year, month) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

/** rows에서 해당 월만 */
export function filterRowsByYearMonth(rows, year, month) {
  const key = toYearMonthKey(year, month);
  return (rows ?? []).filter((row) => String(row.date).startsWith(key));
}

export function tomorrowYmd() {
  return shiftYmd(todayYmdFromDate(), 1);
}

export function startOfMonthYmd(year, month) {
  return `${year}-${String(month).padStart(2, "0")}-01`;
}

export function endOfMonthYmd(year, month) {
  const last = new Date(year, month, 0).getDate();
  return `${year}-${String(month).padStart(2, "0")}-${String(last).padStart(2, "0")}`;
}

export function startOfWeekYmd(ymd) {
  const date = parseYmd(ymd);
  if (!date) return ymd;
  date.setDate(date.getDate() - date.getDay());
  return toYmd(date);
}

export function eachYmd(from, to) {
  const days = [];
  let current = from;
  while (current && to && current <= to) {
    days.push(current);
    current = shiftYmd(current, 1);
  }
  return days;
}

function hashSeed(value) {
  let hash = 2166136261;
  for (const char of String(value)) {
    hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  }
  return hash >>> 0;
}

/** 빈 날짜용 샐러드 키오스크 규모 더미. 같은 날짜는 새로고침해도 같은 값이다. */
export function makeDummyDay(ymd) {
  const date = parseYmd(ymd);
  const weekend = date && (date.getDay() === 0 || date.getDay() === 6);
  const seed = hashSeed(`asak-day-${ymd}`);
  const orderCount = Math.max(8, (weekend ? 26 : 16) + (seed % 9) - 4);
  const avgAmount = 15000 + (seed % 8) * 500;
  const totalAmount = orderCount * avgAmount;
  return {
    date: ymd,
    orderCount,
    totalAmount,
    avgAmount,
    isDummy: true,
    isFuture: false,
  };
}

export function fillDailyRows(rows, from, to, { dummyThrough, today } = {}) {
  const dayToday = today ?? todayYmdFromDate();
  const lastDummy = dummyThrough ?? tomorrowYmd();
  const byDate = new Map((rows ?? []).map((row) => [row.date, row]));

  return eachYmd(from, to).map((date) => {
    if (date > dayToday) {
      return {
        date,
        orderCount: 0,
        totalAmount: 0,
        avgAmount: 0,
        isDummy: false,
        isFuture: true,
      };
    }

    const existing = byDate.get(date);
    if (existing) {
      const orderCount = Number(existing.orderCount) || 0;
      const totalAmount = Number(existing.totalAmount) || 0;
      return {
        date,
        orderCount,
        totalAmount,
        avgAmount:
          Number(existing.avgAmount) || (orderCount ? Math.round(totalAmount / orderCount) : 0),
        isDummy: false,
        isFuture: false,
      };
    }

    if (date <= lastDummy) return makeDummyDay(date);

    return { date, orderCount: 0, totalAmount: 0, avgAmount: 0, isDummy: false, isFuture: false };
  });
}

export function sliceRowsByPeriod(rows, period, { today, customRange } = {}) {
  const day = today ?? todayYmdFromDate();
  if (customRange?.from) {
    const to = customRange.to || customRange.from;
    return (rows ?? []).filter((row) => row.date >= customRange.from && row.date <= to);
  }
  if (period === "today") return (rows ?? []).filter((row) => row.date === day);
  if (period === "week") {
    const from = startOfWeekYmd(day);
    const weekEnd = shiftYmd(from, 6);
    return (rows ?? []).filter((row) => row.date >= from && row.date <= weekEnd);
  }
  if (period === "month") {
    const year = Number(day.slice(0, 4));
    const month = Number(day.slice(5, 7));
    const from = startOfMonthYmd(year, month);
    const to = endOfMonthYmd(year, month);
    return (rows ?? []).filter((row) => row.date >= from && row.date <= to);
  }
  return rows ?? [];
}

export function kpisFromRows(rows) {
  const orderCount = (rows ?? []).reduce((sum, row) => sum + (Number(row.orderCount) || 0), 0);
  const totalAmount = (rows ?? []).reduce((sum, row) => sum + (Number(row.totalAmount) || 0), 0);
  const avgAmount = orderCount ? Math.round(totalAmount / orderCount) : 0;
  return { orderCount, totalAmount, avgAmount };
}

const LUNCH_DINNER_WEIGHTS = [4, 8, 18, 16, 10, 6, 5, 8, 12, 8, 4, 1];

export function fillHourlySlots(slots, { intervalMinutes = 60, dummyDay = null } = {}) {
  const byKey = new Map();
  (slots ?? []).forEach((slot) => {
    const hour = slot.salesHour ?? slot.hour;
    const minute = slot.salesMinute ?? slot.minute ?? 0;
    byKey.set(`${hour}:${minute}`, slot);
  });

  const dummyByHour = new Map();
  if (dummyDay && dummyDay.orderCount > 0) {
    const weightSum = LUNCH_DINNER_WEIGHTS.reduce((sum, value) => sum + value, 0);
    LUNCH_DINNER_WEIGHTS.forEach((weight, index) => {
      const hour = 10 + index;
      const orderCount = Math.max(0, Math.round((dummyDay.orderCount * weight) / weightSum));
      dummyByHour.set(hour, {
        hour,
        minute: 0,
        orderCount,
        totalAmount: orderCount * dummyDay.avgAmount,
        avgAmount: orderCount ? dummyDay.avgAmount : 0,
      });
    });
  }

  const filled = [];
  for (let hour = 10; hour < 22; hour += 1) {
    for (let minute = 0; minute < 60; minute += intervalMinutes) {
      const existing = byKey.get(`${hour}:${minute}`);
      if (existing) {
        filled.push(existing);
        continue;
      }
      if (intervalMinutes === 60 && dummyByHour.has(hour)) {
        filled.push(dummyByHour.get(hour));
        continue;
      }
      filled.push({ hour, minute, orderCount: 0, totalAmount: 0, avgAmount: 0 });
    }
  }
  return filled;
}

export function toShareRows(shares = []) {
  const list = Array.isArray(shares) ? shares : [];
  if (!list.length) return [];

  const normalized = list.map((entry) => {
    if (Array.isArray(entry)) {
      const percent = Number(String(entry[1]).replace("%", "")) || 0;
      return { label: entry[0], percent };
    }
    return {
      label: entry.label ?? entry.name ?? "-",
      percent: Number(entry.percent ?? entry.share ?? 0),
    };
  });

  const max = Math.max(...normalized.map((row) => row.percent), 1);
  return normalized.map((row, index) => [
    row.label,
    `${row.percent}%`,
    `${Math.round((row.percent / max) * 100)}%`,
    index === 0,
  ]);
}

/** 차트 막대 높이(px) — 값 비율로 스케일. 0은 빈 칸으로 둔다. */
export function toBarHeights(values, maxPx = 70) {
  const list = values ?? [];
  const max = Math.max(...list.map(Number), 1);
  return list.map((value) => {
    const amount = Number(value) || 0;
    if (amount <= 0) return 0;
    return Math.max(4, Math.round((amount / max) * maxPx));
  });
}

export function findMaxIndex(values) {
  const list = values ?? [];
  if (!list.length) return -1;
  let maxAt = 0;
  list.forEach((v, i) => {
    if (Number(v) > Number(list[maxAt])) maxAt = i;
  });
  return maxAt;
}

/** 전일 대비 % (소수 1자리). prev가 0이면 null */
export function calcDeltaPercent(current, prev) {
  if (prev == null || prev === 0) return null;
  return Math.round(((current - prev) / prev) * 1000) / 10;
}
