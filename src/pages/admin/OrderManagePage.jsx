import { useMemo, useState } from "react";
import { ordersApi } from "../../api/ordersApi.js";
import OrderDetailPanel from "../../components/admin/orders/OrderDetailPanel.jsx";
import OrderTable from "../../components/admin/orders/OrderTable.jsx";
import AdminConfirmDialog from "../../components/admin/shared/AdminConfirmDialog.jsx";
import AdminDatePicker from "../../components/admin/shared/AdminDatePicker.jsx";
import AdminFilterDropdown from "../../components/admin/shared/AdminFilterDropdown.jsx";
import AdminPagination from "../../components/admin/shared/AdminPagination.jsx";
import AdminSearchInput from "../../components/admin/shared/AdminSearchInput.jsx";
import AdminTopHeader from "../../components/admin/shared/AdminTopHeader.jsx";
import {
  ORDER_STATUS_LABEL,
  ORDER_TYPE_LABEL,
  PAYMENT_STATUS_LABEL,
} from "../../constants/orderLabels.js";
import { ADMIN_PAGINATION } from "../../constants/pagination.js";
import { useOrdersQuery } from "../../hooks/useOrdersQuery.js";
import { usePrintReceiptQuery } from "../../hooks/usePrintReceiptQuery.js";
import { toast } from "../../utils/toast.js";

const ORDERS_PAGINATION = ADMIN_PAGINATION.orders;

/** 일/월 매출과 동일 — mock 연간 범위 (좁은 7/1~7/20 해제) */
const CALENDAR_MIN = "2026-01-01";
const CALENDAR_MAX = "2026-12-31";

