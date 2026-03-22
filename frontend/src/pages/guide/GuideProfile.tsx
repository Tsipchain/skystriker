import { useEffect, useState } from "react";
import api from "../../api/client";
import { GuideDetail } from "../../types";
import LoadingBlock from "../../components/LoadingBlock";

export default function GuideProfile() {
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

  useEffect(() => {
    api
      .get<GuideDetail>("/api/v1/guide/me")
      .then((g) => {
        setGuide(g);
        setFullName(g.full_name ?? "");
        setBio(g.bio ?? "");
        setPhone(g.phone ?? "");
        setLanguages(Array.isArray(g.languages) ? g.languages.join(", ") : "");
        setSpecialties(
          Array.isArray(g.specialties) ? g.specialties.join(", ") : ""
        );
      })
      .catch(() => setError("Failed to load profile."))
      .finally(() => setLoading(false));
  }, []);

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
        languages: languages.split(",").map((l) => l.trim()).filter(Boolean),
        specialties: specialties.split(",").map((s) => s.trim()).filter(Boolean),
      });
      setSuccess("Profile updated successfully.");
    } catch {
      setError("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingBlock />;
  if (!guide && error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Edit Profile</h1>

      {error && <p className="text-red-600">{error}</p>}
      {success && <p className="text-green-600">{success}</p>}

      <form onSubmit={handleSubmit} className="card p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Full Name</label>
          <input
            type="text"
            className="w-full border rounded px-3 py-2"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Bio</label>
          <textarea
            className="w-full border rounded px-3 py-2"
            rows={4}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Phone</label>
          <input
            type="text"
            className="w-full border rounded px-3 py-2"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Languages (comma-separated)
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
            Specialties (comma-separated)
          </label>
          <input
            type="text"
            className="w-full border rounded px-3 py-2"
            value={specialties}
            onChange={(e) => setSpecialties(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
