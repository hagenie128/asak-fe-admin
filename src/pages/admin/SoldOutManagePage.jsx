/* SCR-011 / Sold-out — getSoldOutCatalog() → useSoldOutDraft */
import { INGREDIENT_CATEGORY_FILTERS } from "@/constants/ingredientCategories.js";
import { useMemo, useState } from "react";
import chickenImage from "../../assets/figma/soldout-chicken.png";
import pastaImage from "../../assets/figma/soldout-pasta.png";
import ricottaImage from "../../assets/figma/soldout-ricotta.png";
import salmonImage from "../../assets/figma/soldout-salmon.png";
import sandwichImage from "../../assets/figma/soldout-sandwich.png";
import tomatoImage from "../../assets/figma/soldout-tomato.png";
import AdminAsyncState from "../../components/admin/shared/AdminAsyncState.jsx";
import AdminConfirmDialog from "../../components/admin/shared/AdminConfirmDialog.jsx";
import AdminPagination from "../../components/admin/shared/AdminPagination.jsx";
import AdminSearchInput from "../../components/admin/shared/AdminSearchInput.jsx";
import AdminTopHeader from "../../components/admin/shared/AdminTopHeader.jsx";
import { ADMIN_PAGINATION } from "../../constants/pagination.js";
import { usePagination } from "../../hooks/usePagination.js";
import { soldOutRowKey, useSoldOutDraft } from "../../hooks/useSoldOutDraft.js";

const TABS = [
  { label: "메뉴", targetType: "MENU" },
  { label: "재료", targetType: "INGREDIENT" },
];
const TAB_LABEL_BY_TYPE = Object.fromEntries(TABS.map((tab) => [tab.targetType, tab.label]));
const SOLD_OUT_PAGINATION = ADMIN_PAGINATION.soldOut;

const IMAGE_BY_KEY = {
  chicken: chickenImage,
  pasta: pastaImage,
  ricotta: ricottaImage,
  salmon: salmonImage,
  sandwich: sandwichImage,
  tomato: tomatoImage,
};

function ItemCard({ item, checked, onToggle, soldOut = false, showType = false }) {
  const image = item.imageUrl || IMAGE_BY_KEY[item.imageKey] || tomatoImage;

  return (
    <article
      className={`sold-out-card${checked ? " is-checked" : ""}`}
      role="checkbox"
      aria-checked={checked}
      aria-label={`${item.name} 선택`}
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onToggle();
        }
      }}
    >
      <div className="sold-out-card__image">
        <img src={image} alt="" />
        <input type="checkbox" checked={checked} readOnly tabIndex={-1} aria-hidden="true" />
      </div>
      <div className="sold-out-card__info">
        <strong title={item.name}>{item.name}</strong>
        <div className="sold-out-card__chips">
          {showType && TAB_LABEL_BY_TYPE[item.targetType] ? (
            <span className="sold-out-chip sold-out-chip--type">
              {TAB_LABEL_BY_TYPE[item.targetType]}
            </span>
          ) : null}
          {item.category ? <span className="sold-out-chip">{item.category}</span> : null}
          {/* {Number(item.affectedMenuCount) > 0 ? (
                <span className="sold-out-chip sold-out-chip--affected">
                  영향 메뉴 {item.affectedMenuCount}개
                </span>
              ) : null} */}
          {/* {soldOut || item.isSoldOut ? <AdminStatusBadge role="soldOut" /> : null} */}
        </div>
      </div>
    </article>
  );
}

