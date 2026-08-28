// Legacy placeholder that used to get written to users.avatar_url by default.
// Treated as "no avatar" everywhere so the UI falls back to a letter badge
// instead of showing the BugSnap logo as if it were the user's photo.
export const PLACEHOLDER_AVATAR_URL = "https://bugsnap.akusaraproject.my.id/icon.svg";

export function isRealAvatar(url: string | null | undefined): url is string {
  return !!url && url !== PLACEHOLDER_AVATAR_URL;
}

export function pickAvatar(...candidates: (string | null | undefined)[]): string {
  return candidates.find(isRealAvatar) ?? "";
}

export function initialOf(name: string | null | undefined): string {
  return (name?.trim().charAt(0) || "?").toUpperCase();
}
