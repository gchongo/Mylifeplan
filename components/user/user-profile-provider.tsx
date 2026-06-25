"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { apiJson } from "@/lib/client-api";

export type UserProfile = {
  email: string;
  name: string | null;
  avatar: string | null;
};

type UserProfileContextValue = {
  profile: UserProfile;
  setProfile: (profile: UserProfile) => void;
  refreshProfile: () => Promise<void>;
};

const UserProfileContext = createContext<UserProfileContextValue | null>(null);

export function UserProfileProvider({
  initialProfile,
  children,
}: {
  initialProfile: UserProfile;
  children: ReactNode;
}) {
  const [profile, setProfile] = useState<UserProfile>(initialProfile);

  const refreshProfile = useCallback(async () => {
    const data = await apiJson<{ profile?: UserProfile }>("/api/me/profile");
    if (data.profile) setProfile(data.profile);
  }, []);

  const value = useMemo(
    () => ({ profile, setProfile, refreshProfile }),
    [profile, refreshProfile],
  );

  return <UserProfileContext.Provider value={value}>{children}</UserProfileContext.Provider>;
}

export function useUserProfile() {
  const ctx = useContext(UserProfileContext);
  if (!ctx) {
    throw new Error("useUserProfile must be used within UserProfileProvider");
  }
  return ctx;
}

/** 头像占位字母：昵称首字，否则邮箱首字 */
export function profileInitial(profile: Pick<UserProfile, "name" | "email">): string {
  const fromName = profile.name?.trim().charAt(0);
  if (fromName) return fromName.toUpperCase();
  const fromEmail = profile.email.trim().charAt(0);
  return fromEmail ? fromEmail.toUpperCase() : "?";
}

/** 显示名称：昵称优先，否则邮箱 */
export function profileDisplayName(profile: Pick<UserProfile, "name" | "email">): string {
  const name = profile.name?.trim();
  if (name) return name;
  return profile.email;
}
