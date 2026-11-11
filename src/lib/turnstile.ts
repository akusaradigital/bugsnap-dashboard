const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export interface TurnstileVerification {
  success: boolean;
  errorCodes?: string[];
  error?: string;
}

export async function verifyTurnstileToken(
  token: string,
  remoteIp?: string,
): Promise<TurnstileVerification> {
  const secret = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY?.trim();
  if (!secret) {
    return { success: false, error: "TURNSTILE_SECRET_MISSING" };
  }

  const formData = new URLSearchParams({ secret, response: token });
  if (remoteIp) formData.set("remoteip", remoteIp);

  try {
    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData,
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    const data = (await response.json().catch(() => ({}))) as {
      success?: boolean;
      "error-codes"?: string[];
    };

    return {
      success: response.ok && data.success === true,
      errorCodes: data["error-codes"] || [],
    };
  } catch {
    return { success: false, error: "TURNSTILE_UNAVAILABLE" };
  }
}