function toYmd(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function defaultOrderDate() {
  const today = toYmd(new Date());
  if (today < CALENDAR_MIN) return CALENDAR_MIN;
  if (today > CALENDAR_MAX) return CALENDAR_MAX;
  return today;
}

const DEFAULT_ORDER_DATE = defaultOrderDate();

const ORDER_STATUS_OPTIONS = [
  { value: "", label: "주문 상태 전체" },
  ...Object.entries(ORDER_STATUS_LABEL).map(([value, label]) => ({ value, label })),
];

const PAYMENT_STATUS_OPTIONS = [
  { value: "", label: "결제 상태 전체" },
  ...Object.entries(PAYMENT_STATUS_LABEL).map(([value, label]) => ({ value, label })),
];

const ORDER_TYPE_OPTIONS = [
  { value: "", label: "주문 유형 전체" },
  ...Object.entries(ORDER_TYPE_LABEL).map(([value, label]) => ({ value, label })),
];

/* SCR-010 / 주문 관리 — 목록 + 상세 패널 (/orders) */
export default function OrderManagePage() {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [draftFilters, setDraftFilters] = useState({
    orderStatus: "",
    paymentStatus: "",
    orderType: "",
    dateFrom: DEFAULT_ORDER_DATE,
    dateTo: DEFAULT_ORDER_DATE,
    keyword: "",
  });
  const [appliedFilters, setAppliedFilters] = useState(() => ({
    orderStatus: "",
    paymentStatus: "",
    orderType: "",
    dateFrom: DEFAULT_ORDER_DATE,
    dateTo: DEFAULT_ORDER_DATE,
    keyword: "",
  }));
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null);

  const { status, orders, totalElements, page, pageSize, onPageChange, refetch } = useOrdersQuery({
    pageSize: ORDERS_PAGINATION.pageSize,
    filters: appliedFilters,
  });

  // Hook은 컴포넌트 최상위에서 한 번만 호출해야 하므로(Rules of Hooks) 여기서 가져온다.
  // printReceipt(order)를 부를 때마다 자기 진행 상태를 담은 토스트를 스스로 관리하므로,
  // 이 Page는 진행 중 상태를 따로 들고 있지 않는다 — 여러 건을 연달아 출력해도 각자 독립.
  const { printReceipt } = usePrintReceiptQuery();

  const dateButtonLabel = useMemo(() => {
    const from = draftFilters.dateFrom || appliedFilters.dateFrom || DEFAULT_ORDER_DATE;
    const to = draftFilters.dateTo || appliedFilters.dateTo || from;
    if (from === to) return from.replaceAll("-", ".");
    return `${from.replaceAll("-", ".")} ~ ${to.replaceAll("-", ".")}`;
  }, [appliedFilters, draftFilters]);

  const handleOrderDetail = async (orderId) => {
    const result = await ordersApi.orderDetail(orderId);
    console.log("handleOrderDetail result:", result);
    if (result?.success === false) {
      toast.error(result.message);
      return;
    }
    setSelectedOrder(result);
  };

  function handlePageChange(nextPage) {
    onPageChange(nextPage);
    setSelectedOrder(null);
  }

  function handleSearch() {
    setAppliedFilters({ ...draftFilters });
    setSelectedOrder(null);
    onPageChange(0);
  }

  function handleDateChange(range) {
    setDraftFilters((prev) => ({
      ...prev,
      dateFrom: range.from,
      dateTo: range.to,
    }));
  }
  // TODO-042: backend TODO-038/039 및 frontend TODO-040 완료 후 실제 ordersApi.orderRefund + ConfirmDialog를 연결한다.
  // 카드/신용카드는 이번 범위다. 토스페이는 실제 연동·결제 과정 통합 테스트가 성공할 때만 노출·처리하며,
  // 승인 결제만 환불 가능한지와 409/이미 환불됨 응답을 구분하고 성공 뒤 refetch()로 목록을 갱신한다.
  async function handleRefund(orderId) {
    setConfirmDialog({
      title: "환불하시겠습니까?",
      description: "환불 처리 후 결제 상태가 변경됩니다.",
      confirmLabel: "환불",
      tone: "danger",
      onConfirm: async () => {
        const result = await ordersApi.orderRefund(orderId);
        if (result?.success === false) {
          toast.error(result.message);
          return;
        }
        toast.success(result.message);
        setSelectedOrder(result);
        await printReceipt(result, { onCompleted: () => refetch() });
      },
    });
  }

  // TODO-043: OrderDetailPanel의 "영수증 출력" 버튼(onPrintReceipt(selectedOrder))에서
  // 전체 주문 객체를 그대로 받는다. buildReceiptText가 옵션·제외재료·요청사항까지 필요로 하므로
  // orderId만으로는 부족해서 OrderDetailPanel이 이미 들고 있는 selectedOrder를 통째로 넘겨받는다.
  function handlePrintReceipt(order) {
    setConfirmDialog({
      title: "영수증을 출력하시겠습니까?",
      description: "선택한 주문의 영수증을 출력합니다.",
      confirmLabel: "출력",
      tone: "warning",
      onConfirm: () => {
        // 이 확인창은 여기서 바로 닫힌다 ("정말 출력할지" 묻는 용도). 실제 요청 중/완료/실패
        // 진행 상태는 화면을 막지 않는 토스트로 보여준다 — 그래야 이 확인창을 닫은 뒤에도
        // 다른 주문을 계속 조회·출력하는 등 다른 동작을 같이 할 수 있다.
        printReceipt(order, { onCompleted: refetch });
      },
    });
  }

  function handleConfirm() {
    const action = confirmDialog?.onConfirm;
    setConfirmDialog(null);
    action?.();
  }

  return (
    <section className="order-management">
      <AdminTopHeader
        crumb="Admin / 주문 관리"
        title="주문 관리"
        description="주문 원본 데이터 조회와 결제 상태 확인을 관리하세요."
      />
      <div className="order-management__filters">
        <AdminFilterDropdown
          label="주문 상태"
          value={draftFilters.orderStatus}
          options={ORDER_STATUS_OPTIONS}
          onChange={(orderStatus) => setDraftFilters((prev) => ({ ...prev, orderStatus }))}
        />
        <AdminFilterDropdown
          label="결제 상태"
          value={draftFilters.paymentStatus}
          options={PAYMENT_STATUS_OPTIONS}
          onChange={(paymentStatus) => setDraftFilters((prev) => ({ ...prev, paymentStatus }))}
        />
        <AdminFilterDropdown
          label="주문 유형"
          value={draftFilters.orderType}
          options={ORDER_TYPE_OPTIONS}
          onChange={(orderType) => setDraftFilters((prev) => ({ ...prev, orderType }))}
        />
        <AdminDatePicker
          mode="range"
          monthsVisible={1}
          open={calendarOpen}
          value={{ from: draftFilters.dateFrom, to: draftFilters.dateTo }}
          minDate={CALENDAR_MIN}
          maxDate={CALENDAR_MAX}
          onChange={handleDateChange}
          onClose={() => setCalendarOpen(false)}
        >
          <button
            type="button"
            className={`order-management__date-trigger${calendarOpen || draftFilters.dateFrom ? " is-active" : ""}`}
            aria-expanded={calendarOpen}
            onClick={() => setCalendarOpen((v) => !v)}
          >
            <span>{dateButtonLabel}</span>
            <span className="admin-filter-dropdown__chevron" aria-hidden="true" />
          </button>
        </AdminDatePicker>
        <AdminSearchInput
          className="order-management__keyword"
          aria-label="주문 검색"
          placeholder="주문번호 / 메뉴명 검색"
          value={draftFilters.keyword}
          onChange={(keyword) => setDraftFilters((prev) => ({ ...prev, keyword }))}
          onKeyDown={(event) => {
            if (event.key === "Enter") handleSearch();
          }}
        />
        <button className="order-management__search" type="button" onClick={handleSearch}>
          조회
        </button>
      </div>
      <div className="order-management__body">
        <div className="order-management__table-wrap">
          <OrderTable
            status={status}
            orders={orders}
            selectedOrderId={selectedOrder?.orderId ?? null}
            onOrderDetail={handleOrderDetail}
            onRetry={refetch}
          />
          <AdminPagination
            page={page}
            pageSize={pageSize}
            totalElements={totalElements}
            windowSize={ORDERS_PAGINATION.windowSize}
            onPageChange={handlePageChange}
          />
        </div>
        <OrderDetailPanel
          selectedOrder={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onRefund={handleRefund}
          onPrintReceipt={handlePrintReceipt}
        />
      </div>
      <AdminConfirmDialog
        open={Boolean(confirmDialog)}
        title={confirmDialog?.title}
        description={confirmDialog?.description}
        confirmLabel={confirmDialog?.confirmLabel}
        tone={confirmDialog?.tone ?? "danger"}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmDialog(null)}
      />
    </section>
  );
}
