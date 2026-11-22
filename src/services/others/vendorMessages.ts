/**
 * Every message a vendor receives about their submission. Today the admin copies the text and sends it themselves
 * (WhatsApp, their own email). When email sending is added, send these same messages to the link's vendorEmail.
 */
export type VendorMessage = { subject: string; body: string };

const SITE = "myweddingday";
const date = (value: Date) => value.toLocaleDateString("en-MY", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kuala_Lumpur" });

export const vendorMessages = {
  invite: ({ label, url, expiresAt }: { label: string; url: string; expiresAt: Date }): VendorMessage => ({
    subject: `List ${label} on ${SITE}`,
    body: `Hi ${label},

We'd like to list your business on ${SITE}, where couples plan their wedding and find vendors.

Add your details, photos and packages here (no sign-up needed):
${url}

The link works until ${date(expiresAt)}. We'll review your listing and let you know once it's live.`,
  }),

  received: (): VendorMessage => ({
    subject: "We've received your listing",
    body: "Thanks, we've received your listing. Our team will review it and contact you.",
  }),

  approved: ({ vendorName }: { vendorName: string }): VendorMessage => ({
    subject: `${vendorName} is now live on ${SITE}`,
    body: `Hi ${vendorName},

Good news: your listing has been approved and couples can now find you on ${SITE}.

If anything changes (prices, packages or contact details), just let us know.`,
  }),

  rejected: ({ vendorName, reason }: { vendorName: string; reason: string | null }): VendorMessage => ({
    subject: `About your ${SITE} listing`,
    body: `Hi ${vendorName},

Thank you for submitting your listing. Unfortunately we can't publish it on ${SITE}.${reason ? `\n\nReason: ${reason}` : ""}

Feel free to reply if you have any questions.`,
  }),

  fixRequested: ({ vendorName, note, url, expiresAt }: { vendorName: string; note: string; url: string; expiresAt: Date }): VendorMessage => ({
    subject: `Please update your ${SITE} listing`,
    body: `Hi ${vendorName},

Thanks for your listing. Before we publish it, please make these changes:

${note}

Your submission is saved, so you only need to change what's mentioned:
${url}

The link works until ${date(expiresAt)}.`,
  }),
};

/** The text to paste into WhatsApp or an email body. */
export const messageText = (message: VendorMessage) => message.body;
