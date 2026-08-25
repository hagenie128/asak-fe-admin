/**
 * Admin 결제수단 화면 데이터 형태.
 * 현재 기준: mock / usePaymentMethodDraft
 * BE의 GET/PATCH 매핑 골격은 있으나 Mapper·검증·런타임 확인이 남아 있다.
 * 현재 BE DTO는 active/sortNo, mock은 isActive/sortOrder이므로 TODO-013에서 변환 경계 또는 단일 계약을 확정한다.
 *
 * 사용 예:
 *   /** @typedef {import('../types/paymentMethod.js').PaymentMethod} PaymentMethod *\/
 */

/**
 * 결제수단 목록 row
 * @typedef {Object} PaymentMethod
 * @property {string|number} methodId mock은 "card" 문자열, BE는 숫자 id일 수 있음
 * @property {string} methodName
 * @property {string} [description]
 * @property {string} [imageUrl] Cloudinary 공개 URL (결제수단 로고)
 * @property {boolean} active
 * @property {boolean} [maintenance]
 * @property {number} sortNo
 * @property {string} [receiptMessage]
 */

/**
 * 화면 draft PATCH 형태. 실제 BE body는 active, sortNo이며 receiptMessage는 현재 API·DB 계약에 없다.
 * @typedef {Object} PaymentMethodPatch
 * @property {boolean} [active]
 * @property {number} [sortNo]
 * @property {string|null} [receiptMessage]
 */

export {};
