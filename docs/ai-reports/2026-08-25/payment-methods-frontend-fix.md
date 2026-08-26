# 결제수단 프론트 수정 및 코드 설명

- 날짜: 2026-08-25
- 화면: SCR-018 Admin Payment Method Settings
- Figma: `39:8203` (코드의 `134:11493` 표기와 정합 확인 필요)
- 화면 경로: `/payment-methods`
- API: `GET/PATCH /api/admin/paymentMethods`
- 상태: **프론트 수정 완료 · 백엔드 런타임 API/DB 미검증**

## 수정한 파일

| 파일 | 역할 | 수정 내용 |
| --- | --- | --- |
| `src/hooks/usePaymentMethodDraft.js` | 조회, 토글, 순서 이동, 저장 상태 관리 | API 반환값과 React Effect, `sortNo` 처리 정리 |
| `src/api/paymentMethodsApi.js` | 결제수단 API 호출 경계 | PATCH body와 성공 반환값을 화면에 맞게 정규화 |
| `src/components/admin/AdminPaymentMethodRow.jsx` | 결제수단 목록 한 행 표시 | 백엔드 DTO 필드명으로 이름, 토글, 아이콘 표시 |

## 데이터 흐름

```text
GET /api/admin/paymentMethods
  -> apiClient가 ApiResponse.data 배열만 반환
  -> usePaymentMethodDraft가 sortNo 순으로 rows 저장
  -> PaymentMethodPage가 rows를 AdminPaymentMethodRow로 렌더링
```

`apiClient`의 공통 interceptor는 `{ success, status, code, message, data }` 전체가 아니라 `data`만 반환한다. 따라서 결제수단 훅은 `result.data`를 다시 읽지 않고 `result` 배열을 직접 사용한다.

## 화면 필드와 백엔드 DTO

| 용도 | 백엔드 DTO 필드 | 적용 위치 |
| --- | --- | --- |
| 목록 이름 | `methodName` | 행 제목, 버튼 접근성 문구 |
| 활성 상태 | `active` | 토글 모양, `aria-checked`, 미리보기 필터 |
| 표시 순서 | `sortNo` | GET 정렬, 위/아래 이동 후 재계산, PATCH body |
| 아이콘 종류 | `methodCode` | 로컬 SVG 아이콘 조회 |

이전 화면 코드의 `name`, `isActive`, `sortOrder`는 기존 mock 데이터용 필드였으므로 실제 Admin DTO와 맞지 않았다.

## 저장 동작

순서 변경 또는 토글 뒤 저장하면 각 행에 아래 형식으로 PATCH 요청을 보낸다.

```json
{
  "active": true,
  "sortNo": 1
}
```

백엔드 성공 응답의 `data`는 `null`이다. API 모듈은 요청 Promise가 성공적으로 완료되면 `{ success: true }`를 반환하게 하여, 훅이 `null.success`를 검사하지 않도록 했다. 요청 하나라도 실패하면 훅은 마지막 저장 기준 상태(`baselineRows`)로 되돌린다.

## React Effect 처리

`useEffect` 자체를 async로 선언하지 않았다. 내부 `fetchPaymentMethods`만 async로 실행하고 cleanup에서 `cancelled`를 설정한다. 화면을 떠난 뒤 늦은 응답이 도착해도 state를 갱신하지 않는다.

## 변경하지 않은 범위

- `/api/admin/paymentMethods` 경로와 Vite `/api` proxy
- 백엔드 Controller, Service, Mapper, DB
- 결제수단 화면 외 다른 Admin 화면
- Git commit, push, merge, branch 작업

## 검증 결과와 남은 확인

- `npm run lint`, `npm run build`, `git diff --check`를 프론트 정적 검증으로 실행한다.
- 진단 당시 백엔드 8080 포트가 실행 중이지 않았으므로 실제 GET/PATCH, DB 결과, 브라우저 화면은 별도 확인이 필요하다.
- 실행 후에는 Default, Loading, Empty, Error, Disabled 상태와 토글·순서 변경 후 저장 결과를 SCR-018 기준으로 확인한다.
