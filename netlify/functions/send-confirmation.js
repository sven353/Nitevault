// netlify/functions/send-confirmation.js
//
// Triggered by a Netlify Forms "Outgoing webhook" notification on the
// founding-waitlist form (Site configuration > Forms > Form notifications).
// Netlify calls this function server-side the instant a submission lands, and
// this function fires a transactional confirmation email via Resend.
//
// Required environment variable (Site configuration > Environment variables):
//   RESEND_API_KEY   - a Resend API key (https://resend.com)
//
// No npm dependencies: Netlify Functions run on Node 18+, which has fetch
// built in, so this ships with zero node_modules to install or commit.

const FROM_ADDRESS = "Nitevault <hello@nitevault.com>"; // must be a domain verified in Resend
const REPLY_TO = "hello@nitevault.com";

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch (err) {
    return { statusCode: 400, body: "Invalid JSON payload" };
  }

  // Netlify's outgoing webhook wraps the submission under `payload`, with the
  // raw field values under `payload.data`. Fall back gracefully in case the
  // shape ever changes or this is invoked manually for testing.
  const submission = body.payload || body;
  const data = submission.data || submission || {};

  const email = data.email || submission.email;
  const edition = data.edition || "Barcelona";

  // Netlify sends repeated form fields (interests[]) either as a real array
  // or as a single comma-separated string, depending on payload version.
  let interests = data["interests[]"] || data.interests || [];
  if (typeof interests === "string") {
    interests = interests.split(",").map((s) => s.trim()).filter(Boolean);
  }

  if (!email) {
    console.error("send-confirmation: no email found in submission payload", body);
    return { statusCode: 400, body: "Missing email in submission" };
  }

  if (!process.env.RESEND_API_KEY) {
    console.error("send-confirmation: RESEND_API_KEY is not set");
    return { statusCode: 500, body: "Email provider not configured" };
  }

  const interestsLine = interests.length
    ? `<p style="margin:0 0 24px;color:#94a3b8;font-size:14px;line-height:1.6;">You told us <strong style="color:#e2e8f0;">${escapeHtml(
        interests.join(", ")
      )}</strong> matters most to you. We're building for exactly that.</p>`
    : "";

  const html = renderEmail({ edition, interestsLine });

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: [email],
        reply_to: REPLY_TO,
        subject: "You're on the Nitevault Founding List 🔒",
        html,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("send-confirmation: Resend API error", res.status, errText);
      return { statusCode: 502, body: "Failed to send confirmation email" };
    }

    return { statusCode: 200, body: "Confirmation email sent" };
  } catch (err) {
    console.error("send-confirmation: unexpected error", err);
    return { statusCode: 500, body: "Unexpected error sending email" };
  }
};

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderEmail({ edition, interestsLine }) {
  return `
<!doctype html>
<html>
  <body style="margin:0;padding:0;background-color:#08090D;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#08090D;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:480px;background-color:#12141D;border:1px solid rgba(255,255,255,0.1);border-radius:24px;overflow:hidden;">
            <tr>
              <td style="padding:32px 32px 0;text-align:center;">
                <span style="font-family:'Courier New',monospace;letter-spacing:2px;font-size:16px;font-weight:700;">
                  <span style="color:#ffffff;">NITE</span><span style="color:#34D399;">VAULT</span>
                </span>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 0;text-align:center;">
                <div style="display:inline-block;background:rgba(16,185,129,0.1);border:1px solid rgba(52,211,153,0.4);color:#34D399;font-size:11px;font-family:'Courier New',monospace;text-transform:uppercase;letter-spacing:1px;border-radius:999px;padding:6px 14px;">
                  Founding Member Confirmed
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px 0;text-align:center;">
                <h1 style="margin:0;color:#ffffff;font-size:22px;line-height:1.3;">You're on the Founding VIP List.</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:12px 32px 0;text-align:center;">
                <p style="margin:0;color:#94a3b8;font-size:14px;line-height:1.6;">
                  Your spot in Nitevault's Founding Batch 01 is locked in at the early-bird price. Here's what's reserved for you:
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 0;">
                <table role="presentation" width="100%" style="background-color:#171A24;border:1px solid rgba(255,255,255,0.1);border-radius:16px;">
                  <tr>
                    <td style="padding:20px 20px 4px;">
                      <span style="color:#34D399;font-size:24px;font-weight:800;">€49.99</span>
                      <span style="color:#64748b;font-size:13px;text-decoration:line-through;margin-left:8px;">€69.00</span>
                      <span style="color:#94a3b8;font-size:12px;margin-left:8px;">Founding Member Pricing</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:8px 20px 20px;color:#cbd5e1;font-size:13px;line-height:1.7;">
                      Edition: <strong style="color:#ffffff;">${escapeHtml(edition)}</strong><br>
                      Bundle: 1&times; Holster Shoulder Sling &bull; 1&times; Holster Waist Belt &bull; 5&times; Compost-Ready Inserts
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 0;">
                ${interestsLine}
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 28px;text-align:center;">
                <p style="margin:0;color:#64748b;font-size:12px;line-height:1.6;">
                  No payment has been collected today. We'll email you again the moment Founding Batch 01 opens for checkout. Reply to this email any time, we read every message.
                </p>
              </td>
            </tr>
          </table>
          <p style="margin:20px 0 0;color:#475569;font-size:11px;">&copy; Nitevault.com &middot; Concept-validation list, no orders are being charged today.</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
