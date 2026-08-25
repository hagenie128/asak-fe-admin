/**
 * Admin 매출 화면 데이터 형태.
 * salesApi / useSalesQuery와 매출 API 응답을 사용한다.
 * summary 객체, monthly 객체, daily 객체, time-slots 배열은 서로 다른 응답이므로 adapter에서 구분한다.
 *
 * 사용 예:
 *   /** @typedef {import('../types/sales.js').SalesSummary} SalesSummary *\/
 */

/**
 * @typedef {Object} SalesKpi
 * @property {string} label
 * @property {number} value
 * @property {string} display
 * @property {number} [delta]
 * @property {string} [deltaLabel]
 */

/**
 * @typedef {Object} SalesShareSlice
 * @property {string} label
 * @property {number} percent
 * @property {number} fill
 */

/**
 * @typedef {Object} SalesRankingItem
 * @property {number} rank
 * @property {number} [menuId]
 * @property {string} name
 * @property {number} [count]
 * @property {number} [quantity]
 * @property {number} [orderCount]
 * @property {number} [amount]
 * @property {number} [salesAmount]
 */

/**
 * getSalesSummary 결과 (period 펼친 data)
 * @typedef {Object} SalesSummary
 * @property {string} period today|week|month|...
 * @property {string} label
 * @property {string} dateRange
 * @property {SalesKpi[]} kpis
 * @property {number[]} chartBars
 * @property {SalesShareSlice[]} paymentShare
 * @property {SalesShareSlice[]} orderShare
 * @property {SalesRankingItem[]} ranking
 * @property {string[]} availablePeriods
 */

/**
 * @typedef {Object} SalesDayRow
 * @property {string} date
 * @property {number} orderCount
 * @property {number} totalAmount
 * @property {number} avgAmount
 */

/**
 * @typedef {Object} SalesHourlyPoint
 * @property {number} hour
 * @property {number} [minute] 슬롯 시작 분: 0 또는 30
 * @property {number} orderCount
 * @property {number} totalAmount
 * @property {number} avgAmount
 * @property {number} [grossSalesAmount]
 * @property {number} [canceledAmount]
 * @property {number} [netSalesAmount]
 * @property {number} [canceledOrderCount]
 */

/**
 * getDailySales data
 * @typedef {Object} SalesDaily
 * @property {string} from
 * @property {string} to
 * @property {SalesDayRow[]} rows
 * @property {{ orderCount: number, totalAmount: number, avgAmount: number }} totals
 * @property {Object.<string, SalesHourlyPoint[]>} hourly date → points
 * @property {Object.<string, SalesRankingItem[]>} ranking date → items
 * @property {Object.<string, *>} [breakdown]
 */

/**
 * @typedef {Object} SalesMonthRow
 * @property {string} month YYYY-MM
 * @property {number} orderCount
 * @property {number} totalAmount
 * @property {number} avgAmount
 */

/**
 * getMonthlySales data
 * @typedef {Object} SalesMonthly
 * @property {number} year
 * @property {SalesMonthRow[]} rows
 * @property {{ orderCount: number, totalAmount: number, avgAmount: number }} totals
 * @property {Object.<string, SalesRankingItem[]>|SalesRankingItem[]} [ranking]
 */

export {};
