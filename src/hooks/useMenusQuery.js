// 메뉴 목록 조회 Hook (SCR-016)
// 목록·필터·페이지네이션은 백엔드 PageResult(content, totalElements) 기준
import { useEffect, useState } from "react";
import { menusApi } from "../api/menusApi.js";
import { ADMIN_PAGINATION } from "../constants/pagination.js";

function normalizeUnitForApi(raw) {
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

function normalizeTagsForApi(tags = []) {
  return tags
    .map((tag) => {
      if (typeof tag === "string") {
        return { code: tag, name: tag };
      }
      if (!tag) return null;
      const code = tag.code ?? tag.name;
      const name = tag.name ?? tag.code;
      if (!code && !name) return null;
      return { code, name };
    })
    .filter(Boolean);
}

function sanitizeNutrition(nutrition) {
  if (!nutrition || typeof nutrition !== "object") return null;
  const keys = ["kcal", "carbG", "proteinG", "fatG", "sodiumMg", "servingG"];
  const hasValue = keys.some((key) => nutrition[key] != null && nutrition[key] !== "");
  return hasValue ? nutrition : null;
}

function getOptionGroupCatalog(groups = []) {
  return Array.isArray(groups) ? groups : [];
}

function buildListParams({ page, pageSize, selectedCategoryId, keyword }) {
  const params = {
    page,
    size: pageSize,
    sort: "name,asc",
  };
  const q = keyword.trim();
  if (q) params.keyword = q;
  if (selectedCategoryId != null) params.categoryId = selectedCategoryId;
  return params;
}

export function useMenusQuery({
  initialMenuId = null,
  pageSize = ADMIN_PAGINATION.menus.pageSize,
} = {}) {
  const [menus, setMenus] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [keyword, setKeyword] = useState("");
  const [selectedMenuId, setSelectedMenuId] = useState(null);
  const [page, setPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [tick, setTick] = useState(0);
  const [categories, setCategories] = useState([]);
  const [selectedMenu, setSelectedMenu] = useState(null);
  const [ingredients, setIngredients] = useState([]);
  const [optionGroupCatalog, setOptionGroupCatalog] = useState([]);

  useEffect(() => {
    let cancelled = false;
    menusApi
      .getIngredients()
      .then((response) => {
        if (cancelled) return;
        setIngredients(response?.content ?? []);
      })
      .catch(() => {
        if (!cancelled) setIngredients([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    menusApi
      .listOptionGroups()
      .then((response) => {
        if (cancelled) return;
        setOptionGroupCatalog(getOptionGroupCatalog(response));
      })
      .catch(() => {
        if (!cancelled) setOptionGroupCatalog([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    let cancelled = false;
    async function fetchMenus() {
      setStatus("loading");
      try {
        const response = await menusApi.listMenus(
          buildListParams({ page, pageSize, selectedCategoryId, keyword }),
        );
        if (cancelled) return;
        const content = response.content ?? [];
        setMenus(content);
        setTotalElements(Number(response.totalElements) || 0);
        setStatus(content.length === 0 ? "empty" : "success");
        setError(null);

        // 카테고리 이동 등으로 현재 메뉴가 필터 목록에서 빠져도 선택은 유지한다.
        // (목록에 없다고 다른 메뉴로 바꾸면 이후 카테고리 수정이 엉뚱한 대상에 적용된다.)
        setSelectedMenuId((current) => {
          if (initialMenuId) {
            const matched = content.find((row) => String(row.menuId) === String(initialMenuId));
            if (matched) return matched.menuId;
          }
          if (current != null) {
            return current;
          }
          return content[0]?.menuId ?? null;
        });
      } catch (err) {
        if (cancelled) return;
        setMenus([]);
        setTotalElements(0);
        setStatus("error");
        setError(err);
      }
    }

    fetchMenus();
    return () => {
      cancelled = true;
    };
  }, [initialMenuId, page, pageSize, selectedCategoryId, keyword, tick]);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await menusApi.listCategories();
        setCategories(response.content ?? []);
      } catch (err) {
        setCategories([]);
        setError(err);
      }
    }

    fetchCategories();
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchSelectedMenu() {
      if (!selectedMenuId) {
        setSelectedMenu(null);
        return;
      }

      try {
        const response = await menusApi.getMenu(selectedMenuId);
        if (cancelled) return;
        setSelectedMenu(response ?? null);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setSelectedMenu(null);
        setError(err);
      }
    }

    fetchSelectedMenu();
    return () => {
      cancelled = true;
    };
  }, [selectedMenuId, tick]);

  function updateMenu(menuId, payload) {
    const request = {
      categoryId: payload.categoryId ? Number(payload.categoryId) : null,
      name: payload.name,
      price: Number(payload.price) || 0,
      imageUrl: payload.imageUrl || null,
      description: payload.description || null,
      isSoldOut: payload.isSoldOut === true,
      ingredients: (payload.ingredients ?? []).map((row) => ({
        ingredientId: row.ingredientId,
        role: row.role,
        quantity: row.quantity,
        unit: normalizeUnitForApi(row.unit),
        isDefault: row.isDefault,
        canRemove: row.canRemove,
      })),
      optionGroups: (payload.optionGroups ?? []).map((group) => ({
        optionGroupId: group.optionGroupId ?? group.groupId,
        isRequired: group.isRequired,
        recommendedOptionItemId:
          group.recommendedOptionItemId ??
          group.items?.find((item) => item.isRecommended)?.optionItemId ??
          null,
        items: group.items,
      })),
      nutrition: sanitizeNutrition(payload.nutrition),
      tags: normalizeTagsForApi(payload.tags),
    };
    return menusApi.updateMenu(menuId, request);
  }

  function createMenu(payload) {
    const request = {
      categoryId: payload.categoryId ? Number(payload.categoryId) : null,
      name: payload.name,
      price: Number(payload.price) || 0,
      imageUrl: payload.imageUrl || null,
      description: payload.description || null,
      isSoldOut: payload.isSoldOut === true,
      ingredients: (payload.ingredients ?? []).map((row) => ({
        ingredientId: row.ingredientId,
        role: row.role,
        quantity: row.quantity,
        unit: normalizeUnitForApi(row.unit),
        isDefault: row.isDefault,
        canRemove: row.canRemove,
      })),
      optionGroups: (payload.optionGroups ?? []).map((group) => ({
        optionGroupId: group.optionGroupId ?? group.groupId,
        isRequired: group.isRequired,
        recommendedOptionItemId:
          group.recommendedOptionItemId ??
          group.items?.find((item) => item.isRecommended)?.optionItemId ??
          null,
        items: group.items,
      })),
      nutrition: sanitizeNutrition(payload.nutrition),
      tags: normalizeTagsForApi(payload.tags),
    };
    return menusApi.createMenu(request);
  }

  return {
    status,
    totalElements,
    page,
    pageSize,
    categories,
    ingredients,
    error,
    optionGroupCatalog,
    menus,
    selectedMenuId,
    selectedMenu,
    selectedCategoryId,
    keyword,
    onCategoryIdChange: setSelectedCategoryId,
    onKeywordChange: setKeyword,
    onSelectMenu: setSelectedMenuId,
    updateMenu,
    createMenu,
    onPageChange: (nextPage) => setPage(Math.max(0, nextPage)),
    refetch: () => setTick((n) => n + 1),
  };
}
