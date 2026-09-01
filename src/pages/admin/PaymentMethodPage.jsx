/*
 * SCR-018 / Payment Methods — Figma 134:11493
 * getPaymentMethods() → usePaymentMethodDraft → AdminPaymentMethodRow
 */
import { useState } from "react";
import AdminAsyncState from "../../components/admin/shared/AdminAsyncState.jsx";
import AdminConfirmDialog from "../../components/admin/shared/AdminConfirmDialog.jsx";
import AdminTopHeader from "../../components/admin/shared/AdminTopHeader.jsx";
import AdminPaymentMethodRow from "../../components/admin/AdminPaymentMethodRow.jsx";
import AdminSaveBar from "../../components/admin/shared/AdminSaveBar.jsx";
import { getPaymentMethodIconUrl } from "../../constants/paymentMethodGlyphs.js";
import { usePaymentMethodDraft } from "../../hooks/usePaymentMethodDraft.js";
import { toast } from "../../utils/toast.js";

// POLICIES — JSON 없음, Figma PoliciesSection 정적 유지
const POLICIES = [
  {
    title: "결제 실패 시 초기화 정책",
    body: "결제 실패 시 장바구니 데이터를 5분간 유지한 후 자동으로 초기화합니다",
  },
  {
    title: "영수증 안내 문구",
    body: "주문해주셔서 감사합니다. 맛있게 드시고 리뷰 작성 시 서비스를 드립니다!",
  },
];

const POLICY_STORAGE_KEY = "asak-admin-payment-policies";

function loadPolicies() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(POLICY_STORAGE_KEY) ?? "");
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((row, index) => ({
        title: row.title || POLICIES[index]?.title || `정책 ${index + 1}`,
        body: row.body || POLICIES[index]?.body || "",
      }));
    }
  } catch {
    // 저장된 값이 없으면 기본 안내 문구를 쓴다.
  }
  return POLICIES;
}

function savePolicies(next) {
  window.localStorage.setItem(POLICY_STORAGE_KEY, JSON.stringify(next));
}

function PreviewRow({ method }) {
  const imageUrl = method.imageUrl ?? getPaymentMethodIconUrl(method.methodCode);

  return (
    <div className="payment-preview-row">
      <span className="payment-method-row__icon" aria-hidden="true">
        {imageUrl ? <img src={imageUrl} alt="" /> : null}
      </span>
      <div className="payment-method-row__info">
        <strong>{method.methodName}</strong>
        <span>{method.description}</span>
      </div>
      <span
        className={`payment-toggle${method.active ? "" : " payment-toggle--off"}`}
        aria-hidden="true"
      >
        <i />
      </span>
    </div>
  );
}