function AvailablePanel({
  items,
  totalCount,
  selectedTab,
  onTabChange,
  keyword,
  onKeywordChange,
  categories,
  selectedCategory,
  onCategoryChange,
  selectedKeys,
  onToggle,
  pagination,
}) {
  return (
    <section className="sold-out-panel" aria-label="판매 항목">
      <div className="sold-out-panel__controls">
        <div className="sold-out-tabs" aria-label="항목 유형">
          {TABS.map((tab) => (
            <button
              key={tab.targetType}
              type="button"
              className={tab.targetType === selectedTab ? "is-selected" : ""}
              onClick={() => onTabChange(tab.targetType)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <label className="sold-out-search">
          <span className="sr-only">이름으로 검색</span>
          <AdminSearchInput
            className="admin-search-input--embedded"
            value={keyword}
            placeholder="이름으로 검색..."
            onChange={(next) => onKeywordChange(next)}
          />
          <i aria-hidden="true" />
        </label>
      </div>

      <div className="sold-out-chips" aria-label="카테고리">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            className={category === selectedCategory ? "is-selected" : ""}
            onClick={() => onCategoryChange(category)}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="sold-out-panel__title">
        <strong>전체 항목</strong>
        <span>{totalCount}</span>
      </div>

      <div className="sold-out-grid">
        {items.length === 0 ? (
          <AdminAsyncState
            status="empty"
            layout="section"
            title="표시할 항목이 없습니다"
            description="유형·카테고리·검색어를 바꿔 보세요."
          />
        ) : (
          items.map((item) => {
            const key = soldOutRowKey(item);
            return (
              <ItemCard
                key={key}
                item={item}
                checked={selectedKeys.has(key)}
                onToggle={() => onToggle(key)}
              />
            );
          })
        )}
      </div>

      <AdminPagination
        className="sold-out-panel__pagination"
        page={pagination.page}
        pageSize={pagination.pageSize}
        totalElements={pagination.totalElements}
        windowSize={SOLD_OUT_PAGINATION.windowSize}
        onPageChange={pagination.goToPage}
      />
    </section>
  );
}

function SoldOutPanel({
  items,
  totalCount,
  dirtyCount,
  canSave,
  isSaving,
  selectedKeys,
  onToggle,
  onSelectPage,
  onClearSelection,
  onSave,
  pagination,
}) {
  const hasSelection = selectedKeys.size > 0;

  function handleToggleAll() {
    if (hasSelection) {
      onClearSelection();
      return;
    }
    onSelectPage(items);
  }

  return (
    <section className="sold-out-panel sold-out-panel--selected" aria-label="품절 항목">
      <div className="sold-out-panel__controls sold-out-panel__controls--selected">
        <div className="sold-out-panel__title">
          <strong>품절 목록</strong>
          <span>{totalCount}</span>
        </div>
        <button
          type="button"
          className="sold-out-clear"
          disabled={!hasSelection && items.length === 0}
          onClick={handleToggleAll}
        >
          {hasSelection ? "전체 해제" : "전체 선택"}
        </button>
      </div>

      <div className="sold-out-grid">
        {items.length === 0 ? (
          <AdminAsyncState
            status="empty"
            layout="section"
            title="품절 항목이 없습니다"
            description="왼쪽에서 항목을 선택해 품절 목록으로 옮기세요."
          />
        ) : (
          items.map((item) => {
            const key = soldOutRowKey(item);
            return (
              <ItemCard
                key={key}
                item={item}
                soldOut
                showType
                checked={selectedKeys.has(key)}
                onToggle={() => onToggle(key)}
              />
            );
          })
        )}
      </div>

      <AdminPagination
        className="sold-out-panel__pagination"
        page={pagination.page}
        pageSize={pagination.pageSize}
        totalElements={pagination.totalElements}
        windowSize={SOLD_OUT_PAGINATION.windowSize}
        onPageChange={pagination.goToPage}
      />

      <div className="sold-out-save">
        <span className="sold-out-save__badge">변경사항 {dirtyCount}건</span>
        <button type="button" disabled={!canSave} onClick={onSave}>
          {isSaving ? "저장 중…" : "변경사항 저장"}
        </button>
      </div>
    </section>
  );
}

export default function SoldOutManagePage() {
  const draft = useSoldOutDraft();
  const [selectedTab, setSelectedTab] = useState(TABS[0].targetType);
  const [keyword, setKeyword] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [saveConfirmOpen, setSaveConfirmOpen] = useState(false);

  const typedAvailable = useMemo(
    () => draft.available.filter((row) => row.targetType === selectedTab),
    [draft.available, selectedTab],
  );

  const categories = useMemo(() => {
    if (selectedTab === "INGREDIENT") {
      return INGREDIENT_CATEGORY_FILTERS;
    }
    const names = new Set(typedAvailable.map((row) => row.category).filter(Boolean));
    return ["전체", ...names];
  }, [typedAvailable, selectedTab]);

  const filteredAvailable = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    return typedAvailable.filter((row) => {
      if (selectedCategory !== "전체" && row.category !== selectedCategory) return false;
      if (
        q &&
        !String(row.name ?? "")
          .toLowerCase()
          .includes(q)
      )
        return false;
      return true;
    });
  }, [typedAvailable, selectedCategory, keyword]);

  const availablePage = usePagination(filteredAvailable, {
    pageSize: SOLD_OUT_PAGINATION.pageSize,
  });
  const soldOutPage = usePagination(draft.soldOut, {
    pageSize: SOLD_OUT_PAGINATION.pageSize,
  });

  function handleTabChange(targetType) {
    setSelectedTab(targetType);
    setSelectedCategory("전체");
    setKeyword("");
    availablePage.resetPage();
  }

  function handleCategoryChange(name) {
    setSelectedCategory(name);
    availablePage.resetPage();
  }

  function handleKeywordChange(value) {
    setKeyword(value);
    availablePage.resetPage();
  }

  async function handleSaveConfirm() {
    setSaveConfirmOpen(false);
    const result = await draft.save();
    if (result.success) {
      toast.success(result.message || "저장되었습니다.");
    } else {
      toast.error(result.message || "저장에 실패했습니다.");
    }
  }

  if (draft.status === "loading") {
    return (
      <section className="sold-out-management">
        <AdminTopHeader
          crumb="Admin / 품절 관리"
          title="품절 관리"
          description="메뉴와 재료의 판매 상태를 관리하세요."
        />
        <AdminAsyncState status="loading" layout="page" loadingVariant="card" />
      </section>
    );
  }

  if (draft.status === "error") {
    return (
      <section className="sold-out-management">
        <AdminTopHeader
          crumb="Admin / 품절 관리"
          title="품절 관리"
          description="메뉴와 재료의 판매 상태를 관리하세요."
        />
        <AdminAsyncState
          status="error"
          layout="page"
          title="품절 목록을 불러오지 못했습니다"
          description={draft.error?.message || "잠시 후 다시 시도해 주세요."}
          onRetry={draft.refetch}
        />
      </section>
    );
  }

  return (
    <section className="sold-out-management" data-figma-node="241:14211">
      <AdminTopHeader
        crumb="Admin / 품절 관리"
        title="품절 관리"
        description="메뉴와 재료의 판매 상태를 관리하세요."
      />
      <div className="sold-out-management__workspace">
        <AvailablePanel
          items={availablePage.pageItems}
          totalCount={availablePage.totalElements}
          selectedTab={selectedTab}
          onTabChange={handleTabChange}
          keyword={keyword}
          onKeywordChange={handleKeywordChange}
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
          selectedKeys={draft.selectedAvailable}
          onToggle={draft.toggleAvailableSelect}
          pagination={availablePage}
        />
        <div className="sold-out-transfer" aria-label="항목 이동">
          <button
            type="button"
            className="is-primary"
            disabled={!draft.canMoveToSoldOut}
            aria-label="품절 목록으로 이동"
            onClick={draft.moveToSoldOut}
          >
            →
          </button>
          <button
            type="button"
            disabled={!draft.canMoveToAvailable}
            aria-label="전체 항목으로 이동"
            onClick={draft.moveToAvailable}
          >
            ←
          </button>
        </div>
        <SoldOutPanel
          items={soldOutPage.pageItems}
          totalCount={soldOutPage.totalElements}
          dirtyCount={draft.dirtyCount}
          canSave={draft.canSave}
          isSaving={draft.isSaving}
          selectedKeys={draft.selectedSoldOut}
          onToggle={draft.toggleSoldOutSelect}
          onSelectPage={draft.selectSoldOutPage}
          onClearSelection={draft.clearSoldOutSelection}
          onSave={() => setSaveConfirmOpen(true)}
          pagination={soldOutPage}
        />
      </div>
      <AdminConfirmDialog
        open={saveConfirmOpen}
        title="변경 내용을 저장할까요?"
        description={
          draft.pendingAffectedMenuCount > 0
            ? `품절 상태 변경 ${draft.dirtyCount}건을 저장합니다. 영향 메뉴 ${draft.pendingAffectedMenuCount}개`
            : `품절 상태 변경 ${draft.dirtyCount}건을 저장합니다.`
        }
        confirmLabel="저장"
        tone="warning"
        isBusy={draft.isSaving}
        onConfirm={handleSaveConfirm}
        onCancel={() => setSaveConfirmOpen(false)}
      />
    </section>
  );
}
