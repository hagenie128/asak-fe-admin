// 학습용: 주문 시각·매출 날짜를 화면용 형식으로 바꿉니다.
// mock의 createdAt은 "2026-07-13T11:24:36" 같은 문자열이므로
// 반드시 new Date(...)로 변환한 뒤 포맷한다. (문자열에 toLocaleString 옵션을 쓰면 날짜 포맷이 안 먹음)

function toDate(value) {
  if (value == null || value === "") return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function toYmd(date = new Date()) {
  const d = toDate(date);
  if (!d) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayYmd() {
  return toYmd(new Date());
}

export function currentYearMonth() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

export function calendarYearBounds() {
  return { min: "2026-01-01", max: todayYmd() };
}

export function formatDate(value) {
  const d = toDate(value);
  if (!d) return "-";
  return d.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  // 예: 2026. 07. 13.
}

export function formatDateTime(value) {
  const d = toDate(value);
  if (!d) return "-";
  return d.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  // 예: 2026. 07. 13. 오전 11:24:36
}

export function formatTime(value) {
  const d = toDate(value);
  if (!d) return "-";
  return d.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
