/**
 * 매출 API. 공통 응답 envelope는 apiClient interceptor가 data만 해제한다.
 * Summary·Monthly·Daily·Time-slots는 salesApi와 useSalesQuery를 통해 실 API를 호출한다.
 */
import { apiClient } from "./apiClient.js";
import { API_ENDPOINTS } from "../constants/api.js";

export const salesApi = {
  // 기간 요약은 summary 객체로만 조회한다. QA: 실DB 집계와 period/date-range 오류 응답을 확인한다.
  getSummary({ period, startDate, endDate } = {}) {
    return apiClient.get(API_ENDPOINTS.salesSummary, {
      params: { period, startDate, endDate },
    });
  },

  // 월별 차트 데이터는 year 파라미터로 조회한다. QA: 허용 연도 경계와 0-fill 월을 확인한다.
  // month는 랭킹을 조회할 달이다. 서버는 그 한 달치 랭킹만 반환한다(미지정 시 최근 달).
  getMonthly({ year, month }) {
    return apiClient.get(API_ENDPOINTS.salesMonthly, { params: { year, month } });
  },

  // daily 객체와 time-slots 배열을 별도 메서드로 유지한다. QA: 30/60분, 빈 시간대, 잘못된 날짜를 확인한다.
  getDaily({ from, to } = {}) {
    return apiClient.get(API_ENDPOINTS.salesDaily, { params: { from, to } });
  },

  getDailyTimeSlots({ date, intervalMinutes }) {
    return apiClient.get(API_ENDPOINTS.salesDailyTimeSlots, {
      params: { date, intervalMinutes },
    });
  },

  // 모든 매출 메서드는 API_ENDPOINTS를 사용하며, 날짜 query·빈 데이터·서버 오류는 화면 훅에서 처리한다.
};
