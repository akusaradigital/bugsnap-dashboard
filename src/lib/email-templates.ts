/**
 * Professional HTML Email Templates for BugSnap Notifications.
 * Clean, modern SaaS design with minimal ornamentation, clear hierarchy,
 * and zero decorative emoji/icon clutter.
 */

export function escapeHtml(str: string): string {
  return str.replace(/[&<>"']/g, (ch) => {
    switch (ch) {
      case "&": return "&amp;";
      case "<": return "&lt;";
      case ">": return "&gt;";
      case '"': return "&quot;";
      case "'": return "&#39;";
      default: return ch;
    }
  });
}

interface CommentEmailOptions {
  appUrl: string;
  captureTitle: string;
  captureUrl: string;
  workspaceName?: string;
  authorName: string;
  commentBody: string;
  isMention?: boolean;
  locale?: string;
}

export function renderCommentEmail({
  appUrl,
  captureTitle,
  captureUrl,
  workspaceName,
  authorName,
  commentBody,
  isMention = false,
  locale = "en",
}: CommentEmailOptions): { subject: string; html: string } {
  const safeTitle = escapeHtml(captureTitle || "Untitled capture");
  const safeAuthor = escapeHtml(authorName || "A collaborator");
  const safeWorkspace = workspaceName ? escapeHtml(workspaceName) : "Your Workspace";
  const safeBody = escapeHtml(commentBody).replace(/\n/g, "<br>");
  const settingsUrl = `${appUrl.replace(/\/$/, "")}/settings?tab=notifications`;
  const safeCaptureUrl = escapeHtml(captureUrl);
  const safeSettingsUrl = escapeHtml(settingsUrl);
  const safeAppUrl = escapeHtml(appUrl);

  const isId = locale === "id";
  const subject = isId
    ? (isMention ? `${safeAuthor} menyebut Anda di "${safeTitle}"` : `Komentar baru pada "${safeTitle}" oleh ${safeAuthor}`)
    : (isMention ? `${safeAuthor} mentioned you on "${safeTitle}"` : `New comment on "${safeTitle}" by ${safeAuthor}`);

  const headerContext = isId
    ? (isMention ? "Penyebutan dalam diskusi" : "Komentar baru pada capture")
    : (isMention ? "Mention in discussion" : "New comment on capture");

  const buttonText = isId ? "Lihat komentar di BugSnap" : "View comment in BugSnap";
  const directLinkText = isId ? "Tautan langsung:" : "Direct link:";
  const footerReason = isId
    ? `Anda menerima email ini karena preferensi notifikasi BugSnap Anda diatur untuk memberi tahu tentang ${isMention ? "penyebutan (@mention)" : "komentar"}.`
    : `You received this email because your BugSnap notification preferences are set to notify you of ${isMention ? "@mentions" : "comments"}.`;
  const manageSettingsText = isId ? "Kelola pengaturan notifikasi" : "Manage notification settings";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 32px 16px; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #0f172a;">
  <div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);">
    <!-- Header -->
    <div style="padding: 24px 32px; border-bottom: 1px solid #f1f5f9; background-color: #ffffff;">
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td>
            <span style="font-size: 16px; font-weight: 700; color: #0f172a; letter-spacing: -0.02em;">BugSnap</span>
            <span style="font-size: 13px; color: #64748b; margin-left: 8px;">·</span>
            <span style="font-size: 13px; color: #64748b; margin-left: 8px;">${safeWorkspace}</span>
          </td>
          <td align="right">
            <span style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #475569; background-color: #f1f5f9; padding: 4px 8px; border-radius: 4px;">
              ${headerContext}
            </span>
          </td>
        </tr>
      </table>
    </div>

    <!-- Main Content -->
    <div style="padding: 32px;">
      <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.5; color: #334155;">
        ${isMention ? `<strong>${safeAuthor}</strong> mentioned you in a discussion on:` : `<strong>${safeAuthor}</strong> added a comment on:`}
      </p>

      <div style="margin: 0 0 24px; padding: 12px 16px; background-color: #f8fafc; border-left: 3px solid #89BD49; border-radius: 0 4px 4px 0;">
        <span style="font-size: 14px; font-weight: 600; color: #0f172a; display: block;">
          ${safeTitle}
        </span>
      </div>

      <!-- Comment Box -->
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 18px 20px; margin-bottom: 28px;">
        <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; color: #64748b; margin-bottom: 8px;">
          Comment
        </div>
        <div style="font-size: 14px; line-height: 1.6; color: #1e293b;">
          ${safeBody}
        </div>
      </div>

      <!-- Action Button -->
      <table role="presentation" border="0" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center" style="border-radius: 6px; background-color: #89BD49;">
            <a href="${safeCaptureUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 11px 22px; font-size: 14px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 6px; background-color: #89BD49;">
              ${buttonText}
            </a>
          </td>
        </tr>
      </table>

      <p style="margin: 24px 0 0; font-size: 13px; color: #64748b; line-height: 1.5;">
        ${directLinkText} <a href="${safeCaptureUrl}" style="color: #89BD49; text-decoration: underline;">${safeCaptureUrl}</a>
      </p>
    </div>

    <!-- Footer -->
    <div style="padding: 20px 32px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; font-size: 12px; line-height: 1.5; color: #64748b;">
      <p style="margin: 0 0 8px;">
        ${footerReason}
      </p>
      <p style="margin: 0;">
        <a href="${safeSettingsUrl}" style="color: #89BD49; text-decoration: underline;">${manageSettingsText}</a> · <a href="${safeAppUrl}" style="color: #89BD49; text-decoration: underline;">BugSnap Dashboard</a>
      </p>
    </div>
  </div>
