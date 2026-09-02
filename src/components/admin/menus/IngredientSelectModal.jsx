/*
 * Admin/IngredientSelectModal — Figma 150:5525
 * 메뉴 편집 「+ 재료 추가」: 마스터 재료 다중 선택 모달 (mock stub)
 */
import { useEffect, useMemo, useState } from "react";
import dismissIcon from "../../../assets/figma/icon-dismiss.svg";
import { INGREDIENT_CATEGORY_FILTERS, INGREDIENT_CATEGORY_TONE } from "@/constants/ingredientCategories.js";

const FILTERS = INGREDIENT_CATEGORY_FILTERS.map((key) => ({
  key,
  tone: INGREDIENT_CATEGORY_TONE[key] ?? "all",
}));

/** Figma 150:5525 샘플 + mock 카탈로그 */
export const MOCK_INGREDIENT_CATALOG = [
  {
    ingredientId: 9101,
    name: "로메인",
    category: "베이스",
    role: "base",
    quantity: 50,
    unit: "g",
    kcal: 10.5,
    proteinG: 0.9,
    isSoldOut: false,
  },
  {
    ingredientId: 9102,
    name: "케이준 쉬림프",
    category: "단백질",
    role: "core",
    quantity: 80,
    unit: "g",
    kcal: 120,
    proteinG: 17,
    isSoldOut: false,
  },
  {
    ingredientId: 9103,
    name: "새우",
    category: "단백질",
    role: "core",
    quantity: 70,
    unit: "g",
    kcal: 95,
    proteinG: 20,
    isSoldOut: true,
  },
  {
    ingredientId: 9104,
    name: "방울토마토",
    category: "채소",
    role: "plain",
    quantity: 30,
    unit: "g",
    kcal: 18,
    proteinG: 0.8,
    isSoldOut: false,
  },
  {
    ingredientId: 9105,
    name: "옥수수",
    category: "채소",
    role: "plain",
    quantity: 40,
    unit: "g",
    kcal: 86,
    proteinG: 3.2,
    isSoldOut: false,
  },
  {
    ingredientId: 9106,
    name: "양파",
    category: "채소",
    role: "plain",
    quantity: 20,
    unit: "g",
    kcal: 40,
    proteinG: 1.1,
    isSoldOut: false,
  },
  {
    ingredientId: 9107,
    name: "오리엔탈 드레싱",
    category: "드레싱",
    role: "plain",
    quantity: 30,
    unit: "ml",
    kcal: 45,
    proteinG: 0.3,
    isSoldOut: false,
  },
  {
    ingredientId: 9108,
    name: "퀴노아",
    category: "사이드",
    role: "plain",
    quantity: 40,
    unit: "g",
    kcal: 120,
    proteinG: 4.4,
    isSoldOut: false,
  },
  {
    ingredientId: 9109,
    name: "레몬에이드",
    category: "음료",
    role: "plain",
    quantity: 1,
    unit: "잔",
    kcal: 90,
    proteinG: 0,
    isSoldOut: false,
  },
];

function formatNutrition(row) {
  const parts = [
    row.servingG != null ? `${row.servingG}g` : null,
    row.kcal != null ? `${row.kcal}kcal` : null,
    row.carbG != null ? `탄수 ${row.carbG}g` : null,
    row.sugarG != null ? `당류 ${row.sugarG}g` : null,
    row.proteinG != null ? `단백질 ${row.proteinG}g` : null,
    row.fatG != null ? `지방 ${row.fatG}g` : null,
    row.saturatedFatG != null ? `포화 ${row.saturatedFatG}g` : null,
    row.sodiumMg != null ? `나트륨 ${row.sodiumMg}mg` : null,
  ];
  return parts.filter(Boolean).join(" · ") || "-";
}

function categoryTone(category = "") {
  return INGREDIENT_CATEGORY_TONE[category] || "veg";
}

/**
 * @param {object} props
 * @param {boolean} props.open
 * @param {string} [props.title]
 * @param {string} [props.description]
 * @param {Array} [props.catalog]
 * @param {Array<{ingredientId?: number, name?: string}>} [props.existingIngredients]
 * @param {(rows: Array) => void} [props.onConfirm]
 * @param {() => void} [props.onClose]
 */
