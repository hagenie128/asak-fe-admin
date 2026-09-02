/**
 * 관리자 mock 공급 경계.
 * 화면/Page는 JSON을 직접 import하지 말고 이 모듈만 사용한다.
 * 이후 실 API가 붙으면 여기만 client 호출로 바꾸면 된다.
 *
 * 필드·props 사전: public/mocks/README.md
 *   getLiveOrders      → liveOrders.data.content[]     (§1 Live 카드)
 *   getAdminOrders     → orders.data.content[]         (§2 목록)
 *   getAdminOrderById  → 주문 1건 / 404 envelope       (§2 상세)
 *   getDashboard       → dashboard.data                (§3)
 *     recentOrders는 getAdminOrders(주문 관리) 최신 N건을 매핑 (§2)
 *   getSoldOutCatalog  → soldOut.data                  (§4)
 *   getAdminMenus      → menus.data.content[] (+ detail · 2026-07-22) (§5)
 *   getPaymentMethods  → paymentMethods.data[]         (§6)
 *   getSalesSummary    → sales.summary (+ period)      (§7)
 *   getDailySales      → sales.daily.data              (§7)
 *     (+ hourly[date], ranking[date], breakdown[date] · 2026-07-22)
 *   getMonthlySales    → sales.monthly.data            (§7)
 *     (+ ranking[month] · 2026-07-22)
 */
import adminMock from "./asak-admin-data.json";


let liveOrders = clone(adminMock.liveOrders);

function clone(value) {
  return structuredClone(value);
}

/** page·size가 오면 content를 잘라 주고, totalElements는 전체 건수를 유지한다. */
function applyListPaging(envelope, page, size) {
  const rows = envelope?.data?.content ?? [];
  const totalElements = rows.length;
  if (envelope?.data) {
    envelope.data.totalElements = totalElements;
  }
  if (page == null || size == null || Number(size) <= 0) {
    return envelope;
  }
  const safeSize = Math.max(1, Number(size));
  const totalPages = Math.max(1, Math.ceil(totalElements / safeSize) || 1);
  const safePage = Math.min(Math.max(0, Number(page)), totalPages - 1);
  const start = safePage * safeSize;
  envelope.data.content = rows.slice(start, start + safeSize);
  return envelope;
}

export function completeOrder(orderId) {
  liveOrders.data.content = liveOrders.data.content.map((order) => {
    if (order.orderId === Number(orderId)) {
      order.orderStatus = "COMPLETED";
    }
    return order;
  });
  return {
    success: true,
    status: 200,
    code: "ORDER_COMPLETE_SUCCESS",
    message: "주문 완료 성공",
    data: null,
  };
}

export function cancelOrder(orderId) {
  liveOrders.data.content = liveOrders.data.content.map((order) => {
    if (order.orderId === Number(orderId)) {
      order.orderStatus = "CANCELED";
    }
    return order;
  });
  return {
    success: true,
    status: 200,
    code: "ORDER_CANCEL_SUCCESS",
    message: "주문 취소 성공",
    data: null,
  };
}

export function getAdminMockMeta() {
  return clone(adminMock.meta);
}

export function getAdminScenarios() {
  return clone(adminMock.scenarios);
}

function isForcedSaveFail() {
  try {
    return sessionStorage.getItem("asak_mock_fail_save") === "1";
  } catch {
    return false;
  }
}

