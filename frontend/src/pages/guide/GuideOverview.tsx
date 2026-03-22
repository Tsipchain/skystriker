import { useEffect, useState } from "react";
import api from "../../api/client";
import { GuideDetail } from "../../types";
import LoadingBlock from "../../components/LoadingBlock";

export default function GuideOverview() {
  const [guide, setGuide] = useState<GuideDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/api/v1/guide/me")
      .then((res) => setGuide(res.data))
      .catch(() => setError("Failed to load guide profile."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingBlock />;
  if (error) return <p className="text-red-600">{error}</p>;
  if (!guide) return null;

  const stats = [
    { label: "Bookings", value: guide.bookings_count ?? 0 },
    { label: "Reviews", value: guide.reviews_count ?? 0 },
    { label: "Rating", value: guide.rating ? guide.rating.toFixed(1) : "N/A" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Welcome back, {guide.full_name}!</h1>

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
