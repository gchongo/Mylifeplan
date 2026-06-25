"use client";

import { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/components/i18n/i18n-provider";
import { UserAvatar } from "@/components/user/user-avatar";
import { useUserProfile } from "@/components/user/user-profile-provider";
import { apiJson } from "@/lib/client-api";

export function SettingsProfileSection() {
  const { t } = useI18n();
  const { profile, setProfile } = useUserProfile();
  const [name, setName] = useState(profile.name ?? "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function saveName() {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const data = await apiJson<{ profile?: typeof profile }>("/api/me/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() || null }),
      });
      if (data.profile) {
        setProfile(data.profile);
        setName(data.profile.name ?? "");
        setMessage(t("settings.profile.saved"));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t("common.saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarChange(file: File) {
    setUploading(true);
    setError("");
    setMessage("");
    try {
      const form = new FormData();
      form.append("file", file);
      const upload = await apiJson<{ url?: string }>("/api/me/avatar", {
        method: "POST",
        body: form,
      });
      if (!upload.url) throw new Error(t("settings.profile.uploadFailed"));

      const data = await apiJson<{ profile?: typeof profile }>("/api/me/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar: upload.url }),
      });
      if (data.profile) {
        setProfile(data.profile);
        setMessage(t("settings.profile.avatarUpdated"));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t("settings.profile.uploadFailed"));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function removeAvatar() {
    setUploading(true);
    setError("");
    setMessage("");
    try {
      const data = await apiJson<{ profile?: typeof profile }>("/api/me/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar: null }),
      });
      if (data.profile) {
        setProfile(data.profile);
        setMessage(t("settings.profile.avatarRemoved"));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t("common.saveFailed"));
    } finally {
      setUploading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("settings.profile.title")}</CardTitle>
        <p className="mt-1 text-sm font-normal text-gray-500">{t("settings.profile.intro")}</p>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex flex-wrap items-center gap-4">
          <UserAvatar
            name={profile.name}
            email={profile.email}
            avatar={profile.avatar}
            size="lg"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              {uploading ? t("settings.profile.uploading") : t("settings.profile.changeAvatar")}
            </button>
            {profile.avatar && (
              <button
                type="button"
                disabled={uploading}
                onClick={() => void removeAvatar()}
                className="rounded-lg px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 disabled:opacity-50 dark:hover:bg-gray-800"
              >
                {t("settings.profile.removeAvatar")}
              </button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleAvatarChange(file);
            }}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="profile-nickname" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t("settings.profile.nickname")}
          </label>
          <div className="flex flex-wrap gap-2">
            <input
              id="profile-nickname"
              type="text"
              value={name}
              maxLength={40}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("settings.profile.nicknamePlaceholder")}
              className="min-w-[12rem] flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
            />
            <button
              type="button"
              disabled={saving || name.trim() === (profile.name ?? "").trim()}
              onClick={() => void saveName()}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {saving ? t("common.saving") : t("common.save")}
            </button>
          </div>
        </div>

        <dl className="space-y-2 border-t border-gray-100 pt-4 text-sm dark:border-gray-800">
          <div className="flex items-center justify-between gap-4">
            <dt className="text-gray-500 dark:text-gray-400">{t("settings.email")}</dt>
            <dd className="font-medium text-gray-900 dark:text-gray-100">{profile.email}</dd>
          </div>
        </dl>

        {message && <p className="text-sm text-emerald-600 dark:text-emerald-400">{message}</p>}
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      </CardContent>
    </Card>
  );
}
