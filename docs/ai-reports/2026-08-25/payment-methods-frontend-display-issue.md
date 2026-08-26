# 결제수단 프론트 미노출 진단 기록

- 기록일: 2026-08-25
- 범위: Admin 결제수단 설정 화면(SCR-018)
- Figma: `39:8203` (화면 코드에는 `134:11493` 표기도 존재하여 정합 확인 필요)
- 실행 경로: `/payment-methods`
- 상태: **원인 확인됨 · 코드 수정 미수행 · 런타임 미검증**

## 증상

결제수단 설정 화면에서 목록 데이터가 프론트에 표시되지 않고 빈 목록 상태로 처리된다.

## 확인한 데이터 흐름

```text
GET /api/admin/paymentMethods
  -> apiClient response interceptor
  -> paymentMethodsApi.listPaymentMethods()
  -> usePaymentMethodDraft()
  -> PaymentMethodPage
  -> AdminPaymentMethodRow
```

- Vite 환경변수 `VITE_API_BASE_URL=/api`와 API 상수 `/admin/paymentMethods`의 조합은 최종적으로 `/api/admin/paymentMethods`가 된다.
- 위 최종 경로는 백엔드 `AdminPaymentMethodController`의 `@RequestMapping("/api/admin/paymentMethods")`와 일치한다.
- 다만 진단 시점에 8080 포트의 백엔드 프로세스가 실행 중이지 않아 실제 HTTP 응답/DB 데이터는 검증하지 못했다.

## 확정 원인

### 1. 응답 `data`를 이중으로 참조함

`src/api/apiClient.js`의 응답 interceptor는 성공한 API envelope인
`{ success, status, code, message, data }`에서 `data`만 반환한다.

그러나 `src/hooks/usePaymentMethodDraft.js`는 반환값을 envelope로 가정하고 `envelope.data`를 읽는다.
따라서 백엔드가 결제수단 배열을 반환해도 훅에서는 `undefined`가 되어 `[]`로 대체되며, 화면은 Empty 상태를 렌더링한다.

```js
// 현재 흐름의 의미
const result = await paymentMethodsApi.listPaymentMethods(); // 이미 배열
const nextRows = [...(result.data ?? [])]; // result.data는 undefined
```

영향: 결제수단 API가 정상 응답해도 목록이 0건으로 표시된다.

## 후속 불일치: 목록 표시 및 저장

### 2. 백엔드 DTO와 행 컴포넌트 필드명이 다름

| 백엔드 응답 DTO | 현재 목록 행/화면이 읽는 필드 | 영향 |
| --- | --- | --- |
| `methodName` | `name` | 결제수단명이 표시되지 않음 |
| `active` | `isActive` | 토글의 표시 상태 및 접근성 상태가 잘못됨 |
| `sortNo` | `sortOrder` | 재정렬 뒤 PATCH에 정렬값이 전달되지 않음 |
| `methodCode` | `methodId`를 아이콘 조회에 전달 | 로컬 SVG 아이콘을 찾지 못함 |

영향: 1번을 해결해 행이 순회되더라도, 이름·토글·아이콘 표시가 백엔드 응답과 맞지 않는다.

### 3. PATCH 성공 응답 판정이 interceptor 반환 방식과 다름

백엔드 PATCH 성공 응답의 `data`는 `null`이고, interceptor도 `null`을 반환한다.
현재 저장 로직은 각 결과에 `r.success`가 있다고 가정하므로 성공 결과를 정상 판정하지 못한다.

### 4. Effect 콜백이 async 함수임

`useEffect(async () => ...)`는 Promise를 cleanup 함수로 반환하므로 React 권장 사용 방식이 아니다.
내부에 async 함수(`fetchPaymentMethods`)를 선언하고 effect 본문에서 호출한 뒤, effect 자체는 cleanup 함수만 반환해야 한다.

## 수정 전에 확정할 계약

Screen Bible SCR-018의 API 계약은 `GET/PATCH /api/admin/paymentMethods`이다. 프론트의 화면 모델을 백엔드 DTO와 직접 동일하게 사용할지, 훅에서 다음과 같이 화면 모델로 변환할지 팀 결정이 필요하다.

```text
methodName -> name
active     -> isActive
sortNo     -> sortOrder
methodCode -> 아이콘 조회 키
```

백엔드 PATCH 요청 계약은 `active`, `sortNo`이므로, 화면 모델을 유지한다면 요청 직전에 이 두 필드로 변환해야 한다.

## 최소 수정 후보와 영향 범위

1. `src/hooks/usePaymentMethodDraft.js`
   - 목록 반환값을 배열로 바로 읽는다.
   - 화면 모델 변환 또는 DTO 필드명 통일을 적용한다.
   - 재정렬 키 및 PATCH body를 `sortNo` 계약과 맞춘다.
   - effect의 async 구조와 PATCH 성공 판정을 정리한다.
2. `src/components/admin/AdminPaymentMethodRow.jsx`
   - 확정한 화면 모델 기준으로 이름·활성 상태·아이콘 키를 사용한다.
3. 필요 시 `src/pages/admin/PaymentMethodPage.jsx`
   - 미리보기에서도 목록 행과 같은 모델을 사용하도록 확인한다.

이 문서는 문제 상황 기록이며, 위 파일은 수정하지 않았다.

## 검증 계획

- 백엔드 실행 후 브라우저 Network 또는 Bruno에서 `GET /api/admin/paymentMethods` 응답을 확인한다.
- 1건 이상 데이터에서 Default 상태에 이름·설명·아이콘·토글이 표시되는지 확인한다.
- Loading, Empty, Error, Disabled 상태를 SCR-018 기준으로 확인한다.
- 토글과 순서 변경 후 PATCH body가 `active`, `sortNo`인지 확인한다.
- PATCH 성공 후 저장 바가 해제되고 재조회 결과가 화면에 반영되는지 확인한다.

