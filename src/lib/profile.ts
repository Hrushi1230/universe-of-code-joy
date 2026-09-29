import type { ProfileData } from "@/stores/prefsStore";

export type ProfileField = "fullName" | "username" | "email" | "country" | "bio";
export type ProfileErrors = Partial<Record<ProfileField, string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME = /^@[a-z0-9_]{3,20}$/i;

export function validateLocalProfile(profile: ProfileData): ProfileErrors {
  const errors: ProfileErrors = {};
  const fullName = profile.fullName.trim();
  const username = profile.username.trim();
  const email = profile.email.trim();
  const country = profile.country.trim();
  const bio = profile.bio.trim();

  if (fullName.length < 2) errors.fullName = "Enter at least 2 characters.";
  if (fullName.length > 60) errors.fullName = "Keep the name to 60 characters or fewer.";
  if (!USERNAME.test(username)) {
    errors.username = "Use @ followed by 3–20 letters, numbers, or underscores.";
  }
  if (email && !EMAIL.test(email)) errors.email = "Enter a valid email address or leave it blank.";
  if (country.length > 60) errors.country = "Keep the country to 60 characters or fewer.";
  if (bio.length > 240) errors.bio = "Keep the bio to 240 characters or fewer.";
  return errors;
}

export function normalizeLocalProfile(profile: ProfileData): ProfileData {
  return {
    ...profile,
    fullName: profile.fullName.trim(),
    username: profile.username.trim(),
    email: profile.email.trim(),
    country: profile.country.trim(),
    bio: profile.bio.trim(),
    twoFactorEnabled: false,
  };
}
