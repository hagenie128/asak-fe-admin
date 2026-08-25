/**
 * 결제수단 아이콘 — UI는 public 로컬 SVG 사용.
 * (Cloudinary SVG는 Content-Disposition: attachment 라 <img>에 안 그려질 수 있음)
 * DB 정본 URL은 media_asset.url (asak/payment/*)
 */
export const PAYMENT_METHOD_ICON_URLS = {
  CARD: "/samsung-pay.svg",
  KAKAO_PAY: "/kakaopay.svg",
  NAVER_PAY: "/badge_npay.svg",
  TOSS_PAY: "/toss-logo.svg",
  ZERO_PAY: "/zero-pay.svg",
};

/** @deprecated emoji 글리프 → iconUrl 사용. 폴백만 유지 */
export const PAYMENT_METHOD_GLYPHS = {
  CARD: "💳",
  KAKAO_PAY: "🟡",
  NAVER_PAY: "🟢",
  TOSS_PAY: "🔵",
  ZERO_PAY: "🔵",
};

export function getPaymentMethodIconUrl(methodCode) {
  const url = PAYMENT_METHOD_ICON_URLS[methodCode];
  if (url && !url.includes("res.cloudinary.com")) return url;
  return null;
}

export function getPaymentMethodGlyph(methodId) {
  return PAYMENT_METHOD_GLYPHS[methodId] ?? methodId?.[0]?.toUpperCase() ?? "?";
}
