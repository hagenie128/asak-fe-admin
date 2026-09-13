/*
 * SCR-016 Detail Add/Edit — Figma 134:12400 menu-edit-operational
 * 메뉴 관리 우측 패널: 신규·수정 공용 편집 카드
 * TODO-005: 재료 목록 서버 검색·페이지 처리.
 * 현재는 모달을 열 때 getIngredients()로 목록 전체를 받고, 화면에서만 키워드 필터링한다.
 * 남은 작업: backend 검색/페이지 계약이 확정되면 keyword/page/size와 PageResult 응답을 합의하고,
 * 요청 취소·마지막 응답만 반영하는 규칙까지 포함해 모달 페이지 이동을 연결한다.
 * TODO-006: 재료 추가·저장 수동 QA.
 * 추가, 중복 방지, core/base/plain 분류, 저장 후 상세·키오스크 반영을 브라우저와 API 응답으로 확인한다.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import ricottaImage from "../../../assets/figma/soldout-ricotta.png";
import { formatCurrency } from "../../../utils/currency.js";
import AdminConfirmDialog from "../shared/AdminConfirmDialog.jsx";
import AdminStatusBadge from "../shared/AdminStatusBadge.jsx";
import IngredientSelectModal from "./IngredientSelectModal.jsx";
import { menusApi } from "../../../api/menusApi.js";

const DESC_MAX = 300;
const TAG_OPTIONS = [
  { code: "BEST", name: "BEST", colorHex: "#E87500" },
  { code: "NEW", name: "NEW", colorHex: "#2563EB" },
  { code: "VEGAN", name: "VEGAN", colorHex: "#077E40" },
];

const EMPTY_FORM = {
  name: "",
  categoryId: "",
  price: "",
  description: "",
  isSoldOut: false,
  imageUrl: "",
};

const MENU_FIELD_KEYS = ["name", "categoryId", "price", "description", "isSoldOut", "imageUrl"];

function buildChangeSnapshot(form, ingredients, optionGroups, tags) {
  return {
    form: Object.fromEntries(MENU_FIELD_KEYS.map((key) => [key, form[key] ?? ""])),
    ingredients,
    optionGroups,
    tags,
  };
}

function countChangedRows(beforeRows = [], currentRows = [], getId) {
  const beforeById = new Map(beforeRows.map((row) => [getId(row), row]));
  const currentById = new Map(currentRows.map((row) => [getId(row), row]));
  const rowIds = new Set([...beforeById.keys(), ...currentById.keys()]);

  return [...rowIds].reduce((count, rowId) => {
    if (JSON.stringify(beforeById.get(rowId)) !== JSON.stringify(currentById.get(rowId))) {
      return count + 1;
    }
    return count;
  }, 0);
}

function countChanges(baseline, current) {
  const changedFields = MENU_FIELD_KEYS.filter(
    (key) => baseline.form[key] !== current.form[key],
  ).length;
  const changedIngredients = countChangedRows(
    baseline.ingredients,
    current.ingredients,
    (row) => row.ingredientId,
  );
  const changedOptionGroups = countChangedRows(
    baseline.optionGroups,
    current.optionGroups,
    (row) => row.groupId ?? row.optionGroupId,
  );
  const changedTags = countChangedRows(baseline.tags, current.tags, (row) => row.code ?? row.name);

  return changedFields + changedIngredients + changedOptionGroups + changedTags;
}

function formatIngredientMeta(ingredient) {
  const qty = `${ingredient.quantity ?? ""}${ingredient.unit ?? ""}`.trim();
  const parts = [qty || null];
  if (ingredient.isDefault) parts.push("기본 포함");
  parts.push(ingredient.canRemove === false ? "제거 불가" : "제거 가능");
  return parts.filter(Boolean).join(" · ");
}

function tagClassName(code = "") {
  const upper = String(code).toUpperCase();
  if (upper === "BEST") return "menu-tag menu-tag--best";
  if (upper === "NEW") return "menu-tag menu-tag--new";
  if (upper === "VEGAN") return "menu-tag menu-tag--vegan";
  return "menu-tag";
}

function normalizeOptionGroups(groups = []) {
  return groups.map((group) => {
    const items = group.items ?? [];

    if (!group.isRequired) {
      return {
        ...group,
        recommendedLabel: null,
        items: items.map((item) => ({ ...item, isRecommended: false })),
      };
    }

    const recommendedItem =
      items.find((item) => item.isRecommended && !item.isSoldOut) ??
      items.find((item) => !item.isSoldOut) ??
      items[0];

    return {
      ...group,
      recommendedLabel: recommendedItem?.name ?? null,
      items: items.map((item) => ({
        ...item,
        isRecommended: item.optionItemId === recommendedItem?.optionItemId,
      })),
    };
  });
}

/** API IngredientResponse → IngredientSelectModal catalog row */
function toIngredientCatalogItem(item) {
  const category = item.roleName || item.unitName || item.type || "기타";
  const hint = String(item.roleName || item.role || category).toLowerCase();
  let role = "plain";
  if (hint.includes("base") || category === "베이스") role = "base";
  else if (hint.includes("core") || category === "단백질" || category.includes("핵심")) {
    role = "core";
  }

  // BE CreateMenuIngredientRequest.unit 은 UNIT_TYPE 코드(예: G). 표시명(그램)을내면 등록이 실패한다.
  const unitCode = normalizeUnitCode(item.unitCode || item.unit || item.unitName);

  return {
    ingredientId: item.id ?? item.ingredientId,
    name: item.name,
    category,
    role,
    quantity: item.quantity ?? item.servingG ?? 0,
    unit: unitCode,
    servingG: item.servingG,
    kcal: item.kcal,
    carbG: item.carbG,
    sugarG: item.sugarG,
    proteinG: item.proteinG,
    fatG: item.fatG,
    saturatedFatG: item.saturatedFatG,
    sodiumMg: item.sodiumMg,
    isSoldOut: !!(item.isSoldOut ?? item.soldOut),
  };
}

