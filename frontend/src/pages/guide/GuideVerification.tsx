import { useEffect, useState } from "react";
import api from "../../api/client";
import { GuideDetail } from "../../types";
import LoadingBlock from "../../components/LoadingBlock";
import { useLang } from "../../context/LanguageContext";

export default function GuideVerification() {
  const { t } = useLang();
  const [guide, setGuide] = useState<GuideDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    api
      .get<GuideDetail>("/api/v1/guide/me")
      .then((data) => setGuide(data))
      .catch(() => setError(t('failed_load_verification')))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      await api.post("/api/v1/guide/verification/submit");
      setSuccess(t('verification_submitted'));
      setGuide((prev) =>
        prev ? { ...prev, verification_status: "pending" } : prev
      );
    } catch {
      setError(t('failed_submit_verification'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingBlock />;
  if (!guide && error) return <p className="text-red-600">{error}</p>;
  if (!guide) return null;

  const status = guide.verification_status ?? "unverified";

  const badgeColor: Record<string, string> = {
    verified: "bg-green-100 text-green-800",
    pending: "bg-yellow-100 text-yellow-800",
    unverified: "bg-gray-100 text-gray-800",
    rejected: "bg-red-100 text-red-800",
  };

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-bold">{t('verification_status_title')}</h1>

      {error && <p className="text-red-600">{error}</p>}
      {success && <p className="text-green-600">{success}</p>}

      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-gray-700 font-medium">{t('current_status')}</span>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${badgeColor[status] ?? badgeColor.unverified}`}
          >
            {status}
          </span>
        </div>

        {status === "unverified" && (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? t('submitting') : t('submit_verification')}
          </button>
        )}

        {status === "pending" && (
          <p className="text-gray-500">
            {t('verification_pending_msg')}
          </p>
        )}

        {status === "verified" && (
          <p className="text-gray-500">
            {t('verification_verified_msg')}
          </p>
        )}

        {status === "rejected" && (
          <p className="text-gray-500">
            {t('verification_rejected_msg')}
          </p>
        )}
      </div>
    </div>
  );
}