/** 주문 목록 (필터는 클라이언트 mock 필터, page/size 옵션 지원) */
export function getAdminOrders({
  empty = false,
  orderStatus = "",
  paymentStatus = "",
  orderType = "",
  dateFrom = "",
  dateTo = "",
  keyword = "",
  page,
  size,
} = {}) {
  const envelope = clone(adminMock.orders);
  if (empty) {
    envelope.data = {
      content: [],
      totalElements: 0,
    };
    return envelope;
  }

  let rows = envelope.data.content ?? [];
  if (orderStatus) rows = rows.filter((row) => row.orderStatus === orderStatus);
  if (paymentStatus) rows = rows.filter((row) => row.paymentStatus === paymentStatus);
  if (orderType) rows = rows.filter((row) => row.orderType === orderType);
  if (dateFrom) {
    rows = rows.filter((row) => String(row.createdAt).slice(0, 10) >= dateFrom);
  }
  if (dateTo) {
    rows = rows.filter((row) => String(row.createdAt).slice(0, 10) <= dateTo);
  }
  if (keyword) {
    const q = String(keyword).trim().toLowerCase();
    rows = rows.filter((row) => {
      const no = String(row.orderNo ?? "").toLowerCase();
      const summary = String(row.menuSummary ?? "").toLowerCase();
      const itemHit = (row.items ?? []).some((item) =>
        String(item.menuName ?? "")
          .toLowerCase()
          .includes(q),
      );
      return no.includes(q) || summary.includes(q) || itemHit;
    });
  }

  envelope.data.content = rows;
  return applyListPaging(envelope, page, size);
}

export function getAdminOrderById(orderId) {
  const list = adminMock.orders.data.content;
  const found = list.find((order) => order.orderId === Number(orderId));
  if (!found) {
    return {
      success: false,
      status: 404,
      code: "ADMIN_ORDER_NOT_FOUND",
      message: "주문을 찾을 수 없습니다.",
      data: null,
    };
  }
  return {
    success: true,
    status: 200,
    code: "ADMIN_ORDER_DETAIL_SUCCESS",
    message: "주문 상세 조회 성공",
    data: clone(found),
  };
}

/** 주문 상태 변경 stub — RECEIVED→PREPARING→COMPLETED */
export function updateAdminOrderStatus(orderId, nextStatus) {
  if (isForcedSaveFail()) {
    return {
      success: false,
      status: 500,
      code: "ADMIN_ORDER_STATUS_UPDATE_FAILED",
      message: "주문 상태 변경에 실패했습니다. (mock fail)",
      data: null,
    };
  }

  const order = adminMock.orders.data.content.find((row) => row.orderId === Number(orderId));
  if (!order) {
    return {
      success: false,
      status: 404,
      code: "ADMIN_ORDER_NOT_FOUND",
      message: "주문을 찾을 수 없습니다.",
      data: null,
    };
  }

  const allowed = {
    RECEIVED: "PREPARING",
    PREPARING: "COMPLETED",
  };
  if (allowed[order.orderStatus] !== nextStatus) {
    return {
      success: false,
      status: 400,
      code: "ADMIN_ORDER_STATUS_INVALID",
      message: "허용되지 않는 상태 변경입니다.",
      data: clone(order),
    };
  }

  order.orderStatus = nextStatus;
  return {
    success: true,
    status: 200,
    code: "ADMIN_ORDER_STATUS_UPDATE_SUCCESS",
    message: "주문 상태가 변경되었습니다.",
    data: clone(order),
  };
}

/** 환불 stub — payment APPROVED→REFUNDED, 제공 전만 order CANCELED (실BE와 동일) */
export function refundAdminOrder(orderId) {
  const order = adminMock.orders.data.content.find((row) => row.orderId === Number(orderId));
  if (!order) {
    return {
      success: false,
      status: 404,
      code: "ADMIN_ORDER_NOT_FOUND",
      message: "주문을 찾을 수 없습니다.",
      data: null,
    };
  }
  if (order.paymentStatus !== "APPROVED") {
    return {
      success: false,
      status: 400,
      code: "ADMIN_ORDER_REFUND_NOT_ALLOWED",
      message: "결제 완료된 주문만 환불할 수 있습니다.",
      data: null,
    };
  }
  order.paymentStatus = "REFUNDED";
  order.refundedAt = new Date().toISOString();
  if (order.orderStatus !== "COMPLETED") {
    order.orderStatus = "CANCELED";
    order.cancelledAt = order.refundedAt;
  }
  return {
    success: true,
    status: 200,
    code: "ADMIN_ORDER_REFUND_SUCCESS",
    message: "환불 처리가 완료되었습니다.",
    data: clone(order),
  };
}

