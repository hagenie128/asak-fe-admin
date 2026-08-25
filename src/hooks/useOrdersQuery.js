// 주문 목록 조회 Hook (SCR-010 / WBS2-036)
import { useEffect, useState } from "react";
import { ADMIN_PAGINATION } from "../constants/pagination.js";
import { ordersApi } from "../api/ordersApi.js";

/**
 * @param {object} [options]
 * @param {number} [options.pageSize] — 기본: ADMIN_PAGINATION.orders.pageSize
 * @param {object} [options.filters]
 */
export function useOrdersQuery({ pageSize = ADMIN_PAGINATION.orders.pageSize, filters = {} } = {}) {
  // status: loading | success | empty | error
  // Empty = API 성공 + 0건 / Error = 요청 실패(throw). 둘을 섞지 않는다.
  // TODO-002 검증(2026-08-07): empty/error 분리·필터 쿼리 매핑·Error 재시도(onRetry→refetch) 확인.
  const [status, setStatus] = useState("loading");
  const [empty, setEmpty] = useState(false);
  const [error, setError] = useState(null);
  const [orderRows, setOrderRows] = useState([]);
  const [page, setPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [tick, setTick] = useState(0);

  const {
    orderStatus = "",
    paymentStatus = "",
    orderType = "",
    dateFrom = "",
    dateTo = "",
    keyword = "",
  } = filters;

  useEffect(() => {
    let cancelled = false;

    const fetchOrders = async () => {
      setStatus("loading");
      setEmpty(false);
      setError(null);

      try {
        // apiClient가 envelope을 풀어 PageResult({ content, totalElements, ... })만 반환
        const result = await ordersApi.orderList({
          page,
          size: pageSize,
          orderStatus,
          paymentStatus,
          orderType,
          dateFrom,
          dateTo,
          keyword,
        });

        if (cancelled) return;

        const orderList = Array.isArray(result?.content) ? result.content : [];
        const isEmpty = orderList.length === 0;

        setOrderRows(orderList);
        setEmpty(isEmpty);
        setTotalElements(Number(result?.totalElements) || 0);
        setStatus(isEmpty ? "empty" : "success");
        setError(null);
      } catch (err) {
        if (cancelled) return;

        // 실패는 empty가 아님 — OrderTable이 status==="error"로 별도 UI 표시
        setOrderRows([]);
        setEmpty(false);
        setTotalElements(0);
        setStatus("error");
        setError(err);
      }
    };

    fetchOrders();

    return () => {
      cancelled = true;
    };
  }, [page, pageSize, orderStatus, paymentStatus, orderType, dateFrom, dateTo, keyword, tick]);

  return {
    status,
    empty,
    error,
    orders: orderRows,
    totalElements,
    page,
    pageSize,
    onPageChange: (nextPage) => setPage(Math.max(0, nextPage)),
    refetch: () => setTick((n) => n + 1),
  };
}
