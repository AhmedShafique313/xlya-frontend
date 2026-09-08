"use client";

import { useEffect, useRef, useState } from "react";
import { useAppSelector, useAppDispatch } from "@/redux/hooks";
import { clearCredentials } from "@/redux/services/auth/auth";
import { streamSettings, SettingsUser } from "@/lib/api/settingsStream";
import { toast } from "@/components/snakbar";
import {
  BUSINESS_TYPE_OPTIONS,
  CHALLENGE_OPTIONS,
  TEAM_SIZE_OPTIONS,
} from "@/constants/onboarding";
import { useLandingTheme } from "@/components/landingPage/landingTheme";
import type { LandingThemeTokens } from "@/components/landingPage/landingTheme";

// Downscales/compresses an image client-side before it's base64-encoded and
// sent to the settings lambda, which stores it as a Binary attribute
// directly on the onboarding-table row (DynamoDB's hard 400KB item cap, so
// the lambda rejects anything over ~280KB raw — this keeps ordinary photos
// well under that without the user having to think about it).
async function compressImage(file: File): Promise<{ base64: string; contentType: string }> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = reject;
    el.src = dataUrl;
  });

  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const scale = Math.max(size / img.width, size / img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h);

  const compressed = canvas.toDataURL("image/jpeg", 0.8);
  return { base64: compressed, contentType: "image/jpeg" };
}

