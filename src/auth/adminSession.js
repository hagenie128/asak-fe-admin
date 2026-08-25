/**
 * 관리자 세션 (임시 mock).
 * 실인증 API가 붙기 전까지 web storage만 사용한다.
 * remember=true → localStorage / false → sessionStorage (탭 종료 시 로그아웃)
 */
const STORAGE_KEY = "asak-admin-session-v2";

function readSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function isAdminLoggedIn() {
  // TODO-032 [코드 연결 완료 · 로그인 실응답 검증 대기]: LoginPage가 approved === true일 때만
  // loggedIn 플래그를 저장한다. 이번 범위는 JWT를 사용하지 않으므로 token·만료·파싱 로직은 추가하지 않는다.
  return Boolean(readSession()?.loggedIn);
}

export function loginAdmin({ remember = false } = {}) {
  // TODO-032: 승인 결과만 저장한다. remember=true는 localStorage, false는 sessionStorage를 사용하며
  // 매장 번호와 민감 응답은 저장하지 않는다. 호출부의 approved 검사 없이 이 함수를 직접 호출하지 않는다.
  logoutAdmin();
  const payload = {
    loggedIn: true,
    // loggedInAt: new Date().toISOString(),
    remember: Boolean(remember),
  };
  const store = remember ? localStorage : sessionStorage;
  store.setItem(STORAGE_KEY, JSON.stringify(payload));
  return payload;
}

export function logoutAdmin() {
  localStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(STORAGE_KEY);
  // 이전 키(v1) 잔여 세션 제거
  localStorage.removeItem("asak-admin-session");
  sessionStorage.removeItem("asak-admin-session");
}
