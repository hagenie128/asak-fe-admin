import { useCallback, useEffect, useState } from "react";
import { toDashboardViewModel } from "../adapters/dashboardAdapter.js";
import { adminApi } from "../api/adminApi.js";

// 최초 loading, 재조회 refreshing, error와 refetch를 제공한다.
// 남은 결정: SCR-022의 widget별 partial error를 단일 dashboard 응답에서 어떻게 표시할지 확정한다.
export function useDashboard() {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);
  const [requestVersion, setRequestVersion] = useState(0);

  const refetch = useCallback(() => {
    setRequestVersion((version) => version + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    setError(null);
    setStatus((current) => (current === "success" || current === "refreshing" ? "refreshing" : "loading"));

    adminApi
      .getDashboard()
      .then((response) => {
        if (cancelled) return;
        setData(toDashboardViewModel(response));
        setStatus("success");
      })
      .catch((requestError) => {
        if (cancelled) return;
        setError(requestError);
        setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [requestVersion]);

  return { data, status, error, refetch };
}
