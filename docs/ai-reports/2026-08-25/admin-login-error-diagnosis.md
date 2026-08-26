# 관리자 로그인 오류 진단

- 날짜: 2026-08-25
- 화면: SCR-015 Admin Login
- Figma: `134:12033`
- 프론트 경로: `/login`
- API 계약: `POST /api/admin/login`
- 상태: **원인 확인 · 코드 수정 미수행 · 런타임 API 미검증**

## 증상

관리자 로그인 버튼을 눌렀을 때 오류가 발생하거나, 성공 응답이 와도 로그인 상태로 전환되지 않는다.

## 확인한 요청 흐름

```text
LoginPage.handleSubmit()
  -> adminApi.login(storeNumber)
  -> apiClient POST /api/admin/login
  -> Vite /api proxy
  -> Spring AdminAuthController
  -> loginAdmin()으로 loggedIn 세션 저장
```

프론트 환경변수의 `/api`와 API 상수 `/admin/login`은 최종 요청 경로 `/api/admin/login`을 만든다.

## 원인 1: 진단 시점에 백엔드가 실행 중이지 않음

진단 시점에 `localhost:8080` 리스너가 없었다. 따라서 Vite 프록시가 `/api` 요청을 백엔드로 전달할 수 없어 연결 거부 오류가 발생한다.

### 먼저 확인할 사항

1. ASAK-back 저장소에서 Spring Boot 서버를 실행한다.
2. 8080 포트가 열렸는지 확인한다.
3. 브라우저 Network에서 `POST /api/admin/login`의 상태 코드와 응답 body를 확인한다.

## 원인 2: 프론트 요청 body와 백엔드 Controller 파라미터가 다름

프론트는 다음 JSON body를 보낸다.

```json
{
  "storeNumber": "0001"
}
```

그러나 현재 `AdminAuthController`의 `login` 메서드는 `@PathVariable(name = "storeNumber")`를 사용한다. 매핑 URL은 `/api/admin/login`이며 `{storeNumber}` 경로 변수가 없으므로 Controller가 요청 body의 값을 받을 수 없다.

### 계약을 맞추는 방법

현재 프론트 계약을 유지한다면 백엔드는 `@RequestBody` DTO 또는 request body map으로 `storeNumber`를 받아야 한다.

```text
POST /api/admin/login
body: { storeNumber: "0001" }
```

반대로 PathVariable을 유지하려면 프론트 URL도 `/api/admin/login/0001`로 바꿔야 한다. 현재 화면과 API 주석은 body 계약을 선언하고 있으므로, body 방식이 일관된 선택이다.

## 원인 3: 프론트 성공 판정이 apiClient 반환 구조와 다름

`apiClient`의 성공 interceptor는 아래 envelope 전체가 아니라 `data`만 반환한다.

```json
{
  "success": true,
  "status": 200,
  "code": "...",
  "message": "...",
  "data": "로그인 성공"
}
```

즉 `adminApi.login()`의 반환값은 `"로그인 성공"` 문자열이다. 그러나 `LoginPage`는 `result?.success`를 검사한다.

```js
const result = await adminApi.login(storeNumber);
if (result?.success) {
  loginAdmin({ remember });
}
```

문자열에는 `success` 속성이 없으므로 조건은 false가 되고 `loginAdmin()`이 실행되지 않는다. 이 경우 오류 toast가 없더라도 화면은 비로그인 상태에 남는다.

## 수정 순서

1. Spring Boot 백엔드를 실행해 연결 오류를 제거한다.
2. 백엔드 `AdminAuthController`를 `@RequestBody { storeNumber }` 계약에 맞춘다.
3. 승인 응답 계약을 확정한다.
   - 권장: `data: { approved: true }`
   - 현재처럼 문자열을 유지한다면 프론트는 `result`의 문자열 승인값을 확인한다.
4. `LoginPage`가 승인 결과를 확인한 뒤에만 `loginAdmin({ remember })`을 호출한다.
5. `0001` 성공, 잘못된 번호 401, 빈 번호 400, 네트워크 실패를 각각 확인한다.

## 관련 파일

- `src/pages/admin/LoginPage.jsx`
- `src/api/adminApi.js`
- `src/api/apiClient.js`
- `src/auth/adminSession.js`
- `ASAK-back/src/main/java/com/asak/admin/controller/AdminAuthController.java`

## 변경하지 않은 범위

- 프론트와 백엔드 소스 코드
- JWT 발급, 토큰 만료 처리, Authorization header
- Git commit, push, merge, branch 작업