</body>
</html>`;

  return { subject, html };
}

interface WeeklyDigestOptions {
  appUrl: string;
  workspaceName: string;
  captures: number;
  videos: number;
  comments: number;
  views: number;
}

export function renderWeeklyDigestEmail({
  appUrl,
  workspaceName,
  captures,
  videos,
  comments,
  views,
}: WeeklyDigestOptions): { subject: string; html: string } {
  const safeWorkspace = escapeHtml(workspaceName);
  const dashboardUrl = `${appUrl.replace(/\/$/, "")}/dashboard`;
  const settingsUrl = `${appUrl.replace(/\/$/, "")}/settings?tab=notifications`;
  const safeDashboardUrl = escapeHtml(dashboardUrl);
  const safeSettingsUrl = escapeHtml(settingsUrl);
  const safeAppUrl = escapeHtml(appUrl);

  const subject = `Weekly Activity Summary: ${safeWorkspace}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 32px 16px; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #0f172a;">
  <div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);">
    <!-- Header -->
    <div style="padding: 24px 32px; border-bottom: 1px solid #f1f5f9; background-color: #ffffff;">
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td>
            <span style="font-size: 16px; font-weight: 700; color: #0f172a; letter-spacing: -0.02em;">BugSnap</span>
            <span style="font-size: 13px; color: #64748b; margin-left: 8px;">·</span>
            <span style="font-size: 13px; color: #64748b; margin-left: 8px;">Activity Report</span>
          </td>
          <td align="right">
            <span style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #475569; background-color: #f1f5f9; padding: 4px 8px; border-radius: 4px;">
              Past 7 Days
            </span>
          </td>
        </tr>
      </table>
    </div>

    <!-- Main Content -->
    <div style="padding: 32px;">
      <h1 style="margin: 0 0 8px; font-size: 20px; font-weight: 700; color: #0f172a; line-height: 1.3;">
        ${safeWorkspace}
      </h1>
      <p style="margin: 0 0 28px; font-size: 14px; line-height: 1.5; color: #64748b;">
        Here is your team's BugSnap summary for the past 7 days across captures, video recordings, and discussions.
      </p>

      <!-- 2x2 Metric Table -->
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 32px;">
        <tr>
          <td width="50%" style="padding-right: 8px; padding-bottom: 16px;">
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 18px 20px;">
              <div style="font-size: 26px; font-weight: 700; color: #0f172a; line-height: 1;">
                ${captures}
              </div>
              <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-top: 6px;">
                Captures
              </div>
            </div>
          </td>
          <td width="50%" style="padding-left: 8px; padding-bottom: 16px;">
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 18px 20px;">
              <div style="font-size: 26px; font-weight: 700; color: #0f172a; line-height: 1;">
                ${videos}
              </div>
              <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-top: 6px;">
                Screen Videos
              </div>
            </div>
          </td>
        </tr>
        <tr>
          <td width="50%" style="padding-right: 8px;">
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 18px 20px;">
              <div style="font-size: 26px; font-weight: 700; color: #0f172a; line-height: 1;">
                ${comments}
              </div>
              <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-top: 6px;">
                Comments
              </div>
            </div>
          </td>
          <td width="50%" style="padding-left: 8px;">
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 18px 20px;">
              <div style="font-size: 26px; font-weight: 700; color: #0f172a; line-height: 1;">
                ${views}
              </div>
              <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-top: 6px;">
                Total Views
              </div>
            </div>
          </td>
        </tr>
      </table>

      <!-- Action Button -->
      <table role="presentation" border="0" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center" style="border-radius: 6px; background-color: #89BD49;">
            <a href="${safeDashboardUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 11px 22px; font-size: 14px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 6px; background-color: #89BD49;">
              Open workspace dashboard
            </a>
          </td>
        </tr>
      </table>
    </div>

    <!-- Footer -->
    <div style="padding: 20px 32px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; font-size: 12px; line-height: 1.5; color: #64748b;">
      <p style="margin: 0 0 8px;">
        You received this weekly report because you are an owner of <strong>${safeWorkspace}</strong> with digest notifications enabled.
      </p>
      <p style="margin: 0;">
        <a href="${safeSettingsUrl}" style="color: #89BD49; text-decoration: underline;">Manage notification settings</a> · <a href="${safeAppUrl}" style="color: #89BD49; text-decoration: underline;">BugSnap Dashboard</a>
      </p>
    </div>
  </div>
