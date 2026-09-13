/*
 * Figma Component 연결 후보: AdminLayout
 * 현재 코드 역할: Sidebar + Header + 본문(children) 셸.
 *
 * 정본: docs/Figma 1920×1080 Desktop.
 * 사이드바는 해상도와 관계없이 Desktop 240px을 유지한다.
 * 본문은 contain scale로 비율을 유지하고,
 * 글자가 0.75배 아래로 줄어들지 않도록 최소 스케일을 둔다.
 *
 * 데이터 흐름:
 *   main.jsx → AdminApp → AdminLayout → children Page
 */

import { useEffect, useState } from "react";
import AdminSidebar from "../components/admin/shared/AdminSidebar.jsx";

const CANVAS_W = 1920;
const CANVAS_H = 1080;
const SIDEBAR_W = 240;
const MAIN_W = CANVAS_W - SIDEBAR_W;
const MIN_READABLE_SCALE = 0.75;

function useAdminCanvasScale() {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const update = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const fit = Math.min(vw / CANVAS_W, vh / CANVAS_H, 1);
      const next = Number.isFinite(fit) && fit > 0 ? Math.max(fit, MIN_READABLE_SCALE) : 1;
      setScale(next);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return scale;
}

export default function AdminLayout({ children }) {
  const scale = useAdminCanvasScale();

  return (
    <div className="admin-viewport" style={{ "--admin-scale": scale }}>
      <div className="admin-shell" style={{ width: CANVAS_W * scale }}>
        <div className="admin-sidebar-slot" style={{ width: SIDEBAR_W * scale }}>
          <AdminSidebar model="Desktop" />
        </div>
        <div className="admin-main-slot" style={{ width: MAIN_W * scale }}>
          <div
            className="admin-main-frame"
            style={{ width: MAIN_W * scale, height: CANVAS_H * scale }}
          >
            <main className="admin-main">{children}</main>
          </div>
        </div>
      </div>
    </div>
  );
}
