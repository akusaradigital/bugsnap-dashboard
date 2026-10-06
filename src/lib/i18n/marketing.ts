import type { Dict } from "./types";

export const marketingEn: Dict = {
  "landing.home": "Home",
  "landing.tagline":
    "Catch Bugs in 1-Click. DevTools Logs & Screen Recording, Stored in YOUR Google Drive",
  "landing.subtitle":
    "Capture your screen with full DevTools context - saved directly to your own Google Drive. You own the files. Always.",
  "landing.heroSub":
    "Stop wasting hours asking 'can you reproduce it?'. BugSnap captures your screen with automated console logs, network errors, and environment specs - then saves everything directly to your own Google Drive and creates an interactive share link in seconds. Free, no setup required.",
  "landing.cta": "Add to Chrome - Free",
  "landing.ctaVariantSpeed": "Start Catching Bugs - Free",
  "landing.ctaVariantSpeedSub": "1-Click Screen + DevTools Logs",
  "landing.ctaHint":
    "Record bugs with complete console & network error logs - saved straight to your own Google Drive.",
  "landing.exploreFeatures": "Explore Features",
  "landing.signIn": "Sign in",
  "landing.signInGoogle": "Sign in with Google",
  "landing.redirecting": "Redirecting...",
  "landing.goToDashboard": "Go to Dashboard",
  "landing.freeForever": "Your captures. Your Google Drive. Free.",
  "landing.noCard":
    "Every recording is saved directly to your own Google Drive. No credit card, no setup, no friction.",
  "landing.authFailed": "Authentication failed. Please try again.",
  "landing.pill1Title": "Automated DevTools",
  "landing.pill1Desc":
    "Console errors & network 4xx/5xx captured with zero setup.",
  "landing.pill2Title": "100% Data Ownership",
  "landing.pill2Desc":
    "Saved directly to your Google Drive. No server lock-in.",
  "landing.pill3Title": "Instant 1-Click Sharing",
  "landing.pill3Desc":
    "Teammates view recordings & inspect logs without installing anything.",
  "landing.f1Title": "Capture Screen, Audio & Clicks in Seconds",
  "landing.f1Body":
    "Record whole screens, individual apps, or Chrome tabs in crisp HD with voice narration. Use hotkeys (Ctrl+Shift+S / Ctrl+Shift+F), crop, add arrows, or blur sensitive data before sharing.",
  "landing.editorLabel": "BugSnap - Editor",
  "landing.f2Title": "DevTools Context Captured Silently in the Background",
  "landing.f2Body":
    "No need to teach non-technical teammates how to open Inspect Element. BugSnap automatically attaches console warnings, unhandled exceptions, failed API requests, and system specs to every recording.",
  "landing.f3Title": "One Share Link. Instant Resolution. Zero Back-and-Forth.",
  "landing.f3Body":
    "Paste the link into Jira, Linear, Slack, or GitHub. Developers inspect the network waterfall, copy error messages, and leave timestamped feedback directly on the video timeline.",
  "landing.recordings": "Recordings",
  "landing.all": "All",
  "landing.videos": "Videos",
  "landing.screenshots": "Screenshots",
  "landing.mock1": "Bug on login modal",
  "landing.mock2": "Checkout flow",
  "landing.mock3": "Design review",
  "landing.faq": "Frequently Asked Questions",
  "landing.faq1q": "What makes BugSnap different from a plain screen recorder?",
  "landing.faq1a":
    "Standard screen recorders only capture visual pixels. BugSnap captures both the visual recording AND technical DevTools diagnostics (console errors, failed HTTP requests, headers, and device specs) side-by-side, cutting debugging time from hours to minutes.",
  "landing.faq2q": "How does the Google Drive integration work?",
  "landing.faq2a":
    "All captures are stored directly in your own Google Drive under a dedicated BugSnap folder. You retain full ownership and control of your files - delete or manage them anytime from Drive. We never hold your recordings on our servers.",
  "landing.faq3q":
    "Are sensitive passwords, cookies, or authorization tokens safe?",
  "landing.faq3a":
    "Yes. BugSnap only captures diagnostic console logs and HTTP request metadata. Authentication headers, passwords, and sensitive input fields are filtered, and our built-in canvas editor lets you blur any sensitive onscreen details before saving.",
  "landing.faq4q": "Do my team members need the extension to view links?",
  "landing.faq4a":
    "No. Anyone you share a link with can view the recording, screenshots, and attached context directly in their web browser. No downloads, no sign-ups.",
  "landing.faq5q": "Is BugSnap really free?",
  "landing.faq5a":
    "Yes. BugSnap is free with no paywalls or feature locks. Captures are stored directly in your own Google Drive so you never pay for storage.",
  "landing.faq6q":
    "Which issue trackers and project tools does BugSnap support?",
  "landing.faq6a":
    "BugSnap integrates directly with Jira, Linear, GitHub Issues, Slack, Asana, GitLab, Notion, and ClickUp, generating markdown reports with attached DevTools telemetry.",
  "landing.faq7q": "Can BugSnap access other files in my Google Drive?",
  "landing.faq7a":
    "No. BugSnap only requests the Google Drive 'drive.file' scope, meaning it can only view and edit files it created itself. It can never read, see, or touch your private documents, spreadsheets, or other folders.",
  "landing.faq8q":
    "What happens if I delete a capture from Google Drive or the dashboard?",
  "landing.faq8a":
    "Deleting a capture from the dashboard removes its metadata instantly. Because files are hosted directly in your Drive, you can also delete or manage recordings straight from Google Drive at any time without restrictions.",
  "landing.faq9q": "Does BugSnap sell or analyze my bug reports or telemetry?",
  "landing.faq9a":
    "Never. We never sell your data, use your video recordings for AI model training, or track third-party analytics. Your telemetry and recordings remain 100% private to you and your team.",
  "landing.faq10q":
    "What diagnostic data does BugSnap capture during a recording?",
  "landing.faq10a":
    "BugSnap captures browser console errors and warnings, failed and completed network requests with status codes and headers, DOM mutation replay events, user interaction clicks/keystrokes, and system specifications.",
  "landing.faq11q":
    "Can I take screenshots as well as screen video recordings?",
  "landing.faq11a":
    "Yes. You can capture annotated screenshots with arrows, rectangles, text, and blur tools, or record smooth high-definition video with optional microphone audio, webcam overlay, and tab sound.",
  "landing.faq12q":
    "Does recording with DevTools telemetry slow down my browser?",
  "landing.faq12a":
    "No. BugSnap uses lightweight browser diagnostic APIs and passive event listeners. Data processing runs asynchronously in background service workers with zero noticeable impact on page performance.",
  "landing.faq13q": "How does the DOM Replay feature work?",
  "landing.faq13a":
    "BugSnap records DOM mutations and user interactions safely. In the dashboard player, developers can inspect elements, step through time, and replay exact user actions without needing to reproduce bugs manually.",
  "landing.faq14q":
    "Can I blur or redact sensitive onscreen information before saving?",
  "landing.faq14a":
    "Yes. The built-in image and video editor provides quick blur and blackout tools so you can redact passwords, customer personal information, or API secrets before generating a shareable link.",
  "landing.faq15q":
    "Can I protect shared bug report links with passwords or expiration dates?",
  "landing.faq15a":
    "Yes. You can protect any shared capture link with an optional access password and set an automatic expiration date (such as 7 days, 30 days, or never) to maintain full access control.",
  "landing.faq16q": "How does 1-click issue export to Jira and GitHub work?",
  "landing.faq16a":
    "Click 'Copy Report' from any capture to get a beautifully structured markdown issue containing the bug summary, reproduction steps, device environment, error stack traces, and direct video links ready to paste.",
  "landing.faq17q":
    "Can I organize captures into Workspaces for different teams or projects?",
  "landing.faq17a":
    "Yes. You can create multiple workspaces, invite team members with role-based permissions, and organize bug captures by project, tags, and status to keep reports tidy.",
  "landing.faq18q":
    "Does BugSnap support custom webhooks and team notifications?",
  "landing.faq18a":
    "Yes. You can configure custom webhooks to dispatch automated notifications to your Slack or Discord channels whenever a new bug capture or team comment is submitted.",
  "landing.cta2": "Ready to Never Ask 'Can You Reproduce It?' Again?",
  "landing.footDesc":
    "The fastest way to capture screen recordings, network errors, and console logs - then share bug reports your team can act on instantly.",
  "landing.product": "Product",
  "landing.screenRecorder": "Screen Recorder",
  "landing.devTools": "DevTools Integration",
  "landing.pricing": "Pricing Plans",
  "landing.security": "Security Guard",
  "landing.resources": "Resources",
  "landing.docs": "Documentation",
  "landing.chromeExt": "Chrome Extension",
  "landing.help": "Help Center",
  "landing.apiStatus": "API Status",
  "landing.company": "Company",
  "landing.about": "About Us",
  "landing.privacy": "Privacy Policy",
  "landing.terms": "Terms of Service",
  "landing.contact": "Contact",
  "landing.copyright": "© {year} BugSnap. All rights reserved.",
  "landing.builtOn":
    "Built on your Google Drive. Your data stays yours - always.",
  "landing.ecosystemEyebrow": "Akusara Suite",
  "landing.ecosystemTitle": "Part of the Akusara QA & Dev Ecosystem",
  "landing.ecosystemSub":
    "BugSnap works seamlessly alongside our suite of developer tools to streamline bug tracking and QA.",
  "landing.ecosystemBugSnapDesc":
    "Record bugs with full DevTools logs, saved to your own Google Drive.",
  "landing.ecosystemAksoraTitle": "Aksora",
  "landing.ecosystemAksoraDesc":
    "Issue tracking and project management. Push bugs directly into sprints and tickets.",
  "landing.ecosystemSnapTestTitle": "SnapTest AI",
  "landing.ecosystemSnapTestDesc":
    "Autonomous AI QA agent that runs test suites and turns BugSnap captures into verified tests.",
  "landing.ecosystemOpen": "Open App",
  "landing.howItWorks": "How It Works",
  "landing.howItWorksTitle": "How It Works: From Click to Fix in Seconds",
  "landing.seeFullWalkthrough": "See full walkthrough",
  "landing.featuresTitle": "Everything You Need to Squash Bugs Faster",
  "landing.eyebrow": "Free · No credit card required",
  "landing.trustStrip":
    "Saved directly to YOUR Google Drive. You own every file.",
  "landing.heroTrustNote":
    "100% private Google Drive storage · No credit card required · Free",
  "landing.heroTabDevTools": "DevTools & Video",
  "landing.heroTabAnnotation": "Screenshot Annotation",
  "landing.heroTabShare": "Instant Share Link",
  "landing.trustDrive": "Private Google Drive Storage",
  "landing.trustDriveSub": "You own 100% of your data",
  "landing.trustChrome": "Chrome Web Store Verified",
  "landing.trustChromeSub": "Safe & instant install",
  "landing.trustPrivacy": "Zero 3rd-Party Tracking",
  "landing.trustPrivacySub": "No middleman server lock-in",
  "landing.systemStatusOperational": "All systems operational",
  "landing.ecosystemBugSnapLabel": "Captures & DevTools",
  "landing.ecosystemAksoraBrief": "Issue tracking & sprints",
  "landing.ecosystemSnapTestBrief": "AI QA testing",
  "landing.mockDriveSync": "Saved to Google Drive",
  "landing.mockTabConsole": "Console",
  "landing.mockTabNetwork": "Network",
  "landing.mockTabStorage": "Storage",
  "landing.mockTabSystem": "System",
  "landing.mockConsoleErr":
    "Uncaught TypeError: Cannot read properties of undefined (reading 'checkout')",
  "landing.mockConsoleWarn":
    "Warning: Slow network response on payment-intent API (>1200ms)",
  "landing.mockConsoleClick": "User clicked button#pay-button",
  "landing.mockOrderSummary": "Order Summary",
  "landing.mockItemsCount": "2 items",
  "landing.mockTotalAmount": "$149.00",
  "landing.mockPayButton": "Pay Now $149.00",
  "landing.mockPaymentFailed": "Payment Failed: 500 Internal Server Error",
  "landing.metricSpeedVal": "10x",
  "landing.metricSpeedLabel": "Faster Bug Reports",
  "landing.metricSpeedSub": "Zero repetitive manual repro typing",
  "landing.metricOwnershipVal": "100%",
  "landing.metricOwnershipLabel": "Google Drive Privacy",
  "landing.metricOwnershipSub": "Files stored in your own Google Drive",
  "landing.metricZeroTrackVal": "0",
  "landing.metricZeroTrackLabel": "3rd-Party Tracking",
  "landing.metricZeroTrackSub": "No middleman server data harvesting",
  "landing.metricShareTimeVal": "< 3s",
  "landing.metricShareTimeLabel": "Capture to Link",
  "landing.metricShareTimeSub": "Instant shareable URL generated automatically",
  "landing.playerPlay": "Play",
  "landing.playerPause": "Pause",
  "landing.playerClickMarker": "00:08 User clicks 'Pay Now'",
  "landing.playerErrorMarker": "00:42 POST /charge 500 Error",
  "landing.heroLiveDemo": "Live Interactive Demo",
  "landing.ticketPreviewTitle": "Auto-Generated Issue Preview",
  "landing.ticketAttachedVideo": "checkout-reproduction.webm (720p · 1.2 MB)",
  "landing.ticketAttachedHar": "network-telemetry.har (4 requests)",
  "landing.ticketAttachedSys": "system-environment.json (Win11 · Chrome 140)",
  "landing.ticketSelectHint":
    "Click any integration below to preview the auto-generated ticket:",
  "landing.bentoAnnotateTitle": "Built-in Annotation & Video Narrator",
  "landing.bentoAnnotateDesc":
    "Draw arrows, blur sensitive tokens, highlight UI defects, and record voice narration directly in the browser.",
  "landing.bentoTabTerminal": "Terminal",
  "landing.bentoTabCurl": "cURL Command",
  "landing.bentoTabJson": "DevTools JSON",
  "landing.bentoCopyCmd": "Copy Command",
  "landing.bentoCopiedCmd": "Copied!",
  "landing.faqAll": "All Questions",
  "landing.faqPrivacy": "Google Drive & Privacy",
  "landing.faqDevTools": "DevTools & Capture",
  "landing.faqIntegrations": "Integrations & Sharing",
  "features.title": "The Bug Reporting Toolkit Built for High-Velocity Teams",
  "features.subtitle":
    "Turn vague 'it's broken' reports into actionable debugging context with 1-click video, automated DevTools logs, and your own Google Drive storage.",
  "features.f1Eyebrow": "Screen & Audio Recording",
  "features.f1Title": "Capture Screenshots & Screen Recordings with Audio",
  "features.f1Desc":
    "Record your screen, a specific window, or a Chrome tab in crisp HD. Add voice narration or webcam overlay to explain complex reproduction steps effortlessly.",
  "features.f1HotkeyScreen":
    "One-click shortcut: Ctrl + Shift + S for screenshot",
  "features.f1HotkeyVideo": "Hotkey: Ctrl + Shift + F for screen recording",
  "features.f1Editor":
    "Canvas editor to annotate, crop, highlight, or blur sensitive data",
  "features.f1Stream": "1080p WebM Stream + Microphone Audio",
  "features.f2Eyebrow": "Automated DevTools",
  "features.f2Title": "Zero-Config Console & Network Error Logs",
  "features.f2Desc":
    "No need to explain 'how to open DevTools' to non-technical team members. BugSnap automatically captures failed HTTP requests, console errors, user actions, and environment metadata directly with every recording.",
  "features.f3Eyebrow": "Ownership & Privacy",
  "features.f3Title": "Stored in Your Own Google Drive",
  "features.f3Desc":
    "Unlike other platforms that store your files on their servers, BugSnap uploads video & image files directly to your personal Google Drive account. You retain 100% ownership and control of your files, your privacy, and your storage limits - on every plan, free or paid.",
  "features.f3BadgeTitle": "Your Storage, Your Data",
  "features.f3BadgeDesc":
    "Files are uploaded directly to Google Drive / BugSnap Captures - your folder, in your account. We never store recordings on our servers, so you can delete or manage them anytime, right from Drive.",
  "features.ctaTitle": "Ready to streamline your bug reports?",
  "features.ctaDesc":
    "Install the BugSnap extension and start capturing screen recordings, audio, and DevTools logs in seconds - saved directly to your own Google Drive, free, no credit card required.",
  "features.ctaButton": "Get Extension Free",
  "features.catAll": "All Capabilities",
  "features.catCapture": "Screen & Audio",
  "features.catDevTools": "DevTools & Logs",
  "features.catStorage": "Drive & Privacy",
  "features.devLogsTitle": "Automated DevLogs Captured",
  "features.devLogsError":
    "POST /api/v1/auth 500 Internal Server Error (142ms)",
  "features.devLogsWarn":
    "[Console Warn] Unhandled promise rejection: AuthTokenExpired",
  "features.devLogsEnv": "OS: Windows 11 · Browser: Chrome · Window: 1920x1080",
  "pricing.title": "Simple, Transparent Pricing",
  "pricing.subtitle":
    "All recordings live in your own Google Drive - so we never charge you for storage fees or lock your files. Choose the plan that best fits your team's workflow.",
  "pricing.customTitle": "Need a tailored solution?",
  "pricing.customDesc":
    "Dedicated infrastructure, SSO, IP allowlists, or strict compliance requirements? We deliver custom enterprise deployments tailored to your organization's security requirements.",
  "pricing.contactSales": "Contact Sales",
  "pricing.monthly": "Monthly",
  "pricing.yearly": "Yearly",
  "pricing.yearlySave": "save up to 28%",
  "pricing.mostPopular": "Most Popular",
  "pricing.billedYearly": "Billed yearly",
  "pricing.perMonth": "/mo",
  "pricing.tierFree": "Free",
  "pricing.tierFreeTagline":
    "Everything saved to your own Google Drive - free.",
  "pricing.tierFreeCta": "Install Extension Free",
  "pricing.fFree1": "5 new captures per week",
  "pricing.fFree2": "Unlimited screen & tab recordings (HD)",
  "pricing.fFree3": "Automated console & network log capture",
  "pricing.fFree4": "Stored in your own Google Drive - full ownership",
  "pricing.fFree5": "Public share links & basic view analytics",
  "pricing.fFree6": "Up to 5 team members",
  "pricing.tierPro": "Pro",
  "pricing.tierProTagline": "For teams that deliver and resolve efficiently.",
  "pricing.tierProCta": "Start Free Trial",
  "pricing.fPro1": "Everything in Free",
  "pricing.fPro2": "Unlimited team members",
  "pricing.fPro3": "Custom branding (logo & name)",
  "pricing.fPro4": "Remove the BugSnap watermark",
  "pricing.fPro5": "Slack & Discord webhooks",
  "pricing.fPro6": "AI-generated bug summaries",
  "pricing.tierProPlus": "Pro+",
  "pricing.tierProPlusTagline": "More quota, longer videos, priority AI.",
  "pricing.tierProPlusCta": "Start Free Trial",
  "pricing.fProPlus1": "Everything in Pro",
  "pricing.fProPlus2": "Larger capture quota",
  "pricing.fProPlus3": "Extended video length",
  "pricing.fProPlus4": "Priority AI bug summaries",
  "pricing.fProPlus5": "Advanced access & analytics",
  "pricing.tierEnterprise": "Enterprise",
  "pricing.tierEnterpriseTagline":
    "For organizations with strict security requirements.",
  "pricing.tierEnterpriseCta": "Contact Sales",
  "pricing.fEnt1": "Everything in Pro+",
  "pricing.fEnt2": "Custom domain for share links",
  "pricing.fEnt3": "IP & domain access whitelist",
  "pricing.fEnt4": "Burn-after-reading links",
  "pricing.fEnt5": "Priority support & SLA, SSO-ready",
  "howItWorks.title": "How BugSnap Works: From Bug to Fix in 3 Clicks",
  "howItWorks.subtitle":
    "No complex setups. No developer tools training needed. Just click, record, and share actionable bug reports.",
  "howItWorks.step1Title": "One-Click Capture",
  "howItWorks.step1Desc":
    "Capture screenshots or record screen videos with audio and webcam overlay directly from your browser with a single hotkey.",
  "howItWorks.step2Title": "Automated DevTools Context",
  "howItWorks.step2Desc":
    "BugSnap automatically captures console errors, network requests, OS, and browser metadata without any manual logging or inspection.",
  "howItWorks.step3Title": "Instant Link in Your Drive",
  "howItWorks.step3Desc":
    "Your captures are stored directly in your own Google Drive. Share an interactive link with your team instantly into Jira, Slack, or GitHub.",
  "howItWorks.preview1Title": "Capture Shortcuts",
  "howItWorks.preview1Hotkeys": "Ctrl + Shift + S (Screenshot)",
  "howItWorks.preview1HotkeysVideo": "Ctrl + Shift + F (Recording)",
  "howItWorks.preview2Title": "Automated Diagnostics",
  "howItWorks.preview2Console": "Console Errors & Warnings",
  "howItWorks.preview2Network": "Failed Network Requests",
  "howItWorks.preview3Title": "Zero-Friction Sharing",
  "howItWorks.preview3Drive": "Google Drive Storage",
  "howItWorks.preview3Share": "Instant Share Link",
  "about.title": "About BugSnap",
  "about.subtitle":
    "Built by Akusara Digital to make bug reporting effortless for developers, QA, and product teams.",
  "about.missionTitle": "Our Mission",
  "about.headline": "From Click to Fix: Eliminating Friction in Bug Reports",
  "about.missionDesc":
    "Turn vague 'it doesn't work' bug reports into actionable, debuggable context in seconds. Eliminate the friction between reporters and developers.",
  "about.privacyFirstTitle": "Privacy First & Your Drive",
  "about.privacyFirstDesc":
    "Unlike other tools that store your videos on third-party servers, BugSnap connects directly to your Google Drive. Your data stays in your cloud, always.",
  "about.ecosystemTitle": "Akusara Digital Ecosystem",
  "about.ecosystemDesc":
    "BugSnap works seamlessly alongside Aksora and SnapTest AI to provide an end-to-end bug tracking and QA testing solution.",
  "about.stat1Value": "1-Click",
  "about.stat1Label": "Instant screen & DevTools recording",
  "about.stat2Value": "100%",
  "about.stat2Label": "Data ownership in your Google Drive",
  "about.stat3Value": "0",
  "about.stat3Label": "Third-party video hosting servers",
  "about.stat4Value": "0s",
  "about.stat4Label": "Wasted time explaining reproduction steps",
  "about.companyDesc": "Creator of BugSnap, Aksora, and SnapTest AI.",
  "about.visitWebsite": "Visit akusaradigital.com",
  "docs.title": "BugSnap Documentation",
  "docs.subtitle":
    "Guides, hotkeys, and integration references to get the most out of BugSnap.",
  "docs.gettingStarted": "Getting Started",
  "docs.installExt": "Install Extension",
  "docs.shortcuts": "Keyboard Shortcuts",
  "docs.driveSetup": "Google Drive Setup",
  "docs.viewAndShare": "Sharing & Permissions",
  "docs.navGettingStartedDesc":
    "Install the extension and link your Google Drive.",
  "docs.navShortcutsDesc":
    "Capture instantly with hotkeys without opening menus.",
  "docs.navDriveSetupDesc": "Understand permissions and private cloud storage.",
  "docs.navViewAndShareDesc":
    "Password protection, expiration dates, and links.",
  "docs.shortcutScreenshot": "Instant Screenshot",
  "docs.shortcutScreenshotDesc":
    "Capture current visible tab or selected window",
  "docs.shortcutRecording": "Start Screen Recording",
  "docs.shortcutRecordingDesc":
    "Record screen, tab, or window with microphone audio",
  "docs.driveScopeDesc":
    "BugSnap requests the standard Google Drive drive.file scope. This means BugSnap can only read and write files it created itself - it can never see, read, or modify your personal files or spreadsheets.",
  "docs.viewHelpFaqs": "View Help Center FAQs",
  "docs.contactSupport": "Contact Technical Support",
  "docs.terminalCopied": "Copied!",
  "docs.copyCode": "Copy",
  "help.title": "Help Center & FAQs",
  "help.subtitle":
    "Find answers to common questions about setting up the Chrome extension, managing permissions, and using the dashboard.",
  "help.faqHeading": "Frequently Asked Questions",
  "help.faq1Q": "How do I connect my Google Drive?",
  "help.faq1A":
    "When you first capture a bug and attempt to save, a Chrome popup will prompt you to authenticate via Google OAuth. Allow the 'drive.file' permission so BugSnap can write the generated screenshots/video files directly into a new 'BugSnap Captures' folder.",
  "help.faq2Q": "Why are my DevTools logs empty?",
  "help.faq2A":
    "Ensure you triggered the capture on the specific page where the bug occurred. The extension captures console errors and failed network requests only during the recording session or right at the moment you click screenshot.",
  "help.faq3Q": "How do I invite team members?",
  "help.faq3A":
    "Go to your Dashboard, navigate to 'Settings > Members', and enter their email address. They will receive an email invite to join your Workspace. All captures recorded in this Workspace will be visible to them.",
  "help.faq4Q": "Are my captures public by default?",
  "help.faq4A":
    "No. Captures are strictly visible to you and your Workspace members. If you generate a public share link (/c/...), you can secure it with an optional password and an expiration date.",
  "help.needHelp": "Still need help?",
  "help.needHelpDesc":
    "Can't find the answer you're looking for? Reach out to our technical support team.",
  "help.emailSupport": "Email Support",
  "help.getStarted": "Get started",
  "help.installFree": "Install Extension Free",
  "help.seePricing": "See Pricing",
  "help.resources": "Resources",
  "help.viewDocs": "Request Detailed Documentation",
  "help.contactForm": "Contact Form & Details",
  "help.systemStatus": "System Status",
  "help.openFaq": "Open question",
  "help.closeFaq": "Close question",
  "contact.title": "Contact Us",
  "contact.subtitle":
    "Have questions, feedback, or need help with BugSnap? Reach out to our team.",
  "contact.emailSupport": "Email Support",
  "contact.company": "Company & Publisher",
  "contact.companyDesc":
    "Developer and operator of BugSnap - From Click to Fix.",
  "contact.enterprise": "Enterprise & Sales",
  "contact.enterpriseTitle": "Custom Deployment",
  "contact.enterpriseDesc":
    "Need SLA guarantees, SSO, or custom integrations for your team? Contact our sales team to discuss enterprise options.",
  "contact.startCapturing": "Start capturing with BugSnap",
  "contact.installFree": "Install Extension Free",
  "contact.seePricing": "See Pricing",
  "contact.usefulResources": "Useful Resources",
  "contact.privacy": "Privacy Policy",
  "contact.privacyDesc":
    "How we handle your data, Google Drive integration, and Chrome permissions.",
  "contact.terms": "Terms of Service",
  "contact.termsDesc":
    "The agreement between you and BugSnap regarding acceptable use and service limits.",
  "contact.docs": "Documentation & Extension Setup",
  "contact.docsDesc":
    "Guides on how to install, configure Google Drive OAuth, and use the annotation editor.",
  "contact.emailDesc":
    "For technical issues, account help, security reports, or general inquiries. We aim to reply within 24 hours.",
  "contact.websiteLabel": "Website:",
  "security.title": "Security Built on Trust & Transparency",
  "security.subtitle":
    "We designed BugSnap with privacy-first architecture: your media is stored in your own Google Drive, and our platform keeps only minimal metadata.",
  "security.h1Title": "BYO Storage - Files in YOUR Drive",
  "security.h1Desc":
    "Recordings and screenshots never touch our servers. They go straight to your personal Google Drive, under your ownership and retention controls.",
  "security.h2Title": "Encryption in Transit",
  "security.h2Desc":
    "All traffic is served over HTTPS / TLS 1.3. Authentication sessions use short-lived encrypted tokens with forced token rotation.",
  "security.h3Title": "No Data Selling",
  "security.h3Desc":
    "We do not sell, rent, or share your personal data, captures, or metadata with any advertisers, data brokers, or third parties. Ever.",
  "security.h4Title": "Principle of Least Privilege",
  "security.h4Desc":
    "The extension requests only the minimal Chrome permissions needed to capture media and upload to Google Drive, justified and vetted for the Chrome Web Store.",
  "security.h5Title": "Minimal Metadata Storage",
  "security.h5Desc":
    "Only capture title, duration, OS, browser, and dev-log summaries are stored in our secure cloud database - needed to render your workspace dashboard.",
  "security.h6Title": "Enterprise-Grade Compliance",
  "security.h6Desc":
    "Our infrastructure is regularly audited and adheres to strict security standards to ensure your data remains protected.",
  "security.comparisonTitle": "What we store vs. what we never store",
  "security.comparisonDesc":
    "We only store: metadata needed to render the dashboard and tracking (title, type, duration, OS, browser, timestamps), plus comments/captures you explicitly delete from the dashboard. We never store your Google passwords, Drive file contents, or browsing history.",
  "security.deleteNote":
    "You can delete any capture or its metadata at any time.",
  "security.ctaTitle": "Trust BugSnap with your bug reports",
  "security.ctaDesc":
    "Install the extension free - your captures stay in your own Google Drive, and paid plans unlock advanced team security.",
  "security.installFree": "Install Extension Free",
  "security.seePricing": "See Pricing",
  "security.readPrivacy": "Read the full Privacy Policy",
  "security.verifiedBadge": "Verified Architecture",
  "support.btn": "Customer Support",
  "support.helpPrompt": "Need help? Contact us now!",
  "support.title": "Customer Support",
  "support.subtitle": "Report bugs, request features, or ask questions",
  "support.hide": "Minimize",
  "support.unhide": "Expand",
  "support.close": "Close",
  "support.category": "Report Category",
  "support.catBug": "Bug Report",
  "support.catFeature": "New Feature",
  "support.catOther": "General",
  "support.descBug": "Feature error or unexpected behavior",
  "support.descFeature": "Suggest an idea or feature for BugSnap",
  "support.descOther": "General inquiries, account, or feedback",
  "support.placeholderBug":
    "Describe what happened, steps to reproduce, or error messages...",
  "support.placeholderFeature":
    "What feature would you like to see and how would it help?...",
  "support.placeholderOther": "Write your question or message for our team...",
  "support.emailLabel": "Your Email",
  "support.emailHint": "(for CS response)",
  "support.subjectLabel": "Subject / Title",
  "support.subjectPlaceholderBug": "e.g. Video recording stopped unexpectedly",
  "support.subjectPlaceholderFeature": "e.g. Notion export integration",
  "support.subjectPlaceholderOther": "e.g. Storage quota question",
  "support.messageLabel": "Message Details",
  "support.sending": "Sending to CS...",
  "support.sendBtn": "Send to CS",
  "support.urgent": "Need urgent response?",
  "support.successTitle": "Report Sent!",
  "support.successDesc":
    "Message forwarded to Customer Support ({email}). We will get back to you shortly.",
  "support.openClient": "Open in your email client",
  "support.sendAnother": "Send another report",
  "support.validationError": "Please enter a message or description.",
  "support.emailRequired": "Email is required so our CS team can reply to you.",
  "support.emailInvalid":
    "Please enter a valid email address (e.g. name@domain.com).",
  "support.emailDisposable":
    "Temporary or disposable email addresses are not allowed.",
  "support.botBlocked": "Anti-bot verification failed. Please try again.",

  /* --- BugSnap Public Website Design System --- */
  "site.nav.product": "Product",
  "site.nav.features": "Features",
  "site.nav.solutions": "Solutions",
  "site.nav.howItWorks": "How it works",
  "site.nav.pricing": "Pricing",
  "site.nav.extension": "Extension",
  "site.nav.docs": "Docs",
  "site.nav.login": "Log in",
  "site.nav.getStarted": "Get started",
  "site.nav.dashboard": "Dashboard",
  "site.nav.blog": "Blog",
  "site.theme.day": "Day",
  "site.theme.dark": "Dark",
  "site.theme.system": "System",

  "site.hero.eyebrow": "Developer-first bug reporting",
  "site.hero.headline": "From Click to Fix. In seconds.",
  "site.hero.body":
    "Capture your screen with automatic console logs, failed network requests, and system specs - saved directly to your Google Drive. Zero server lock-in.",
  "site.hero.ctaPrimary": "Add to Chrome - Free",
  "site.hero.ctaSecondary": "See how it works",
  "site.hero.meta": "Free • Your Google Drive • No credit card",

  "site.flow.badge": "Product Workflow",
  "site.flow.title": "From reproduction to resolution without back-and-forth",
  "site.flow.subtitle":
    "Every recording turns vague bug reports into airtight technical tickets.",
  "site.flow.step1.title": "Spot the issue",
  "site.flow.step1.desc":
    "Something breaks in your web app. No need to reproduce it three times or guess what went wrong.",
  "site.flow.step2.title": "Capture with 1 click",
  "site.flow.step2.desc":
    "Record tab, window, or entire screen. Add arrows, rectangles, or blur sensitive data directly on canvas.",
  "site.flow.step3.title": "Telemetry attached silently",
  "site.flow.step3.desc":
    "Console exceptions, network 4xx/5xx payloads, storage, and device specs are bundled automatically.",
  "site.flow.step4.title": "Saved to your Google Drive",
  "site.flow.step4.desc":
    "Files go straight to your own cloud storage. You retain 100% data ownership and privacy.",
  "site.flow.step5.title": "Share a smart interactive link",
  "site.flow.step5.desc":
    "Teammates inspect DevTools, replay video, and copy stack traces in their browser without downloading anything.",
  "site.flow.step6.title": "Ship the fix",
  "site.flow.step6.desc":
    "Export markdown reports directly to Jira, Linear, GitHub Issues, or Slack and close the ticket.",

  "site.features.sectionBadge": "Capabilities",
  "site.features.sectionTitle":
    "Everything developers need to diagnose bugs fast",
  "site.features.sectionSub":
    "Built for speed, technical depth, and complete data ownership.",
  "site.features.f1.title": "Crisp Screen & Audio Recording",
  "site.features.f1.desc":
    "Record full screens, individual app windows, or Chrome tabs with microphone narration and click ripples. Hotkeys Ctrl+Shift+S / Ctrl+Shift+F fire instantly.",
  "site.features.f2.title": "Automated DevTools Telemetry",
  "site.features.f2.desc":
    "Console errors, unhandled exceptions, and network waterfalls captured in real time. Redacts auth tokens and passwords before storage.",
  "site.features.f3.title": "Visual On-Screen Annotations",
  "site.features.f3.desc":
    "Draw callouts, arrows, step numbers, and pixelate sensitive customer data right on your recording or screenshot.",
  "site.features.f4.title": "100% Google Drive Storage",
  "site.features.f4.desc":
    "All captures are stored in your own Google Drive account under drive.file scope. No third-party servers holding your proprietary code.",
  "site.features.f5.title": "Interactive Player & Inspector",
  "site.features.f5.desc":
    "Recipients can view the video, inspect time-aligned console errors, and copy curl commands for failed network requests directly.",
  "site.features.f6.title": "One-Click Issue Tracker Export",
  "site.features.f6.desc":
    "Generate formatted bug reports for Jira, Linear, GitHub Issues, Asana, GitLab, and Slack with attached logs.",

  "site.bugsnap.heroTag1": "Zero 3rd-Party Storage",
  "site.bugsnap.heroTag2": "100% Private Google Drive",
  "site.bugsnap.heroTag3": "Automated DevTools Telemetry",
  "site.bugsnap.metricsEyebrow": "Results you can measure",
  "site.bugsnap.metricsTitle":
    "Fewer tabs. Zero back-and-forth. Bugs solved on the first pass.",
  "site.bugsnap.compareEyebrow": "Why teams switch",
  "site.bugsnap.compareTitle":
    "Screenshots lack context. BugSnap delivers the root cause.",
  "site.bugsnap.oldTitle": "The Traditional Way",
  "site.bugsnap.oldDesc": "Vague screenshots and endless guessing games.",
  "site.bugsnap.oldPoint1":
    "QA shares a blurry screenshot in Slack with 'it’s broken'.",
  "site.bugsnap.oldPoint2":
    "Dev asks: what browser? Can you inspect console? What’s the payload?",
  "site.bugsnap.oldPoint3":
    "Hours wasted trying to reproduce edge-case bugs across environments.",
  "site.bugsnap.newTitle": "With BugSnap",
  "site.bugsnap.newDesc": "Screen recording + DevTools diagnostics in one click.",
  "site.bugsnap.newPoint1":
    "1-click video with mic audio and on-canvas annotations.",
  "site.bugsnap.newPoint2":
    "Console errors, network 4xx/5xx, and system specs attached silently.",
  "site.bugsnap.newPoint3":
    "Stored in your own Google Drive. Zero server storage fees, forever.",
  "site.bugsnap.integrationsEyebrow": "Built for your actual stack",
  "site.bugsnap.integrationsTitle":
    "Native integrations with the trackers you already use",
  "site.bugsnap.integrationsSub":
    "Push structured markdown reports with attached DevTools logs directly into your engineering workflow.",
  "site.bugsnap.intNative": "Native integration",
  "site.bugsnap.ctaTitle": "Catch the next bug with full context.",
  "site.bugsnap.ctaSub":
    "Free. Stored in your Google Drive. No credit card.",
  "site.bugsnap.demoEyebrow": "Live Product Walkthrough",
  "site.bugsnap.demoTitle":
    "See BugSnap in action: from trigger to fix in 3 seconds",
  "site.bugsnap.demoSub":
    "Watch how BugSnap captures your screen, extracts console errors and network failures, and stores everything in your Google Drive.",

  "site.bugsnap.roleEyebrow": "Built for your whole team",
  "site.bugsnap.roleTitle": "Every role gets exactly what they need",
  "site.bugsnap.roleSub":
    "QA testers, developers, and PMs each see a different value - BugSnap delivers all three.",

  "site.roles.tabAll": "All Roles (3)",
  "site.roles.tabQa": "QA & Testers",
  "site.roles.tabDev": "Software Engineers",
  "site.roles.tabPm": "Product Managers",

  "site.roles.qa.badge": "QA & Testers",
  "site.roles.qa.tag": "Zero Repro Steps",
  "site.roles.qa.title": "Record once. Never type repro steps again.",
  "site.roles.qa.desc":
    "Stop writing 5-paragraph bug descriptions. A 30-second screen capture with voice narration attaches console errors and network failures automatically.",
  "site.roles.qa.p1": "1-click video recording with microphone audio & click ripple",
  "site.roles.qa.p2": "Auto-attaches unhandled exceptions and network 4xx/5xx errors",
  "site.roles.qa.p3": "Built-in blur tool redacts sensitive passwords and client PII",
  "site.roles.qa.metric": "Saves ~45 mins per bug report",
  "site.roles.qa.simBtn": "Simulate 30s Recording",
  "site.roles.qa.simDone": "Captured 1080p Video + DevTools in 0.8s",

  "site.roles.dev.badge": "Software Engineers",
  "site.roles.dev.tag": "Instant Root Cause",
  "site.roles.dev.title": "Full stack trace & network payload in the first message.",
  "site.roles.dev.desc":
    "No more 'works on my machine'. Every BugSnap link gives you a synchronized video timeline, DevTools console error logs, network request waterfalls, and exact environment specs.",
  "site.roles.dev.p1": "Exact stack traces with file names, line numbers, and error traces",
  "site.roles.dev.p2": "One-click copy cURL command to replay failed API requests in terminal",
  "site.roles.dev.p3": "AI Clue automatically isolates root cause from error traces",
  "site.roles.dev.metric": "Zero 'can you reproduce it?' debates",
  "site.roles.dev.curlBtn": "Copy cURL Command",
  "site.roles.dev.curlDone": "Copied cURL to Clipboard!",

  "site.roles.pm.badge": "Product Managers",
  "site.roles.pm.tag": "1-Click Ticket Handover",
  "site.roles.pm.title": "From Slack ping to sprint ticket in one click.",
  "site.roles.pm.desc":
    "Annotate UI flaws on staging builds with arrows and callouts. Share feedback links with engineering without opening a Jira ticket for every typo, or export directly with 1 click.",
  "site.roles.pm.p1": "Formatted 1-click export to Jira, Linear, GitHub Issues, and Asana",
  "site.roles.pm.p2": "On-canvas annotations with arrows, boxes, text, and step numbers",
  "site.roles.pm.p3": "Team workspaces organized by project and sprint folders",
  "site.roles.pm.metric": "100% complete technical context in tickets",
  "site.roles.pm.ticketBtn": "Copy Markdown Ticket",
  "site.roles.pm.ticketDone": "Copied Markdown Ticket!",

  "site.roles.loop.badge": "Seamless Team Handoff",
  "site.roles.loop.title": "How the Whole Team Collaborates in BugSnap",
  "site.roles.loop.sub": "From initial discovery to sprint resolution in one continuous loop:",
  "site.roles.loop.s1": "QA Discovers & Records",
  "site.roles.loop.s1Sub": "30s video with mic & logs",
  "site.roles.loop.s2": "BugSnap Captures All",
  "site.roles.loop.s2Sub": "Auto-saved to Google Drive",
  "site.roles.loop.s3": "Dev Inspects & Fixes",
  "site.roles.loop.s3Sub": "Stack trace + copy cURL",
  "site.roles.loop.s4": "PM Closes Sprint Ticket",
  "site.roles.loop.s4Sub": "1-click Linear / Jira export",
  "site.roles.loop.live": "Solved in 1 pass · Zero Slack ping-pong",

  "site.bugsnap.split.kicker": "For QA and developers tired of vague bug reports",
  "site.bugsnap.split.headline":
    "Blurry bug reports waste hours. BugSnap solves them in seconds.",
  "site.bugsnap.split.sub":
    "Capture your screen with automatic console errors, failed network requests, and system specs attached. Stored directly in your Google Drive.",
  "site.bugsnap.split.cta": "Install Free Extension",
  "site.bugsnap.split.chatQa":
    "Hey, the $2,400 Pay button threw an error on checkout staging!",
  "site.bugsnap.split.chatDev":
    "Found it in the attached logs! Auth token expired at line 42. Fixed & deployed.",
  "site.bugsnap.split.chatBadge": "Resolved in 1m 42s with zero back-and-forth",
  "site.bugsnap.split.chatChannel": "BugSnap · #staging-bugs",
  "site.bugsnap.split.chatQaName": "Sarah · QA Lead",
  "site.bugsnap.split.chatDevName": "Rizki · Backend Dev",
  "site.bugsnap.split.chatBotName": "BugSnap · Auto-attached",

  "solutions.badge": "Built for modern product teams",
  "solutions.title": "Clarity for every role in the debugging loop",
  "solutions.subtitle":
    "From initial discovery to root-cause fix, BugSnap removes the friction between reporters, engineers, and product managers.",
  "solutions.qa.title": "QA Engineers",
  "solutions.qa.role": "File airtight bug reports in seconds, not minutes",
  "solutions.qa.desc":
    "Stop typing 15 reproduction steps or manually copying console logs. Record the screen once; BugSnap captures the exact technical context automatically.",
  "solutions.dev.title": "Software Engineers",
  "solutions.dev.role":
    "Fix bugs on the first pass with full diagnostic context",
  "solutions.dev.desc":
    "Inspect HTTP status codes, request bodies, stack traces, and device specs side-by-side with video. Never ask 'can you reproduce this?' again.",
  "solutions.pm.title": "Product Managers",
  "solutions.pm.role":
    "Communicate visual anomalies and edge cases with precision",
  "solutions.pm.desc":
    "Annotate expected vs. actual behavior on screen. Share clear, interactive links directly in Linear, Jira, or Slack without video upload limits.",
  "solutions.support.title": "Support Teams",
  "solutions.support.role":
    "Turn customer issues into actionable engineering tickets",
  "solutions.support.desc":
    "Gather technical reproduction data silently in the background without needing customer-facing agents to understand DevTools.",
  "solutions.qa.point1":
    "1-click recording with hotkeys (Ctrl+Shift+S / Ctrl+Shift+F)",
  "solutions.qa.point2":
    "Automatic capture of console errors and failed network calls",
  "solutions.qa.point3":
    "Reduces time spent writing step-by-step reproduction instructions",
  "solutions.dev.point1":
    "Full unhandled JS exceptions with complete stack traces",
  "solutions.dev.point2":
    "Exact HTTP status codes, request bodies, and headers",
  "solutions.dev.point3":
    "Copy curl commands directly to reproduce in terminal",
  "solutions.pm.point1": "On-screen callouts, arrows, and visual markers",
  "solutions.pm.point2":
    "Interactive web links that open directly in Linear and Jira",
  "solutions.pm.point3":
    "Private Google Drive links without video file upload limits",
  "solutions.support.point1":
    "Background diagnostic capture without asking users for DevTools",
  "solutions.support.point2":
    "Export complete ticket summaries directly to helpdesk systems",
  "solutions.support.point3":
    "One share link contains recording, logs, and network details",

  "status.title": "System Status & API Health",
  "status.subtitle":
    "Real-time operational status for all BugSnap services, database cluster, and cloud integrations.",
  "status.allOperational": "All Systems Operational",
  "status.uptimeNote": "99.98% overall system uptime over the last 90 days.",
  "status.checkedJustNow": "Checked just now",
  "status.components": "Service Components",
  "status.uptimeHistory": "Uptime History (Last 90 Days)",
  "status.daysAgo": "90 days ago",
  "status.today": "Today",
  "status.ctaTitle": "All systems ready for your bug reports",
  "status.ctaDesc":
    "Install the BugSnap extension free - captures are saved to your own Google Drive.",
  "status.installFree": "Install Extension Free",
  "status.viewPricing": "View Pricing",
  "status.operational": "Operational",
  "status.svc.dashboard": "Web Dashboard",
  "status.svc.api": "Core Database & API",
  "status.svc.drive": "Google Drive OAuth Integration",
  "status.svc.ai": "AI Summary Service",
  "status.svc.webhook": "Slack & Discord Webhook Delivery",
  "status.svc.extension": "Chrome Extension Bridge",

  "extension.badge": "Chrome Web Store",
  "extension.heroTitle": "Find a bug. Capture it. Ship the context.",
  "extension.heroSub":
    "The lightweight Chrome extension that turns your browser into a full bug reporting suite. Video, screenshots, console errors, and network telemetry saved directly to your Google Drive.",
  "extension.installCta": "Add to Chrome - Free",
  "extension.installMeta":
    "Compatible with Google Chrome, Brave, Microsoft Edge, and Chromium browsers.",
  "extension.f1Title": "Instant Browser Hotkeys",
  "extension.f1Desc":
    "Hit Ctrl+Shift+S (Cmd+Shift+S) for screenshots or Ctrl+Shift+F for video recording without breaking your flow.",
  "extension.f2Title": "Zero Extension Requirement for Viewers",
  "extension.f2Desc":
    "Anyone with the link can view your recording and DevTools panel in their browser - no account or extension needed to inspect.",
  "extension.f3Title": "Zero Bandwidth Waste",
  "extension.f3Desc":
    "Direct upload to your Google Drive minimizes server hops and guarantees privacy for enterprise workflows.",
  "site.viewer.eyebrow": "See the result",
  "site.viewer.title": "What your developer receives - instantly",
  "site.viewer.sub":
    "Open one link. Every diagnostic is already there, zero follow-up needed.",
  "site.before.eyebrow": "Before vs After",
  "site.before.title": "From 47-minute Slack threads to 1 link",
  "site.before.sub": "See exactly what changes when your team uses BugSnap.",
  "site.testimonials.eyebrow": "Loved by teams",
  "site.testimonials.title": "Engineering teams ship faster with BugSnap",
  "site.testimonials.sub": "From QA leads to CTOs - here's what they say.",
  "site.trust.eyebrow": "Zero-data architecture",
  "site.trust.title": "Your files never touch our servers",
  "site.trust.sub":
    "Every recording goes directly to your Google Drive via OAuth. BugSnap stores only metadata and share links.",
  "site.hotkeys.eyebrow": "Built for keyboard warriors",
  "site.hotkeys.title": "Three shortcuts. Full diagnostic context.",
  "site.hotkeys.sub": "Press them right now - BugSnap listens and responds.",

  "blog.title": "Blog",
  "blog.subtitle": "Tips, guides, and insights on bug reporting and developer productivity",
  "blog.badge": "BugSnap Blog",
  "blog.allArticles": "All Articles",
  "blog.freeLicense": "Free License Photo",
  "blog.ctaTitle": "Ready to streamline your bug reports?",
  "blog.ctaDesc": "Record screens with audio, capture console & network logs, and store files directly in your own Google Drive.",
  "blog.ctaButton": "Install Extension — Free",
  "blog.authorBio": "Engineering notes and debugging workflows from the BugSnap team.",
  "blog.readMore": "Read more",
  "blog.backToBlog": "← Back to Blog",
  "blog.publishedOn": "Published on",
  "blog.writtenBy": "by",
};

