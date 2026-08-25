import axios from "axios";

/*
 * API 공통 클라이언트
 * 서버 응답 envelope({ success, status, code, message, data })는
 * 이 파일에서 한 번만 해제한다.
 */

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "",
  headers: {
    Accept: "application/json",
  },
});

// TODO-033: TODO-031 로그인 응답의 access token을 단일 세션 읽기 함수로 가져와
// Authorization: Bearer <token>을 붙인다. 로그인·토큰 없는 공개 요청에는 빈 헤더를 보내지 않는다.

// TODO-033: 401은 토큰 삭제 후 로그인 화면으로 이동하되, 호출 컴포넌트가 중복 toast를 만들지 않게
// 공통 처리 범위를 먼저 정한다.
// TODO-037: 403·409·검증 실패는 ApiResponse의 code/message를 보존해 화면별 안내와 매핑한다.
// interceptor가 성공 응답을 body.data로 unwrap하므로 호출부에서 response.data를 다시 접근하지 않는다.

// 서버 공통 응답 envelope 해제
export function unwrapResponse(response) {
  const body = response.data;

  if (!body?.success) {
    const error = new Error(body?.message ?? "API request failed");
    error.code = body?.code;
    error.status = body?.status ?? response.status;
    throw error;
  }

  return body.data;
}

// 성공 응답은 각 화면에 body.data만 전달
apiClient.interceptors.response.use(
  (response) => unwrapResponse(response),
  (error) => {
    const body = error?.response?.data;
    if (body?.message) {
      const normalized = new Error(body.message);
      normalized.code = body.code;
      normalized.status = body.status ?? error.response?.status;
      return Promise.reject(normalized);
    }
    return Promise.reject(error);
  },
);
