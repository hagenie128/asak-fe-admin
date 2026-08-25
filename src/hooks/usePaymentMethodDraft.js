// 결제수단 편집 Hook — WBS2-040
// 1차: 토글·정렬·저장 연결됨.
// 저장 실패(asak_mock_fail_save=1) 시 baselineRows 스냅샷으로 롤백.

import { useCallback, useEffect, useMemo, useState } from "react";
// TODO-014 [코드 연결 완료 · 수동 QA 대기]: 초기 목록은 paymentMethodsApi에서 읽고,
// save()는 변경 행 전체를 개별 PATCH로 저장한다. 실패하면 baselineRows로 롤백한다.
// API_BASE_PATH 정렬 후 중복 저장 방지, 새로고침 뒤 정렬·활성 상태·미리보기,
// 없는 id·유효하지 않은 요청과 일부 PATCH 실패를 실제 API에서 수동 QA한다.
import { paymentMethodsApi } from "../api/paymentMethodsApi.js";

function cloneRows(rows) {
  return structuredClone(rows ?? []);
}

function snapshot(rows) {
  return rows.map((row) => `${row.methodId}:${row.active}:${row.sortNo}`).join("|");
}

function reorder(rows, methodId, direction) {
  const index = rows.findIndex((row) => row.methodId === methodId);
  if (index < 0) return rows;

  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= rows.length) return rows;

  const next = [...rows];
  [next[index], next[target]] = [next[target], next[index]];
  return next.map((row, sortIndex) => ({ ...row, sortNo: sortIndex + 1 }));
}

export function usePaymentMethodDraft() {
  const [rows, setRows] = useState([]);
  const [baseline, setBaseline] = useState("");
  const [baselineRows, setBaselineRows] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [error, setError] = useState(null);
  const [tick, setTick] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);

  const refetch = useCallback(() => {
    setTick((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchPaymentMethods() {
      setStatus("loading");
      setError(null);
      try {
      const result = await paymentMethodsApi.listPaymentMethods();
      if (cancelled) return;
      if (result?.success === false) {
        throw new Error(result.message || "결제수단을 불러오지 못했습니다.");
      }
      const nextRows = [...(result ?? [])].sort((a, b) => a.sortNo - b.sortNo);
      setRows(nextRows);
      setBaselineRows(cloneRows(nextRows));
      setBaseline(snapshot(nextRows));
      setStatus("ready");
      } catch (err) {
        if (cancelled) return;
        setRows([]);
        setBaselineRows([]);
        setBaseline("");
        setError(err);
        setStatus("error");
      }
    }

    fetchPaymentMethods();

    return () => {
      cancelled = true;
    };
  }, [tick]);

  const isDirty = useMemo(() => snapshot(rows) !== baseline, [rows, baseline]);

  const activePreviewRows = useMemo(() => rows.filter((row) => row.active), [rows]);

  const toggleMethod = useCallback((methodId) => {
    setRows((prev) =>
      prev.map((row) => (row.methodId === methodId ? { ...row, active: !row.active } : row)),
    );
  }, []);

  const moveMethod = useCallback((methodId, direction) => {
    setRows((prev) => reorder(prev, methodId, direction));
  }, []);

  const save = useCallback(async () => {
    if (!isDirty || isUpdating) {
      return { success: true, message: "변경사항이 없습니다." };
    }

    const attempt = rows;
    setIsUpdating(true);
    try {
      const result = await Promise.all(
        attempt.map((row) => paymentMethodsApi.updatePaymentMethod(row.methodId, row)),
      );
      if (result.every((r) => r.success === true)) {
        setBaselineRows(cloneRows(attempt));
        setBaseline(snapshot(attempt));
      } else {
        // before(=attempt)는 현재 dirty 상태와 같음 → 마지막 성공 baseline으로 복원
        setRows(cloneRows(baselineRows));
      }
      return { success: true, message: "결제수단 설정을 저장했습니다." };
    } catch {
      setRows(cloneRows(baselineRows));
      return { success: false, message: "저장에 실패했습니다." };
    } finally {
      setIsUpdating(false);
    }
  }, [rows, isDirty, isUpdating, baselineRows]);

  return {
    status,
    error,
    rows,
    activePreviewRows,
    isDirty,
    isUpdating,
    canSave: isDirty && !isUpdating,
    toggleMethod,
    moveMethod,
    save,
    refetch,
  };
}
