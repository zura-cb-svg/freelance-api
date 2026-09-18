import { useEffect, useRef, useState } from "react";
import { Pencil, UploadCloud, Check, X, Briefcase } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { updateMyProfile, uploadPortfolio } from "../api/users";
import { getUserReviews } from "../api/reviews";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { ReviewsPanel } from "../components/reviews/ReviewsPanel";
import { initials } from "../utils/format";

export function Profile() {
  const { user, setUser, refreshProfile } = useAuth();
  const toast = useToast();
  const fileInputRef = useRef(null);

  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [skills, setSkills] = useState(user?.skills || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [reviews, setReviews] = useState([]);
  const [reviewStatus, setReviewStatus] = useState("loading");

  const loadReviews = () => {
    if (!user?.id) return;
    setReviewStatus("loading");
    getUserReviews(user.id)
      .then((data) => {
        setReviews(Array.isArray(data) ? data : []);
        setReviewStatus("ready");
      })
      .catch(() => setReviewStatus("error"));
  };

  useEffect(() => {
    loadReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const startEditing = () => {
    setFullName(user?.full_name || "");
    setBio(user?.bio || "");
    setSkills(user?.skills || "");
    setIsEditing(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updated = await updateMyProfile({ full_name: fullName.trim(), bio, skills });
      setUser(updated);
      toast.success("Profile updated.");
      setIsEditing(false);
    } catch (err) {
      toast.error(err.friendlyMessage || "Couldn't update your profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      await uploadPortfolio(file);
      toast.success("Portfolio file uploaded.");
      refreshProfile();
    } catch (err) {
      toast.error(err.friendlyMessage || "Couldn't upload that file.");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  if (!user) return null;

  const skillList = (user.skills || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <div className="container-page max-w-3xl py-10">
      <div className="card p-6 sm:p-8">
        <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-xl font-semibold text-brand-700">
              {initials(user.full_name)}
            </span>
            <div>
              <h1 className="text-xl font-semibold text-ink-900">{user.full_name}</h1>
              <p className="text-sm text-ink-500">{user.email}</p>
              <div className="mt-1.5 flex items-center gap-2">
                <Badge tone="brand">{user.role}</Badge>
                {!user.is_active && <Badge tone="pending">Inactive</Badge>}
              </div>
            </div>
          </div>

          {!isEditing && (
            <Button variant="secondary" size="sm" onClick={startEditing}>
              <Pencil size={14} /> Edit profile
            </Button>
          )}
        </div>

        <div className="mt-7 border-t border-line pt-6">
          {isEditing ? (
            <div className="flex flex-col gap-4">
              <div>
                <label className="field-label" htmlFor="full-name">
                  Full name
                </label>
                <input
                  id="full-name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="field-input"
                />
              </div>
              <div>
                <label className="field-label" htmlFor="bio">
                  Bio
                </label>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  placeholder="Tell clients and freelancers a bit about yourself..."
                  className="field-input resize-none"
                />
              </div>
              <div>
                <label className="field-label" htmlFor="skills">
                  Skills <span className="font-normal text-ink-500">(comma-separated)</span>
                </label>
                <input
                  id="skills"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="React, Node.js, UI Design"
                  className="field-input"
                />
              </div>
              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setIsEditing(false)} className="flex-1">
                  <X size={15} /> Cancel
                </Button>
                <Button onClick={handleSave} isLoading={isSaving} className="flex-1">
                  <Check size={15} /> Save changes
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <h2 className="text-sm font-semibold text-ink-900">Bio</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-500">
                  {user.bio || "No bio added yet."}
                </p>
              </div>
              <div>
                <h2 className="text-sm font-semibold text-ink-900">Skills</h2>
                {skillList.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {skillList.map((skill) => (
                      <Badge key={skill}>{skill}</Badge>
                    ))}
                  </div>
                ) : (
                  <p className="mt-1.5 text-sm text-ink-500">No skills added yet.</p>
                )}
              </div>
            </div>
          )}
        </div>

        {user.role === "freelancer" && (
          <div className="mt-7 border-t border-line pt-6">
            <h2 className="text-sm font-semibold text-ink-900">Portfolio</h2>
            <p className="mt-1 text-sm text-ink-500">Upload a file to showcase your past work.</p>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileSelect}
              aria-label="Upload portfolio file"
            />
            <Button
              variant="secondary"
              size="sm"
              className="mt-3"
              onClick={() => fileInputRef.current?.click()}
              isLoading={isUploading}
            >
              <UploadCloud size={15} /> Upload file
            </Button>
          </div>
        )}
      </div>

      <div className="card mt-6 p-6 sm:p-8">
        <h2 className="mb-1 text-lg font-semibold text-ink-900">Reviews</h2>
        <p className="mb-5 text-sm text-ink-500">Feedback other users have left on your profile.</p>
        <ReviewsPanel reviews={reviews} status={reviewStatus} onRetry={loadReviews} />
      </div>

      {user.role === "client" && (
        <div className="mt-6 flex items-center gap-2 rounded-lg border border-line bg-surface px-4 py-3 text-sm text-ink-500">
          <Briefcase size={15} />
          Looking for your job postings? Head to{" "}
          <a href="/applications" className="font-medium text-brand-600 hover:text-brand-700">
            My Jobs
          </a>
          .
        </div>
      )}
    </div>
  );
}
