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
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const selectedLabel = options.find((o) => o.value === value)?.label;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full px-3.5 py-2.5 text-[0.8rem] bg-[#161616] backdrop-blur-sm border rounded-lg text-left focus:outline-none transition-all ${
          open ? "border-[var(--gold-primary)] ring-1 ring-[var(--gold-primary)]" : "border-[#2a2a2a]"
        } ${selectedLabel ? "text-white" : "text-gray-500"}`}
      >
        {selectedLabel || placeholder}
      </button>
      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
        <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 right-0 mt-1.5 z-50 w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg shadow-xl shadow-black/40 overflow-hidden">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`w-full text-left px-3.5 py-2.5 text-[0.8rem] transition-colors ${
                  value === opt.value
                    ? "bg-[var(--gold-primary)]/10 text-[var(--gold-primary)]"
                    : "text-gray-300 hover:bg-white/5"
                }`}
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

  return (
    <div className="min-h-screen flex justify-center p-6 md:p-10 pt-24 text-[#f4f0e8]">
      <div className="w-full max-w-[720px] min-w-0">
        <h1 className="text-2xl font-bold text-white mb-1">Profile & Settings</h1>
        <p className="text-sm text-gray-500 mb-8">Manage your account details and preferences.</p>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-[var(--gold-primary)] animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Avatar */}
            <section className="border border-[#1c1c1c] bg-[#0f0f0f] rounded-2xl p-6">
              <h2 className="text-sm font-semibold text-white mb-4">Profile photo</h2>
              <div className="flex items-center gap-5">
                <div className="relative w-20 h-20 rounded-full overflow-hidden border border-[#2a2a2a] bg-[#1a1a1a] flex items-center justify-center flex-shrink-0">
                  {profile?.profileImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profile.profileImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-semibold text-[var(--gold-primary)]">{initials}</span>
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
                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#2a2a2a]/50 border border-gray-700/50 text-white hover:bg-[#2a2a2a] transition-colors disabled:opacity-50"
                  >
                    {uploadingImage ? "Uploading…" : profile?.profileImage ? "Change photo" : "Upload photo"}
                  </button>
                  {profile?.profileImage && (
                    <button
                      type="button"
                      onClick={handleDeleteImage}
                      disabled={deletingImage}
                      className="px-4 py-2 text-xs font-semibold rounded-lg text-gray-400 hover:text-red-400 transition-colors disabled:opacity-50"
                    >
                      {deletingImage ? "Removing…" : "Remove"}
                    </button>
                  )}
                </div>
              </div>
            </section>

            {/* Read-only identity */}
            <section className="border border-[#1c1c1c] bg-[#0f0f0f] rounded-2xl p-6">
              <h2 className="text-sm font-semibold text-white mb-4">Account details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[0.72rem] font-medium text-gray-500 mb-1.5">First name</label>
                  <div className="px-3.5 py-2.5 text-[0.8rem] bg-[#161616] border border-[#2a2a2a] rounded-lg text-gray-400">
                    {firstName || "—"}
                  </div>
                </div>
                <div>
                  <label className="block text-[0.72rem] font-medium text-gray-500 mb-1.5">Last name</label>
                  <div className="px-3.5 py-2.5 text-[0.8rem] bg-[#161616] border border-[#2a2a2a] rounded-lg text-gray-400">
                    {lastName || "—"}
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[0.72rem] font-medium text-gray-500 mb-1.5">Email</label>
                  <div className="px-3.5 py-2.5 text-[0.8rem] bg-[#161616] border border-[#2a2a2a] rounded-lg text-gray-400">
                    {email || "—"}
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[0.72rem] font-medium text-gray-500 mb-1.5">Contact number</label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+1 555 000 0000"
                    className="w-full px-3.5 py-2.5 text-[0.8rem] bg-[#161616] border border-[#2a2a2a] rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-[var(--gold-primary)] transition-colors"
                  />
                </div>
              </div>
            </section>

            {/* Business settings */}
            <section className="border border-[#1c1c1c] bg-[#0f0f0f] rounded-2xl p-6">
              <h2 className="text-sm font-semibold text-white mb-4">Business settings</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[0.72rem] font-medium text-gray-500 mb-1.5">Business type</label>
                  <Dropdown
                    value={businessType}
                    onChange={setBusinessType}
                    options={BUSINESS_TYPE_OPTIONS}
                    placeholder="Select business type"
                  />
                </div>
                <div>
                  <label className="block text-[0.72rem] font-medium text-gray-500 mb-1.5">Biggest challenge</label>
                  <Dropdown
                    value={challenge}
                    onChange={setChallenge}
                    options={CHALLENGE_OPTIONS}
                    placeholder="Select challenge"
                  />
                </div>
                <div>
                  <label className="block text-[0.72rem] font-medium text-gray-500 mb-1.5">Team size</label>
                  <Dropdown
                    value={teamSize}
                    onChange={setTeamSize}
                    options={TEAM_SIZE_OPTIONS}
                    placeholder="Select team size"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={savingProfile}
                className="mt-5 px-6 py-2.5 rounded-xl font-semibold text-sm animate-button-gradient text-black hover:shadow-lg hover:shadow-[var(--gold-primary)]/20 hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:hover:scale-100"
              >
                {savingProfile ? "Saving…" : "Save changes"}
              </button>
            </section>

            {/* Password */}
            <section className="border border-[#1c1c1c] bg-[#0f0f0f] rounded-2xl p-6">
              <h2 className="text-sm font-semibold text-white mb-4">Password</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-[0.72rem] font-medium text-gray-500 mb-1.5">Current password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-[0.8rem] bg-[#161616] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-[var(--gold-primary)] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[0.72rem] font-medium text-gray-500 mb-1.5">New password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-[0.8rem] bg-[#161616] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-[var(--gold-primary)] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[0.72rem] font-medium text-gray-500 mb-1.5">Confirm new password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-[0.8rem] bg-[#161616] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-[var(--gold-primary)] transition-colors"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={handleChangePassword}
                disabled={savingPassword}
                className="mt-5 px-6 py-2.5 rounded-xl font-semibold text-sm bg-[#2a2a2a]/50 border border-gray-700/50 text-white hover:bg-[#2a2a2a] transition-colors disabled:opacity-50"
              >
                {savingPassword ? "Updating…" : "Update password"}
              </button>
            </section>

            {/* Upgrade */}
            <section className="border border-[#1c1c1c] bg-[#0f0f0f] rounded-2xl p-6 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold text-white">Upgrade your account</h2>
                <p className="text-xs text-gray-500 mt-1">Unlock higher limits and more features.</p>
              </div>
              <button
                type="button"
                className="px-5 py-2.5 rounded-lg font-semibold text-xs text-[var(--gold-primary)] border border-[var(--gold-primary)]/40 hover:bg-[var(--gold-primary)]/10 transition-colors flex-shrink-0"
              >
                Upgrade Account
              </button>
            </section>

            {/* Danger zone */}
            <section className="border border-red-900/40 bg-red-950/10 rounded-2xl p-6">
              <h2 className="text-sm font-semibold text-red-400">Delete account</h2>
              <p className="text-xs text-gray-500 mt-1 mb-4">
                This permanently removes your account and all associated data. This cannot be undone.
              </p>
              <button
                type="button"
                onClick={() => setDeleteModalOpen(true)}
                className="px-5 py-2.5 rounded-lg font-semibold text-xs text-red-400 border border-red-900/50 hover:bg-red-950/30 transition-colors"
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
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => !deletingAccount && setDeleteModalOpen(false)}
          />
          <div className="relative w-full max-w-sm bg-[#0f0f0f] border border-red-900/40 rounded-2xl p-6">
            <h3 className="text-base font-semibold text-white mb-2">Delete {displayName}&apos;s account?</h3>
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              This permanently deletes your account and all data from Xlya. It cannot be undone. Type your email (
              <span className="text-gray-400">{email}</span>) to confirm.
            </p>
            <input
              type="email"
              value={deleteConfirmEmail}
              onChange={(e) => setDeleteConfirmEmail(e.target.value)}
              placeholder={email || "your@email.com"}
              className="w-full px-3.5 py-2.5 text-[0.8rem] bg-[#161616] border border-[#2a2a2a] rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-red-500 transition-colors"
            />
            <div className="flex items-center justify-end gap-3 mt-5">
              <button
                type="button"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setDeleteConfirmEmail("");
                }}
                disabled={deletingAccount}
                className="px-4 py-2 text-xs font-medium text-gray-400 hover:text-white transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deletingAccount || deleteConfirmEmail.trim().toLowerCase() !== (email || "").toLowerCase()}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-red-600 text-white hover:bg-red-500 transition-colors disabled:opacity-40 disabled:hover:bg-red-600"
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
