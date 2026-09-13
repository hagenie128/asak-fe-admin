/**
 * Admin 주문 API 응답 형태 (BE OrderList/Detail/Live + 화면 mock 보조).
 *
 * 사용 예:
 *   /** @typedef {import('../types/adminOrder.js').OrderListItem} OrderListItem *\/
 */

/**
 * GET /api/admin/orders 목록 row (OrderListResponse)
 * @typedef {Object} OrderListItem
 * @property {number} orderId
 * @property {string} orderNo
 * @property {string} orderType
 * @property {string} orderStatus
 * @property {string} paymentStatus
 * @property {number} totalAmount
 * @property {string} createdAt ISO datetime
 * @property {number} itemCount
 * @property {string} menuSummary
 */

/**
 * @typedef {Object} OrderOptionItem
 * @property {number} optionItemId
 * @property {string} name
 * @property {number} quantity
 */

/**
 * @typedef {Object} OrderExcludedIngredient
 * @property {number} ingredientId
 * @property {string} name
 */

/**
 * @typedef {Object} OrderItem
 * @property {number} menuId
 * @property {string} menuName
 * @property {number} quantity
 * @property {number} unitPrice
 * @property {OrderOptionItem[]|string|null} optionItems BE는 JSON raw, mock은 배열
 * @property {OrderExcludedIngredient[]|string|null} excludedIngredients
 */

/**
 * GET /api/admin/orders/{orderId} 상세 (OrderDetailResponse)
 * @typedef {Object} OrderDetail
 * @property {number} orderId
 * @property {string} orderNo
 * @property {string} orderType
 * @property {string} orderStatus
 * @property {string} paymentStatus
 * @property {string|null} paymentMethod
 * @property {number} totalAmount
 * @property {string} createdAt
 * @property {OrderItem[]} items
 */

/**
 * Live 보드 메뉴 줄 (화면용)
 * @typedef {Object} LiveOrderMenu
 * @property {string} menuName
 * @property {number} quantity
 * @property {string} [base]
 * @property {string} [dressing]
 * @property {{ label: string, tone?: string }[]} [options]
 */

/**
 * GET /api/admin/orders/live row (LiveOrderResponse)
 * @typedef {Object} LiveOrder
 * @property {number} orderId
 * @property {string} orderNo
 * @property {string} orderTypeLabel
 * @property {string} orderStatus
 * @property {number} totalAmount
 * @property {string} createdAt
 * @property {string|null} [paidAt] 결제 완료 시각. 경과시간 기준
 * @property {number|null} elapsedSec 결제 완료 후 경과 초. 미결제는 null
 * @property {LiveOrderMenu[]|string|null} menus BE는 JSON raw, mock은 배열
 */

/**
 * Live 목록 envelope data
 * @typedef {Object} LiveOrderList
 * @property {LiveOrder[]} content
 * @property {number} totalElements
 */

export {};
