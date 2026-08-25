// 품절 화면(SCR-011) draft Hook — WBS2-038
//
// [드래프트란?]
//   GET 카탈로그에서 읽은 목록을 화면에서 고치는 "임시 사본".
//   → / ← 로 옮겨도 저장 버튼 전까지 서버 baseline은 바뀌지 않는다.
//
// [이 훅이 들고 있는 것]
//   available, soldOut  → 드래프트 (왼쪽/오른쪽 패널에 보이는 목록)
//   selectedAvailable   → 왼쪽에서 체크한 "이번에 옮길" 항목
//   selectedSoldOut     → 오른쪽에서 체크한 "이번에 되돌릴" 항목
//   dirtyCount          → 저장 전에 바뀐 건수 (처음 불러온 때와 비교)

import { useCallback, useEffect, useMemo, useState } from "react";
import { soldOutApi } from "../api/soldOutApi.js";

// 서버 카탈로그를 baseline으로 두고 변경분만 PATCH하며 실패 시 baseline으로 복원한다.
// QA: loading/empty/error/dirty/saveConfirm, 빠른 재시도, 화면 이탈 후 재진입을 브라우저에서 확인한다.
/** DB 카탈로그 행의 고유 키 — targetType + targetId */
export function soldOutRowKey(item) {
  return `${item.targetType}-${item.targetId}`;
}

function cloneRows(rows) {
  return structuredClone(rows ?? []);
}

function countDirty(savedSoldOutKeys, currentSoldOutRows) {
  const current = new Set(currentSoldOutRows.map(soldOutRowKey));
  let count = 0;
  for (const key of current) {
    if (!savedSoldOutKeys.has(key)) count += 1;
  }
  for (const key of savedSoldOutKeys) {
    if (!current.has(key)) count += 1;
  }
  return count;
}

function toChanges(baselineRows, currentRows) {
  const baseline = new Set(baselineRows.map(soldOutRowKey));
  const current = new Set(currentRows.map(soldOutRowKey));
  const byKey = new Map([...baselineRows, ...currentRows].map((row) => [soldOutRowKey(row), row]));
  return [...new Set([...baseline, ...current])]
    .filter((key) => baseline.has(key) !== current.has(key))
    .map((key) => {
      const row = byKey.get(key);
      return { targetType: row.targetType, targetId: row.targetId, isSoldOut: current.has(key) };
    });
}

