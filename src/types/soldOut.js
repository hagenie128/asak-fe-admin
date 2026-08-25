/**
 * Admin 품절 화면 데이터 형태.
 * GET /api/admin/soldOut 카탈로그와 useSoldOutDraft를 사용한다.
 * PATCH changes는 targetType/targetId/isSoldOut로 전송하며, UI draft와 서버 baseline을 분리해 실패 시 baseline으로 복원한다.
 * API는 MENU/INGREDIENT/OPTION_ITEM을 반환하지만 현재 화면은 MENU/INGREDIENT 탭만 노출한다.
 *
 * 사용 예:
 *   /** @typedef {import('../types/soldOut.js').SoldOutRow} SoldOutRow *\/
 */

/**
 * @typedef {"MENU"|"INGREDIENT"|"OPTION_ITEM"} SoldOutTargetType
 */

/**
 * 품절 카탈로그 한 줄
 * @typedef {Object} SoldOutRow
 * @property {SoldOutTargetType} targetType
 * @property {number} targetId
 * @property {string} name
 * @property {string} category
 * @property {boolean} isSoldOut
 * @property {string} [imageKey]
 * @property {number} [price] MENU일 때
 */

/**
 * GET 품절 카탈로그 data
 * @typedef {Object} SoldOutCatalog
 * @property {SoldOutRow[]} available 판매 가능(왼쪽)
 * @property {SoldOutRow[]} soldOut 품절(오른쪽)
 */

/**
 * PATCH /api/admin/soldOut 변경 한 건
 * @typedef {Object} SoldOutChange
 * @property {SoldOutTargetType} targetType
 * @property {number} targetId
 * @property {boolean} isSoldOut
 */

/**
 * PATCH body — BE SoldOutPatchRequest 와 동일
 * @typedef {Object} SoldOutPatchBody
 * @property {SoldOutChange[]} changes
 */

export {};