/** 영수증 출력 stub — 상태 변경 없이 성공만 반환 */
export function printAdminOrderReceipt(orderId) {
  const order = adminMock.orders.data.content.find((row) => row.orderId === Number(orderId));
  if (!order) {
    return {
      success: false,
      status: 404,
      code: "ADMIN_ORDER_NOT_FOUND",
      message: "주문을 찾을 수 없습니다.",
      data: null,
    };
  }
  if (order.paymentStatus !== "APPROVED" && order.paymentStatus !== "REFUNDED") {
    return {
      success: false,
      status: 400,
      code: "ADMIN_ORDER_RECEIPT_NOT_ALLOWED",
      message: "결제 완료 또는 환불된 주문만 영수증을 출력할 수 있습니다.",
      data: null,
    };
  }
  return {
    success: true,
    status: 200,
    code: "ADMIN_ORDER_RECEIPT_PRINT_SUCCESS",
    message: "영수증 출력이 완료되었습니다.",
    data: clone(order),
  };
}

/** Live 목록. empty/error 는 QA fixture */
export function getLiveOrders({ empty = false, error = false, page, size } = {}) {
  if (error) {
    return {
      success: false,
      status: 500,
      code: "LIVE_ORDERS_FETCH_FAILED",
      message: "주문 현황을 불러오지 못했습니다.",
      data: { content: [], totalElements: 0 },
    };
  }
  if (empty) {
    return {
      success: true,
      status: 200,
      code: "LIVE_ORDERS_EMPTY",
      message: "진행 중 주문이 없습니다.",
      data: { content: [], totalElements: 0 },
    };
  }
  return applyListPaging(clone(liveOrders), page, size);
}

const DASHBOARD_RECENT_ORDER_LIMIT = 3;

/** 주문 관리 row → 대시보드 최근 주문 row (createdAt → createdAtLabel) */
function toDashboardRecentOrder(order) {
  const createdAt = String(order.createdAt ?? "");
  const createdAtLabel = createdAt.length >= 16 ? createdAt.slice(11, 16) : "-";
  return {
    orderNo: order.orderNo,
    orderType: order.orderType,
    menuSummary: order.menuSummary,
    totalAmount: order.totalAmount,
    orderStatus: order.orderStatus,
    createdAtLabel,
  };
}

/** 대시보드 — KPI 등은 dashboard mock, 최근 주문만 주문 관리(orders) 소스 */
export function getDashboard() {
  const envelope = clone(adminMock.dashboard);
  const orderRows = getAdminOrders().data?.content ?? [];
  const recentOrders = [...orderRows]
    .sort((a, b) => String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? "")))
    .slice(0, DASHBOARD_RECENT_ORDER_LIMIT)
    .map(toDashboardRecentOrder);
  if (envelope?.data) {
    envelope.data.recentOrders = recentOrders;
  }
  return envelope;
}

/** MENU row는 menus 목록의 name·categoryName으로 맞춘다 (뱃지/이름 불일치 방지). */
function syncSoldOutMenuRow(row, menuById) {
  if (row?.targetType !== "MENU") return row;
  const menu = menuById.get(row.targetId);
  if (!menu) return row;
  return {
    ...row,
    name: menu.name ?? row.name,
    category: menu.categoryName ?? row.category,
    price: menu.price ?? row.price,
  };
}

export function getSoldOutCatalog() {
  const envelope = clone(adminMock.soldOut);
  const menuById = new Map(
    (adminMock.menus?.data?.content ?? []).map((menu) => [menu.menuId, menu]),
  );
  if (envelope?.data) {
    envelope.data.available = (envelope.data.available ?? []).map((row) =>
      syncSoldOutMenuRow(row, menuById),
    );
    envelope.data.soldOut = (envelope.data.soldOut ?? []).map((row) =>
      syncSoldOutMenuRow(row, menuById),
    );
  }
  return envelope;
}

