/*
 * [미연결] Zustand 세션 후보. 이번 매장 번호 승인 범위에서는 사용하지 않는다.
 * 실행 중 세션 정본: auth/adminSession.js
 * TODO-032: JWT 세션을 도입하지 않고 auth/adminSession.js의 loggedIn 경계를 유지한다.
 * storage 변경은 이 store와 직접 섞지 않고 auth/adminSession.js를 단일 읽기·쓰기 경계로 유지한다.
 */

import { create } from "zustand";

/** 화면·라우트에서 사용 금지. */
export const useAdminSessionStore = create((set) => ({
  session: null,
  isAuthenticated: false,

  setSession: (session) => set({ session, isAuthenticated: Boolean(session) }),
  clearSession: () => set({ session: null, isAuthenticated: false }),
}));

/** @deprecated 문서 호환용 이름만. 사용 금지. */
export const adminSessionStore = {
  _hint: "useAdminSessionStore / auth/adminSession.js 를 보라. 연결 금지.",
};