function normalizeUnitCode(raw) {
  if (raw == null || String(raw).trim() === "") return "G";
  const value = String(raw).trim();
  const upper = value.toUpperCase();
  if (upper === "G" || upper === "GRAM" || upper === "GRAMS" || value === "그램" || value === "g") {
    return "G";
  }
  if (upper === "ML" || upper === "MILLILITER" || value === "밀리리터") {
    return "ML";
  }
  if (/^[A-Z0-9_]+$/i.test(value)) return upper;
  return "G";
}

function normalizeIngredientRole(role) {
  const value = String(role ?? "").trim().toLowerCase();
  if (value === "core") return "core";
  if (value === "base") return "base";
  return "plain";
}

function normalizeIngredient(row) {
  return { ...row, role: normalizeIngredientRole(row.role) };
}

function menuIsSoldOut(menu) {
  return !!(menu?.isSoldOut ?? menu?.soldOut);
}

function sumNutrition(ingredientRows, catalog = []) {
  const byId = new Map(
    catalog.map((row) => [row.ingredientId ?? row.id, row]).filter(([id]) => id != null),
  );
  const totals = { kcal: 0, carbG: 0, proteinG: 0, fatG: 0, sodiumMg: 0 };
  let any = false;
  for (const row of ingredientRows) {
    const source = byId.get(row.ingredientId) ?? row;
    for (const key of Object.keys(totals)) {
      const value = Number(source[key]);
      if (Number.isFinite(value)) {
        totals[key] += value;
        any = true;
      }
    }
  }
  if (!any) return null;
  return Object.fromEntries(
    Object.entries(totals).map(([key, value]) => [key, Math.round(value * 10) / 10]),
  );
}

function normalizeTags(tags = []) {
  return tags
    .map((tag) => {
      if (typeof tag === "string") {
        const matched = TAG_OPTIONS.find((option) => option.code === tag || option.name === tag);
        return matched ? { code: matched.code, name: matched.name } : { code: tag, name: tag };
      }
      if (!tag || (tag.code == null && tag.name == null)) return null;
      return {
        code: tag.code ?? tag.name,
        name: tag.name ?? tag.code,
      };
    })
    .filter(Boolean);
}