export default function PaymentMethodPage() {
  const draft = usePaymentMethodDraft();
  const [saveConfirmOpen, setSaveConfirmOpen] = useState(false);
  const [policies, setPolicies] = useState(loadPolicies);
  const [editingPolicyTitle, setEditingPolicyTitle] = useState(null);
  const [policyDraft, setPolicyDraft] = useState("");

  async function handleSaveConfirm() {
    setSaveConfirmOpen(false);
    const result = await draft.save();
    if (result.success) {
      toast.success(result.message || "저장되었습니다.");
    } else {
      toast.error(result.message || "저장에 실패했습니다.");
    }
  }

  function startPolicyEdit(policy) {
    setEditingPolicyTitle(policy.title);
    setPolicyDraft(policy.body);
  }

  function cancelPolicyEdit() {
    setEditingPolicyTitle(null);
    setPolicyDraft("");
  }

  function confirmPolicyEdit() {
    const next = policies.map((policy) =>
      policy.title === editingPolicyTitle ? { ...policy, body: policyDraft.trim() || policy.body } : policy,
    );
    setPolicies(next);
    savePolicies(next);
    cancelPolicyEdit();
    toast.success("안내 문구를 이 기기에 저장했습니다.");
  }

  if (draft.status === "loading") {
    return (
      <section className="payment-settings">
        <AdminTopHeader
          crumb="Admin / 결제수단 설정"
          title="결제수단 설정"
          description="변경 사항은 키오스크에 즉시 반영됩니다"
        />
        <AdminAsyncState status="loading" layout="page" loadingVariant="card" />
      </section>
    );
  }

  if (draft.status === "error") {
    return (
      <section className="payment-settings">
        <AdminTopHeader
          crumb="Admin / 결제수단 설정"
          title="결제수단 설정"
          description="변경 사항은 키오스크에 즉시 반영됩니다"
        />
        <AdminAsyncState
          status="error"
          layout="page"
          title="결제수단을 불러오지 못했습니다"
          description={draft.error?.message || "잠시 후 다시 시도해 주세요."}
          onRetry={draft.refetch}
        />
      </section>
    );
  }

  return (
    <section className="payment-settings" aria-label="결제수단 설정" data-figma-node="134:11493">
      <AdminTopHeader
        crumb="Admin / 결제수단 설정"
        title="결제수단 설정"
        description="변경 사항은 키오스크에 즉시 반영됩니다"
      />
      <div className="payment-settings__body">
        <div className="payment-settings__main">
          <h2>결제수단 목록</h2>
          {draft.rows.length === 0 ? (
            <AdminAsyncState
              status="empty"
              layout="section"
              title="결제수단이 없습니다"
              description="등록된 결제수단이 없습니다."
            />
          ) : (
            <div className="payment-method-list">
              {draft.rows.map((method, index) => (
                <AdminPaymentMethodRow
                  key={method.methodId}
                  method={method}
                  disabled={draft.isUpdating}
                  canMoveUp={index > 0}
                  canMoveDown={index < draft.rows.length - 1}
                  onToggle={() => draft.toggleMethod(method.methodId)}
                  onMoveUp={() => draft.moveMethod(method.methodId, "up")}
                  onMoveDown={() => draft.moveMethod(method.methodId, "down")}
                />
              ))}
            </div>
          )}
          <h2 className="payment-settings__policies-title">결제 정책 설정</h2>
          <p className="payment-settings__policies-note">
            결제수단 활성/순서는 키오스크에 저장됩니다. 아래 안내는 이 관리자 화면에만 저장됩니다.
          </p>
          <div className="payment-policy-row">
            {policies.map((policy) => (
              <article key={policy.title} className="payment-policy-card">
                <div className="payment-policy-card__head">
                  <strong>{policy.title}</strong>
                  {editingPolicyTitle === policy.title ? (
                    <span className="payment-policy-card__edit-actions">
                      <button type="button" onClick={cancelPolicyEdit}>
                        취소
                      </button>
                      <button type="button" onClick={confirmPolicyEdit}>
                        적용
                      </button>
                    </span>
                  ) : (
                    <button type="button" onClick={() => startPolicyEdit(policy)}>
                      수정
                    </button>
                  )}
                </div>
                {editingPolicyTitle === policy.title ? (
                  <textarea
                    className="payment-policy-card__editor"
                    value={policyDraft}
                    rows={4}
                    onChange={(event) => setPolicyDraft(event.target.value)}
                  />
                ) : (
                  <p>{policy.body}</p>
                )}
              </article>
            ))}
          </div>
        </div>
        <div className="payment-settings__preview">
          <div className="payment-settings__preview-head">
            <h2>결제수단 목록</h2>
            <p>설정한 결제수단 순서대로 키오스크/웹 결제 화면에 노출됩니다.</p>
          </div>
          <div className="payment-preview-card">
            {draft.activePreviewRows.length > 0 ? (
              draft.activePreviewRows.map((method) => (
                <PreviewRow key={method.methodId} method={method} />
              ))
            ) : (
              <AdminAsyncState
                status="empty"
                layout="section"
                title="활성화된 결제수단이 없습니다"
                description="왼쪽에서 결제수단을 켜 주세요."
              />
            )}
          </div>
        </div>
      </div>
      <AdminSaveBar
        isDirty={draft.isDirty}
        isSaving={draft.isUpdating}
        onSave={() => setSaveConfirmOpen(true)}
      />
      <AdminConfirmDialog
        open={saveConfirmOpen}
        title="결제수단 설정을 저장할까요?"
        description="변경 사항은 키오스크에 즉시 반영됩니다."
        confirmLabel="저장하기"
        cancelLabel="취소"
        tone="warning"
        isBusy={draft.isUpdating}
        onConfirm={handleSaveConfirm}
        onCancel={() => setSaveConfirmOpen(false)}
      />
    </section>
  );
}
