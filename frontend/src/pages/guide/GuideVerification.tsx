import { useEffect, useState, useRef } from "react";
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

  // Document state
  const [idDocUrl, setIdDocUrl] = useState("");
  const [selfieUrl, setSelfieUrl] = useState("");
  const [licenseUrl, setLicenseUrl] = useState("");
  const [uploadingId, setUploadingId] = useState(false);
  const [uploadingSelfie, setUploadingSelfie] = useState(false);
  const [uploadingLicense, setUploadingLicense] = useState(false);

  const idRef = useRef<HTMLInputElement>(null);
  const selfieRef = useRef<HTMLInputElement>(null);
  const licenseRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api
      .get<GuideDetail>("/api/v1/guide/me")
      .then((data) => {
        setGuide(data);
        setIdDocUrl(data.id_document_url || "");
        setSelfieUrl(data.selfie_url || "");
        setLicenseUrl(data.guide_license_url || "");
      })
      .catch(() => setError(t("failed_load_verification")))
      .finally(() => setLoading(false));
  }, []);

  async function uploadFile(
    file: File,
    setUrl: (u: string) => void,
    setUploading: (b: boolean) => void
  ) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/v1/guide/upload", {
        method: "POST",
        headers: {
          "X-Guide-Id": guide?.id || "",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
        body: formData,
      });
      const data = await res.json();
      if (data.url) setUrl(data.url);
    } catch {
      setError(t("upload_failed"));
    } finally {
      setUploading(false);
    }
  }

  const handleSubmit = async () => {
    if (!idDocUrl || !selfieUrl) {
      setError(t("id_and_selfie_required"));
      return;
    }
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const res = await api.post<{
        status: string;
        verifyid_reference: string;
        fraud_score: number | null;
        fraud_notes: string;
      }>("/api/v1/guide/verification/submit", {
        id_document_url: idDocUrl,
        selfie_url: selfieUrl,
        guide_license_url: licenseUrl,
      });
      setSuccess(t("verification_submitted"));
      setGuide((prev) =>
        prev ? { ...prev, verification_status: "pending" } : prev
      );
    } catch {
      setError(t("failed_submit_verification"));
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

  const canSubmit = status === "unverified" || status === "rejected";

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">{t("verification_status_title")}</h1>

      {error && <p className="text-red-600">{error}</p>}
      {success && <p className="text-green-600">{success}</p>}

      {/* Status Badge */}
      <div className="card p-6">
        <div className="flex items-center gap-3">
          <span className="text-gray-700 font-medium">
            {t("current_status")}
          </span>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${badgeColor[status] ?? badgeColor.unverified}`}
          >
            {t(status as keyof typeof import('../../i18n/translations/en').default)}
          </span>
        </div>

        {status === "pending" && (
          <p className="text-gray-500 mt-3">{t("verification_pending_msg")}</p>
        )}
        {status === "verified" && (
          <div className="mt-3">
            <p className="text-green-700 font-medium">
              {t("verification_verified_msg")}
            </p>
            {guide.fraud_score !== null && guide.fraud_score !== undefined && (
              <p className="text-xs text-gray-400 mt-1">
                {t("fraud_score")}: {guide.fraud_score}/100
              </p>
            )}
          </div>
        )}
        {status === "rejected" && (
          <p className="text-red-600 mt-3">
            {t("verification_rejected_msg")}
          </p>
        )}
      </div>

      {/* Document Upload Section */}
      {canSubmit && (
        <>
          {/* Step-by-step instructions */}
          <div className="bg-sky-50 border border-sky-200 rounded-xl p-5">
            <h3 className="font-semibold text-sky-900 mb-2">
              {t("verification_steps_title")}
            </h3>
            <p className="text-sm text-sky-700">{t("verification_steps_desc")}</p>
          </div>

          {/* ID Document */}
          <div className="card p-6 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-sm font-bold">
                1
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  {t("upload_id_document")}
                </h3>
                <p className="text-sm text-gray-500">
                  {t("upload_id_desc")}
                </p>
              </div>
            </div>
            {idDocUrl ? (
              <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg p-3">
                <svg
                  className="w-5 h-5 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-sm text-green-700 font-medium">
                  {t("document_uploaded")}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIdDocUrl("");
                    idRef.current?.click();
                  }}
                  className="ml-auto text-sm text-sky-600 hover:text-sky-700"
                >
                  {t("change")}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => idRef.current?.click()}
                disabled={uploadingId}
                className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-sky-400 hover:bg-sky-50 transition-colors"
              >
                <svg
                  className="w-8 h-8 mx-auto text-gray-400 mb-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span className="text-sm text-gray-500">
                  {uploadingId ? t("uploading") : t("click_to_upload_id")}
                </span>
              </button>
            )}
            <input
              ref={idRef}
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadFile(f, setIdDocUrl, setUploadingId);
              }}
            />
          </div>

          {/* Selfie */}
          <div className="card p-6 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-sm font-bold">
                2
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  {t("upload_selfie")}
                </h3>
                <p className="text-sm text-gray-500">
                  {t("upload_selfie_desc")}
                </p>
              </div>
            </div>
            {selfieUrl ? (
              <div className="flex items-center gap-3">
                <img
                  src={selfieUrl}
                  alt="Selfie"
                  className="w-20 h-20 rounded-lg object-cover"
                />
                <div className="flex items-center gap-2 flex-1 bg-green-50 border border-green-200 rounded-lg p-3">
                  <svg
                    className="w-5 h-5 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-sm text-green-700 font-medium">
                    {t("selfie_uploaded")}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelfieUrl("");
                      selfieRef.current?.click();
                    }}
                    className="ml-auto text-sm text-sky-600 hover:text-sky-700"
                  >
                    {t("change")}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => selfieRef.current?.click()}
                disabled={uploadingSelfie}
                className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-sky-400 hover:bg-sky-50 transition-colors"
              >
                <svg
                  className="w-8 h-8 mx-auto text-gray-400 mb-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span className="text-sm text-gray-500">
                  {uploadingSelfie ? t("uploading") : t("click_to_upload_selfie")}
                </span>
              </button>
            )}
            <input
              ref={selfieRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadFile(f, setSelfieUrl, setUploadingSelfie);
              }}
            />
          </div>

          {/* Guide License (optional) */}
          <div className="card p-6 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-bold">
                3
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  {t("upload_guide_license")}
                </h3>
                <p className="text-sm text-gray-500">
                  {t("upload_license_desc")}
                </p>
              </div>
            </div>
            {licenseUrl ? (
              <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg p-3">
                <svg
                  className="w-5 h-5 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-sm text-green-700 font-medium">
                  {t("license_uploaded")}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setLicenseUrl("");
                    licenseRef.current?.click();
                  }}
                  className="ml-auto text-sm text-sky-600 hover:text-sky-700"
                >
                  {t("change")}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => licenseRef.current?.click()}
                disabled={uploadingLicense}
                className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-indigo-400 hover:bg-indigo-50 transition-colors"
              >
                <span className="text-sm text-gray-500">
                  {uploadingLicense
                    ? t("uploading")
                    : t("click_to_upload_license")}
                </span>
                <span className="block text-xs text-gray-400 mt-1">
                  {t("optional")}
                </span>
              </button>
            )}
            <input
              ref={licenseRef}
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadFile(f, setLicenseUrl, setUploadingLicense);
              }}
            />
          </div>

          {/* VerifyID Info Banner */}
          <div className="bg-gradient-to-r from-gray-900 to-indigo-900 rounded-xl p-5 text-white">
            <div className="flex items-start gap-3">
              <svg
                className="w-6 h-6 text-indigo-300 flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              <div>
                <h4 className="font-semibold mb-1">{t("powered_by_verifyid")}</h4>
                <p className="text-sm text-gray-300">
                  {t("verifyid_desc")}
                </p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={submitting || !idDocUrl || !selfieUrl}
            className="w-full bg-sky-600 text-white px-6 py-3 rounded-lg hover:bg-sky-700 disabled:opacity-50 font-semibold text-lg transition-colors"
          >
            {submitting ? t("submitting") : t("submit_verification")}
          </button>
        </>
      )}
    </div>
  );
}
