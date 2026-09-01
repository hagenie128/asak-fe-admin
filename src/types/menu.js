/**
 * Admin 메뉴 API 응답 형태 (BE MenuDetailResponse / MenuListResponse 기준).
 *
 * 사용 예 (다른 파일에서):
 *   /** @typedef {import('../types/menu.js').MenuDetail} MenuDetail *\/
 *   /** @param {MenuDetail} menu *\/
 */

/**
 * @typedef {Object} MenuNutrition
 * @property {number|null} kcal
 * @property {number|null} carbG
 * @property {number|null} proteinG
 * @property {number|null} fatG
 * @property {number|null} sodiumMg
 */

/**
 * @typedef {Object} MenuIngredient
 * @property {number} ingredientId
 * @property {string} name
 * @property {boolean} soldOut
 * @property {string} role
 * @property {number} quantity
 * @property {string} unit
 * @property {boolean} default
 * @property {boolean} canRemove
 */

/**
 * @typedef {Object} MenuOptionGroup
 * @property {number} optionGroupId
 * @property {string} name
 * @property {string} groupType
 * @property {string} selectType
 * @property {number|null} minSelect
 * @property {number|null} maxSelect
 * @property {boolean|null} isRequired
 * @property {string|null} recommendedLabel 메뉴별 추천(없으면 정책 기본)
 * @property {MenuOptionItem[]} [items]
 */

/**
 * @typedef {Object} MenuOptionItem
 * @property {number} optionItemId
 * @property {string} name
 * @property {number} [extraPrice]
 * @property {boolean} [isSoldOut]
 * @property {boolean} [isRecommended]
 */

/**
 * GET/POST /api/admin/menus/{id} 상세 data
 * @typedef {Object} MenuDetail
 * @property {number} menuId
 * @property {number} categoryId
 * @property {string} categoryName
 * @property {string} name
 * @property {number} price
 * @property {string|null} imageUrl
 * @property {string|null} description
 * @property {boolean} soldOut
 * @property {MenuIngredient[]} ingredients
 * @property {MenuOptionGroup[]} optionGroups
 * @property {MenuNutrition|null} nutrition
 * @property {string[]} allergens
 * @property {string[]} tags
 */

/**
 * GET /api/admin/menus 목록 row
 * @typedef {Object} MenuListItem
 * @property {number} menuId
 * @property {number} categoryId
 * @property {string} name
 * @property {number} price
 * @property {string|null} imageUrl
 * @property {boolean} soldOut
 * @property {boolean} hasSoldOutIngredient
 * @property {boolean} orderable
 */

/**
 * GET /api/admin/menus/categories row
 * @typedef {Object} MenuCategory
 * @property {number} categoryId
 * @property {string} categoryName
 * @property {number|null} sortOrder
 * @property {boolean|null} isActive
 */

export {};