function IngredientGroup({ title, tone, rows, onRemove }) {
  if (!rows.length) return null;
  return (
    <div className={`menu-edit-ingredients menu-edit-ingredients--${tone}`}>
      <p>{title}</p>
      <div className="menu-edit-ingredient-list">
        {rows.map((ingredient) => (
          <div key={ingredient.ingredientId} className="menu-edit-ingredient-chip">
            <strong>{ingredient.name}</strong>
            <span>{formatIngredientMeta(ingredient)}</span>
            {ingredient.isSoldOut ? <em>품절</em> : null}
            <button
              type="button"
              aria-label={`${ingredient.name} 제거`}
              onClick={() => onRemove(ingredient.ingredientId)}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MenuEditPanel({
  mode = "edit",
  menu,
  categoryOptions = [],
  optionGroupCatalog = [],
  ingredients: ingredientMaster = [],
  onCancel,
  onSave,
  onDelete,
}) {
  const isCreate = mode === "create";
  const [form, setForm] = useState(EMPTY_FORM);
  const [ingredients, setIngredients] = useState([]);
  const [optionGroups, setOptionGroups] = useState([]);
  const [nutrition, setNutrition] = useState({});
  const [allergens, setAllergens] = useState([]);
  const [tags, setTags] = useState([]);
  const [baseline, setBaseline] = useState("");
  const [ingredientModalOpen, setIngredientModalOpen] = useState(false);
  const [ingredientCatalog, setIngredientCatalog] = useState([]);
  const [tagPickerOpen, setTagPickerOpen] = useState(false);
  const [optionGroupPickerOpen, setOptionGroupPickerOpen] = useState(false);
  const [pendingOptionGroup, setPendingOptionGroup] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const fileInputRef = useRef(null);
  const previewUrlRef = useRef("");

  useEffect(() => {
    if (isCreate || !menu) {
      const next = { ...EMPTY_FORM };
      setForm(next);
      setIngredients([]);
      setOptionGroups([]);
      setNutrition({});
      setAllergens([]);
      setTags([]);
      setTagPickerOpen(false);
      setOptionGroupPickerOpen(false);
      setPendingOptionGroup(null);
      setImageFile(null);
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = "";
      }
      setPreviewUrl("");
      setBaseline(JSON.stringify(buildChangeSnapshot(next, [], [], [])));
      return;
    }
    const next = {
      name: menu.name ?? "",
      categoryId: menu.categoryId ?? "",
      price: menu.price != null ? String(menu.price) : "",
      description: menu.description ?? "",
      isSoldOut: menuIsSoldOut(menu),
      imageUrl: menu.imageUrl ?? "",
    };
    const nextIngredients = (menu.ingredients ?? []).map(normalizeIngredient);
    setForm(next);
    setIngredients(nextIngredients);
    const nextOptionGroups = normalizeOptionGroups(menu.optionGroups ?? []);
    setOptionGroups(nextOptionGroups);
    setNutrition(menu.nutrition ?? {});
    setAllergens(menu.allergens ?? []);
    setTags(normalizeTags(menu.tags ?? []));
    setTagPickerOpen(false);
    setOptionGroupPickerOpen(false);
    setPendingOptionGroup(null);
    setImageFile(null);
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = "";
    }
    setPreviewUrl("");
    setBaseline(
      JSON.stringify(
        buildChangeSnapshot(
          next,
          nextIngredients,
          nextOptionGroups,
          normalizeTags(menu.tags ?? []),
        ),
      ),
    );
  }, [isCreate, menu]);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!ingredientModalOpen) return undefined;
    let cancelled = false;

    async function loadIngredients() {
      try {
        const page = await menusApi.getIngredients();
        if (cancelled) return;
        const content = page?.content ?? [];
        setIngredientCatalog(content.map(toIngredientCatalogItem));
      } catch {
        if (cancelled) return;
        setIngredientCatalog(ingredientMaster.map(toIngredientCatalogItem));
      }
    }

    loadIngredients();
    return () => {
      cancelled = true;
    };
  }, [ingredientModalOpen]);

  const dirtyCount = useMemo(() => {
    const current = buildChangeSnapshot(form, ingredients, optionGroups, tags);
    const initial = baseline ? JSON.parse(baseline) : current;
    return countChanges(initial, current);
  }, [form, ingredients, optionGroups, tags, baseline]);

  const core = ingredients.filter((row) => row.role === "core");
  const base = ingredients.filter((row) => row.role === "base");
  const plain = ingredients.filter((row) => row.role === "plain");
  const descLen = form.description.length;

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    onSave?.({
      ...form,
      imageUrl: imageFile ? "" : form.imageUrl,
      imageFile,
      price: Number(form.price) || 0,
      categoryId:
        form.categoryId === "" || form.categoryId == null ? null : Number(form.categoryId),
      ingredients,
      optionGroups,
      nutrition,
      allergens,
      tags,
    });
  }

  function removeIngredient(ingredientId) {
    setIngredients((prev) => prev.filter((row) => row.ingredientId !== ingredientId));
  }

  function selectRecommendedOption(groupId, optionItemId) {
    setOptionGroups((prev) =>
      prev.map((group) => {
        if (!group.isRequired || group.optionGroupId !== groupId) return group;

        const items = (group.items ?? []).map((item) => ({
          ...item,
          isRecommended: item.optionItemId === optionItemId,
        }));
        const recommendedItem = items.find((item) => item.isRecommended);

        return {
          ...group,
          items,
          recommendedLabel: recommendedItem?.name ?? null,
        };
      }),
    );
  }

  function handleAddIngredients(selected) {
    setIngredients((prev) => {
      const usedIds = new Set(prev.map((row) => row.ingredientId));
      const usedNames = new Set(prev.map((row) => String(row.name).trim()));
      const next = selected
        .filter((row) => !usedIds.has(row.ingredientId) && !usedNames.has(String(row.name).trim()))
        .map((row) => ({
          ingredientId: row.ingredientId,
          name: row.name,
          quantity: row.quantity ?? 0,
          unit: row.unit ?? "g",
          role: normalizeIngredientRole(row.role),
          isDefault: true,
          // 핵심 재료는 키오스크의 "재료 빼기" 대상이 될 수 없다.
          canRemove: normalizeIngredientRole(row.role) !== "core",
          isSoldOut: !!row.isSoldOut,
        }));
      return [...prev, ...next];
    });
    setIngredientModalOpen(false);
  }

  function handleImagePick() {
    fileInputRef.current?.click();
  }

  function handleImageFileChange(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }
    const nextUrl = URL.createObjectURL(file);
    previewUrlRef.current = nextUrl;
    setImageFile(file);
    setPreviewUrl(nextUrl);
  }

  function handleImageRemove() {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = "";
    }
    setImageFile(null);
    setPreviewUrl("");
    updateField("imageUrl", "");
  }

  function handleRecalculateNutrition() {
    const next = sumNutrition(ingredients, ingredientMaster);
    if (!next) return;
    setNutrition(next);
  }

  const nutritionCatalogReady = ingredientMaster.length > 0 || ingredients.some((row) => row.kcal != null);

  const availableTags = TAG_OPTIONS.filter(
    (option) => !tags.some((tag) => tag.code === option.code),
  );
  const availableOptionGroups = optionGroupCatalog.filter(
    (group) => !optionGroups.some((connected) => connected.optionGroupId === group.optionGroupId),
  );

  function addTag(option) {
    setTags((prev) => [...prev, option]);
    setTagPickerOpen(false);
  }

  function removeTag(code) {
    setTags((prev) => prev.filter((tag) => tag.code !== code));
  }

  function addOptionGroup(group) {
    const [nextGroup] = normalizeOptionGroups([group]);
    setOptionGroups((prev) => [...prev, nextGroup]);
    setOptionGroupPickerOpen(false);
  }

  function requestOptionGroupRemoval(group) {
    setPendingOptionGroup(group);
  }

  function confirmOptionGroupRemoval() {
    if (!pendingOptionGroup) return;
    setOptionGroups((prev) =>
      prev.filter((group) => group.optionGroupId !== pendingOptionGroup.optionGroupId),
    );
    setPendingOptionGroup(null);
  }

  return (
    <aside className="menu-edit-panel" data-figma-node="134:12400">
      <div className="menu-edit-panel__scroll">
        <section className="menu-edit-card">
          <div className="menu-edit-card__top">
            <div className="menu-edit-image">
              <span>메뉴 이미지</span>
              <div className="menu-edit-image__preview">
                <img
                  src={previewUrl || form.imageUrl || menu?.imageUrl || ricottaImage}
                  alt=""
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  hidden
                  onChange={handleImageFileChange}
                />
                <div className="menu-edit-image__actions">
                  <button type="button" onClick={handleImagePick}>
                    {imageFile || form.imageUrl ? "이미지 변경" : "파일 선택"}
                  </button>
                  <button
                    type="button"
                    className="is-danger"
                    aria-label="이미지 제거"
                    disabled={!imageFile && !form.imageUrl}
                    onClick={handleImageRemove}
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>

            <div className="menu-edit-card__fields">
              <header className="menu-edit-card__header">
                <div>
                  <h2>기본 정보</h2>
                  <p>고객 키오스크에 노출되는 기본 판매 정보입니다.</p>
                </div>
                <div className="menu-edit-card__actions">
                  {!isCreate ? (
                    <button type="button" className="is-delete" onClick={onDelete}>
                      삭제
                    </button>
                  ) : null}
                  <button type="button" className="is-save" onClick={handleSave}>
                    저장
                  </button>
                </div>
              </header>

              <label className="menu-edit-field">
                <span>메뉴명</span>
                <input
                  value={form.name}
                  placeholder={menu ? menu.name : "메뉴명"}
                  onChange={(event) => updateField("name", event.target.value)}
                />
              </label>
            </div>
          </div>

          <div className="menu-edit-field-row">
            <label className="menu-edit-field">
              <span>카테고리</span>
              <select
                value={
                  form.categoryId === "" || form.categoryId == null
                    ? ""
                    : String(form.categoryId)
                }
                onChange={(event) => updateField("categoryId", event.target.value)}
              >
                <option value="">카테고리 선택</option>
                {categoryOptions.map((category) => (
                  <option key={category.categoryId} value={String(category.categoryId)}>
                    {category.categoryName}
                  </option>
                ))}
              </select>
            </label>
            <label className="menu-edit-field">
              <span>판매 가격</span>
              <input
                value={form.price}
                inputMode="numeric"
                placeholder={menu ? menu.price : "0"}
                onChange={(event) => updateField("price", event.target.value.replace(/[^\d]/g, ""))}
              />
              <small>{form.price ? formatCurrency(Number(form.price)) : "0원"}</small>
            </label>
          </div>

          <label className="menu-edit-field">
            <span>메뉴 설명</span>
            <textarea
              value={form.description}
              maxLength={DESC_MAX}
              placeholder={menu ? menu.description : "메뉴 설명"}
              onChange={(event) => updateField("description", event.target.value)}
              rows={6}
            />
            <em>
              {descLen} / {DESC_MAX}자
            </em>
          </label>

          <div className="menu-edit-status">
            <span>판매 상태</span>
            <button
              type="button"
              className={`menu-edit-toggle${!form.isSoldOut ? " is-on" : ""}`}
              role="switch"
              aria-checked={!form.isSoldOut}
              onClick={() => updateField("isSoldOut", !form.isSoldOut)}
            >
              <i />
              <b>{form.isSoldOut ? "품절" : "판매중"}</b>
            </button>
          </div>
        </section>

        <section className="menu-edit-card">
          <header className="menu-edit-card__section-head">
            <div>
              <h3>기본 재료</h3>
              <p>재료의 역할과 분량 정보입니다. 수량과 단위는 마스터 데이터에서 자동 적용됩니다.</p>
            </div>
            <button type="button" className="is-link" onClick={() => setIngredientModalOpen(true)}>
              + 재료 추가
            </button>
          </header>

          <IngredientGroup
            title="핵심 재료"
            tone="core"
            rows={core}
            onRemove={removeIngredient}
          />
          <IngredientGroup
            title="베이스 재료"
            tone="base"
            rows={base}
            onRemove={removeIngredient}
          />
          <IngredientGroup
            title="일반 기본 재료"
            tone="plain"
            rows={plain}
            onRemove={removeIngredient}
          />

          <p className="menu-edit-note">
            재료 제거는 이 메뉴에서만 연결을 해제합니다. 마스터 데이터는 유지됩니다.
          </p>
        </section>

        {/* <section className="menu-detail-card menu-detail-options">
          <h3>옵션 그룹</h3>
          <div className="menu-detail-options__grid">
            {sortedOptionGroups.map((group) => (
              <article
                key={group.optionGroupId}
                className={`menu-detail-options__item${
                  group.isRequired ? "" : " menu-detail-options__item--optional"
                }`}
              >
                <div>
                  <strong>{group.name}</strong>
                  <AdminStatusBadge role={group.isRequired ? "required" : "optional"} />
                </div>
                <p>{formatOptionRule(group)}</p>
                <p>{group.recommendedLabel ? `추천: ${group.recommendedLabel}` : "추천 없음"}</p>
              </article>
            ))}
          </div>
        </section> */}

        <section className="menu-edit-card ">
          <header className="menu-edit-card__section-head">
            <h3>옵션 그룹</h3>
            <button
              type="button"
              className="is-link"
              disabled={availableOptionGroups.length === 0}
              onClick={() => setOptionGroupPickerOpen((prev) => !prev)}
            >
              + 옵션 그룹 추가
            </button>
          </header>
          {optionGroupPickerOpen ? (
            <div
              className="menu-edit-option-picker"
              role="listbox"
              aria-label="추가할 옵션 그룹 선택"
            >
              {availableOptionGroups.map((group) => (
                <button
                  key={group.optionGroupId}
                  type="button"
                  role="option"
                  aria-selected="false"
                  onClick={() => addOptionGroup(group)}
                >
                  <strong>{group.name}</strong>
                  <span>{group.isRequired ? "필수" : "선택"}</span>
                </button>
              ))}
            </div>
          ) : null}
          <div className="menu-edit-options">
            {optionGroups.length === 0 ? (
              <p className="menu-edit-empty">연결된 옵션 그룹이 없습니다.</p>
            ) : (
              optionGroups.map((group) => (
                <article
                  key={group.optionGroupId}
                  className={`menu-edit-options__item${
                    group.isRequired ? "" : " menu-edit-options__item--optional"
                  }`}
                >
                  <div>
                    <strong>{group.name}</strong>
                    <span className="menu-edit-options__item-actions">
                      <AdminStatusBadge role={group.isRequired ? "required" : "optional"} />
                      <button
                        type="button"
                        aria-label={`${group.name} 옵션 그룹 삭제`}
                        onClick={() => requestOptionGroupRemoval(group)}
                      >
                        ×
                      </button>
                    </span>
                  </div>
                  {group.isRequired ? (
                    <fieldset className="menu-edit-options__recommend">
                      <legend>추천 옵션</legend>
                      {(group.items ?? []).length > 0 ? (
                        <select
                          value={String(
                            group.items.find((item) => item.isRecommended)?.optionItemId ?? "",
                          )}
                          onChange={(event) =>
                            selectRecommendedOption(group.optionGroupId, Number(event.target.value))
                          }
                        >
                          {group.items.map((item) => (
                            <option
                              key={item.optionItemId}
                              value={item.optionItemId}
                              disabled={item.isSoldOut}
                            >
                              {item.name}
                              {item.isSoldOut
                                ? " (품절)"
                                : item.extraPrice
                                  ? ` (+${formatCurrency(item.extraPrice)})`
                                  : ""}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <p>추천할 수 있는 옵션이 없습니다.</p>
                      )}
                    </fieldset>
                  ) : (
                    <p className="menu-edit-options__optional">
                      선택 그룹에는 추천을 설정하지 않습니다.
                    </p>
                  )}
                </article>
              ))
            )}
          </div>
        </section>

        <section className="menu-edit-card">
          <header className="menu-edit-card__section-head">
            <div>
              <h3>영양 정보</h3>
              <p>재료 기준 자동 계산됨</p>
            </div>
            <button
              type="button"
              className="is-link"
              disabled={!nutritionCatalogReady || ingredients.length === 0}
              onClick={handleRecalculateNutrition}
            >
              재계산
            </button>
          </header>
          <div className="menu-edit-nutrition">
            <div>
              <span>칼로리</span>
              <b>{nutrition.kcal != null ? `${nutrition.kcal} kcal` : "-"}</b>
            </div>
            <div>
              <span>탄수화물</span>
              <b>{nutrition.carbG != null ? `${nutrition.carbG} g` : "-"}</b>
            </div>
            <div>
              <span>단백질</span>
              <b>{nutrition.proteinG != null ? `${nutrition.proteinG} g` : "-"}</b>
            </div>
            <div>
              <span>지방</span>
              <b>{nutrition.fatG != null ? `${nutrition.fatG} g` : "-"}</b>
            </div>
            <div>
              <span>나트륨</span>
              <b>{nutrition.sodiumMg != null ? `${nutrition.sodiumMg} mg` : "-"}</b>
            </div>
          </div>
        </section>

        <div className="menu-edit-tags-row">
          <section className="menu-edit-card menu-edit-card--half">
            <h3>알레르기 정보</h3>
            <p>기본 재료와 옵션 기준 자동 집계. 재료 변경 시 갱신됩니다.</p>
            <div className="menu-edit-chips">
              {allergens.length > 0 ? (
                allergens.map((name) => <span key={name}>{name}</span>)
              ) : (
                <span>없음</span>
              )}
            </div>
          </section>
          <section className="menu-edit-card menu-edit-card--half">
            <h3>태그 설정</h3>
            <div className="menu-edit-chips">
              {tags.map((tag) => (
                <span
                  key={tag.code || tag.name}
                  className={`${tagClassName(tag.code)} menu-edit-tag`}
                >
                  {tag.name || tag.code}
                  <button
                    type="button"
                    aria-label={`${tag.name || tag.code} 태그 제거`}
                    onClick={() => removeTag(tag.code)}
                  >
                    ×
                  </button>
                </span>
              ))}
              <button
                type="button"
                className="is-link"
                disabled={availableTags.length === 0}
                onClick={() => setTagPickerOpen((prev) => !prev)}
              >
                + 태그 추가
              </button>
              {tagPickerOpen ? (
                <div className="menu-edit-tag-picker" role="listbox" aria-label="추가할 태그 선택">
                  {availableTags.map((option) => (
                    <button
                      key={option.code}
                      type="button"
                      role="option"
                      aria-selected="false"
                      className={tagClassName(option.code)}
                      onClick={() => addTag(option)}
                    >
                      {option.name}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </div>

      <footer className="menu-edit-bottombar">
        <span>
          {dirtyCount > 0
            ? `저장되지 않은 변경사항 ${dirtyCount}건`
            : isCreate
              ? "신규 메뉴 작성 중"
              : "변경사항 없음"}
        </span>
        <div>
          <button type="button" onClick={onCancel}>
            취소
          </button>
          <button type="button" className="is-primary" onClick={handleSave}>
            {isCreate ? "메뉴 등록" : "변경사항 저장"}
          </button>
        </div>
      </footer>

      <IngredientSelectModal
        open={ingredientModalOpen}
        catalog={ingredientCatalog}
        existingIngredients={ingredients}
        onClose={() => setIngredientModalOpen(false)}
        onConfirm={handleAddIngredients}
      />
      <AdminConfirmDialog
        open={Boolean(pendingOptionGroup)}
        title="옵션 그룹을 삭제할까요?"
        description={
          pendingOptionGroup
            ? `"${pendingOptionGroup.name}" 옵션 그룹을 이 메뉴에서 제거합니다.`
            : "선택한 옵션 그룹을 이 메뉴에서 제거합니다."
        }
        confirmLabel="삭제"
        tone="danger"
        onConfirm={confirmOptionGroupRemoval}
        onCancel={() => setPendingOptionGroup(null)}
      />
    </aside>
  );
}
