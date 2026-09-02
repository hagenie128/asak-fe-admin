<div align="center">

# 🧑‍💼 ASAK Admin

**주문 현황부터 메뉴·품절·매출까지 매장을 운영하는 ASAK 관리자 화면**

![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=111827)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white)
![Zustand](https://img.shields.io/badge/Zustand-5-433E38?style=flat-square)
![PWA](https://img.shields.io/badge/PWA-Enabled-5A0FC8?style=flat-square&logo=pwa&logoColor=white)
![Status](https://img.shields.io/badge/Status-In_Development-F59E0B?style=flat-square)

[빠른 시작](#-빠른-시작) · [화면·라우트](#-화면과-라우트) · [데이터 소스](#-화면별-데이터-소스-2026-08-14) · [PWA](#-pwa--태블릿-전체화면) · [이미지](#️-메뉴-이미지--cloudinary) · [폴더 구조](#-폴더-구조도) · [문서](#-관련-문서)

</div>

---

> **Team Project Original** — 팀 프로젝트 종료 시점 스냅샷
> Team Development: 2026.07 ~ 2026.09
> Freeze tag: `team-original-2026-09-02`
> 이 저장소에는 팀 종료 이후 개인 확장 작업을 추가하지 않습니다.

| 버전 | 배포 |
| --- | --- |
| Team Original (이 repo) | https://asak.stackroom.cloud |
| 하진 Personal Extension | https://hajin-asak.stackroom.cloud |
| 나연 Personal Extension | https://nayeon-asak.stackroom.cloud |

---

## 0. 프로젝트 한눈에 보기

ASAK 관리자 운영 화면 전용 **React + Vite** 애플리케이션입니다. 태블릿(1920×1080) 환경을 기준으로 만들고, 고객용 주문 키오스크는 별도 저장소인 `ASAK-Kiosk`에서 개발합니다.

핵심 설계는 아래 한 줄로 요약됩니다.

```text
Page(화면 조립) → Hook(데이터 조회·draft) → api/*Api.js (실서버) 또는 mocks/adminMockRepository.js (mock)
```

- **Page는 조립만** 합니다. 화면 요소는 `components/admin`에서 가져와 배치합니다.
- **Page에서 JSON을 직접 import하지 않습니다.** mock이 필요하면 항상 `adminMockRepository`를 거칩니다.
- `VITE_USE_MOCK` 같은 전역 스위치는 **없습니다.** 화면마다 아래 데이터 소스 표를 따릅니다.

> **작업 시작점:** [ASAK 프로젝트 작업 허브](../ASAK/PROJECT_HUB.md) → 기능 한 개 선택 → 이 저장소 코드 수정 → 워크로그 기록

---

## 🚀 빠른 시작

### 1단계: 저장소로 이동해 환경 변수 준비

```powershell
cd C:\ASAK-workspace\ASAK-Admin
copy .env.example .env
```

현재 `.env.example`에는 `VITE_API_BASE_URL`만 있습니다. 메뉴 이미지는 Cloudinary 자격 증명을 프론트에 넣어 가져오는 방식이 아니라, **백엔드가 응답한 공개 `imageUrl`을 그대로 표시**합니다.

### 2단계: 의존성 설치와 개발 서버 실행

```powershell
npm install
npm run dev
```

### 3단계: 접속 확인

| 항목 | 값 |
| --- | --- |
| 개발 서버 | `http://localhost:5174` (`host: 0.0.0.0`) |
| API 프록시 | `/api` → `http://localhost:8080` (`vite.config.js`) |
| PWA | `display: fullscreen` · `orientation: landscape` |
| 로그인 | 백엔드 없이도 `auth/adminSession`(localStorage)으로 진입 가능 |

주문·메뉴 화면은 실제 API를 호출하므로, 그 화면을 보려면 **`ASAK-back` 서버가 8080에서 실행 중**이어야 합니다.

태블릿에서 설치형으로 보려면 [Android PWA 전체화면](../ASAK/docs/operations/setup/android-pwa-fullscreen.md)을 따릅니다. Admin 포트는 **5174**입니다.

### 자주 쓰는 명령어

| 명령어 | 용도 |
| --- | --- |
| `npm run dev` | 개발 서버 실행 |
| `npm run lint` | ESLint 정적 검사 |
| `npm run build` | 배포용 `dist/` 생성 |
| `npm run preview` | 빌드 결과 미리보기 |

---

## 🧭 화면과 라우트

실행 경로는 **kebab-case**가 정본입니다. (`AdminApp.jsx` 기준)

| 경로 | 페이지 | 화면 설명 |
| --- | --- | --- |
| `/login` | `LoginPage` | 관리자 로그인 |
| `/` | `LiveOrderPage` | 로그인 후 홈 · 실시간 주문 보드 |
| `/dashboard` | `DashboardPage` | KPI·최근 주문·주간 매출 요약 |
| `/orders` | `OrderManagePage` | 주문 목록 검색·필터·상세 |
| `/sold-out` | `SoldOutManagePage` | 판매/품절 항목 이동 관리 |
| `/menus` | `MenuManagePage` | 메뉴 목록 + 상세/편집 패널 |
| `/menus/new` · `/menus/edit` | `MenuEditPage` | 메뉴 등록·수정 모드 |
| `/payment-methods` | `PaymentMethodPage` | 결제수단 활성·순서 설정 |
| `/sales` | `SalesSummaryPage` | 기간별 매출 요약 |
| `/sales/monthly` | `MonthlySalesPage` | 월별 매출 |
| `/sales/daily` | `DailySalesPage` | 일별·시간대별 매출 |
| `/ui-preview/...` | `UiStatePreviewPage` | 개발용 UI 상태 미리보기 |

`/orders/live`는 `/`로 리다이렉트됩니다. 정본 camelCase(`/soldOut`, `/paymentMethods`)와의 정렬은 `TODO-036`로 남아 있습니다.

---

## 🔌 화면별 데이터 소스 (2026-08-14)

화면마다 실서버와 mock이 섞여 있으므로, 작업 전 **이 표를 먼저 확인**하세요.

| 화면 / Hook | API | 소스 | 상태 |
| --- | --- | --- | --- |
| Live 주문 보드 (`LiveOrderBoard`) | API-021 | `api/ordersApi.js` | ✅ 실API |
| 주문 목록 (`useOrdersQuery`) | API-007 | `api/ordersApi.js` | ✅ 실API |
| 주문 상세 (`OrderDetailPanel`) | API-022 | `api/ordersApi.js` | ✅ 실API |
| 주문 상태 변경 | API-008 | `ordersApi.changeOrderStatus` | ✅ 실API |
| 주문 취소 | API-024 | `ordersApi.cancelOrder` | ✅ 실API |
| 메뉴 목록 (`useMenusQuery`) | API-011 | `api/menusApi.js` | ✅ 실API |
| 메뉴 상세 | API-023 | `menusApi.getMenu` | ✅ 실API |
| 메뉴 등록·수정 | API-012 / 013 | `menusApi.createMenu/updateMenu` | ✅ 실API |
| 메뉴 삭제 | — (계획 외 추가) | `menusApi.deleteMenu` | ✅ 실API (soft delete) |
| 카테고리·재료 조회 | — (보조 조회) | `menusApi.listCategories/getIngredients` | ✅ 실API |
| 품절 (`useSoldOutDraft`) | API-009 / 010 | `mocks/adminMockRepository` | 🟡 mock (`soldOutApi` 미구현) |
| 결제수단 (`usePaymentMethodDraft`) | API-015 / 016 | `mocks/adminMockRepository` | 🟡 mock (`paymentMethodsApi` 미구현) |
| 매출 요약·월별·일별 (`useSalesQuery`) | API-017 / 018 / 019 | `mocks/adminMockRepository` | 🟡 mock (`salesApi` 미구현) |
| 대시보드 (`useDashboard`) | API-020 | `mocks/adminMockRepository` | 🟡 mock (`adminApi.getDashboard` 미구현) |
| 로그인 | — (TODO-027) | `auth/adminSession.js` | 🟡 localStorage (JWT 미연동) |
| 주문 환불·영수증 출력 | — (TODO-038~043) | — | ⛔ 백엔드 계약·프론트 연결 모두 미완료 |

API 번호 정본은 [`../ASAK-back/IMPLEMENTATION_PLAN.md`](../ASAK-back/IMPLEMENTATION_PLAN.md) §4입니다. mock 화면은 백엔드에 대응 Controller가 아직 비어 있는 기능이며, mock JSON 필드 사전은 [`public/mocks/README.md`](public/mocks/README.md)에 있습니다.

### 호출 경로와 프론트 파일

| API | Method | 경로 | 프론트 |
| --- | --- | --- | --- |
| API-007 | GET | `/api/admin/orders` | `ordersApi.listOrders` |
| API-021 | GET | `/api/admin/orders/live` | `ordersApi.listLiveOrders` |
| API-022 | GET | `/api/admin/orders/{orderId}` | `ordersApi.getOrder` |
| API-008 | PATCH | `/api/admin/orders/{orderId}/{status}` | `ordersApi.changeOrderStatus` |
| API-024 | PATCH | `/api/admin/orders/{orderId}/cancel` | `ordersApi.cancelOrder` |
| API-011 | GET | `/api/admin/menus` | `menusApi.listMenus` |
| API-023 | GET | `/api/admin/menus/{menuId}` | `menusApi.getMenu` |
| API-012 | POST | `/api/admin/menus` | `menusApi.createMenu` |
| API-013 | PATCH | `/api/admin/menus/{menuId}` | `menusApi.updateMenu` |
| — | DELETE | `/api/admin/menus/{menuId}` | `menusApi.deleteMenu` |
| — | GET | `/api/admin/menus/categories` | `menusApi.listCategories` |
| — | GET | `/api/admin/menus/ingredients` | `menusApi.getIngredients` |

`constants/api.js`에는 품절·결제수단·매출·대시보드 경로 상수도 선언되어 있지만, **상수 선언은 endpoint 존재 증거가 아닙니다.** 해당 경로는 백엔드 Controller가 비어 있어 아직 호출하지 않습니다.

> ⚠️ 결제수단 경로는 백엔드가 camelCase(`/api/admin/paymentMethods`)이고 Product Bible은 kebab-case(`/api/admin/payment-methods`)로 적혀 있습니다. API-015/016을 연결하기 전에 정본 경로를 하나로 확정해야 합니다. (`TODO-011`)

### 인증 현재 상태

| 정본 (실제 사용 중) | 미연결 (JWT 준비물) |
| --- | --- |
| `auth/adminSession.js` ← `AdminApp` / `LoginPage` / `AdminSidebar` | `hooks/useAdminAuth.js` + `store/adminSessionStore.js` |

`apiClient`에는 아직 Authorization 헤더와 401 처리가 없습니다. (`TODO-033`)

---

## 📱 PWA · 태블릿 전체화면

관리자 화면은 `vite-plugin-pwa`로 설치형 앱처럼 실행합니다. 대상은 **가로형 Android 태블릿 + Chrome**입니다.

| 항목 | 값 | 근거 |
| --- | --- | --- |
| 플러그인 | `vite-plugin-pwa` · `registerType: "autoUpdate"` | `vite.config.js` |
| 앱 이름 | `ASAK Admin` | manifest `name` / `short_name` |
| 표시 모드 | `fullscreen` 우선, `standalone` 대체 | `display` / `display_override` |
| 화면 방향 | `landscape` | manifest `orientation` |
| 시작 URL | `/` · scope `/` · id `/asak-admin` | manifest |
| 아이콘 | `public/pwa-192x192.png`, `pwa-512x512.png`, `maskable-icon-512x512.png` | `public/` |

### 전체화면 진입 흐름

```text
AdminApp
  → AdminStartGate「시작하기」터치
  → requestAppFullscreen()  (utils/fullscreen.js)
  → landscape orientation lock 시도
  → 로그인 / 세션 화면으로 진입
```

- Fullscreen API는 **사용자 제스처(클릭/터치)** 안에서만 호출됩니다.
- 세션이 남아 로그인 화면을 건너뛰어도 `AdminStartGate`에서 한 번 터치하게 합니다.
- `LoginPage`에서도 로그인 성공 시 `requestAppFullscreen()`을 호출합니다.
- 실패해도 앱 흐름은 막지 않습니다 (기기 미지원·거부·이미 전체화면).

### 시연 시 주의

- 개발 서버는 `host: "0.0.0.0"` · 포트 **5174**입니다. 같은 네트워크의 태블릿에서 `http://<PC-IP>:5174`로 접속합니다.
- 내부망 HTTP로 설치하려면 Chrome 개발용 플래그가 필요합니다. 절차는 [Android PWA 전체화면](../ASAK/docs/operations/setup/android-pwa-fullscreen.md)을 따릅니다.
- PWA만으로는 부팅 자동 실행·이탈 차단을 보장하지 않습니다.

---

## 🖼️ 메뉴 이미지 · Cloudinary

관리자 화면의 메뉴 이미지는 로컬 `public/assets/menu` 정본이 아니라, 백엔드가 내려주는 **Cloudinary 공개 URL**을 사용합니다.

```text
DB menu.image_asset_id
  → media_asset.url (Cloudinary URL)
  → Admin 메뉴 API의 imageUrl
  → MenuListPanel / MenuDetailPanel / MenuEditPanel의 <img src>
```

### 화면별 사용 위치

| 파일 | 이미지 처리 |
| --- | --- |
| `MenuListPanel.jsx` | `menu.imageUrl`로 메뉴 카드 이미지 표시 · 값이 없으면 로컬 fallback |
| `MenuDetailPanel.jsx` | `menu.imageUrl`로 상세 이미지 표시 · 값이 없으면 로컬 fallback |
| `MenuEditPanel.jsx` | 기존 `imageUrl` 미리보기와 요청 payload 구성 |
| `useMenusQuery.js` | 등록·수정 요청의 `imageUrl` 정규화 |
| `CloudinaryImagePreview.jsx` | Cloudinary SDK 렌더링 예제 컴포넌트 · 현재 메뉴 편집 흐름에는 미연결 |

### 현재 연결 상태

- ✅ 메뉴 목록·상세에서 API `imageUrl`을 받아 Cloudinary 이미지를 표시합니다.
- ✅ 백엔드는 `media_asset.url`을 JOIN해 기존 `imageUrl` 필드로 응답합니다.
- 🟡 관리자 등록·수정은 아직 `mediaAssetId` 선택 UI가 없고, 레거시 `imageUrl` 호환 경로를 사용합니다.
- 🟡 `CloudinaryImagePreview`는 SDK 동작 예제이며 실제 메뉴 업로드·선택 UI가 아닙니다.
- ⛔ 브라우저에 `CLOUDINARY_API_SECRET`을 넣으면 안 됩니다. 업로드 서명은 향후 백엔드 또는 별도 안전한 업로드 도구가 담당해야 합니다.

결제수단 SVG는 Cloudinary가 `Content-Disposition: attachment`로 응답할 수 있어 `<img>` 표시가 실패할 수 있습니다. `constants/paymentMethodGlyphs.js`는 `methodId` 기반 로컬 glyph를 우선 사용해 이 문제를 피합니다.

---

## 📁 폴더 구조도

```text
src/
│
├── main.jsx                         # [진입점] React 앱 시작
├── apps/
│   └── AdminApp.jsx                 # [라우트] URL ↔ 페이지 연결 + 전역 CSS 로드 순서 지정
│
├── pages/
│   ├── admin/                       # [URL 화면] 조립만 담당 (Hook + components)
│   │   ├── LoginPage.jsx            # - 관리자 로그인
│   │   ├── LiveOrderPage.jsx        # - 실시간 주문 보드 (로그인 후 홈)
│   │   ├── DashboardPage.jsx        # - KPI·최근 주문·주간 매출
│   │   ├── OrderManagePage.jsx      # - 주문 목록 + 필터 + 상세 패널
│   │   ├── MenuManagePage.jsx       # - 메뉴 목록 + 상세/편집 패널
│   │   ├── MenuEditPage.jsx         # - 메뉴 등록·수정 모드 wrapper
│   │   ├── SoldOutManagePage.jsx    # - 판매/품절 이동 관리
│   │   ├── PaymentMethodPage.jsx    # - 결제수단 토글·정렬
│   │   ├── SalesSummaryPage.jsx     # - 기간별 매출 요약
│   │   ├── MonthlySalesPage.jsx     # - 월별 매출
│   │   └── DailySalesPage.jsx       # - 일별·시간대별 매출
│   └── dev/
│       └── UiStatePreviewPage.jsx   # - 개발용 UI 상태 미리보기 (운영 화면 아님)
│
├── components/admin/                # [UI 조각] 파일이 여럿인 도메인만 하위 폴더
│   ├── LiveOrderBoard.jsx           # - Live 보드 (사이드바 포함 전체 화면형)
│   ├── DashboardPanels.jsx          # - 대시보드 섹션 묶음
│   ├── SalesShareCard.jsx           # - 결제수단·주문유형 비중 카드
│   ├── AdminPaymentMethodRow.jsx    # - 결제수단 한 줄
│   ├── AdminStartGate.jsx           # - 전체화면 진입 게이트
│   ├── orders/                      # - OrderTable, OrderDetailPanel, OrderStatusBadge
│   ├── menus/                       # - MenuListPanel, MenuDetailPanel, MenuEditPanel,
│   │                                #   IngredientSelectModal
│   └── shared/                      # - 여러 화면이 함께 쓰는 공통 UI
│       ├── AdminSidebar.jsx         #   · 좌측 내비게이션
│       ├── AdminTopHeader.jsx       #   · 상단 헤더·브레드크럼
│       ├── AdminDatePicker.jsx      #   · 단일·범위 날짜 선택
│       ├── AdminFilterDropdown.jsx  #   · 상태·유형 필터
│       ├── AdminSearchInput.jsx     #   · 검색 입력
│       ├── AdminPagination.jsx      #   · 페이지 이동
│       ├── AdminConfirmDialog.jsx   #   · 확인 모달
│       ├── AdminSaveBar.jsx         #   · 저장·취소 바
│       ├── AdminStatusBadge.jsx     #   · 상태 배지
│       └── AdminAsyncState.jsx      #   · 로딩·빈 목록·오류 표시
│
├── layouts/
│   └── AdminLayout.jsx              # [셸] 1920×1080 캔버스 + scale (Live는 자체 셸 사용)
│
├── hooks/                           # [데이터 조회·draft 상태]
│   ├── useOrdersQuery.js            # - 주문 목록 조회·필터·페이징 (실API)
│   ├── useMenusQuery.js             # - 메뉴 목록·상세·저장 (실API)
│   ├── useSoldOutDraft.js           # - 품절 편집 draft (mock)
│   ├── usePaymentMethodDraft.js     # - 결제수단 편집 draft (mock)
│   ├── useSalesQuery.js             # - 매출 조회 (mock)
│   ├── useDashboard.js              # - 대시보드 조회 (mock)
│   ├── usePagination.js             # - 페이지 계산 공통 로직
│   └── useAdminAuth.js              # - JWT 후보 (앱 미연결)
│
├── api/                             # [서버 계약] axios 래퍼
│   ├── apiClient.js                 # - 공통 axios 인스턴스·envelope 처리
│   ├── ordersApi.js                 # - 주문 목록·상세·Live·상태 변경·취소
│   ├── menusApi.js                  # - 메뉴 CRUD·카테고리·재료
│   ├── adminApi.js                  # - 대시보드 등 (미구현 셸)
│   ├── soldOutApi.js                # - 품절 (미구현 셸)
│   ├── paymentMethodsApi.js         # - 결제수단 (미구현 셸)
│   └── salesApi.js                  # - 매출 (미구현 셸)
│
├── mocks/
│   └── adminMockRepository.js       # [mock 단일 입구] public/mocks/asak-admin-data.json 읽기
│
├── auth/
│   └── adminSession.js              # [세션 정본] localStorage 기반 로그인 상태
├── store/
│   └── adminSessionStore.js         # [zustand] JWT 전환용 — 현재 앱 미연결
│
├── types/                           # [JSDoc 응답 형태] 런타임 import 없음
├── constants/                       # [상수] 라벨·페이지 크기·결제수단 아이콘
├── utils/                           # [순수 함수] 금액·날짜·토스트·전체화면·TTS 문구
└── styles/                          # [CSS] tokens → reset → global → commonStyle 순서로 로드

public/mocks/asak-admin-data.json    # mock 데이터 원본
docs/                                # 온보딩·아키텍처 문서 (구명칭 잔존 가능)
```

> 단일 파일 컴포넌트는 **폴더를 만들지 않고 평탄하게** 둡니다. (`DashboardPanels.jsx`, `dashboard.css`) 파일이 여럿인 도메인만 `orders/`, `menus/`, `shared/`로 묶습니다.

---

## 🛠️ 기술 구성과 역할

### 1) React 19 + React Router 7

**역할:** 화면 구성과 URL 라우팅을 담당합니다.

**동작 방식:** `main.jsx` → `AdminApp.jsx`에서 경로별 페이지를 선택합니다. 일반 화면은 `staticPages` 매핑으로 `AdminLayout` 안에 렌더링하고, Live 보드는 사이드바를 자체 포함하므로 레이아웃 밖에서 렌더링합니다.

### 2) Vite 8

**역할:** 개발 서버와 번들러입니다.

**동작 방식:** 5174 포트에서 개발 서버를 띄우고 `/api` 요청을 8080 백엔드로 프록시합니다. 덕분에 프론트 코드에는 백엔드 주소를 하드코딩하지 않습니다.

### 3) Zustand 5

**역할:** 전역 상태 관리입니다.

**동작 방식:** `store/adminSessionStore.js`가 JWT 세션 후보로 준비되어 있습니다. 다만 현재 로그인 정본은 `auth/adminSession.js`이며 store는 아직 앱에 연결되지 않았습니다.

### 4) Axios

**역할:** HTTP 통신입니다.

**동작 방식:** `api/apiClient.js`가 공통 인스턴스를 만들고 백엔드의 `{ success, status, code, message, data }` envelope를 처리합니다. 각 `*Api.js`는 이 클라이언트만 사용하고, 화면은 Hook을 통해 호출합니다.

### 5) Cloudinary (`@cloudinary/react`, `@cloudinary/url-gen`)

**역할:** Cloudinary 이미지 변환·렌더링을 위한 SDK입니다.

**동작 방식:** 현재 실제 메뉴 목록·상세는 SDK가 아니라 API의 공개 `imageUrl`을 일반 `<img>`에 넣어 표시합니다. `CloudinaryImagePreview.jsx`만 SDK를 직접 사용하는 예제이며, 메뉴 업로드·자산 선택 흐름에는 아직 연결되지 않았습니다.

### 6) vite-plugin-pwa

**역할:** 관리자 화면을 가로형 태블릿에 설치형 앱처럼 띄우기 위한 PWA 구성입니다.

**동작 방식:** `vite.config.js`가 빌드 시 manifest와 service worker를 생성합니다. `display: fullscreen`, `orientation: landscape`, 아이콘 3종을 선언하고 `registerType: "autoUpdate"`로 SW를 갱신합니다. 실제 전체화면 진입은 `AdminStartGate` / `LoginPage`의 터치 제스처에서 `utils/fullscreen.js`가 담당합니다. 설치 절차는 [Android PWA 전체화면](../ASAK/docs/operations/setup/android-pwa-fullscreen.md)을 따릅니다.

### 7) ESLint 9

**역할:** 코드 품질 검사입니다.

**동작 방식:** `eslint.config.js` 규칙으로 `npm run lint` 시 미사용 변수, Hook 규칙 위반 등을 잡아냅니다.

---

## 🎨 화면 규칙

- **CSS 로드 순서:** `tokens` → `reset` → `global` → `commonStyle` (`AdminApp.jsx`에서 고정)
- **캔버스:** Figma 1920×1080 기준 + `scale` 변환 (`AdminLayout`)
- **CSS 파일 규칙:** 컴포넌트와 동일하게 단일 CSS는 평탄하게, 여러 파일이면 도메인 폴더로 묶습니다.
- 화면 상태(Default·Loading·Empty·Error·Disabled)는 `AdminAsyncState`로 통일해 표현합니다.

---

## 📚 관련 문서

| 문서 | 읽는 시점 |
| --- | --- |
| [`src/STRUCTURE_GUIDE.md`](src/STRUCTURE_GUIDE.md) | 파일 위치·데이터 소스를 빠르게 찾을 때 |
| [`public/mocks/README.md`](public/mocks/README.md) | mock 필드를 화면에 바인딩할 때 |
| [`docs/README.md`](docs/README.md) | 온보딩·아키텍처·Git 운영 문서 목차 |
| [Android PWA 전체화면](../ASAK/docs/operations/setup/android-pwa-fullscreen.md) | 태블릿 설치·fullscreen·갱신 절차 |
| [ASAK 문서 허브](../ASAK/docs/README.md) | 중앙 문서 전체 입구 |
| [Frontend Implementation](../ASAK/docs/product_bible/12_Frontend_Implementation/README.md) | 프론트 구현 기준 |
| [API·DB 구현 가이드](../ASAK/docs/implementation_guide/04-api-db-implementation.md) | 응답 envelope·필드 규칙 확인 |
| [`../ASAK-back/docs/MENU_IMAGE_ASSET_FLOW.md`](../ASAK-back/docs/MENU_IMAGE_ASSET_FLOW.md) | Cloudinary·`media_asset` 이미지 전환 상세 |

문서와 구현이 충돌하면 API 계약과 운영 정책을 먼저 확인하고, 결정 사항을 해당 문서에 갱신합니다.
