/*
 * SCR-015 / Login / Default (Figma node 134:12033)
 * 인증 API 없음 → adminSession(localStorage) mock만.
 *
 * mock 시나리오(JSON meta/scenarios.login 참고): admin | kitchen | viewer | invalid
 * 세션: loginAdmin() / logoutAdmin() — src/auth/adminSession.js
 * 성공 시 navigate "/" (주문 현황)
 * Props: onLoggedIn? (선택 콜백)
 */
import { useState } from "react";
import loginLogo from "../../assets/svg/logo-F.svg";
import loginBg from "../../assets/figma/login-bg.png";
import { loginAdmin } from "../../auth/adminSession.js";
import { requestAppFullscreen } from "../../utils/fullscreen.js";
import { toast } from "../../utils/toast.js";
import { adminApi } from "../../api/adminApi.js";

export default function LoginPage({ onLoggedIn } = {}) {
  const [remember, setRemember] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      // 태블릿 Chrome: 로그인 터치 = 사용자 제스처 → 주소창 숨김 전체화면
      if (window.innerHeight < 768) {
        //가로모드인 경우
        await requestAppFullscreen();
      }
      // TODO-034 [코드 연결 완료 · 실 API 검증 대기]: storeNumber → adminApi.login → approved 검사 → loginAdmin 순서다.
      // API_BASE_PATH 정렬 후 중복 요청, 잘못된 매장 번호·빈 입력·네트워크 오류를 실제 응답으로 구분해 수동 QA한다.
      const storeNumber = event.target.storeNumber.value;
      const result = await adminApi.login(storeNumber);
      if (result.approved === true) {
        loginAdmin({ remember });
        onLoggedIn?.();
      }
    } catch (e) {
      console.error(e);
      toast.error(e.message || "로그인에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  }
  return (
    <main className="admin-login-page">
      <img className="admin-login-page__photo" alt="" aria-hidden="true" src={loginBg} />
      <div className="admin-login-page__veil" aria-hidden="true" />
      <div className="admin-login-page__tint" aria-hidden="true" />

      <section className="admin-login-card">
        <div className="admin-login-card__head">
          <img className="admin-login-card__brand" src={loginLogo} alt="ASAK" />
          <h1>관리자 로그인</h1>
        </div>

        <form className="admin-login-card__form" onSubmit={handleSubmit}>
          <label className="admin-login-field">
            <span>매장 번호</span>
            <input name="storeNumber" placeholder="0001" autoComplete="storeNumber" />
          </label>
          {/* <label className="admin-login-field">
            <span>아이디</span>
            <input name="username" defaultValue="admin_asak" autoComplete="username" />
          </label>
          <label className="admin-login-field">
            <span>비밀번호</span>
            <input
              name="password"
              type="password"
              defaultValue="password"
              autoComplete="current-password"
            />
          </label> */}

          <label className="admin-login-card__check">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            <span>로그인 상태 유지</span>
          </label>

          <button type="submit" className="admin-login-card__submit" disabled={submitting}>
            {submitting ? "로그인 중…" : "로그인"}
          </button>
        </form>

        <small>© 2025 ASAK. All Rights Reserved.</small>
      </section>
    </main>
  );
}
