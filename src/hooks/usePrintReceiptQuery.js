// Admin 주문 상세 영수증 출력 요청 + 상태 폴링 Hook
import { useEffect, useRef } from "react";
import { ordersApi } from "../api/ordersApi.js";
import { toast } from "../utils/toast.js";

const POLL_INTERVAL_MS = 1000;
const POLL_TIMEOUT_MS = 15000;

/**
 * printReceipt(order)를 부를 때마다 독립된 토스트 1개 + 폴링 루프 1개를 새로 시작한다.
 * 공유 상태(단일 status/eventId)를 두지 않은 이유: 여러 주문을 연달아 출력할 수 있어서,
 * 하나의 status만 있으면 두 번째 출력이 첫 번째 진행 상태를 덮어써버린다. 각 호출이 자기
 * 토스트를 들고 있으면 몇 건을 동시에 출력해도 화면에 각자 따로 쌓인다.
 */
export function usePrintReceiptQuery() {
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;
    return () => {
      cancelledRef.current = true;
    };
  }, []);

  async function printReceipt(order, { onCompleted } = {}) {
    const label = order?.orderNo ? `주문 ${order.orderNo}` : "영수증";
    const toastHandle = toast.loading(`${label} 출력 요청 중`, "잠시만 기다려주세요.");

    let eventId;
    try {
      const response = await ordersApi.printReceipt(order);
      if (cancelledRef.current) return;
      eventId = response?.eventId;
      toastHandle.update(`${label} 출력 중`, "loading", "RTOS 처리 결과를 기다리는 중입니다.");
    } catch (err) {
      if (cancelledRef.current) return;
      toastHandle.update(`${label} 출력 요청 실패`, "error", err.message);
      return;
    }

    // eventId를 못 받으면(PENDING/PROCESSING을 나타낼 방법이 없음) 여기서 중단한다.
    if (eventId == null) {
      toastHandle.update(`${label} 출력 요청 실패`, "error", "장치 이벤트 id를 받지 못했습니다.");
      return;
    }

    // 완료/실패가 나올 때까지 1초 간격으로 폴링한다. 15초 안에는 끝나야 한다.
    const startedAt = Date.now();
    for (;;) {
      if (Date.now() - startedAt >= POLL_TIMEOUT_MS) {
        toastHandle.update(
          `${label} 출력 시간 초과`,
          "error",
          "장치 응답이 없어 출력을 중단했습니다. 프린터 연결을 확인해 주세요.",
        );
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
      if (cancelledRef.current) return;

      let events;
      try {
        events = await ordersApi.listDeviceEvents();
      } catch {
        // 네트워크 순간 오류는 토스트를 유지한 채 다음 폴링에서 다시 시도한다.
        continue;
      }
      if (cancelledRef.current) return;

      const event = events?.find((e) => e.eventId === eventId);
      if (!event) continue;

      if (event.status === "COMPLETED") {
        toastHandle.update(`${label} 출력 완료`, "success", event.result);
        onCompleted?.();
        return;
      }
      if (event.status === "FAILED") {
        toastHandle.update(`${label} 출력 실패`, "error", event.result || "영수증 출력에 실패했습니다.");
        return;
      }
      // PENDING | PROCESSING -> 계속 대기
    }
  }

  return { printReceipt };
}
