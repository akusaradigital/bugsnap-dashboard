export type Tab = "general" | "members" | "billing" | "integrations" | "account" | "notifications";

// i18n keys, not strings: this is a module const so it cannot call useT() -
// the caller resolves it at render time.
export const TAB_TITLES: Record<Tab, { title: string; subtitle: string }> = {
  general: { title: "settings.tabGeneral", subtitle: "settings.tabGeneralSub" },
  members: { title: "settings.members", subtitle: "settings.tabMembersSub" },
  billing: { title: "settings.tabBilling", subtitle: "settings.tabBillingSub" },
  integrations: { title: "settings.tabIntegrations", subtitle: "settings.tabIntegrationsSub" },
  account: { title: "settings.tabAccount", subtitle: "settings.tabAccountSub" },
  notifications: { title: "settings.tabNotifications", subtitle: "settings.tabNotificationsSub" },
};

export const ROLE_OPTIONS = ["Customer success", "Support", "Engineering", "Design", "Product", "QA", "Sales", "Other"];
