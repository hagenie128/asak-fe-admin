/*
 * 태블릿 Chrome 발표용 진입 게이트.
 * Fullscreen API는 사용자 제스처가 필요하므로, 세션이 남아 로그인 화면을
 * 건너뛰어도 여기서 한 번 터치하게 한다.
 */
import loginBg from "../../assets/figma/login-bg.png";
import loginLogo from "../../assets/svg/logo-F.svg";
import { requestAppFullscreen } from "../../utils/fullscreen.js";

export default function AdminStartGate({ onStart }) {
  async function handleStart() {
    if (window.innerHeight < 768) {
      //가로모드인 경우
      await requestAppFullscreen();
    }
    onStart?.();
  }

  return (
    <main className="admin-login-page" aria-label="ASAK Admin 시작">
      <img className="admin-login-page__photo" alt="" aria-hidden="true" src={loginBg} />
      <div className="admin-login-page__veil" aria-hidden="true" />
      <div className="admin-login-page__tint" aria-hidden="true" />

      <section className="admin-login-card">
        <div className="admin-login-card__head">
          <img className="admin-login-card__brand" src={loginLogo} alt="ASAK" />
          <h1>ASAK Admin</h1>
          {/* <p className="admin-login-card__lead">선생님 태블릿에서 전체화면으로 운영을 시작합니다.</p> */}
        </div>

        <button type="button" className="admin-login-card__submit" onClick={handleStart}>
          시작하기
        </button>

        <small>© 2025 ASAK. All Rights Reserved.</small>
      </section>
    </main>
  );
}