export const marketingId: Dict = {
  "landing.home": "Beranda",
  "landing.tagline":
    "Tangkap Bug dalam 1 Klik. Log DevTools & Rekaman Layar, Tersimpan di Google Drive ANDA",
  "landing.subtitle":
    "Rekam layar Anda dengan konteks DevTools lengkap - tersimpan langsung ke Google Drive milik Anda sendiri. File milik Anda. Selamanya.",
  "landing.heroSub":
    "Hentikan membuang waktu menanyakan 'bisa tolong direproduksi?'. BugSnap merekam layar Anda lengkap dengan log console otomatis, error jaringan, dan spesifikasi lingkungan - lalu menyimpan semuanya langsung ke Google Drive pribadi Anda dan membuat tautan interaktif siap bagi dalam hitungan detik. Gratis, tanpa instalasi rumit.",
  "landing.cta": "Tambah ke Chrome - Gratis",
  "landing.ctaVariantSpeed": "Mulai Tangkap Bug - Gratis",
  "landing.ctaVariantSpeedSub": "1-Klik Rekaman + Log DevTools",
  "landing.ctaHint":
    "Rekam bug dengan log console & error jaringan lengkap - tersimpan langsung ke Google Drive Anda sendiri.",
  "landing.exploreFeatures": "Jelajahi Fitur",
  "landing.signIn": "Masuk",
  "landing.signInGoogle": "Masuk dengan Google",
  "landing.redirecting": "Mengalihkan...",
  "landing.goToDashboard": "Ke Dasbor",
  "landing.freeForever": "Tangkapan Anda. Google Drive Anda. Gratis.",
  "landing.noCard":
    "Setiap rekaman tersimpan langsung ke Google Drive milik Anda sendiri. Tanpa kartu kredit, tanpa setup, tanpa kerumitan.",
  "landing.authFailed": "Autentikasi gagal. Silakan coba lagi.",
  "landing.pill1Title": "DevTools Otomatis",
  "landing.pill1Desc":
    "Error console & jaringan 4xx/5xx tertangkap tanpa konfigurasi.",
  "landing.pill2Title": "100% Kepemilikan Data",
  "landing.pill2Desc":
    "Tersimpan langsung ke Google Drive Anda. Bebas lock-in vendor.",
  "landing.pill3Title": "Berbagi Sekali Klik",
  "landing.pill3Desc":
    "Rekan tim dapat memutar video & memeriksa log tanpa perlu instal aplikasi.",
  "landing.f1Title": "Rekam Layar, Audio & Klik dalam Hitungan Detik",
  "landing.f1Body":
    "Rekam seluruh layar, aplikasi, atau tab Chrome dalam resolusi HD dengan narasi suara. Gunakan tombol pintas (Ctrl+Shift+S / Ctrl+Shift+F), potong, beri panah penjelas, atau buramkan data sensitif sebelum dibagikan.",
  "landing.editorLabel": "BugSnap - Editor",
  "landing.f2Title": "Konteks DevTools Ditangkap Otomatis di Latar Belakang",
  "landing.f2Body":
    "Tak perlu mengajari anggota tim non-teknis cara membuka Inspect Element. BugSnap secara otomatis melampirkan peringatan console, error tak tertangani, kegagalan API, dan spesifikasi sistem ke setiap rekaman.",
  "landing.f3Title": "Satu Tautan Berbagi. Solusi Cepat. Nol Debat Berulang.",
  "landing.f3Body":
    "Tempel tautan ke Jira, Linear, Slack, atau GitHub. Developer dapat memeriksa waterfall jaringan, menyalin pesan error, dan memberi komentar bertanda waktu langsung di lini masa video.",
  "landing.recordings": "Rekaman",
  "landing.all": "Semua",
  "landing.videos": "Video",
  "landing.screenshots": "Tangkapan Layar",
  "landing.mock1": "Bug di modal login",
  "landing.mock2": "Alur checkout",
  "landing.mock3": "Tinjauan desain",
  "landing.faq": "Pertanyaan yang Sering Diajukan",
  "landing.faq1q": "Apa yang membedakan BugSnap dari perekam layar biasa?",
  "landing.faq1a":
    "Perekam layar biasa hanya merekam visual piksel. BugSnap merekam video visual SEKALIGUS diagnostik teknis DevTools (error console, permintaan HTTP gagal, header, dan spesifikasi perangkat) berdampingan, memangkas waktu debugging dari berjam-jam menjadi beberapa menit.",
  "landing.faq2q": "Bagaimana cara kerja integrasi Google Drive?",
  "landing.faq2a":
    "Semua file video dan gambar diunggah langsung ke Google Drive Anda sendiri di dalam folder khusus. Anda memegang 100% kepemilikan data tanpa biaya markup penyimpanan, tanpa penguncian vendor, dan kendali penuh atas izin akses.",
  "landing.faq3q":
    "Apakah kata sandi, cookie, atau token otorisasi sensitif tetap aman?",
  "landing.faq3a":
    "Ya. BugSnap hanya menangkap log diagnostik console dan metadata permintaan HTTP. Header autentikasi, kata sandi, dan input sensitif disaring otomatis, serta editor kanvas bawaan memungkinkan Anda memburamkan data sensitif apa pun di layar sebelum disimpan.",
  "landing.faq4q":
    "Apakah developer atau klien perlu memasang ekstensi untuk melihat tautan?",
  "landing.faq4a":
    "Tidak. Siapa pun yang menerima tautan dapat melihat tangkapan, memutar video, dan memeriksa log DevTools langsung di browser modern mana pun tanpa perlu memasang aplikasi apa pun atau mendaftar akun.",
  "landing.faq5q": "Apakah BugSnap benar-benar gratis?",
  "landing.faq5a":
    "Ya. BugSnap gratis tanpa paywall atau fitur berbayar. Tangkapan disimpan langsung ke Google Drive Anda sendiri, jadi Anda tidak perlu membayar penyimpanan.",
  "landing.faq6q":
    "Alat pelacak isu dan manajemen proyek apa saja yang didukung BugSnap?",
  "landing.faq6a":
    "BugSnap terintegrasi langsung dengan Jira, Linear, GitHub Issues, Slack, Asana, GitLab, Notion, dan ClickUp, menghasilkan laporan markdown lengkap dengan lampiran telemetri DevTools.",
  "landing.faq7q":
    "Apakah BugSnap bisa mengakses file lain di Google Drive saya?",
  "landing.faq7a":
    "Tidak. BugSnap hanya meminta izin Google Drive 'drive.file', yang berarti aplikasi hanya dapat melihat dan mengelola file yang dibuatnya sendiri. BugSnap tidak akan pernah bisa membaca, melihat, atau menyentuh dokumen pribadi, spreadsheet, atau folder lain di Google Drive Anda.",
  "landing.faq8q":
    "Apa yang terjadi jika saya menghapus tangkapan dari Google Drive atau dashboard?",
  "landing.faq8a":
    "Menghapus tangkapan dari dashboard akan langsung menghapus metadatanya. Karena file tersimpan di Google Drive Anda sendiri, Anda juga dapat mengelola atau menghapusnya langsung dari Google Drive kapan pun tanpa batasan.",
  "landing.faq9q":
    "Apakah BugSnap menjual atau menganalisis laporan bug atau data telemetri saya?",
  "landing.faq9a":
    "Tidak pernah. Kami tidak menjual data Anda, tidak menggunakan rekaman video Anda untuk pelatihan model AI, dan tidak memasang pelacak analitik pihak ketiga. Semua rekaman dan telemetri 100% milik Anda dan tim Anda.",
  "landing.faq10q":
    "Data diagnostik apa saja yang ditangkap BugSnap saat perekaman?",
  "landing.faq10a":
    "BugSnap menangkap error dan peringatan console browser, riwayat request jaringan beserta kode status dan header, event replay perubahan DOM, aksi klik/ketikan pengguna, serta spesifikasi sistem dan browser.",
  "landing.faq11q":
    "Bisakah saya mengambil screenshot selain rekaman video layar?",
  "landing.faq11a":
    "Ya. Anda dapat mengambil screenshot beranotasi dengan panah, kotak, teks, dan alat sensor blur, atau merekam video definisi tinggi yang mulus dengan mikrofon, webcam, dan audio tab opsional.",
  "landing.faq12q":
    "Apakah perekaman dengan telemetri DevTools memperlambat performa browser?",
  "landing.faq12a":
    "Tidak. BugSnap memanfaatkan API diagnostik browser bawaan yang sangat ringan dan listener pasif. Pemrosesan data berjalan secara asinkron di background service worker tanpa penurunan performa halaman yang berarti.",
  "landing.faq13q": "Bagaimana cara kerja fitur DOM Replay?",
  "landing.faq13a":
    "BugSnap merekam perubahan visual DOM dan interaksi pengguna secara aman. Di player dashboard, developer dapat memeriksa elemen, melompat ke detik tertentu, dan memutar ulang aksi persis tanpa perlu menebak-nebak cara reproduksi bug.",
  "landing.faq14q":
    "Bisakah saya memburamkan atau menyensor informasi sensitif di layar sebelum disimpan?",
  "landing.faq14a":
    "Ya. Editor gambar bawaan menyediakan alat blur dan sensor cepat agar Anda dapat menyamarkan kata sandi, data pribadi pelanggan, atau token rahasia sebelum membagikan tautan laporan.",
  "landing.faq15q":
    "Bisakah saya mengunci tautan laporan bug dengan kata sandi atau batas kedaluwarsa?",
  "landing.faq15a":
    "Ya. Anda dapat mengamankan setiap tautan tangkapan publik dengan kata sandi akses opsional dan mengatur batas waktu kedaluwarsa otomatis (seperti 7 hari, 30 hari, atau tanpa batas) demi privasi penuh.",
  "landing.faq16q": "Bagaimana cara kerja ekspor 1-klik ke Jira dan GitHub?",
  "landing.faq16a":
    "Klik 'Salin Laporan' dari tangkapan mana pun untuk menghasilkan format markdown rapi yang berisi ringkasan bug, langkah reproduksi, info perangkat, stack trace error, dan tautan langsung ke video untuk ditempelkan ke tiket.",
  "landing.faq17q":
    "Bisakah saya mengelompokkan tangkapan ke dalam Workspace untuk tim atau proyek berbeda?",
  "landing.faq17a":
    "Ya. Anda dapat membuat beberapa workspace, mengundang anggota tim dengan izin berbasis peran, dan mengatur laporan bug berdasarkan proyek, tag, atau status agar tetap terorganisir.",
  "landing.faq18q":
    "Apakah BugSnap mendukung webhook kustom dan notifikasi tim?",
  "landing.faq18a":
    "Ya. Anda dapat mengonfigurasi webhook kustom untuk mengirimkan notifikasi otomatis ke channel Slack atau Discord setiap kali ada laporan bug baru atau komentar tim yang ditambahkan.",
  "landing.cta2":
    "Siap Mengakhiri Pertanyaan 'Bisa Tolong Direproduksi?' Selamanya?",
  "landing.footDesc":
    "Cara tercepat untuk merekam layar, menangkap error jaringan dan log console - lalu membagikan laporan bug yang langsung bisa ditindaklanjuti tim Anda.",
  "landing.product": "Produk",
  "landing.screenRecorder": "Perekam Layar",
  "landing.devTools": "Integrasi DevTools",
  "landing.pricing": "Paket Harga",
  "landing.security": "Pengaman",
  "landing.resources": "Sumber Daya",
  "landing.docs": "Dokumentasi",
  "landing.chromeExt": "Ekstensi Chrome",
  "landing.help": "Pusat Bantuan",
  "landing.apiStatus": "Status API",
  "landing.company": "Perusahaan",
  "landing.about": "Tentang Kami",
  "landing.privacy": "Kebijakan Privasi",
  "landing.terms": "Ketentuan Layanan",
  "landing.contact": "Kontak",
  "landing.copyright": "© {year} BugSnap. Semua hak dilindungi.",
  "landing.builtOn":
    "Dibangun di atas Google Drive Anda. Data Anda tetap milik Anda - selamanya.",
  "landing.ecosystemEyebrow": "Rangkaian Akusara",
  "landing.ecosystemTitle": "Bagian dari Ekosistem QA & Dev Akusara",
  "landing.ecosystemSub":
    "BugSnap bekerja berdampingan dengan rangkaian tool developer kami untuk mempermudah pelacakan bug dan QA.",
  "landing.ecosystemBugSnapDesc":
    "Rekam bug dengan log DevTools lengkap, tersimpan di Google Drive Anda sendiri.",
  "landing.ecosystemAksoraTitle": "Aksora",
  "landing.ecosystemAksoraDesc":
    "Pelacakan isu dan manajemen proyek. Kirim bug langsung ke sprint dan tiket.",
  "landing.ecosystemSnapTestTitle": "SnapTest AI",
  "landing.ecosystemSnapTestDesc":
    "Agen QA bertenaga AI yang menjalankan rangkaian pengujian dan mengubah tangkapan BugSnap menjadi tes terverifikasi.",
  "landing.ecosystemOpen": "Buka Aplikasi",
  "landing.howItWorks": "Cara Kerjanya",
  "landing.howItWorksTitle":
    "Cara Kerja: Dari Klik ke Solusi dalam Hitungan Detik",
  "landing.seeFullWalkthrough": "Lihat panduan lengkap",
  "landing.featuresTitle":
    "Semua yang Anda Butuhkan untuk Membasmi Bug Lebih Cepat",
  "landing.eyebrow": "Gratis · Tanpa perlu kartu kredit",
  "landing.trustStrip":
    "Tersimpan langsung di Google Drive ANDA. File sepenuhnya milik Anda.",
  "landing.heroTrustNote":
    "100% penyimpanan Google Drive pribadi · Tanpa perlu kartu kredit · Gratis",
  "landing.heroTabDevTools": "DevTools & Video",
  "landing.heroTabAnnotation": "Anotasi Screenshot",
  "landing.heroTabShare": "Tautan Berbagi Cepat",
  "landing.trustDrive": "Penyimpanan Google Drive Pribadi",
  "landing.trustDriveSub": "File 100% milik Anda seutuhnya",
  "landing.trustChrome": "Terverifikasi di Chrome Web Store",
  "landing.trustChromeSub": "Aman & instalasi instan",
  "landing.trustPrivacy": "Tanpa Pelacak Pihak Ketiga",
  "landing.trustPrivacySub": "Tanpa ketergantungan server perantara",
  "landing.systemStatusOperational": "Semua sistem beroperasi normal",
  "landing.ecosystemBugSnapLabel": "Tangkapan & DevTools",
  "landing.ecosystemAksoraBrief": "Pelacakan isu & sprint",
  "landing.ecosystemSnapTestBrief": "Pengujian QA AI",
  "landing.mockDriveSync": "Tersimpan di Google Drive",
  "landing.mockTabConsole": "Console",
  "landing.mockTabNetwork": "Network",
  "landing.mockTabStorage": "Storage",
  "landing.mockTabSystem": "Sistem",
  "landing.mockConsoleErr":
    "Uncaught TypeError: Cannot read properties of undefined (reading 'checkout')",
  "landing.mockConsoleWarn":
    "Peringatan: Respon jaringan lambat pada API payment-intent (>1200ms)",
  "landing.mockConsoleClick": "Pengguna mengklik button#pay-button",
  "landing.mockOrderSummary": "Ringkasan Pesanan",
  "landing.mockItemsCount": "2 item",
  "landing.mockTotalAmount": "$149.00",
  "landing.mockPayButton": "Bayar Sekarang $149.00",
  "landing.mockPaymentFailed": "Pembayaran Gagal: 500 Internal Server Error",
  "landing.metricSpeedVal": "10x",
  "landing.metricSpeedLabel": "Laporan Bug Lebih Cepat",
  "landing.metricSpeedSub": "Tanpa perlu mengetik ulang langkah reproduksi",
  "landing.metricOwnershipVal": "100%",
  "landing.metricOwnershipLabel": "Privasi Google Drive",
  "landing.metricOwnershipSub": "File tersimpan di Google Drive milik Anda",
  "landing.metricZeroTrackVal": "0",
  "landing.metricZeroTrackLabel": "Pelacakan Pihak Ketiga",
  "landing.metricZeroTrackSub": "Tanpa pemanenan data di server perantara",
  "landing.metricShareTimeVal": "< 3d",
  "landing.metricShareTimeLabel": "Tangkapan ke Tautan",
  "landing.metricShareTimeSub": "Tautan instan dibuat otomatis siap dibagikan",
  "landing.playerPlay": "Putar",
  "landing.playerPause": "Jeda",
  "landing.playerClickMarker": "00:08 Pengguna klik 'Pay Now'",
  "landing.playerErrorMarker": "00:42 POST /charge 500 Error",
  "landing.heroLiveDemo": "Demo Interaktif Langsung",
  "landing.ticketPreviewTitle": "Preview Isu Dibuat Otomatis",
  "landing.ticketAttachedVideo": "checkout-reproduction.webm (720p · 1.2 MB)",
  "landing.ticketAttachedHar": "network-telemetry.har (4 permintaan)",
  "landing.ticketAttachedSys": "system-environment.json (Win11 · Chrome 140)",
  "landing.ticketSelectHint":
    "Klik integrasi di bawah untuk melihat contoh tiket otomatis:",
  "landing.bentoAnnotateTitle": "Anotasi Terintegrasi & Narasi Suara",
  "landing.bentoAnnotateDesc":
    "Gambar panah, sensor token sensitif, sorot bug UI, dan rekam narasi suara langsung di browser.",
  "landing.bentoTabTerminal": "Terminal",
  "landing.bentoTabCurl": "Perintah cURL",
  "landing.bentoTabJson": "JSON DevTools",
  "landing.bentoCopyCmd": "Salin Perintah",
  "landing.bentoCopiedCmd": "Tersalin!",
  "landing.faqAll": "Semua Pertanyaan",
  "landing.faqPrivacy": "Google Drive & Privasi",
  "landing.faqDevTools": "DevTools & Rekaman",
  "landing.faqIntegrations": "Integrasi & Berbagi",
  "features.title": "Toolkit Pelaporan Bug untuk Tim Cepat",
  "features.subtitle":
    "Ubah laporan 'ini rusak' yang samar menjadi konteks debugging siap pakai dengan video 1-klik, log DevTools otomatis, dan penyimpanan Google Drive Anda sendiri.",
  "features.f1Eyebrow": "Perekaman Layar & Audio",
  "features.f1Title":
    "Ambil Tangkapan Layar & Rekaman Layar Lengkap dengan Audio",
  "features.f1Desc":
    "Rekam layar, jendela tertentu, atau tab Chrome dalam kualitas HD jernih. Tambahkan narasi suara atau webcam untuk menjelaskan langkah reproduksi yang rumit dengan mudah.",
  "features.f1HotkeyScreen":
    "Pintasan instan: Ctrl + Shift + S untuk tangkapan layar",
  "features.f1HotkeyVideo": "Pintasan: Ctrl + Shift + F untuk rekaman layar",
  "features.f1Editor":
    "Editor kanvas untuk anotasi, potong, sorot, atau buramkan data sensitif",
  "features.f1Stream": "Stream WebM 1080p + Audio Mikrofon",
  "features.f2Eyebrow": "DevTools Otomatis",
  "features.f2Title": "Log Error Console & Jaringan Tanpa Konfigurasi",
  "features.f2Desc":
    "Tidak perlu lagi menjelaskan 'cara buka DevTools' ke anggota tim non-teknis. BugSnap secara otomatis menangkap permintaan HTTP gagal, error console, aksi pengguna, dan metadata lingkungan pada setiap rekaman.",
  "features.f3Eyebrow": "Kepemilikan & Privasi",
  "features.f3Title": "Tersimpan di Google Drive Anda Sendiri",
  "features.f3Desc":
    "Berbeda dengan platform lain yang menyimpan file Anda di server mereka, BugSnap mengunggah file video & gambar langsung ke akun Google Drive pribadi Anda. Anda mempertahankan 100% kepemilikan dan kendali atas file, privasi, dan batas penyimpanan Anda - di semua paket, gratis maupun berbayar.",
  "features.f3BadgeTitle": "Penyimpanan Anda, Data Anda",
  "features.f3BadgeDesc":
    "File diunggah langsung ke Google Drive / BugSnap Captures - folder Anda, di akun Anda. Kami tidak pernah menyimpan rekaman di server kami, sehingga Anda dapat menghapus atau mengelolanya kapan saja langsung dari Drive.",
  "features.ctaTitle":
    "Siap memangkas waktu debugging Anda hingga setengahnya?",
  "features.ctaDesc":
    "Pasang ekstensi BugSnap dan mulai rekam layar, audio, dan log DevTools dalam hitungan detik - tersimpan langsung ke Google Drive Anda sendiri, gratis, tanpa kartu kredit.",
  "features.ctaButton": "Pasang Ekstensi Gratis",
  "features.catAll": "Semua Fitur",
  "features.catCapture": "Layar & Audio",
  "features.catDevTools": "DevTools & Log",
  "features.catStorage": "Drive & Privasi",
  "features.devLogsTitle": "DevLogs Otomatis Ditangkap",
  "features.devLogsError":
    "POST /api/v1/auth 500 Internal Server Error (142ms)",
  "features.devLogsWarn":
    "[Console Warn] Unhandled promise rejection: AuthTokenExpired",
  "features.devLogsEnv": "OS: Windows 11 · Browser: Chrome · Window: 1920x1080",
  "pricing.title": "Harga Sederhana & Transparan",
  "pricing.subtitle":
    "Semua rekaman tersimpan di Google Drive Anda sendiri - jadi kami tidak pernah membebankan biaya penyimpanan atau mengunci file Anda. Pilih paket yang paling sesuai untuk alur kerja tim Anda.",
  "pricing.customTitle": "Butuh solusi enterprise khusus?",
  "pricing.customDesc":
    "Infrastruktur khusus, SSO, whitelist IP, atau kebutuhan kepatuhan ketat? Kami menyediakan deployment enterprise kustom sesuai kebijakan keamanan organisasi Anda.",
  "pricing.contactSales": "Hubungi Penjualan",
  "pricing.monthly": "Bulanan",
  "pricing.yearly": "Tahunan",
  "pricing.yearlySave": "hemat hingga 28%",
  "pricing.mostPopular": "Paling Populer",
  "pricing.billedYearly": "Ditagih tahunan",
  "pricing.perMonth": "/bln",
  "pricing.tierFree": "Gratis",
  "pricing.tierFreeTagline":
    "Semua tersimpan di Google Drive Anda sendiri - gratis.",
  "pricing.tierFreeCta": "Pasang Ekstensi Gratis",
  "pricing.fFree1": "5 tangkapan baru per minggu",
  "pricing.fFree2": "Rekaman layar & tab tanpa batas (HD)",
  "pricing.fFree3": "Penangkapan log konsol & jaringan otomatis",
  "pricing.fFree4": "Tersimpan di Google Drive Anda - kepemilikan penuh",
  "pricing.fFree5": "Tautan berbagi publik & analitik tampilan",
  "pricing.fFree6": "Hingga 5 anggota tim",
  "pricing.tierPro": "Pro",
  "pricing.tierProTagline":
    "Untuk tim yang ingin menyelesaikan bug lebih efisien.",
  "pricing.tierProCta": "Mulai Uji Coba Gratis",
  "pricing.fPro1": "Semua fitur di Gratis",
  "pricing.fPro2": "Anggota tim tanpa batas",
  "pricing.fPro3": "Branding khusus (logo & nama)",
  "pricing.fPro4": "Hapus watermark BugSnap",
  "pricing.fPro5": "Webhook Slack & Discord",
  "pricing.fPro6": "Ringkasan bug bertenaga AI",
  "pricing.tierProPlus": "Pro+",
  "pricing.tierProPlusTagline":
    "Kuota lebih besar, video lebih panjang, prioritas AI.",
  "pricing.tierProPlusCta": "Mulai Uji Coba Gratis",
  "pricing.fProPlus1": "Semua fitur di Pro",
  "pricing.fProPlus2": "Kuota tangkapan lebih besar",
  "pricing.fProPlus3": "Durasi video lebih panjang",
  "pricing.fProPlus4": "Prioritas ringkasan bug AI",
  "pricing.fProPlus5": "Akses & analitik lanjutan",
  "pricing.tierEnterprise": "Enterprise",
  "pricing.tierEnterpriseTagline":
    "Untuk organisasi dengan standar keamanan ketat.",
  "pricing.tierEnterpriseCta": "Hubungi Penjualan",
  "pricing.fEnt1": "Semua fitur di Pro+",
  "pricing.fEnt2": "Domain khusus untuk tautan berbagi",
  "pricing.fEnt3": "Whitelist akses IP & domain",
  "pricing.fEnt4": "Tautan hangus setelah dibaca",
  "pricing.fEnt5": "Dukungan prioritas & SLA, siap SSO",
  "howItWorks.title": "Cara Kerja BugSnap: Dari Bug ke Solusi dalam 3 Klik",
  "howItWorks.subtitle":
    "Tanpa setup rumit. Tanpa perlu pelatihan developer tools. Cukup rekam, salin tautan, dan selesaikan bug lebih cepat.",
  "howItWorks.step1Title": "Rekam Layar & Audio Sekali Klik",
  "howItWorks.step1Desc":
    "Tekan Ctrl+Shift+F untuk merekam video atau Ctrl+Shift+S untuk tangkapan layar. Beri anotasi panah, sorot bagian rusak, dan tambahkan narasi suara.",
  "howItWorks.step2Title": "DevTools Otomatis & Ekstraksi Error",
  "howItWorks.step2Desc":
    "BugSnap bekerja di latar belakang merekam error console, kegagalan panggilan API (404, 500), payload respons, OS, browser, dan spesifikasi viewport.",
  "howItWorks.step3Title": "Tautan Instan di Google Drive Anda",
  "howItWorks.step3Desc":
    "Video dan log tersimpan langsung ke Google Drive Anda sendiri. Bagikan tautan interaktif ke Jira, Slack, atau GitHub - developer dapat memeriksa log dan video berdampingan.",
  "howItWorks.preview1Title": "Pintasan Tangkapan",
  "howItWorks.preview1Hotkeys": "Ctrl + Shift + S (Tangkapan Layar)",
  "howItWorks.preview1HotkeysVideo": "Ctrl + Shift + F (Perekaman)",
  "howItWorks.preview2Title": "Diagnostik Otomatis",
  "howItWorks.preview2Console": "Error & Peringatan Console",
  "howItWorks.preview2Network": "Permintaan Jaringan Gagal",
  "howItWorks.preview3Title": "Berbagi Tanpa Hambatan",
  "howItWorks.preview3Drive": "Penyimpanan Google Drive",
  "howItWorks.preview3Share": "Tautan Berbagi Interaktif",
  "about.title": "Tentang BugSnap",
  "about.subtitle":
    "Dibangun oleh Akusara Digital untuk mengakhiri perselisihan antara QA, pengguna, dan developer selamanya.",
  "about.missionTitle": "Misi Kami: From Click to Fix",
  "about.headline":
    "From Click to Fix: Menghilangkan Hambatan dalam Pelaporan Bug",
  "about.missionDesc":
    "Setiap developer pernah menerima tiket bug bertuliskan 'tombol tidak berfungsi' tanpa konteks apa pun. BugSnap diciptakan agar pelaporan bug menjadi mudah bagi siapa saja: satu klik merekam visual bug, log console, dan kegagalan jaringan, sehingga tim dapat memperbaiki bug dalam hitungan menit, bukan berhari-hari.",
  "about.privacyFirstTitle": "100% Privasi & Kepemilikan Data",
  "about.privacyFirstDesc":
    "Kami percaya rekaman Anda tidak boleh terkunci di server SaaS pihak ketiga. BugSnap terhubung langsung ke Google Drive Anda sendiri, memberi Anda kendali mutlak atas batas penyimpanan, kepatuhan privasi, dan retensi file.",
  "about.ecosystemTitle": "Ekosistem Akusara Digital",
  "about.ecosystemDesc":
    "BugSnap bekerja berdampingan dengan Aksora dan SnapTest AI untuk memberikan solusi pelacakan bug dan pengujian QA menyeluruh.",
  "about.stat1Value": "1-Klik",
  "about.stat1Label": "Perekaman instan layar & DevTools",
  "about.stat2Value": "100%",
  "about.stat2Label": "Kepemilikan data di Google Drive Anda",
  "about.stat3Value": "0",
  "about.stat3Label": "Server hosting video pihak ketiga",
  "about.stat4Value": "0s",
  "about.stat4Label": "Waktu terbuang menjelaskan reproduksi",
  "about.companyDesc": "Kreator BugSnap, Aksora, dan SnapTest AI.",
  "about.visitWebsite": "Kunjungi akusaradigital.com",
  "docs.title": "Dokumentasi BugSnap",
  "docs.subtitle":
    "Panduan, tombol pintas, dan referensi integrasi untuk memaksimalkan BugSnap.",
  "docs.gettingStarted": "Memulai",
  "docs.installExt": "Pasang Ekstensi",
  "docs.shortcuts": "Pintasan Keyboard",
  "docs.driveSetup": "Pengaturan Google Drive",
  "docs.viewAndShare": "Berbagi & Izin",
  "docs.navGettingStartedDesc":
    "Pasang ekstensi dan hubungkan Google Drive Anda.",
  "docs.navShortcutsDesc":
    "Tangkap instan dengan tombol pintas tanpa membuka menu.",
  "docs.navDriveSetupDesc": "Pahami perizinan dan penyimpanan cloud privat.",
  "docs.navViewAndShareDesc":
    "Proteksi kata sandi, batas kedaluwarsa, dan tautan.",
  "docs.shortcutScreenshot": "Tangkapan Layar Instan",
  "docs.shortcutScreenshotDesc": "Tangkap tab aktif atau area pilihan",
  "docs.shortcutRecording": "Mulai Perekaman Layar",
  "docs.shortcutRecordingDesc":
    "Rekam layar, tab, atau jendela dengan audio mikrofon",
  "docs.driveScopeDesc":
    "BugSnap meminta izin standar Google Drive drive.file. Ini berarti BugSnap hanya dapat membaca dan menulis file yang dibuatnya sendiri - tidak pernah dapat melihat, membaca, atau mengubah file pribadi atau spreadsheet Anda.",
  "docs.viewHelpFaqs": "Lihat FAQ Pusat Bantuan",
  "docs.contactSupport": "Hubungi Dukungan Teknis",
  "docs.terminalCopied": "Tersalin!",
  "docs.copyCode": "Salin",
  "help.title": "Pusat Bantuan & FAQ",
  "help.subtitle":
    "Temukan jawaban atas pertanyaan umum tentang pengaturan ekstensi Chrome, mengelola izin, dan menggunakan dashboard.",
  "help.faqHeading": "Pertanyaan yang Sering Diajukan",
  "help.faq1Q": "Bagaimana cara menghubungkan Google Drive saya?",
  "help.faq1A":
    "Saat pertama kali merekam bug dan mencoba menyimpan, popup Chrome akan meminta Anda untuk autentikasi via Google OAuth. Izinkan izin 'drive.file' agar BugSnap dapat menulis file screenshot/video langsung ke folder 'BugSnap Captures' baru.",
  "help.faq2Q": "Mengapa log DevTools saya kosong?",
  "help.faq2A":
    "Pastikan Anda memicu rekaman pada halaman spesifik tempat bug terjadi. Ekstensi hanya merekam error console dan request jaringan yang gagal selama sesi rekaman atau tepat saat Anda klik screenshot.",
  "help.faq3Q": "Bagaimana cara mengundang anggota tim?",
  "help.faq3A":
    "Buka Dashboard Anda, navigasi ke 'Pengaturan > Anggota', dan masukkan alamat email mereka. Mereka akan menerima undangan email untuk bergabung ke Workspace Anda. Semua rekaman di Workspace ini akan terlihat oleh mereka.",
  "help.faq4Q": "Apakah rekaman saya publik secara default?",
  "help.faq4A":
    "Tidak. Rekaman hanya terlihat oleh Anda dan anggota Workspace. Jika Anda membuat link berbagi publik (/c/...), Anda dapat mengamankannya dengan password opsional dan tanggal kedaluwarsa.",
  "help.needHelp": "Masih butuh bantuan?",
  "help.needHelpDesc":
    "Tidak menemukan jawaban yang Anda cari? Hubungi tim dukungan teknis kami.",
  "help.emailSupport": "Email Dukungan",
  "help.getStarted": "Mulai sekarang",
  "help.installFree": "Pasang Ekstensi Gratis",
  "help.seePricing": "Lihat Harga",
  "help.resources": "Sumber Daya",
  "help.viewDocs": "Minta Dokumentasi Lengkap",
  "help.contactForm": "Formulir Kontak & Detail",
  "help.systemStatus": "Status Sistem",
  "help.openFaq": "Buka pertanyaan",
  "help.closeFaq": "Tutup pertanyaan",
  "contact.title": "Hubungi Kami",
  "contact.subtitle":
    "Ada pertanyaan, masukan, atau butuh bantuan dengan BugSnap? Hubungi tim kami.",
  "contact.emailSupport": "Dukungan Email",
  "contact.company": "Perusahaan & Penerbit",
  "contact.companyDesc": "Pengembang dan operator BugSnap - From Click to Fix.",
  "contact.enterprise": "Enterprise & Sales",
  "contact.enterpriseTitle": "Deployment Kustom",
  "contact.enterpriseDesc":
    "Butuh jaminan SLA, SSO, atau integrasi kustom untuk tim Anda? Hubungi tim sales kami untuk mendiskusikan opsi enterprise.",
  "contact.startCapturing": "Mulai merekam dengan BugSnap",
  "contact.installFree": "Pasang Ekstensi Gratis",
  "contact.seePricing": "Lihat Harga",
  "contact.usefulResources": "Sumber Daya Berguna",
  "contact.privacy": "Kebijakan Privasi",
  "contact.privacyDesc":
    "Cara kami menangani data Anda, integrasi Google Drive, dan izin Chrome.",
  "contact.terms": "Syarat Layanan",
  "contact.termsDesc":
    "Perjanjian antara Anda dan BugSnap mengenai penggunaan yang dapat diterima dan batas layanan.",
  "contact.docs": "Dokumentasi & Pengaturan Ekstensi",
  "contact.docsDesc":
    "Panduan cara pasang, konfigurasi Google Drive OAuth, dan menggunakan editor anotasi.",
  "contact.emailDesc":
    "Untuk kendala teknis, bantuan akun, laporan keamanan, atau pertanyaan umum. Kami berupaya merespons dalam 24 jam.",
  "contact.websiteLabel": "Situs Web:",
  "security.title": "Keamanan Berbasis Kepercayaan & Transparansi",
  "security.subtitle":
    "Kami merancang BugSnap dengan arsitektur privasi utama: media Anda tersimpan di Google Drive Anda sendiri, dan platform kami hanya menyimpan metadata minimal.",
  "security.h1Title": "BYO Storage - File di Drive ANDA",
  "security.h1Desc":
    "Rekaman dan tangkapan layar tidak pernah tersimpan di server kami. File langsung masuk ke Google Drive pribadi Anda, dengan kontrol penuh Anda.",
  "security.h2Title": "Enkripsi Selama Transit",
  "security.h2Desc":
    "Seluruh lalu lintas dilayani melalui HTTPS / TLS 1.3. Sesi autentikasi menggunakan token terenkripsi berumur pendek dengan rotasi berkala.",
  "security.h3Title": "Tidak Ada Penjualan Data",
  "security.h3Desc":
    "Kami tidak menjual, menyewakan, atau membagikan data pribadi, tangkapan, atau metadata Anda ke pengiklan atau pihak ketiga. Selamanya.",
  "security.h4Title": "Prinsip Hak Akses Minimal",
  "security.h4Desc":
    "Ekstensi hanya meminta izin Chrome minimal yang dibutuhkan untuk menangkap media dan mengunggah ke Google Drive, terverifikasi di Chrome Web Store.",
  "security.h5Title": "Penyimpanan Metadata Minimal",
  "security.h5Desc":
    "Hanya judul tangkapan, durasi, OS, browser, dan ringkasan dev-log yang disimpan di database cloud aman kami - diperlukan untuk menampilkan dashboard.",
  "security.h6Title": "Kepatuhan Tingkat Enterprise",
  "security.h6Desc":
    "Infrastruktur kami diaudit secara berkala dan mematuhi standar keamanan ketat agar data Anda tetap terlindungi.",
  "security.comparisonTitle":
    "Apa yang kami simpan vs. apa yang tidak pernah kami simpan",
  "security.comparisonDesc":
    "Kami hanya menyimpan: metadata yang diperlukan untuk menampilkan dashboard (judul, tipe, durasi, OS, browser, penanda waktu), serta komentar/tangkapan yang Anda kelola. Kami tidak pernah menyimpan sandi Google, isi file Drive, atau riwayat penjelajahan Anda.",
  "security.deleteNote":
    "Anda dapat menghapus tangkapan atau metadatanya kapan saja.",
  "security.ctaTitle": "Percayakan BugSnap untuk laporan bug Anda",
  "security.ctaDesc":
    "Pasang ekstensi gratis - tangkapan Anda tetap berada di Google Drive Anda sendiri, dan paket berbayar membuka fitur keamanan tim tingkat lanjut.",
  "security.installFree": "Pasang Ekstensi Gratis",
  "security.seePricing": "Lihat Harga",
  "security.readPrivacy": "Baca Kebijakan Privasi Lengkap",
  "security.verifiedBadge": "Arsitektur Terverifikasi",
  "support.btn": "Customer Support",
  "support.helpPrompt": "Butuh bantuan? Hubungi kami sekarang!",
  "support.title": "Customer Support",
  "support.subtitle": "Lapor bug, request fitur, atau tanya kendala teknis",
  "support.hide": "Kecilkan",
  "support.unhide": "Perbesar",
  "support.close": "Tutup",
  "support.category": "Kategori Laporan",
  "support.catBug": "Lapor Bug",
  "support.catFeature": "Fitur Baru",
  "support.catOther": "Lain-lain",
  "support.descBug": "Fitur error atau tidak berjalan semestinya",
  "support.descFeature": "Usulkan ide atau fitur yang Anda butuhkan di BugSnap",
  "support.descOther": "Pertanyaan umum, akun, atau masukan untuk tim",
  "support.placeholderBug":
    "Ceritakan kendala yang terjadi, langkah untuk memicu bug, atau pesan error yang muncul...",
  "support.placeholderFeature":
    "Ide fitur apa yang ingin ditambahkan dan bagaimana fitur ini bisa membantu alur kerja Anda?...",
  "support.placeholderOther":
    "Tuliskan pertanyaan atau pesan Anda untuk tim Customer Support...",
  "support.emailLabel": "Email Anda",
  "support.emailHint": "(untuk balasan CS)",
  "support.subjectLabel": "Subjek / Judul",
  "support.subjectPlaceholderBug": "Contoh: Video rekaman berhenti mendadak",
  "support.subjectPlaceholderFeature": "Contoh: Integrasi export ke Notion",
  "support.subjectPlaceholderOther": "Contoh: Pertanyaan kuota penyimpanan",
  "support.messageLabel": "Detail Pesan",
  "support.sending": "Mengirim ke CS...",
  "support.sendBtn": "Kirim Laporan ke CS",
  "support.urgent": "Butuh respon mendesak?",
  "support.successTitle": "Laporan Terkirim!",
  "support.successDesc":
    "Pesan telah diteruskan ke Customer Support ({email}). Kami akan segera menindaklanjutinya.",
  "support.openClient": "Buka di Email Client Anda",
  "support.sendAnother": "Kirim Laporan Lain",
  "support.validationError": "Mohon tuliskan pesan atau deskripsi laporan.",
  "support.emailRequired":
    "Email wajib diisi agar tim CS dapat membalas pesan Anda.",
  "support.emailInvalid": "Format email tidak valid (contoh: nama@domain.com).",
  "support.emailDisposable": "Email sementara/disposable tidak diperkenankan.",
  "support.botBlocked": "Verifikasi anti-bot gagal. Silakan coba lagi.",

  /* --- BugSnap Public Website Design System --- */
  "site.nav.product": "Produk",
  "site.nav.features": "Fitur",
  "site.nav.solutions": "Solusi",
  "site.nav.howItWorks": "Cara Kerja",
  "site.nav.pricing": "Harga",
  "site.nav.extension": "Ekstensi",
  "site.nav.docs": "Dokumentasi",
  "site.nav.login": "Masuk",
  "site.nav.getStarted": "Mulai Sekarang",
  "site.nav.dashboard": "Dasbor",
  "site.nav.blog": "Blog",
  "site.theme.day": "Siang",
  "site.theme.dark": "Gelap",
  "site.theme.system": "Sistem",

  "site.hero.eyebrow": "Alat pelaporan bug berfokus developer",
  "site.hero.headline": "Dari Klik hingga Selesai. Dalam hitungan detik.",
  "site.hero.body":
    "Rekam layar Anda dilengkapi log console otomatis, kegagalan request jaringan, dan spesifikasi sistem - tersimpan langsung di Google Drive Anda. Bebas lock-in server.",
  "site.hero.ctaPrimary": "Tambah ke Chrome - Gratis",
  "site.hero.ctaSecondary": "Pelajari cara kerja",
  "site.hero.meta": "Gratis • Google Drive Anda • Tanpa kartu kredit",

  "site.flow.badge": "Alur Kerja Produk",
  "site.flow.title": "Dari reproduksi hingga penyelesaian tanpa perdebatan",
  "site.flow.subtitle":
    "Setiap rekaman mengubah laporan bug yang samar menjadi tiket teknis yang siap diperbaiki.",
  "site.flow.step1.title": "Temukan kendala",
  "site.flow.step1.desc":
    "Terjadi error pada aplikasi web. Tak perlu mereka ulang tiga kali atau menebak penyebab masalah.",
  "site.flow.step2.title": "Rekam dengan 1 klik",
  "site.flow.step2.desc":
    "Rekam tab, jendela, atau seluruh layar. Beri panah, bingkai, atau buramkan data sensitif langsung di kanvas.",
  "site.flow.step3.title": "Telemetri terlampir otomatis",
  "site.flow.step3.desc":
    "Log exception console, payload request 4xx/5xx, storage, dan spesifikasi perangkat dibundel otomatis.",
  "site.flow.step4.title": "Tersimpan di Google Drive Anda",
  "site.flow.step4.desc":
    "File disimpan langsung di akun Google Drive pribadi Anda. Kepemilikan data dan privasi 100% milik Anda.",
  "site.flow.step5.title": "Bagikan tautan interaktif",
  "site.flow.step5.desc":
    "Rekan tim dapat menginspeksi DevTools, memutar ulang video, dan menyalin stack trace langsung di browser.",
  "site.flow.step6.title": "Selesaikan perbaikan",
  "site.flow.step6.desc":
    "Kirim laporan berformat markdown ke Jira, Linear, GitHub Issues, atau Slack lalu tutup tiket dengan cepat.",

  "site.features.sectionBadge": "Kemampuan",
  "site.features.sectionTitle":
    "Semua yang dibutuhkan developer untuk diagnosis bug cepat",
  "site.features.sectionSub":
    "Dirancang untuk kecepatan, kedalaman teknis, dan kepemilikan data penuh.",
  "site.features.f1.title": "Rekaman Layar & Audio Resolusi Tinggi",
  "site.features.f1.desc":
    "Rekam seluruh layar, jendela aplikasi, atau tab Chrome dengan narasi mikrofon dan efek klik. Tombol pintas Ctrl+Shift+S / Ctrl+Shift+F bekerja seketika.",
  "site.features.f2.title": "Telemetri DevTools Otomatis",
  "site.features.f2.desc":
    "Error console, exception tak tertangani, dan waterfall jaringan tertangkap seketika. Token autentikasi dan password disaring sebelum disimpan.",
  "site.features.f3.title": "Anotasi Visual Langsung di Layar",
  "site.features.f3.desc":
    "Gambar panah, kotak penjelas, nomor langkah, dan buramkan data pribadi pengguna langsung di tangkapan layar atau rekaman.",
  "site.features.f4.title": "Penyimpanan 100% Google Drive",
  "site.features.f4.desc":
    "Semua tangkapan tersimpan di akun Google Drive Anda dengan cakupan drive.file. Tidak ada server pihak ketiga yang menyimpan kode internal Anda.",
  "site.features.f5.title": "Pemutar & Inspektor Interaktif",
  "site.features.f5.desc":
    "Penerima dapat menonton video, memeriksa error console yang sinkron dengan waktu, dan menyalin perintah curl untuk request yang gagal.",
  "site.features.f6.title": "Ekspor Sekali Klik ke Issue Tracker",
  "site.features.f6.desc":
    "Hasilkan laporan bug terformat untuk Jira, Linear, GitHub Issues, Asana, GitLab, dan Slack lengkap dengan log pendukung.",

  "site.bugsnap.heroTag1": "Nol Biaya Server Pihak Ketiga",
  "site.bugsnap.heroTag2": "100% Google Drive Pribadi",
  "site.bugsnap.heroTag3": "Telemetri DevTools Otomatis",
  "site.bugsnap.metricsEyebrow": "Hasil yang dapat Anda ukur",
  "site.bugsnap.metricsTitle":
    "Lebih sedikit tab. Tanpa debat panjang. Bug selesai di percobaan pertama.",
  "site.bugsnap.compareEyebrow": "Mengapa tim beralih",
  "site.bugsnap.compareTitle":
    "Screenshot biasa minim konteks. BugSnap langsung beri akar masalah.",
  "site.bugsnap.oldTitle": "Cara Tradisional",
  "site.bugsnap.oldDesc": "Screenshot samar dan tebak-tebakan tanpa akhir.",
  "site.bugsnap.oldPoint1":
    'QA kirim screenshot buram di Slack bertuliskan "rusak nih".',
  "site.bugsnap.oldPoint2":
    "Dev tanya: pakai browser apa? Bisa inspect console? Payloadnya apa?",
  "site.bugsnap.oldPoint3":
    "Berjam-jam terbuang sia-sia hanya untuk mereproduksi bug.",
  "site.bugsnap.newTitle": "Bersama BugSnap",
  "site.bugsnap.newDesc": "Rekaman layar + diagnostik DevTools dalam satu klik.",
  "site.bugsnap.newPoint1":
    "1 klik rekam video dengan mikrofon dan anotasi kanvas.",
  "site.bugsnap.newPoint2":
    "Error console, kegagalan network 4xx/5xx, dan spek sistem terlampir otomatis.",
  "site.bugsnap.newPoint3":
    "Tersimpan di Google Drive Anda sendiri. Bebas biaya storage selamanya.",
  "site.bugsnap.integrationsEyebrow": "Dibuat untuk stack tim Anda",
  "site.bugsnap.integrationsTitle":
    "Integrasi bawaan dengan tracker yang sudah Anda gunakan",
  "site.bugsnap.integrationsSub":
    "Kirim laporan markdown terstruktur dengan log DevTools langsung ke alur kerja tim Anda.",
  "site.bugsnap.intNative": "Integrasi bawaan",
  "site.bugsnap.ctaTitle": "Tangkap bug berikutnya dengan konteks lengkap.",
  "site.bugsnap.ctaSub":
    "Gratis. Tersimpan di Google Drive Anda. Tanpa kartu kredit.",
  "site.bugsnap.demoEyebrow": "Demo Produk Langsung",
  "site.bugsnap.demoTitle":
    "Lihat BugSnap beraksi: dari trigger hingga fix dalam 3 detik",
  "site.bugsnap.demoSub":
    "Saksikan cara BugSnap merekam layar, mengekstrak error console dan kegagalan network, lalu menyimpan semuanya di Google Drive Anda.",

  "site.bugsnap.roleEyebrow": "Dibuat untuk seluruh tim Anda",
  "site.bugsnap.roleTitle": "Setiap peran mendapatkan apa yang mereka butuhkan",
  "site.bugsnap.roleSub":
    "QA tester, developer, dan PM punya kebutuhan berbeda - BugSnap menjawab ketiganya.",

  "site.roles.tabAll": "Semua Peran (3)",
  "site.roles.tabQa": "QA & Tester",
  "site.roles.tabDev": "Software Engineer",
  "site.roles.tabPm": "Product Manager",

  "site.roles.qa.badge": "QA & Tester",
  "site.roles.qa.tag": "Nol Langkah Manual",
  "site.roles.qa.title": "Rekam sekali. Tak perlu lagi mengetik langkah manual.",
  "site.roles.qa.desc":
    "Hentikan mengetik 5 paragraf deskripsi bug. Rekam layar 30 detik dengan narasi suara, log console dan kegagalan network terlampir otomatis.",
  "site.roles.qa.p1": "Rekam video 1 klik dengan audio mikrofon & efek klik",
  "site.roles.qa.p2": "Otomatis lampirkan exception dan error network 4xx/5xx",
  "site.roles.qa.p3": "Fitur blur bawaan untuk sensor password dan data sensitif",
  "site.roles.qa.metric": "Hemat ~45 menit per laporan bug",
  "site.roles.qa.simBtn": "Simulasi Rekam 30 Detik",
  "site.roles.qa.simDone": "Video 1080p + DevTools Tersimpan dalam 0.8s",

  "site.roles.dev.badge": "Software Engineer",
  "site.roles.dev.tag": "Akar Masalah Instan",
  "site.roles.dev.title": "Stack trace dan payload network lengkap di pesan pertama.",
  "site.roles.dev.desc":
    "Tak ada lagi 'di laptop saya aman'. Setiap tautan BugSnap menyajikan rekaman video, log console, waterfall request network, dan spek perangkat lengkap.",
  "site.roles.dev.p1": "Stack trace presisi lengkap dengan nama file, nomor baris, dan jejak error",
  "site.roles.dev.p2": "Salin perintah cURL 1 klik untuk tes ulang request API di terminal",
  "site.roles.dev.p3": "AI Clue otomatis isolasi akar masalah dari jejak error",
  "site.roles.dev.metric": "Nol debat 'bisa diulang bug-nya?'",
  "site.roles.dev.curlBtn": "Salin Perintah cURL",
  "site.roles.dev.curlDone": "Perintah cURL Berhasil Disalin!",

  "site.roles.pm.badge": "Product Manager",
  "site.roles.pm.tag": "1 Klik Serah Terima Tiket",
  "site.roles.pm.title": "Dari chat Slack jadi tiket sprint dalam 1 klik.",
  "site.roles.pm.desc":
    "Anotasi cacat UI di build staging dengan panah dan callout. Bagikan link umpan balik ke tim dev tanpa buat tiket baru untuk setiap typo, atau ekspor langsung.",
  "site.roles.pm.p1": "Ekspor 1 klik terformat ke Jira, Linear, GitHub Issues, dan Asana",
  "site.roles.pm.p2": "Anotasi visual di layar dengan panah, kotak, teks, dan nomor urut",
  "site.roles.pm.p3": "Workspace tim terorganisir rapi berdasarkan folder proyek dan sprint",
  "site.roles.pm.metric": "100% konteks teknis lengkap di tiket sprint",
  "site.roles.pm.ticketBtn": "Salin Tiket Markdown",
  "site.roles.pm.ticketDone": "Tiket Markdown Berhasil Disalin!",

  "site.roles.loop.badge": "Alur Kolaborasi Tim",
  "site.roles.loop.title": "Cara Seluruh Tim Berkolaborasi di BugSnap",
  "site.roles.loop.sub": "Dari penemuan awal hingga tiket sprint ditutup dalam satu alur berkesinambungan:",
  "site.roles.loop.s1": "QA Temukan & Rekam",
  "site.roles.loop.s1Sub": "Video 30s dengan mic & log",
  "site.roles.loop.s2": "BugSnap Tangkap Semua",
  "site.roles.loop.s2Sub": "Tersimpan di Google Drive",
  "site.roles.loop.s3": "Dev Cari Akar Masalah & Fix",
  "site.roles.loop.s3Sub": "Stack trace + salin cURL",
  "site.roles.loop.s4": "PM Tutup Tiket Sprint",
  "site.roles.loop.s4Sub": "Ekspor 1 klik ke Linear / Jira",
  "site.roles.loop.live": "Selesai dalam 1 ronde · Nol debat ping-pong di Slack",

  "site.bugsnap.split.kicker": "Buat developer & QA yang lelah menebak bug",
  "site.bugsnap.split.headline":
    "Bug di-report samar, developer buang waktu nebak-nebak.",
  "site.bugsnap.split.sub":
    "Satu klik rekam, log console, error network, dan spek perangkat otomatis terlampir. Tersimpan aman di Google Drive Anda.",
  "site.bugsnap.split.cta": "Pasang Ekstensi Gratis",
  "site.bugsnap.split.chatQa":
    "Kak, tombol Bayar $2,400 error pas diklik di staging!",
  "site.bugsnap.split.chatDev":
    "Ketemu dari log terlampir! Token auth expired di baris 42. Udah di-deploy.",
  "site.bugsnap.split.chatBadge": "Selesai dalam 1m 42s tanpa debat panjang",
  "site.bugsnap.split.chatChannel": "BugSnap · #staging-bugs",
  "site.bugsnap.split.chatQaName": "Sarah · QA Lead",
  "site.bugsnap.split.chatDevName": "Rizki · Backend Dev",
  "site.bugsnap.split.chatBotName": "BugSnap · Otomatis Terlampir",

  "solutions.badge": "Dibuat untuk tim produk modern",
  "solutions.title": "Kejelasan untuk setiap peran dalam siklus penanganan bug",
  "solutions.subtitle":
    "Dari temuan awal hingga perbaikan tuntas, BugSnap menghilangkan friksi antara pelapor, engineer, dan product manager.",
  "solutions.qa.title": "QA Engineer",
  "solutions.qa.role": "Kirim laporan bug tanpa celah dalam hitungan detik",
  "solutions.qa.desc":
    "Hentikan mengetik 15 langkah reproduksi atau menyalin log console manual. Cukup rekam layar sekali, BugSnap melampirkan konteks teknis lengkap secara otomatis.",
  "solutions.dev.title": "Software Engineer",
  "solutions.dev.role":
    "Perbaiki bug di kesempatan pertama dengan diagnostik utuh",
  "solutions.dev.desc":
    "Inspeksi kode status HTTP, payload request, stack trace, dan info perangkat berdampingan dengan video. Tak perlu lagi bertanya 'bisa direproduksi?'.",
  "solutions.pm.title": "Product Manager",
  "solutions.pm.role":
    "Komunikasikan anomali visual dan edge case secara presisi",
  "solutions.pm.desc":
    "Anotasikan perbedaan perilaku yang diharapkan vs aktual langsung di layar. Bagikan tautan interaktif ke Linear, Jira, atau Slack tanpa limit ukuran file.",
  "solutions.support.title": "Tim Support",
  "solutions.support.role":
    "Ubah keluhan pengguna menjadi tiket engineering yang terstruktur",
  "solutions.support.desc":
    "Kumpulkan data teknis tanpa disadari di latar belakang tanpa mewajibkan agen CS memahami DevTools secara mendalam.",
  "solutions.qa.point1":
    "Perekaman 1 klik dengan tombol pintas (Ctrl+Shift+S / Ctrl+Shift+F)",
  "solutions.qa.point2":
    "Perekaman otomatis log error console dan kegagalan jaringan",
  "solutions.qa.point3":
    "Memangkas waktu menulis instruksi langkah reproduksi manual",
  "solutions.dev.point1":
    "Eksepsi JavaScript tak tertangani dengan stack trace lengkap",
  "solutions.dev.point2":
    "Kode status HTTP, payload request, dan header yang presisi",
  "solutions.dev.point3":
    "Salin perintah curl langsung untuk reproduksi instan di terminal",
  "solutions.pm.point1": "Callout, panah, dan penanda visual langsung di layar",
  "solutions.pm.point2":
    "Tautan web interaktif yang terbuka langsung di Linear dan Jira",
  "solutions.pm.point3":
    "Tautan Google Drive privat tanpa batasan kuota upload video",
  "solutions.support.point1":
    "Perekaman diagnostik di latar belakang tanpa meminta user buka DevTools",
  "solutions.support.point2":
    "Ekspor ringkasan tiket lengkap langsung ke sistem helpdesk",
  "solutions.support.point3":
    "Satu tautan berisi rekaman video, log, dan rincian jaringan",

  "status.title": "Status Sistem & Kesehatan API",
  "status.subtitle":
    "Status operasional real-time untuk seluruh layanan, cluster database, dan integrasi cloud BugSnap.",
  "status.allOperational": "Seluruh Sistem Beroperasi Normal",
  "status.uptimeNote":
    "99.98% uptime sistem keseluruhan selama 90 hari terakhir.",
  "status.checkedJustNow": "Diperiksa baru saja",
  "status.components": "Komponen Layanan",
  "status.uptimeHistory": "Riwayat Uptime (90 Hari Terakhir)",
  "status.daysAgo": "90 hari lalu",
  "status.today": "Hari ini",
  "status.ctaTitle": "Seluruh sistem siap melayani pelaporan bug Anda",
  "status.ctaDesc":
    "Pasang ekstensi BugSnap gratis - hasil tangkapan tersimpan di Google Drive milik Anda.",
  "status.installFree": "Pasang Ekstensi Gratis",
  "status.viewPricing": "Lihat Harga",
  "status.operational": "Operasional",
  "status.svc.dashboard": "Dashboard Web",
  "status.svc.api": "Database Utama & API",
  "status.svc.drive": "Integrasi OAuth Google Drive",
  "status.svc.ai": "Layanan Ringkasan AI",
  "status.svc.webhook": "Pengiriman Webhook Slack & Discord",
  "status.svc.extension": "Penghubung Ekstensi Chrome",

  "extension.badge": "Chrome Web Store",
  "extension.heroTitle": "Temukan bug. Tangkap layarnya. Kirim konteksnya.",
  "extension.heroSub":
    "Ekstensi Chrome ringan yang mengubah peramban Anda menjadi stasiun pelaporan bug lengkap. Video, screenshot, error console, dan telemetri jaringan tersimpan langsung di Google Drive Anda.",
  "extension.installCta": "Tambah ke Chrome - Gratis",
  "extension.installMeta":
    "Kompatibel dengan Google Chrome, Brave, Microsoft Edge, dan peramban Chromium lainnya.",
  "extension.f1Title": "Tombol Pintas Seketika",
  "extension.f1Desc":
    "Tekan Ctrl+Shift+S (Cmd+Shift+S) untuk screenshot atau Ctrl+Shift+F untuk rekaman video tanpa mengganggu alur kerja Anda.",
  "extension.f2Title": "Penerima Tak Perlu Pasang Ekstensi",
  "extension.f2Desc":
    "Siapapun yang menerima tautan dapat menonton rekaman dan panel DevTools langsung di browser mereka tanpa perlu mendaftar akun.",
  "extension.f3Title": "Hemat Bandwidth Tanpa Server Antara",
  "extension.f3Desc":
    "Unggahan langsung ke Google Drive Anda memangkas lompatan server dan menjamin privasi untuk alur kerja perusahaan.",
  "site.viewer.eyebrow": "Lihat hasilnya",
  "site.viewer.title": "Yang diterima developer - seketika",
  "site.viewer.sub":
    "Buka satu link. Semua diagnostik sudah ada, tanpa tanya-jawab lanjutan.",
  "site.before.eyebrow": "Sebelum vs Sesudah",
  "site.before.title": "Dari 47 menit chat Slack jadi 1 link",
  "site.before.sub":
    "Lihat persis apa yang berubah ketika tim Anda pakai BugSnap.",
  "site.testimonials.eyebrow": "Disukai tim-tim hebat",
  "site.testimonials.title": "Tim engineering lebih cepat dengan BugSnap",
  "site.testimonials.sub": "Dari QA lead sampai CTO - ini kata mereka.",
  "site.trust.eyebrow": "Arsitektur zero-data",
  "site.trust.title": "File Anda tidak pernah menyentuh server kami",
  "site.trust.sub":
    "Setiap rekaman langsung ke Google Drive Anda via OAuth. BugSnap hanya menyimpan metadata dan link berbagi.",
  "site.hotkeys.eyebrow": "Dibuat untuk keyboard warriors",
  "site.hotkeys.title": "Tiga shortcut. Konteks diagnostik lengkap.",
  "site.hotkeys.sub": "Tekan sekarang - BugSnap mendengar dan merespons.",

  "blog.title": "Blog",
  "blog.subtitle": "Tips, panduan, dan insight seputar pelaporan bug dan produktivitas developer",
  "blog.badge": "Blog BugSnap",
  "blog.allArticles": "Semua Artikel",
  "blog.freeLicense": "Foto Lisensi Bebas",
  "blog.ctaTitle": "Siap mempercepat pelaporan bug Anda?",
  "blog.ctaDesc": "Rekam layar dengan audio, tangkap log console & network, dan simpan file langsung di Google Drive Anda sendiri.",
  "blog.ctaButton": "Pasang Ekstensi — Gratis",
  "blog.authorBio": "Catatan engineering dan alur debugging dari tim BugSnap.",
  "blog.readMore": "Baca selengkapnya",
  "blog.backToBlog": "← Kembali ke Blog",
  "blog.publishedOn": "Dipublikasikan pada",
  "blog.writtenBy": "oleh",
};
