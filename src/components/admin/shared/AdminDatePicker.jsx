/*
 * 날짜/기간 선택 (매출·주문 필터)
 * mode: "single" | "range"
 * value: "YYYY-MM-DD" | { from, to }
 *
 * Figma: single 162:15939 구조 · range 3218:16401 배열·색
 */
import { useEffect, useMemo, useRef, useState } from "react";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const RANGE_PRESETS = [
  { id: "today", label: "오늘" },
  { id: "week", label: "이번 주" },
  { id: "month", label: "이번 달" },
  { id: "custom", label: "직접 선택" },
];

function toYmd(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseYmd(ymd) {
  if (!ymd) return null;
  const d = new Date(`${ymd}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function addMonths(date, delta) {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

function buildCells(viewMonth) {
  const first = startOfMonth(viewMonth);
  const startPad = first.getDay();
  const start = new Date(first);
  start.setDate(first.getDate() - startPad);
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

function isBefore(a, b) {
  return a < b;
}

function isAfter(a, b) {
  return a > b;
}

function formatDot(ymd) {
  if (!ymd) return "—";
  return ymd.replaceAll("-", ".");
}

function startOfWeek(date) {
  const d = new Date(date);
  const weekday = d.getDay();
  const daysSinceMonday = weekday === 0 ? 6 : weekday - 1;
  d.setDate(d.getDate() - daysSinceMonday);
  return d;
}

function endOfWeek(date) {
  const d = startOfWeek(date);
  d.setDate(d.getDate() + 6);
  return d;
}

function clampRange(from, to, min, max) {
  let nextFrom = from;
  let nextTo = to;
  if (min && isBefore(nextFrom, toYmd(min))) nextFrom = toYmd(min);
  if (max && isAfter(nextFrom, toYmd(max))) nextFrom = toYmd(max);
  if (min && isBefore(nextTo, toYmd(min))) nextTo = toYmd(min);
  if (max && isAfter(nextTo, toYmd(max))) nextTo = toYmd(max);
  if (isAfter(nextFrom, nextTo)) return { from: nextTo, to: nextFrom };
  return { from: nextFrom, to: nextTo };
}

/** min/max 안에 있는 기준일. 실제 오늘이 데이터 범위 밖이면 가장 가까운 허용일로 맞춘다. */
function resolveAnchorDate(min, max) {
  const today = new Date();
  const todayYmd = toYmd(today);
  if (max && isAfter(todayYmd, toYmd(max))) return new Date(max.getTime());
  if (min && isBefore(todayYmd, toYmd(min))) return new Date(min.getTime());
  return today;
}

function detectRangePreset(from, to, min, max) {
  if (!from || !to) return "custom";
  const anchor = resolveAnchorDate(min, max);
  const todayYmd = toYmd(anchor);
  const week = clampRange(toYmd(startOfWeek(anchor)), toYmd(endOfWeek(anchor)), min, max);
  const month = clampRange(toYmd(startOfMonth(anchor)), toYmd(endOfMonth(anchor)), min, max);
  if (from === todayYmd && to === todayYmd) return "today";
  if (from === week.from && to === week.to) return "week";
  if (from === month.from && to === month.to) return "month";
  return "custom";
}

export default function AdminDatePicker({
  mode = "single",
  value = null,
  onChange,
  onClose,
  minDate,
  maxDate,
  open = false,
  children,
  className = "",
  /** range 모드에서 보이는 달 수. 주문 목록만 1, 나머지는 기본 2. */
  monthsVisible = 2,
  /** 데이터가 있는 YYYY-MM-DD 목록. 없으면 해당 날짜 글자를 옅게 표시한다. */
  availableDates = null,
  /** true면 availableDates 밖 날짜는 선택 불가 */
  onlyAvailableSelectable = false,
  /** 데이터가 있는 YYYY-MM 목록(월 선택용). */
  availableMonths = null,
}) {
  const rootRef = useRef(null);
  const initial =
    mode === "range"
      ? parseYmd(value?.from) || parseYmd(value?.to) || new Date()
      : parseYmd(value) || new Date();

  const [viewMonth, setViewMonth] = useState(() => startOfMonth(initial));
  const [draftSingle, setDraftSingle] = useState(mode === "single" ? value : null);
  const [draftFrom, setDraftFrom] = useState(mode === "range" ? value?.from ?? null : null);
  const [draftTo, setDraftTo] = useState(mode === "range" ? value?.to ?? null : null);
  const [activePreset, setActivePreset] = useState("custom");

  const availableDateSet = useMemo(() => {
    if (!availableDates?.length) return null;
    return new Set(availableDates);
  }, [availableDates]);

  const availableMonthSet = useMemo(() => {
    if (!availableMonths?.length) return null;
    return new Set(availableMonths);
  }, [availableMonths]);

  useEffect(() => {
    if (!open) return;
    const boundMin = parseYmd(minDate);
    const boundMax = parseYmd(maxDate);
    if (mode === "single") {
      const next = value || toYmd(resolveAnchorDate(boundMin, boundMax));
      setDraftSingle(next);
      const d = parseYmd(next) || new Date();
      setViewMonth(startOfMonth(d));
    } else {
      const anchor = resolveAnchorDate(boundMin, boundMax);
      const today = toYmd(anchor);
      const nextFrom = value?.from || today;
      const nextTo = value?.to || value?.from || today;
      setDraftFrom(nextFrom);
      setDraftTo(nextTo);
      setActivePreset(detectRangePreset(nextFrom, nextTo, boundMin, boundMax));
      const d = parseYmd(nextFrom) || anchor;
      setViewMonth(startOfMonth(d));
    }
  }, [open, mode, value, minDate, maxDate]);

  useEffect(() => {
    if (!open) return undefined;
    function handlePointer(event) {
      if (!rootRef.current?.contains(event.target)) {
        onClose?.();
      }
    }
    function handleKey(event) {
      if (event.key === "Escape") onClose?.();
    }
    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open, onClose]);

  const min = parseYmd(minDate);
  const max = parseYmd(maxDate);
  const todayYmd = toYmd(new Date());
  const dualMonths = mode === "range" && monthsVisible >= 2;
  const rightMonth = addMonths(viewMonth, 1);
  const months = dualMonths ? [viewMonth, rightMonth] : [viewMonth];

  function isDisabled(date) {
    const ymd = toYmd(date);
    if (min && isBefore(ymd, toYmd(min))) return true;
    if (max && isAfter(ymd, toYmd(max))) return true;
    if (onlyAvailableSelectable && availableDateSet && !availableDateSet.has(ymd)) return true;
    return false;
  }

  function handleDayClick(date) {
    if (isDisabled(date)) return;
    const ymd = toYmd(date);
    if (mode === "single") {
      setDraftSingle(ymd);
      return;
    }
    setActivePreset("custom");
    if (!draftFrom || (draftFrom && draftTo)) {
      setDraftFrom(ymd);
      setDraftTo(null);
      return;
    }
    if (isBefore(ymd, draftFrom)) {
      setDraftTo(draftFrom);
      setDraftFrom(ymd);
      return;
    }
    setDraftTo(ymd);
  }

  function handlePreset(presetId) {
    setActivePreset(presetId);
    if (presetId === "custom") return;

    const anchor = resolveAnchorDate(min, max);
    let from;
    let to;
    if (presetId === "today") {
      from = anchor;
      to = anchor;
    } else if (presetId === "week") {
      from = startOfWeek(anchor);
      to = endOfWeek(anchor);
    } else {
      from = startOfMonth(anchor);
      to = endOfMonth(anchor);
    }

    const next = clampRange(toYmd(from), toYmd(to), min, max);
    setDraftFrom(next.from);
    setDraftTo(next.to);
    setViewMonth(startOfMonth(parseYmd(next.from) || anchor));
  }

  function handleApply() {
    if (mode === "single") {
      if (!draftSingle) return;
      onChange?.(draftSingle);
      onClose?.();
      return;
    }
    if (!draftFrom) return;
    const next = { from: draftFrom, to: draftTo || draftFrom };
    onChange?.(next);
    onClose?.();
  }

  function hasDayData(date) {
    const ymd = toYmd(date);
    if (availableDateSet) return availableDateSet.has(ymd);
    if (availableMonthSet) {
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      return availableMonthSet.has(key);
    }
    return true;
  }

  function dayClass(date, monthDate) {
    const ymd = toYmd(date);
    const weekday = date.getDay();
    const classes = [];
    if (date.getMonth() !== monthDate.getMonth()) classes.push("is-outside");
    if (ymd === todayYmd) classes.push("is-today");
    if (weekday === 0) classes.push("is-sun");
    if (weekday === 6) classes.push("is-sat");
    if (!hasDayData(date)) classes.push("is-no-data");
    if (mode === "single" && ymd === draftSingle) classes.push("is-selected");
    if (mode === "range" && draftFrom) {
      const rangeEnd = draftTo;
      const isStart = ymd === draftFrom;
      const isEnd = rangeEnd != null && ymd === rangeEnd;
      const isSingleEdge = isStart && (!rangeEnd || rangeEnd === draftFrom);

      if (isStart || isEnd) classes.push("is-range-edge");
      if (isStart) classes.push("is-range-start");
      if (isEnd) classes.push("is-range-end");
      if (isSingleEdge) classes.push("is-range-single");

      if (rangeEnd && !isBefore(ymd, draftFrom) && !isAfter(ymd, rangeEnd)) {
        classes.push("is-in-range");
      }
    }
    return classes.join(" ");
  }

  const hint =
    mode === "single"
      ? formatDot(draftSingle)
      : `${formatDot(draftFrom)} ~ ${formatDot(draftTo || draftFrom)}`;

  function renderMonth(monthDate, key, { showPrev = true, showNext = true } = {}) {
    return (
      <div className="admin-date-picker__month" key={key}>
        <div className="admin-date-picker__nav">
          {showPrev ? (
            <button type="button" aria-label="이전 달" onClick={() => setViewMonth((m) => addMonths(m, -1))}>
              ‹
            </button>
          ) : (
            <span className="admin-date-picker__nav-spacer" aria-hidden="true" />
          )}
          <strong>
            {monthDate.getFullYear()}년 {monthDate.getMonth() + 1}월
          </strong>
          {showNext ? (
            <button type="button" aria-label="다음 달" onClick={() => setViewMonth((m) => addMonths(m, 1))}>
              ›
            </button>
          ) : (
            <span className="admin-date-picker__nav-spacer" aria-hidden="true" />
          )}
        </div>
        <div className="admin-date-picker__weekdays">
          {WEEKDAYS.map((label, index) => (
            <span
              key={label}
              className={index === 0 ? "is-sun" : index === 6 ? "is-sat" : undefined}
            >
              {label}
            </span>
          ))}
        </div>
        <div className="admin-date-picker__grid">
          {buildCells(monthDate).map((date) => {
            const ymd = toYmd(date);
            return (
              <button
                key={`${key}-${ymd}-${date.getMonth()}`}
                type="button"
                disabled={isDisabled(date)}
                className={dayClass(date, monthDate)}
                onClick={() => handleDayClick(date)}
              >
                <span className="admin-date-picker__day-label">{date.getDate()}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const panelModeClass = mode === "range"
    ? dualMonths
      ? "is-range"
      : "is-range is-range-single-month"
    : "is-single";

  return (
    <div className={`admin-date-picker ${className}`.trim()} ref={rootRef}>
      {children}
      {open ? (
        <div
          className={`admin-date-picker__panel ${panelModeClass}`}
          role="dialog"
          aria-label="날짜 선택"
        >
          {mode === "range" ? (
            <div className="admin-date-picker__presets" role="tablist" aria-label="기간 빠른 선택">
              {RANGE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  role="tab"
                  aria-selected={activePreset === preset.id}
                  className={activePreset === preset.id ? "is-active" : undefined}
                  onClick={() => handlePreset(preset.id)}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          ) : null}

          <div className={`admin-date-picker__months${dualMonths ? " is-dual" : ""}`}>
            {months.map((monthDate, index) =>
              renderMonth(monthDate, index === 0 ? "left" : "right", {
                showPrev: !dualMonths || index === 0,
                showNext: !dualMonths || index === months.length - 1,
              }),
            )}
          </div>

          <div className="admin-date-picker__footer">
            <p>{hint}</p>
            <button type="button" className="is-primary" onClick={handleApply}>
              적용
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