function Dropdown({
  value,
  onChange,
  options,
  placeholder,
  t,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  t: LandingThemeTokens;
}) {
  const [open, setOpen] = useState(false);
  const selectedLabel = options.find((o) => o.value === value)?.label;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full px-3.5 py-2.5 text-[0.8rem] rounded-lg text-left focus:outline-none transition-all"
        style={{
          background: t.surface,
          border: `1px solid ${open ? t.gold : t.border}`,
          color: selectedLabel ? t.fg : t.fgFaint,
        }}
      >
        {selectedLabel || placeholder}
      </button>
      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
        <svg className="w-3.5 h-3.5" style={{ color: t.fgFaint }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute top-full left-0 right-0 mt-1.5 z-50 w-full rounded-lg overflow-hidden"
            style={{ background: t.card, border: `1px solid ${t.border}`, boxShadow: "0 12px 32px rgba(0,0,0,0.35)" }}
          >
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className="w-full text-left px-3.5 py-2.5 text-[0.8rem] transition-colors"
                style={{
                  background: value === opt.value ? t.goldDim : "transparent",
                  color: value === opt.value ? t.gold : t.fgMid,
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const { t } = useLandingTheme();
  const dispatch = useAppDispatch();
  const authUser = useAppSelector((state) => state.auth.user);
  const accessToken = useAppSelector((state) => state.auth.tokens.accessToken);

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<SettingsUser | null>(null);

  const [businessType, setBusinessType] = useState("");
  const [challenge, setChallenge] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const [uploadingImage, setUploadingImage] = useState(false);
  const [deletingImage, setDeletingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);

  const loadProfile = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      let loaded: SettingsUser | null = null;
      await streamSettings(accessToken, { action: "get" }, (event) => {
        if (event.type === "result" && event.statusCode === 200 && event.user) {
          loaded = event.user;
        }
      });
      const result = loaded as SettingsUser | null;
      if (result) {
        setProfile(result);
        setBusinessType(result.businessType || "");
        setChallenge(result.challenge || "");
        setTeamSize(result.teamSize || "");
        setPhoneNumber(result.phoneNumber || "");
      } else {
        toast.error("Couldn't load your profile.");
      }
    } catch (err) {
      console.error("Failed to load profile:", err);
      toast.error("Couldn't load your profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const handleSaveProfile = async () => {
    if (!accessToken || savingProfile) return;
    setSavingProfile(true);
    try {
      let ok = false;
      let errorMsg = "";
      await streamSettings(
        accessToken,
        { action: "update_profile", businessType, challenge, teamSize, phoneNumber },
        (event) => {
          if (event.type !== "result") return;
          ok = event.statusCode === 200;
          errorMsg = event.error || "";
        }
      );
      if (ok) {
        toast.success("Profile updated.");
      } else {
        toast.error(errorMsg || "Couldn't update your profile.");
      }
    } catch (err) {
      console.error("Failed to update profile:", err);
      toast.error("Couldn't update your profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !accessToken) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }

    setUploadingImage(true);
    try {
      const { base64, contentType } = await compressImage(file);
      let ok = false;
      let errorMsg = "";
      let newImage: string | undefined;
      await streamSettings(accessToken, { action: "upload_image", imageBase64: base64, contentType }, (event) => {
        if (event.type !== "result") return;
        ok = event.statusCode === 200;
        errorMsg = event.error || "";
        newImage = event.profileImage;
      });
      if (ok) {
        setProfile((prev) => (prev ? { ...prev, profileImage: newImage || prev.profileImage } : prev));
        toast.success("Photo updated.");
      } else {
        toast.error(errorMsg || "Couldn't upload your photo.");
      }
    } catch (err) {
      console.error("Failed to upload image:", err);
      toast.error("Couldn't upload your photo.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDeleteImage = async () => {
    if (!accessToken || deletingImage) return;
    setDeletingImage(true);
    try {
      let ok = false;
      await streamSettings(accessToken, { action: "delete_image" }, (event) => {
        if (event.type === "result") ok = event.statusCode === 200;
      });
      if (ok) {
        setProfile((prev) => (prev ? { ...prev, profileImage: null } : prev));
        toast.success("Photo removed.");
      } else {
        toast.error("Couldn't remove your photo.");
      }
    } catch (err) {
      console.error("Failed to delete image:", err);
      toast.error("Couldn't remove your photo.");
    } finally {
      setDeletingImage(false);
    }
  };

  const handleChangePassword = async () => {
    if (!accessToken || savingPassword) return;
    if (!currentPassword || !newPassword) {
      toast.error("Please fill in both password fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New password and confirmation don't match.");
      return;
    }
    setSavingPassword(true);
    try {
      let ok = false;
      let errorMsg = "";
      await streamSettings(accessToken, { action: "change_password", currentPassword, newPassword }, (event) => {
        if (event.type !== "result") return;
        ok = event.statusCode === 200;
        errorMsg = event.error || "";
      });
      if (ok) {
        toast.success("Password updated.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(errorMsg || "Couldn't update your password.");
      }
    } catch (err) {
      console.error("Failed to change password:", err);
      toast.error("Couldn't update your password.");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!accessToken || deletingAccount) return;
    setDeletingAccount(true);
    try {
      let ok = false;
      let errorMsg = "";
      await streamSettings(accessToken, { action: "delete_account" }, (event) => {
        if (event.type !== "result") return;
        ok = event.statusCode === 200;
        errorMsg = event.error || "";
      });
      if (ok) {
        toast.success("Your account has been deleted.");
      } else {
        toast.error(errorMsg || "Couldn't delete your account.");
        setDeletingAccount(false);
        return;
      }
    } catch (err) {
      console.error("Failed to delete account:", err);
      toast.error("Couldn't delete your account.");
      setDeletingAccount(false);
      return;
    }
    dispatch(clearCredentials());
    // Full browser navigation, not router.push — same reasoning as
    // AppNavbar.handleLogout: this page is mounted inside ProtectedRoute,
    // whose own redirect effect would otherwise win the race.
    window.location.href = "/";
  };

  // Prefer the settings lambda's own GetUserCommand read (fetched fresh from
  // Cognito on every load) over the Redux auth.user snapshot — a session
  // that started via /auth/login never gets firstName/lastName written into
  // Redux (the login lambda's result event doesn't return them), so relying
  // on authUser here silently showed only the email for anyone who logged
  // in rather than signed up. profile.firstName/lastName/email come straight
  // from Cognito's given_name/family_name/email attributes instead.
  const firstName = profile?.firstName || authUser?.firstName;
  const lastName = profile?.lastName || authUser?.lastName;
  const email = profile?.email || authUser?.email;
  const displayName = [firstName, lastName].filter(Boolean).join(" ") || email || "Account";
  const initials = (firstName?.[0] || email?.[0] || "?").toUpperCase();

  const cardStyle: React.CSSProperties = { border: `1px solid ${t.border}`, background: t.card };
  const inputStyle: React.CSSProperties = { background: t.surface, border: `1px solid ${t.border}`, color: t.fg };
  const readonlyStyle: React.CSSProperties = { background: t.surface, border: `1px solid ${t.border}`, color: t.fgMid };
  const socialButtonStyle: React.CSSProperties = { background: t.surface, border: `1px solid ${t.border}`, color: t.fg };

  return (
    <div className="min-h-screen flex justify-center p-6 md:p-10 pt-20 md:pt-[88px] lg:pt-[104px]" style={{ color: t.fg }}>
      <div className="w-full max-w-[720px] min-w-0">
        <h1 className="text-2xl font-bold mb-1" style={{ color: t.fg }}>Profile & Settings</h1>
        <p className="text-sm mb-8" style={{ color: t.fgMid }}>Manage your account details and preferences.</p>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 rounded-full animate-spin" style={{ border: `2px solid ${t.border}`, borderTopColor: t.gold }} />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Avatar */}
            <section className="rounded-2xl p-6" style={cardStyle}>
              <h2 className="text-sm font-semibold mb-4" style={{ color: t.fg }}>Profile photo</h2>
              <div className="flex items-center gap-5">
                <div
                  className="relative w-20 h-20 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0"
                  style={{ border: `1px solid ${t.border}`, background: t.surface }}
                >
                  {profile?.profileImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profile.profileImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-semibold" style={{ color: t.gold }}>{initials}</span>
                  )}
                </div>
                <div className="flex items-center gap-2.5">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="px-4 py-2 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 hover:brightness-125"
                    style={socialButtonStyle}
                  >
                    {uploadingImage ? "Uploading…" : profile?.profileImage ? "Change photo" : "Upload photo"}
                  </button>
                  {profile?.profileImage && (
                    <button
                      type="button"
                      onClick={handleDeleteImage}
                      disabled={deletingImage}
                      className="px-4 py-2 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                      style={{ color: t.fgMid }}
                    >
                      {deletingImage ? "Removing…" : "Remove"}
                    </button>
                  )}
                </div>
              </div>
            </section>

            {/* Read-only identity */}
            <section className="rounded-2xl p-6" style={cardStyle}>
              <h2 className="text-sm font-semibold mb-4" style={{ color: t.fg }}>Account details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[0.72rem] font-medium mb-1.5" style={{ color: t.fgFaint }}>First name</label>
                  <div className="px-3.5 py-2.5 text-[0.8rem] rounded-lg" style={readonlyStyle}>
                    {firstName || "Not set"}
                  </div>
                </div>
                <div>
                  <label className="block text-[0.72rem] font-medium mb-1.5" style={{ color: t.fgFaint }}>Last name</label>
                  <div className="px-3.5 py-2.5 text-[0.8rem] rounded-lg" style={readonlyStyle}>
                    {lastName || "Not set"}
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[0.72rem] font-medium mb-1.5" style={{ color: t.fgFaint }}>Email</label>
                  <div className="px-3.5 py-2.5 text-[0.8rem] rounded-lg" style={readonlyStyle}>
                    {email || "Not set"}
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[0.72rem] font-medium mb-1.5" style={{ color: t.fgFaint }}>Contact number</label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+1 555 000 0000"
                    className="w-full px-3.5 py-2.5 text-[0.8rem] rounded-lg focus:outline-none transition-colors"
                    style={inputStyle}
                  />
                </div>
              </div>
            </section>

            {/* Business settings */}
            <section className="rounded-2xl p-6" style={cardStyle}>
              <h2 className="text-sm font-semibold mb-4" style={{ color: t.fg }}>Business settings</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[0.72rem] font-medium mb-1.5" style={{ color: t.fgFaint }}>Business type</label>
                  <Dropdown value={businessType} onChange={setBusinessType} options={BUSINESS_TYPE_OPTIONS} placeholder="Select business type" t={t} />
                </div>
                <div>
                  <label className="block text-[0.72rem] font-medium mb-1.5" style={{ color: t.fgFaint }}>Biggest challenge</label>
                  <Dropdown value={challenge} onChange={setChallenge} options={CHALLENGE_OPTIONS} placeholder="Select challenge" t={t} />
                </div>
                <div>
                  <label className="block text-[0.72rem] font-medium mb-1.5" style={{ color: t.fgFaint }}>Team size</label>
                  <Dropdown value={teamSize} onChange={setTeamSize} options={TEAM_SIZE_OPTIONS} placeholder="Select team size" t={t} />
                </div>
              </div>
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={savingProfile}
                className="mt-5 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 disabled:opacity-50"
                style={{ background: t.gold, color: t.isDark ? "#0a0a0a" : "#faf8f4" }}
              >
                {savingProfile ? "Saving…" : "Save changes"}
              </button>
            </section>

            {/* Password */}
            <section className="rounded-2xl p-6" style={cardStyle}>
              <h2 className="text-sm font-semibold mb-4" style={{ color: t.fg }}>Password</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-[0.72rem] font-medium mb-1.5" style={{ color: t.fgFaint }}>Current password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-[0.8rem] rounded-lg focus:outline-none transition-colors"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label className="block text-[0.72rem] font-medium mb-1.5" style={{ color: t.fgFaint }}>New password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-[0.8rem] rounded-lg focus:outline-none transition-colors"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label className="block text-[0.72rem] font-medium mb-1.5" style={{ color: t.fgFaint }}>Confirm new password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-[0.8rem] rounded-lg focus:outline-none transition-colors"
                    style={inputStyle}
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={handleChangePassword}
                disabled={savingPassword}
                className="mt-5 px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50 hover:brightness-125"
                style={socialButtonStyle}
              >
                {savingPassword ? "Updating…" : "Update password"}
              </button>
            </section>

            {/* Upgrade */}
            <section className="rounded-2xl p-6 flex items-center justify-between gap-4" style={cardStyle}>
              <div>
                <h2 className="text-sm font-semibold" style={{ color: t.fg }}>Upgrade your account</h2>
                <p className="text-xs mt-1" style={{ color: t.fgMid }}>Unlock higher limits and more features.</p>
              </div>
              <button
                type="button"
                className="px-5 py-2.5 rounded-lg font-semibold text-xs transition-colors flex-shrink-0"
                style={{ color: t.gold, border: `1px solid ${t.gold}66` }}
              >
                Upgrade Account
              </button>
            </section>

            {/* Danger zone */}
            <section className="rounded-2xl p-6" style={{ border: "1px solid rgba(239,68,68,0.35)", background: t.isDark ? "rgba(69,10,10,0.15)" : "rgba(254,226,226,0.4)" }}>
              <h2 className="text-sm font-semibold" style={{ color: "#f87171" }}>Delete account</h2>
              <p className="text-xs mt-1 mb-4" style={{ color: t.fgMid }}>
                This permanently removes your account and all associated data. This cannot be undone.
              </p>
              <button
                type="button"
                onClick={() => setDeleteModalOpen(true)}
                className="px-5 py-2.5 rounded-lg font-semibold text-xs transition-colors"
                style={{ color: "#f87171", border: "1px solid rgba(239,68,68,0.4)" }}
              >
                Delete Account
              </button>
            </section>
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 backdrop-blur-sm"
            style={{ background: "rgba(0,0,0,0.6)" }}
            onClick={() => !deletingAccount && setDeleteModalOpen(false)}
          />
          <div className="relative w-full max-w-sm rounded-2xl p-6" style={{ background: t.card, border: "1px solid rgba(239,68,68,0.35)" }}>
            <h3 className="text-base font-semibold mb-2" style={{ color: t.fg }}>Delete {displayName}&apos;s account?</h3>
            <p className="text-xs mb-4 leading-relaxed" style={{ color: t.fgMid }}>
              This permanently deletes your account and all data from Xlya. It cannot be undone. Type your email (
              <span style={{ color: t.fgMid }}>{email}</span>) to confirm.
            </p>
            <input
              type="email"
              value={deleteConfirmEmail}
              onChange={(e) => setDeleteConfirmEmail(e.target.value)}
              placeholder={email || "your@email.com"}
              className="w-full px-3.5 py-2.5 text-[0.8rem] rounded-lg focus:outline-none transition-colors"
              style={inputStyle}
            />
            <div className="flex items-center justify-end gap-3 mt-5">
              <button
                type="button"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setDeleteConfirmEmail("");
                }}
                disabled={deletingAccount}
                className="px-4 py-2 text-xs font-medium transition-colors disabled:opacity-50"
                style={{ color: t.fgMid }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deletingAccount || deleteConfirmEmail.trim().toLowerCase() !== (email || "").toLowerCase()}
                className="px-4 py-2 text-xs font-semibold rounded-lg transition-colors disabled:opacity-40"
                style={{ background: "#dc2626", color: "#ffffff" }}
              >
                {deletingAccount ? "Deleting…" : "Delete permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
