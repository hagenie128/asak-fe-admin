/*
 * Figma Shared/ConfirmDialog (145:2 / 158:23975)
 * Admin 시나리오: discardChanges·saveChanges(warning),
 * disableAllPaymentMethods·deleteMenu(danger)
 * loading 시 Primary·Secondary 모두 비활성 (Abort 미구현)
 */
export default function AdminConfirmDialog({
  open = false,
  title = "확인이 필요합니다",
  description = "이 작업은 취소할 수 없습니다.",
  confirmLabel = "확인",
  cancelLabel = "취소",
  tone = "danger",
  isBusy = false,
  onConfirm,
  onCancel,
  children,
}) {
  if (!open) return null;

  return (
    <div
      className="admin-confirm-layer"
      role="presentation"
      onClick={isBusy ? undefined : onCancel}
    >
      <section
        className={`admin-confirm admin-confirm--${tone}${isBusy ? " is-busy" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-confirm-title"
        onClick={(event) => event.stopPropagation()}
      >
        <span className="admin-confirm__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {tone === "warning" ? (
              <>
                <path d="M10.3 3.9 2.2 18a2 2 0 0 0 1.7 3h16.2a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
                <path d="M12 9v4M12 17h.01" />
              </>
            ) : (
              <>
                <circle cx="12" cy="12" r="10" />
                <path d="m15 9-6 6M9 9l6 6" />
              </>
            )}
          </svg>
        </span>
        <div className="admin-confirm__text">
          <h2 id="admin-confirm-title">{title}</h2>
          {description ? <p>{description}</p> : null}
        </div>
        {children ? <div className="admin-confirm__body">{children}</div> : null}
        <div className="admin-confirm__actions">
          <button type="button" disabled={isBusy} onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className="is-primary"
            disabled={isBusy}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
