/* SCR-016 메뉴 상세 보기 (읽기 전용) — Figma Basic-Info 등 */
import ricottaImage from "../../../assets/figma/soldout-ricotta.png";
import { formatCurrency } from "../../../utils/currency.js";
import AdminAsyncState from "../shared/AdminAsyncState.jsx";
import AdminStatusBadge from "../shared/AdminStatusBadge.jsx";

function tagClassName(code = "") {
  const upper = String(code).toUpperCase();
  if (upper === "BEST") return "menu-tag menu-tag--best";
  if (upper === "NEW") return "menu-tag menu-tag--new";
  if (upper === "VEGAN") return "menu-tag menu-tag--vegan";
  return "menu-tag";
}

function ingredientRole(role) {
  const value = String(role ?? "").trim().toLowerCase();
  if (value === "core") return "core";
  if (value === "base") return "base";
  return "plain";
}

function tagCode(tag) {
  if (typeof tag === "string") return tag;
  return tag?.code || tag?.name || "";
}

function tagLabel(tag) {
  if (typeof tag === "string") return tag;
  return tag?.name || tag?.code || "";
}

function formatIngredientMeta(ingredient) {
  const qty =
    `${ingredient.quantity !== 0 ? `${ingredient.quantity}${ingredient.unit}` : ""}`.trim();
  const parts = [qty || null];
  if (ingredient.isDefault) parts.push("기본 포함");
  parts.push(ingredient.canRemove === false ? "제거 불가" : "제거 가능");
  return parts.filter(Boolean).join(" · ");
}

function formatOptionRule(group) {
  const requirement = group.isRequired ? "필수" : "선택";

  if (group.selectType === "SINGLE") {
    return `${requirement} · 1개 선택`;
  }

  if (group.maxSelect != null && group.maxSelect > 0) {
    return `${requirement} · 최대 ${group.maxSelect}개`;
  }

  return requirement;
}

export default function MenuDetailPanel({ menu, onEdit, onDelete }) {
  if (!menu) {
    return (
      <aside className="menu-detail-panel" aria-label="메뉴 상세">
        <AdminAsyncState
          status="empty"
          layout="section"
          title="메뉴를 선택해 주세요"
          description="왼쪽에서 메뉴 카드를 선택하면 상세가 여기에 표시됩니다."
        />
      </aside>
    );
  }

  const ingredients = menu.ingredients ?? [];
  const core = ingredients.filter((row) => ingredientRole(row.role) === "core");
  const base = ingredients.filter((row) => ingredientRole(row.role) === "base");
  const plain = ingredients.filter((row) => ingredientRole(row.role) === "plain");
  const optionGroups = menu.optionGroups ?? [];
  const sortedOptionGroups = [...optionGroups].sort((a, b) => {
    if (Boolean(a.isRequired) === Boolean(b.isRequired)) return 0;
    return a.isRequired ? -1 : 1;
  });
  const nutrition = menu.nutrition ?? {};
  const allergens = menu.allergens ?? [];
  const tags = menu.tags ?? [];
  const imageSrc = menu.imageUrl || ricottaImage;

  return (
    <aside className="menu-detail-panel">
      <div className="menu-detail-panel__scroll">
        <header className="menu-detail__header">
          <div>
            <h2>기본 정보</h2>
            <p>등록된 상품의 상세 정보 및 노출 설정을 보여줍니다.</p>
          </div>
          <div className="menu-detail__actions">
            <button type="button" className="is-delete" onClick={onDelete}>
              삭제
            </button>
            <button type="button" className="is-edit" onClick={onEdit}>
              수정
            </button>
          </div>
        </header>

        <section className="menu-detail-card menu-detail-basic">
          <div className="menu-detail-basic__top">
            <img src={imageSrc} alt="" />
            <div className="menu-detail-basic__info">
              <div className="menu-detail-basic__name">
                <strong>{menu.name}</strong>
                <AdminStatusBadge role={menu.isSoldOut ? "soldOut" : "selling"} />
              </div>
              <p>
                <span>카테고리</span>
                <b>{menu.categoryName}</b>
              </p>
              <p className="menu-detail-basic__price">
                <span>판매 가격</span>
                <b>{formatCurrency(menu.price)}</b>
              </p>
            </div>
          </div>
          <div className="menu-detail-basic__desc">
            <span>메뉴 설명</span>
            <p>{menu.description ?? "설명이 없습니다."}</p>
          </div>
        </section>

        <section className="menu-detail-card menu-detail-ingredients">
          <header>
            <h3>기본 재료</h3>
            <span>지정된 정량 정보</span>
          </header>
          {core.length > 0 ? (
            <div className="menu-detail-ingredients__group">
              <p className="menu-detail-legend menu-detail-legend--core">핵심 재료</p>
              {core.map((ingredient) => (
                <div
                  key={ingredient.ingredientId}
                  className="menu-ingredient-row menu-ingredient-row--core"
                >
                  <strong>{ingredient.name}</strong>
                  <b>{formatIngredientMeta(ingredient)}</b>
                </div>
              ))}
            </div>
          ) : null}
          {base.length > 0 ? (
            <div className="menu-detail-ingredients__group">
              <p className="menu-detail-legend menu-detail-legend--base">베이스 재료</p>
              {base.map((ingredient) => (
                <div
                  key={ingredient.ingredientId}
                  className="menu-ingredient-row menu-ingredient-row--base"
                >
                  <strong>{ingredient.name}</strong>
                  <b>{formatIngredientMeta(ingredient)}</b>
                </div>
              ))}
            </div>
          ) : null}
          {plain.length > 0 ? (
            <div className="menu-detail-ingredients__group">
              <p className="menu-detail-legend menu-detail-legend--plain">일반 기본 재료</p>
              <div className="menu-ingredient-chips">
                {plain.map((ingredient) => (
                  <span key={ingredient.ingredientId}>
                    {ingredient.name}{" "}
                    <i>
                      {ingredient.quantity !== 0 ? `${ingredient.quantity}${ingredient.unit}` : ""}
                    </i>
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        <section className="menu-detail-card menu-detail-options">
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
        </section>

        <section className="menu-detail-card menu-detail-nutrition">
          <header>
            <h3>영양 정보</h3>
            <span>정량 기준 자동 분석</span>
          </header>
          <div className="menu-detail-nutrition__grid">
            <div>
              <span>칼로리</span>
              <b>{nutrition.kcal != null ? `${nutrition.kcal} kcal` : "-"}</b>
            </div>
            <div>
              <span>단백질</span>
              <b>{nutrition.proteinG != null ? `${nutrition.proteinG} g` : "-"}</b>
            </div>
            <div>
              <span>탄수화물</span>
              <b>{nutrition.carbG != null ? `${nutrition.carbG} g` : "-"}</b>
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

        <section className="menu-detail-tags">
          <article>
            <h3>알레르기 정보</h3>
            <div>
              {allergens.length > 0 ? (
                allergens.map((name) => <span key={name}>{name}</span>)
              ) : (
                <span>없음</span>
              )}
            </div>
          </article>
          <article>
            <h3>태그 설정</h3>
            <div>
              {tags.length > 0 ? (
                tags.map((tag) => (
                  <span key={tagCode(tag) || tagLabel(tag)} className={tagClassName(tagCode(tag))}>
                    {tagLabel(tag)}
                  </span>
                ))
              ) : (
                <span>없음</span>
              )}
            </div>
          </article>
        </section>
      </div>
    </aside>
  );
}
