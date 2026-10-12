export interface EscalationPayloadParams {
  title: string | null;
  siteUrl?: string | null;
  occurrences: number;
  affectedUsers: number;
  captureUrl: string;
  fingerprint: string;
}

export interface EscalationEmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

export interface EscalationEmbed {
  title: string;
  url: string;
  color: number;
  fields: EscalationEmbedField[];
}

export interface EscalationWebhookPayload {
  content: string;
  text: string;
  embeds: EscalationEmbed[];
}

/**
 * Escalate only when currentCount has reached the threshold AND has gotten
 * WORSE since the last time this exact fingerprint was escalated - so a
 * cron tick 15 minutes after the first escalation, with no new reports,
 * does not fire again. lastEscalatedCount === null means never escalated.
 */
export function shouldEscalate(
  currentCount: number,
  threshold: number,
  lastEscalatedCount: number | null
): boolean {
  const safeThreshold = Math.max(1, Number.isFinite(threshold) ? threshold : 5);
  if (!Number.isFinite(currentCount) || currentCount < safeThreshold) {
    return false;
  }
  if (lastEscalatedCount === null || !Number.isFinite(lastEscalatedCount)) {
    return true;
  }
  return currentCount > lastEscalatedCount;
}

/**
 * Builds Slack- and Discord-compatible escalation webhook payload.
 */
export function buildEscalationPayload(params: EscalationPayloadParams): EscalationWebhookPayload {
  const { title, siteUrl, occurrences, affectedUsers, captureUrl, fingerprint } = params;
  const cleanTitle = (title && title.trim()) || "Untitled Capture";
  const userCount = Math.max(1, affectedUsers || 1);
  const userText = userCount === 1 ? "1 person" : `${userCount} people`;

  const content = `⚠️ Recurring error reported ${occurrences}× (reported by ${userText}): **${cleanTitle}**\n${captureUrl}`;
  const text = `⚠️ Recurring error reported ${occurrences}× (reported by ${userText}): ${cleanTitle}\n${captureUrl}`;

  const fields: EscalationEmbedField[] = [
    { name: "Occurrences", value: String(occurrences), inline: true },
    { name: "Reported by", value: userText, inline: true },
    { name: "Fingerprint", value: (fingerprint || "unknown").slice(0, 1024), inline: false },
  ];

  if (siteUrl && siteUrl.trim()) {
    fields.push({ name: "Site", value: siteUrl.trim(), inline: false });
  }

  return {
    content,
    text,
    embeds: [
      {
        title: `⚠️ Recurring Error: ${cleanTitle}`,
        url: captureUrl,
        color: 0xef4444,
        fields,
      },
    ],
  };
}
