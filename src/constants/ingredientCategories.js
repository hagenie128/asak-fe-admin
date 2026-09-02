/** ing.type_id → common_code(INGREDIENT_TYPE).name — 품절·재료 선택 UI 공통 */
export const INGREDIENT_CATEGORY_LABELS = Object.freeze([
  "베이스",
  "단백질",
  "토핑",
  "드레싱",
  "채소",
  "사이드",
  "음료",
]);

export const INGREDIENT_CATEGORY_FILTERS = Object.freeze(["전체", ...INGREDIENT_CATEGORY_LABELS]);

/** chip / filter tone (CSS modifier) */
export const INGREDIENT_CATEGORY_TONE = Object.freeze({
  채소: "veg",
  단백질: "protein",
  토핑: "topping",
  드레싱: "dressing",
  베이스: "base",
  사이드: "side",
  음료: "drink",
});
