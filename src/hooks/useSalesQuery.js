// Page → mode / period 로 getter 고르기
// return { status, data, error, refetch } — data 는 envelope.data
// Summary·Monthly·Daily는 실 API를 사용한다.
// mode별 startDate/endDate·year·date query를 그대로 전달하고, 빠른 기간 변경 시 이전 응답이 화면을 덮지 않게 처리한다.

import { useCallback, useEffect, useState } from "react";
import {
  toDailySalesViewModel,
  toMonthlySalesViewModel,
  toSalesSummaryViewModel,
} from "../adapters/salesAdapter.js";
import { salesApi } from "../api/salesApi.js";

// mode별 API 결과를 adapter로 바꾸고 useEffect cleanup으로 오래된 응답의 state 반영을 막는다.
// QA: 기간을 빠르게 바꿀 때 loading/error/empty가 각 화면에서 올바르게 보이는지 브라우저에서 확인한다.
/**
 * @param {object} [options]
 * @param {"summary"|"monthly"|"daily"} [options.mode]
 * @param {"today"|"week"|"month"|null} [options.period] summary 전용
 * @param {string} [options.startDate] summary 직접 조회 시작일(ISO)
 * @param {string} [options.endDate] summary 직접 조회 종료일(ISO)
 * @param {number} [options.year] monthly 조회 연도
 * @param {number} [options.month] monthly 랭킹을 조회할 달(1~12). 없으면 서버가 최근 달을 쓴다.
 * @param {string} [options.from] daily 조회 시작일(ISO)
 * @param {string} [options.to] daily 조회 종료일(ISO)
 */
export function useSalesQuery({
  mode = "summary",
  period = "month",
  startDate,
  endDate,
  year,
  month,
  from,
  to,
} = {}) {
  const [status, setStatus] = useState("idle");
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [requestVersion, setRequestVersion] = useState(0);

  const refetch = useCallback(() => {
    setRequestVersion((version) => version + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    setError(null);
    // 기간 전환 때 화면을 통째로 비우지 않도록, 첫 로딩만 loading으로 둔다.
    setStatus((current) => (current === "success" ? "success" : "loading"));
    if (mode === "summary") {
      salesApi
        .getSummary({ period: period ?? undefined, startDate, endDate })
        .then((response) => {
          if (cancelled) return;
          setData(toSalesSummaryViewModel(response));
          setStatus("success");
        })
        .catch((requestError) => {
          if (cancelled) return;
          setError(requestError);
          setData(null);
          setStatus("error");
        });
      return () => {
        cancelled = true;
      };
    }

    const request =
      mode === "monthly"
        ? salesApi.getMonthly({ year, month })
        : mode === "daily"
          ? salesApi.getDaily({ from, to })
          : Promise.reject(new Error("Invalid mode"));
    const toViewModel = mode === "monthly" ? toMonthlySalesViewModel : toDailySalesViewModel;

    request
      .then((response) => {
        if (cancelled) return;
        setData(toViewModel(response));
        setStatus("success");
      })
      .catch((requestError) => {
        if (cancelled) return;
        setError(requestError);
        setData(null);
        setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [mode, period, startDate, endDate, year, month, from, to, requestVersion]);

  return {
    status,
    data,
    error,
    refetch,
  };
}