</body>
</html>`;

  return { subject, html };
}

interface WorkspaceInviteOptions {
  appUrl: string;
  workspaceName: string;
  inviterEmail: string;
  loginUrl: string;
  extensionUrl: string;
}

export function renderWorkspaceInviteEmail({
  appUrl,
  workspaceName,
  inviterEmail,
  loginUrl,
  extensionUrl,
}: WorkspaceInviteOptions): { subject: string; html: string } {
  const safeWorkspace = escapeHtml(workspaceName);
  const safeInviter = escapeHtml(inviterEmail);
  const safeLoginUrl = escapeHtml(loginUrl);
  const safeExtensionUrl = escapeHtml(extensionUrl);
  const safeAppUrl = escapeHtml(appUrl);

  const subject = `Invitation to join ${safeWorkspace} on BugSnap`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 32px 16px; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #0f172a;">
  <div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);">
    <!-- Header -->
    <div style="padding: 24px 32px; border-bottom: 1px solid #f1f5f9; background-color: #ffffff;">
      <span style="font-size: 16px; font-weight: 700; color: #0f172a; letter-spacing: -0.02em;">BugSnap</span>
      <span style="font-size: 13px; color: #64748b; margin-left: 8px;">·</span>
      <span style="font-size: 13px; color: #64748b; margin-left: 8px;">Workspace Invitation</span>
    </div>

    <!-- Main Content -->
    <div style="padding: 32px;">
      <h1 style="margin: 0 0 16px; font-size: 20px; font-weight: 700; color: #0f172a; line-height: 1.3;">
        You've been invited to join ${safeWorkspace}
      </h1>

      <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #334155;">
        <strong>${safeInviter}</strong> has invited you to collaborate on the <strong>${safeWorkspace}</strong> workspace on BugSnap.
      </p>

      <p style="margin: 0 0 28px; font-size: 14px; line-height: 1.6; color: #475569;">
        With BugSnap, your team captures, shares, and annotates bug reports with automatic console logs, network requests, and environment diagnostics.
      </p>

      <!-- Action Buttons -->
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
        <tr>
          <td align="center" style="border-radius: 6px; background-color: #89BD49; padding-right: 12px;">
            <a href="${safeLoginUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 11px 22px; font-size: 14px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 6px; background-color: #89BD49;">
              Accept invitation & log in
            </a>
          </td>
          <td align="center" style="border-radius: 6px; background-color: #f1f5f9;">
            <a href="${safeExtensionUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 11px 18px; font-size: 14px; font-weight: 600; color: #334155; text-decoration: none; border-radius: 6px; background-color: #f1f5f9;">
              Install Chrome extension
            </a>
          </td>
        </tr>
      </table>

      <p style="margin: 0; font-size: 13px; color: #64748b; line-height: 1.5;">
        Sign in using the invited email address to access your workspace captures immediately.
      </p>
    </div>

    <!-- Footer -->
    <div style="padding: 20px 32px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; font-size: 12px; line-height: 1.5; color: #64748b;">
      <p style="margin: 0 0 4px;">
        If you did not expect this invitation, you can safely disregard this email.
      </p>
      <p style="margin: 0;">
        BugSnap · <a href="${safeAppUrl}" style="color: #89BD49; text-decoration: underline;">bugsnap.akusaraproject.my.id</a>
      </p>
    </div>
  </div>
</body>
</html>`;

  return { subject, html };
}
