import { useEffect, useState } from "react";
import api from "../../api/client";
import { GuideDetail } from "../../types";
import LoadingBlock from "../../components/LoadingBlock";
import { useLang } from "../../context/LanguageContext";

export default function GuideOverview() {
  const { t } = useLang();
  const [guide, setGuide] = useState<GuideDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<GuideDetail>("/api/v1/guide/me")
      .then((data) => setGuide(data))
      .catch(() => setError(t('failed_load_profile')))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingBlock />;
  if (error) return <p className="text-red-600">{error}</p>;
  if (!guide) return null;

  const stats = [
    { label: t('experiences'), value: guide.experiences?.length ?? 0 },
    { label: t('reviews'), value: guide.total_reviews ?? 0 },
    { label: t('rating'), value: guide.rating ? guide.rating.toFixed(1) : "N/A" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('welcome_back_name', { name: guide.full_name })}</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="card p-6 text-center">
            <p className="text-3xl font-bold">{s.value}</p>
            <p className="text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