/** 품절 draft 저장 stub — sessionStorage asak_mock_fail_save=1 이면 실패 */
export function saveSoldOutCatalog({ available = [], soldOut = [] } = {}) {
  if (isForcedSaveFail()) {
    return {
      success: false,
      status: 500,
      code: "SOLD_OUT_SAVE_FAILED",
      message: "품절 저장에 실패했습니다. (mock fail)",
      data: null,
    };
  }
  adminMock.soldOut.data.available = clone(available).map((row) => ({
    ...row,
    isSoldOut: false,
  }));
  adminMock.soldOut.data.soldOut = clone(soldOut).map((row) => ({
    ...row,
    isSoldOut: true,
  }));
  return {
    success: true,
    status: 200,
    code: "SOLD_OUT_SAVE_SUCCESS",
    message: "품절 변경사항이 저장되었습니다.",
    data: clone(adminMock.soldOut.data),
  };
}

export function getPaymentMethods() {
  return clone(adminMock.paymentMethods);
}

/** 결제수단 draft 저장 stub — sessionStorage asak_mock_fail_save=1 이면 실패 */
export function savePaymentMethods(rows = []) {
  if (isForcedSaveFail()) {
    return {
      success: false,
      status: 500,
      code: "ADMIN_PAYMENT_METHOD_SAVE_FAILED",
      message: "결제수단 저장에 실패했습니다. (mock fail)",
      data: null,
    };
  }
  adminMock.paymentMethods.data = clone(rows).map((row, index) => ({
    ...row,
    sortOrder: index + 1,
  }));
  return {
    success: true,
    status: 200,
    code: "ADMIN_PAYMENT_METHOD_SAVE_SUCCESS",
    message: "결제수단 설정이 저장되었습니다.",
    data: clone(adminMock.paymentMethods.data),
  };
}

export function getAdminMenus({
  keyword = "",
  categoryName = "",
  onlyActive,
  page,
  size,
} = {}) {
  const envelope = clone(adminMock.menus);
  let rows = envelope.data.content;
  if (keyword) {
    const q = String(keyword).toLowerCase();
    rows = rows.filter((row) => row.name.toLowerCase().includes(q));
  }
  if (categoryName && categoryName !== "전체") {
    rows = rows.filter((row) => row.categoryName === categoryName);
  }
  if (onlyActive === true) {
    rows = rows.filter((row) => row.isActive);
  }
  if (onlyActive === false) {
    rows = rows.filter((row) => !row.isActive);
  }
  envelope.data.content = rows;
  return applyListPaging(envelope, page, size);
}

export function getAdminMenuById(menuId) {
  const found = adminMock.menus.data.content.find((row) => row.menuId === Number(menuId));
  if (!found) {
    return {
      success: false,
      status: 404,
      code: "ADMIN_MENU_NOT_FOUND",
      message: "메뉴를 찾을 수 없습니다.",
      data: null,
    };
  }
  return {
    success: true,
    status: 200,
    code: "ADMIN_MENU_DETAIL_SUCCESS",
    message: "메뉴 상세 조회 성공",
    data: clone(found),
  };
}

/** period: today | week | month | empty | partial
 * empty/partial 은 QA 시나리오용. 화면 탭에는 today/week/month 만 노출한다.
 */
export function getSalesSummary(period = "month") {
  const envelope = clone(adminMock.sales.summary);
  const selected = envelope.data.periods[period] || envelope.data.periods.month;
  envelope.data = {
    period: period,
    ...selected,
    availablePeriods: ["today", "week", "month"],
  };
  return envelope;
}

export function getDailySales() {
  return clone(adminMock.sales.daily);
}

export function getMonthlySales() {
  return clone(adminMock.sales.monthly);
}
