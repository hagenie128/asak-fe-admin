import { useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import adminLogo from "../../../assets/svg/logo-L.svg";
import asakSLogo from "../../../assets/svg/logo-S.svg";
import dashboardIcon from "../../../assets/figma/icon-nav-dashboard.svg";
import ordersIcon from "../../../assets/figma/icon-nav-orders.svg";
import salesIcon from "../../../assets/figma/icon-nav-sales.svg";
import menuIcon from "../../../assets/figma/icon-nav-menu.svg";
import soldOutIcon from "../../../assets/figma/icon-nav-soldout.svg";
import paymentIcon from "../../../assets/figma/icon-nav-payment.svg";
import caretDownIcon from "../../../assets/figma/icon-nav-caret-down.svg";
import signOutIcon from "../../../assets/figma/icon-nav-signout.svg";
import promoLettuce from "../../../assets/figma/promo-lettuce.png";
import promoCarrot from "../../../assets/figma/promo-carrot.png";
import { logoutAdmin } from "../../../auth/adminSession.js";

/*
 * Figma: Admin/Navbar (150:4739)
 *   Model=Desktop (150:4740, 240×1080) — 기본 셸
 *   Model=Tablet  (150:4865, 90×1080)  — 아이콘 rail
 *   Model=logo    (150:4904, 90×72)    — Live Order 상단 마크
 *
 * Props: model?: "Desktop" | "Tablet" | "logo"
 * mock/세션: logoutAdmin() → /login
 * 경로 표: src/STRUCTURE_GUIDE.md
 */
const MODELS = {
  Desktop: "Desktop",
  Tablet: "Tablet",
  logo: "logo",
};

export default function AdminSidebar({ model = MODELS.Desktop }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSalesOpen, setIsSalesOpen] = useState(() => location.pathname.startsWith("/sales"));

  function handleLogout() {
    logoutAdmin();
    navigate("/login", { replace: true });
  }

  if (model === MODELS.logo) {
    return (
      <div
        className="admin-sidebar admin-sidebar--logo"
        data-figma-node="150:4904"
        data-figma-model="logo"
        aria-label="ASAK"
        onClick={() => navigate("/dashboard")}
      >
        <img className="admin-sidebar__brand-mark" alt="ASAK" src={asakSLogo} />
      </div>
    );
  }

  const isTablet = model === MODELS.Tablet;

  return (
    <aside
      className={`admin-sidebar${isTablet ? " admin-sidebar--tablet" : " admin-sidebar--desktop"}`}
      data-figma-node={isTablet ? "150:4865" : "150:4740"}
      data-figma-model={isTablet ? "Tablet" : "Desktop"}
    >
      <button
        type="button"
        className="admin-sidebar__brand"
        aria-label="ASAK Admin"
        onClick={() => navigate("/dashboard")}
      >
        {isTablet ? (
          <img className="admin-sidebar__brand-mark" alt="ASAK" src={asakSLogo} />
        ) : (
          <img className="admin-sidebar__brand-full" alt="ASAK" src={adminLogo} />
        )}
      </button>

      <nav className="admin-sidebar__nav" aria-label="관리자 메뉴">
        <NavLink end to="/dashboard" aria-label="Home">
          <img alt="" aria-hidden="true" src={dashboardIcon} />
          <span>Home</span>
        </NavLink>
        <NavLink end to="/orders" aria-label="주문 관리">
          <img alt="" aria-hidden="true" src={ordersIcon} />
          <span>주문 관리</span>
        </NavLink>

        {isTablet ? (
          <>
            <NavLink end to="/menus" aria-label="메뉴 관리">
              <img alt="" aria-hidden="true" src={menuIcon} />
              <span>메뉴 관리</span>
            </NavLink>
            <NavLink end to="/sold-out" aria-label="항목 품절 관리">
              <img alt="" aria-hidden="true" src={soldOutIcon} />
              <span>항목 품절 관리</span>
            </NavLink>
            <NavLink end to="/payment-methods" aria-label="결제수단 설정">
              <img alt="" aria-hidden="true" src={paymentIcon} />
              <span>결제수단 설정</span>
            </NavLink>
            <NavLink end to="/sales" aria-label="매출 관리">
              <img alt="" aria-hidden="true" src={salesIcon} />
              <span>매출 관리</span>
            </NavLink>
          </>
        ) : (
          <>
            <div className="admin-sidebar__group">
              <div className="admin-sidebar__group-row">
                <NavLink end to="/sales" aria-label="매출 관리">
                  <img alt="" aria-hidden="true" src={salesIcon} />
                  <span>매출 관리</span>
                </NavLink>
                <button
                  type="button"
                  className="admin-sidebar__caret-button"
                  aria-expanded={isSalesOpen}
                  aria-label="매출 관리 하위 메뉴"
                  onClick={() => setIsSalesOpen((prev) => !prev)}
                >
                  <img
                    className={`admin-sidebar__caret${isSalesOpen ? " is-open" : ""}`}
                    alt=""
                    aria-hidden="true"
                    src={caretDownIcon}
                  />
                </button>
              </div>
              {isSalesOpen ? (
                <>
                  <NavLink className="admin-sidebar__subitem" to="/sales/daily">
                    <span>일별 매출</span>
                  </NavLink>
                  <NavLink className="admin-sidebar__subitem" to="/sales/monthly">
                    <span>월별 매출</span>
                  </NavLink>
                </>
              ) : null}
            </div>
            <NavLink end to="/menus" aria-label="메뉴 관리">
              <img alt="" aria-hidden="true" src={menuIcon} />
              <span>메뉴 관리</span>
            </NavLink>
            <NavLink end to="/sold-out" aria-label="항목 품절 관리">
              <img alt="" aria-hidden="true" src={soldOutIcon} />
              <span>항목 품절 관리</span>
            </NavLink>
            <NavLink end to="/payment-methods" aria-label="결제수단 설정">
              <img alt="" aria-hidden="true" src={paymentIcon} />
              <span>결제수단 설정</span>
            </NavLink>
          </>
        )}
      </nav>

      {!isTablet ? (
        <div className="admin-sidebar__promo">
          <div className="admin-sidebar__promo-art" aria-hidden="true">
            <img className="admin-sidebar__promo-lettuce" alt="" src={promoLettuce} />
            <img className="admin-sidebar__promo-carrot" alt="" src={promoCarrot} />
          </div>
          <p className="admin-sidebar__promo-text">현재 진행 중인 주문 상태를 한눈에 확인하세요.</p>
          <NavLink className="admin-sidebar__promo-cta" end to="/">
            주문 현황
          </NavLink>
        </div>
      ) : (
        <NavLink className="admin-sidebar__live-cta" end to="/" aria-label="주문 현황 (라이브오더)" title="주문 현황">
          <span className="admin-sidebar__live-dot" aria-hidden="true" />
        </NavLink>
      )}

      <button type="button" className="admin-sidebar__logout" aria-label="Logout" onClick={handleLogout}>
        <img alt="" aria-hidden="true" src={signOutIcon} />
        <span>Logout</span>
      </button>
    </aside>
  );
}