export function useSoldOutDraft() {
  // ① "저장된 장부" 기준 — 키 + 전체 목록 스냅샷(저장 실패 롤백용)
  const [baselineSoldOutKeys, setBaselineSoldOutKeys] = useState([]);
  const [baselineAvailable, setBaselineAvailable] = useState([]);
  const [baselineSoldOut, setBaselineSoldOut] = useState([]);

  // ② 드래프트 = 화면에 보이는 두 목록 (useState)
  const [available, setAvailable] = useState([]);
  const [soldOut, setSoldOut] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [error, setError] = useState(null);
  const [tick, setTick] = useState(0);

  // ③ 체크박스 = 드래프트와 별개. "지금 고른 것"만 잠깐 기억
  const [selectedAvailable, setSelectedAvailable] = useState(() => new Set());
  const [selectedSoldOut, setSelectedSoldOut] = useState(() => new Set());

  const [isSaving, setIsSaving] = useState(false);

  const refetch = useCallback(() => {
    setTick((prev) => prev + 1);
  }, []);

  // 서버 카탈로그 → 드래프트로 복사 (tick으로 재시도)
  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setError(null);
    soldOutApi
      .listSoldOutCatalog()
      .then((catalog) => {
        if (cancelled) return;
        const nextAvailable = catalog?.available ?? [];
        const nextSoldOut = catalog?.soldOut ?? [];
        setAvailable(nextAvailable);
        setSoldOut(nextSoldOut);
        setBaselineAvailable(cloneRows(nextAvailable));
        setBaselineSoldOut(cloneRows(nextSoldOut));
        setBaselineSoldOutKeys(nextSoldOut.map(soldOutRowKey));
        setSelectedAvailable(new Set());
        setSelectedSoldOut(new Set());
        setStatus("ready");
      })
      .catch((err) => {
        if (cancelled) return;
        setAvailable([]);
        setSoldOut([]);
        setError(err);
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [tick]);

  // 저장 안 한 변경 건수 (현재 품절 목록 vs 마지막 저장 기준)
  const dirtyCount = useMemo(
    () => countDirty(new Set(baselineSoldOutKeys), soldOut),
    [soldOut, baselineSoldOutKeys],
  );

  const toggleAvailableSelect = useCallback((key) => {
    setSelectedAvailable((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const toggleSoldOutSelect = useCallback((key) => {
    setSelectedSoldOut((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  /** 오른쪽 패널 — 현재 페이지 항목 전체 선택 */
  const selectSoldOutPage = useCallback((rows) => {
    setSelectedSoldOut((prev) => {
      const next = new Set(prev);
      for (const row of rows) {
        next.add(soldOutRowKey(row));
      }
      return next;
    });
  }, []);

  /** 오른쪽 패널 — 체크 전부 해제 */
  const clearSoldOutSelection = useCallback(() => {
    setSelectedSoldOut(new Set());
  }, []);

  // → : 왼쪽에서 체크한 것만 품절 목록으로 (드래프트 안에서만 이동)
  const moveToSoldOut = useCallback(() => {
    if (selectedAvailable.size === 0) return;

    const moving = [];
    const staying = [];
    for (const row of available) {
      if (selectedAvailable.has(soldOutRowKey(row))) {
        moving.push({ ...row, isSoldOut: true });
      } else {
        staying.push(row);
      }
    }

    setAvailable(staying);
    setSoldOut((prev) => [...prev, ...moving]);
    setSelectedAvailable(new Set());
  }, [available, selectedAvailable]);

  // ← : 오른쪽에서 체크한 것만 판매 목록으로
  const moveToAvailable = useCallback(() => {
    if (selectedSoldOut.size === 0) return;

    const moving = [];
    const staying = [];
    for (const row of soldOut) {
      if (selectedSoldOut.has(soldOutRowKey(row))) {
        moving.push({ ...row, isSoldOut: false });
      } else {
        staying.push(row);
      }
    }

    setSoldOut(staying);
    setAvailable((prev) => [...prev, ...moving]);
    setSelectedSoldOut(new Set());
  }, [soldOut, selectedSoldOut]);

  // 저장: 드래프트의 품절 상태만 PATCH로 전송한다.
  const save = useCallback(async () => {
    if (dirtyCount === 0) {
      return { success: true, message: "변경사항이 없습니다." };
    }

    setIsSaving(true);
    try {
      const catalog = await soldOutApi.patchSoldOut(toChanges(baselineSoldOut, soldOut));
      const nextAvailable = catalog?.available ?? [];
      const nextSoldOut = catalog?.soldOut ?? [];
      setAvailable(nextAvailable);
      setSoldOut(nextSoldOut);
      setBaselineAvailable(cloneRows(nextAvailable));
      setBaselineSoldOut(cloneRows(nextSoldOut));
      setBaselineSoldOutKeys(nextSoldOut.map(soldOutRowKey));
      setSelectedAvailable(new Set());
      setSelectedSoldOut(new Set());
      return { success: true, message: "저장되었습니다." };
    } catch (error) {
      setAvailable(cloneRows(baselineAvailable));
      setSoldOut(cloneRows(baselineSoldOut));
      setSelectedAvailable(new Set());
      setSelectedSoldOut(new Set());
      return { success: false, message: error.message };
    } finally {
      setIsSaving(false);
    }
  }, [soldOut, dirtyCount, baselineAvailable, baselineSoldOut]);

  return {
    status,
    error,
    available,
    soldOut,
    dirtyCount,
    isSaving,
    selectedAvailable,
    selectedSoldOut,
    toggleAvailableSelect,
    toggleSoldOutSelect,
    selectSoldOutPage,
    clearSoldOutSelection,
    moveToSoldOut,
    moveToAvailable,
    save,
    refetch,
    canMoveToSoldOut: selectedAvailable.size > 0,
    canMoveToAvailable: selectedSoldOut.size > 0,
    canSave: dirtyCount > 0 && !isSaving,
  };
}
