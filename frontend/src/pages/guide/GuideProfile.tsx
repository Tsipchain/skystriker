import { useEffect, useState, useRef } from "react";
import api from "../../api/client";
import { GuideDetail, City, Country } from "../../types";
import LoadingBlock from "../../components/LoadingBlock";
import { useLang } from "../../context/LanguageContext";

export default function GuideProfile() {
  const { t } = useLang();
  const [guide, setGuide] = useState<GuideDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [languages, setLanguages] = useState("");
  const [specialties, setSpecialties] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [cityId, setCityId] = useState("");
  const [serviceCityIds, setServiceCityIds] = useState<string[]>([]);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [cities, setCities] = useState<City[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const avatarRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([
      api.get<GuideDetail>("/api/v1/guide/me"),
      api.get<City[]>("/api/v1/public/cities"),
      api.get<Country[]>("/api/v1/public/countries"),
    ])
      .then(([g, c, co]) => {
        setGuide(g);
        setFullName(g.full_name ?? "");
        setBio(g.bio ?? "");
        setPhone(g.phone ?? "");
        setLanguages(Array.isArray(g.languages) ? g.languages.join(", ") : "");
        setSpecialties(
          Array.isArray(g.specialties) ? g.specialties.join(", ") : ""
        );
        setAvatarUrl(g.avatar_url ?? "");
        setCityId((g as any).city_id ?? "");
        setServiceCityIds(g.service_city_ids ?? []);
        setCities(c);
        setCountries(co);
      })
      .catch(() => setError(t("failed_load_profile_short")))
      .finally(() => setLoading(false));
  }, []);

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/v1/guide/upload", {
        method: "POST",
        headers: {
          "X-Guide-Id": guide?.id || "",
          Authorization: `Bearer ${localStorage.getItem("skystriker_token") || ""}`,
        },
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        setAvatarUrl(data.url);
      }
    } catch {
      setError(t("failed_update_profile"));
    } finally {
      setUploadingAvatar(false);
    }
  }

  function toggleServiceCity(cid: string) {
    setServiceCityIds((prev) =>
      prev.includes(cid) ? prev.filter((x) => x !== cid) : [...prev, cid]
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await api.patch("/api/v1/guide/me", {
        full_name: fullName,
        bio,
        phone,
        languages: languages
          .split(",")
          .map((l) => l.trim())
          .filter(Boolean),
        specialties: specialties
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        avatar_url: avatarUrl,
        city_id: cityId || undefined,
        service_city_ids: serviceCityIds.join(","),
      });
      setSuccess(t("profile_updated"));
    } catch {
      setError(t("failed_update_profile"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingBlock />;
  if (!guide && error) return <p className="text-red-600">{error}</p>;

  // Group cities by country
  const citiesByCountry: Record<string, City[]> = {};
  cities.forEach((c) => {
    const key = c.country_name || "Other";
    if (!citiesByCountry[key]) citiesByCountry[key] = [];
    citiesByCountry[key].push(c);
  });

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">{t("edit_profile")}</h1>

      {error && <p className="text-red-600">{error}</p>}
      {success && <p className="text-green-600">{success}</p>}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Avatar Section */}
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 mb-4">
            {t("profile_photo")}
          </h3>
          <div className="flex items-center gap-6">
            <div className="relative group">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="w-24 h-24 rounded-full object-cover border-4 border-sky-100"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-3xl font-bold border-4 border-sky-50">
                  {fullName.charAt(0).toUpperCase() || "?"}
                </div>
              )}
              <button
                type="button"
                onClick={() => avatarRef.current?.click()}
                className="absolute inset-0 rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-sm font-medium"
              >
                {uploadingAvatar ? "..." : t("change")}
              </button>
            </div>
            <div>
              <button
                type="button"
                onClick={() => avatarRef.current?.click()}
                disabled={uploadingAvatar}
                className="text-sm text-sky-600 hover:text-sky-700 font-medium"
              >
                {uploadingAvatar ? t("uploading") : t("upload_photo")}
              </button>
              <p className="text-xs text-gray-400 mt-1">
                {t("photo_hint")}
              </p>
            </div>
            <input
              ref={avatarRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
          </div>
        </div>

        {/* Basic Info */}
        <div className="card p-6 space-y-4">
          <h3 className="font-semibold text-gray-900 mb-2">
            {t("basic_info")}
          </h3>
          <div>
            <label className="block text-sm font-medium mb-1">
              {t("full_name")}
            </label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {t("bio")}
            </label>
            <textarea
              className="w-full border rounded px-3 py-2"
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {t("phone")}
            </label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {t("languages_comma")}
            </label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2"
              value={languages}
              onChange={(e) => setLanguages(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {t("specialties_comma")}
            </label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2"
              value={specialties}
              onChange={(e) => setSpecialties(e.target.value)}
            />
          </div>
        </div>

        {/* Primary City & Service Areas */}
        <div className="card p-6 space-y-4">
          <h3 className="font-semibold text-gray-900 mb-2">
            {t("location_service_areas")}
          </h3>
          <p className="text-sm text-gray-500">{t("service_areas_desc")}</p>

          <div>
            <label className="block text-sm font-medium mb-1">
              {t("primary_city")}
            </label>
            <select
              className="w-full border rounded px-3 py-2"
              value={cityId}
              onChange={(e) => setCityId(e.target.value)}
            >
              <option value="">{t("select_city")}</option>
              {Object.entries(citiesByCountry).map(([country, cList]) => (
                <optgroup key={country} label={country}>
                  {cList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              {t("service_cities")}
            </label>
            <div className="max-h-48 overflow-y-auto border rounded p-3 space-y-1">
              {Object.entries(citiesByCountry).map(([country, cList]) => (
                <div key={country}>
                  <p className="text-xs font-semibold text-gray-500 uppercase mt-2 mb-1">
                    {country}
                  </p>
                  {cList.map((c) => (
                    <label
                      key={c.id}
                      className="flex items-center gap-2 py-0.5 cursor-pointer hover:bg-gray-50 px-1 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={serviceCityIds.includes(c.id)}
                        onChange={() => toggleServiceCity(c.id)}
                        className="rounded text-sky-600"
                      />
                      <span className="text-sm">{c.name}</span>
                    </label>
                  ))}
                </div>
              ))}
            </div>
            {serviceCityIds.length > 0 && (
              <p className="text-xs text-sky-600 mt-1">
                {serviceCityIds.length} {t("cities_selected")}
              </p>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="bg-sky-600 text-white px-6 py-2.5 rounded-lg hover:bg-sky-700 disabled:opacity-50 font-medium"
        >
          {saving ? t("saving") : t("save_changes")}
        </button>
      </form>
    </div>
  );
}