export default function IngredientSelectModal({
  open,
  title = "베이스 재료 추가",
  description = "추가할 재료를 선택해 주세요.",
  catalog = MOCK_INGREDIENT_CATALOG,
  existingIngredients = [],
  onConfirm,
  onClose,
}) {
  const [keyword, setKeyword] = useState("");
  const [filter, setFilter] = useState("전체");
  const [selectedIds, setSelectedIds] = useState(() => new Set());

  const alreadyAddedKeys = useMemo(() => {
    const ids = new Set();
    const names = new Set();
    existingIngredients.forEach((row) => {
      if (row?.ingredientId != null) ids.add(row.ingredientId);
      if (row?.name) names.add(String(row.name).trim());
    });
    return { ids, names };
  }, [existingIngredients]);

  const rows = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    return catalog
      .map((item) => {
        const alreadyAdded =
          alreadyAddedKeys.ids.has(item.ingredientId) ||
          alreadyAddedKeys.names.has(String(item.name).trim());
        return { ...item, alreadyAdded };
      })
      .filter((item) => {
        if (filter !== "전체" && item.category !== filter) return false;
        if (!q) return true;
        return String(item.name).toLowerCase().includes(q);
      });
  }, [alreadyAddedKeys, catalog, filter, keyword]);

  const selectableRows = rows.filter((row) => !row.alreadyAdded);
  const selectedRows = selectableRows.filter((row) => selectedIds.has(row.ingredientId));
  const selectedCount = selectedRows.length;
  const soldOutSelectedCount = selectedRows.filter((row) => row.isSoldOut).length;
  const allSelectableChecked =
    selectableRows.length > 0 && selectableRows.every((row) => selectedIds.has(row.ingredientId));

  useEffect(() => {
    if (!open) return undefined;
    setKeyword("");
    setFilter("전체");
    setSelectedIds(new Set());

    function onKeyDown(event) {
      if (event.key === "Escape") onClose?.();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  function toggleId(ingredientId, disabled) {
    if (disabled) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(ingredientId)) next.delete(ingredientId);
      else next.add(ingredientId);
      return next;
    });
  }

  function toggleAll() {
    if (allSelectableChecked) {
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds(new Set(selectableRows.map((row) => row.ingredientId)));
  }

  function handleConfirm() {
    const picked = catalog.filter(
      (item) =>
        selectedIds.has(item.ingredientId) &&
        !alreadyAddedKeys.ids.has(item.ingredientId) &&
        !alreadyAddedKeys.names.has(String(item.name).trim()),
    );
    onConfirm?.(picked);
  }

  return (
    <div
      className="ingredient-select-layer"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <section
        className="ingredient-select-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ingredient-select-title"
        data-figma-node="150:5525"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="ingredient-select-modal__header">
          <div>
            <h2 id="ingredient-select-title">{title}</h2>
            <p>{description}</p>
          </div>
          <button
            type="button"
            className="ingredient-select-modal__close"
            aria-label="닫기"
            onClick={onClose}
          >
            <img src={dismissIcon} alt="" width={28} height={28} />
          </button>
        </header>

        <div className="ingredient-select-modal__toolbar">
          <label className="ingredient-select-modal__search">
            <span className="sr-only">재료명 검색</span>
            <input
              value={keyword}
              placeholder="재료명 검색"
              onChange={(event) => setKeyword(event.target.value)}
            />
          </label>
          <div className="ingredient-select-modal__filters" role="tablist" aria-label="재료 유형">
            {FILTERS.map((chip) => (
              <button
                key={chip.key}
                type="button"
                role="tab"
                aria-selected={filter === chip.key}
                className={`ingredient-filter-chip ingredient-filter-chip--${chip.tone}${
                  filter === chip.key ? " is-active" : ""
                }`}
                onClick={() => setFilter(chip.key)}
              >
                {chip.key}
              </button>
            ))}
          </div>
        </div>

        <div className="ingredient-select-modal__table">
          <div className="ingredient-select-modal__thead">
            <button
              type="button"
              className={`ingredient-check${allSelectableChecked ? " is-checked" : ""}`}
              aria-label="전체 선택"
              aria-pressed={allSelectableChecked}
              disabled={selectableRows.length === 0}
              onClick={toggleAll}
            />
            <span>재료명</span>
            <span>유형</span>
            <span>영양정보</span>
            <span>상태</span>
          </div>

          <div className="ingredient-select-modal__tbody">
            {rows.length === 0 ? (
              <p className="ingredient-select-modal__empty">검색 결과가 없습니다.</p>
            ) : (
              rows.map((row) => {
                const checked = selectedIds.has(row.ingredientId);
                const disabled = row.alreadyAdded;
                const soldOut = !!row.isSoldOut;
                const rowClass = [
                  "ingredient-select-row",
                  checked ? "is-selected" : "",
                  soldOut && !disabled ? "is-soldout" : "",
                  disabled ? "is-disabled" : "",
                ]
                  .filter(Boolean)
                  .join(" ");

                return (
                  <div key={row.ingredientId}>
                    <div
                      className={rowClass}
                      role="button"
                      tabIndex={disabled ? -1 : 0}
                      aria-disabled={disabled}
                      aria-pressed={checked}
                      onClick={() => toggleId(row.ingredientId, disabled)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          toggleId(row.ingredientId, disabled);
                        }
                      }}
                    >
                      <span
                        className={`ingredient-check${checked ? " is-checked" : ""}${
                          disabled ? " is-disabled" : ""
                        }`}
                        aria-hidden="true"
                      />
                      <strong className="ingredient-select-row__name">{row.name}</strong>
                      <span
                        className={`ingredient-type-badge ingredient-type-badge--${categoryTone(
                          row.category,
                        )}`}
                      >
                        {row.category}
                      </span>
                      <span className="ingredient-select-row__nutrition">
                        {formatNutrition(row)}
                      </span>
                      {disabled ? (
                        <span className="ingredient-status-badge ingredient-status-badge--added">
                          이미 추가됨
                        </span>
                      ) : soldOut ? (
                        <span className="ingredient-status-badge ingredient-status-badge--soldout">
                          품절
                        </span>
                      ) : (
                        <span className="ingredient-status-badge ingredient-status-badge--available">
                          판매중
                        </span>
                      )}
                    </div>
                    {soldOut && !disabled ? (
                      <p className="ingredient-select-modal__soldout-note">
                        ⚠ 품절 재료는 메뉴에 포함되지만 고객 주문 화면에는 노출되지 않습니다.
                      </p>
                    ) : null}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <footer className="ingredient-select-modal__footer">
          <p className="ingredient-select-modal__summary">
            <span>{selectedCount}개 선택됨</span>
            {soldOutSelectedCount > 0 ? (
              <>
                <span> · </span>
                <em>품절 재료 {soldOutSelectedCount}개 포함</em>
              </>
            ) : null}
          </p>
          <div className="ingredient-select-modal__actions">
            <button type="button" onClick={onClose}>
              취소
            </button>
            <button
              type="button"
              className="is-primary"
              disabled={selectedCount === 0}
              onClick={handleConfirm}
            >
              추가
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}
