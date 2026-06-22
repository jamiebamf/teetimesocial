import "dotenv/config";
import express from "express";
import nodemailer from "nodemailer";
import path from "path";
import { fileURLToPath } from "url";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json({ limit: "1mb" }));

const requiredEmailSettings = [
  "EMAIL_HOST",
  "EMAIL_PORT",
  "EMAIL_USER",
  "EMAIL_PASS",
  "EMAIL_TO",
  "EMAIL_FROM"
];

function hasEmailSettings() {
  return requiredEmailSettings.every((key) => Boolean(process.env[key]));
}

function formatPayload(payload = {}) {
  return Object.entries(payload)
    .map(([key, value]) => {
      const label = key
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());

      if (Array.isArray(value)) {
        return `${label}: ${value.join(", ")}`;
      }

      if (value === null || value === undefined || value === "") {
        return `${label}: -`;
      }

      return `${label}: ${String(value)}`;
    })
    .join("\n");
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getCustomerEmail(payload = {}) {
  const type = String(payload.type ?? "");
  const name = String(payload.full_name ?? "there");
  const reference = payload.booking_reference ? String(payload.booking_reference) : "";
  const bookingDate = payload.booking_date ? String(payload.booking_date) : "";
  const bookingTime = payload.booking_time ? String(payload.booking_time) : "";
  const simulator = payload.simulator ? String(payload.simulator) : "";
  const membershipType = payload.membership_type ? String(payload.membership_type) : "";
  const eventType = payload.event_type ? String(payload.event_type) : "";
  const coachingInterest = payload.coaching_interest ? String(payload.coaching_interest) : "";

  if (type === "Simulator booking") {
    return {
      subject: `Tee Time Social booking request received${reference ? ` - ${reference}` : ""}`,
      text: [
        `Hi ${name},`,
        "",
        "Thank you for your Tee Time Social simulator booking request.",
        "",
        reference ? `Booking reference: ${reference}` : "",
        bookingDate ? `Date: ${bookingDate}` : "",
        bookingTime ? `Time: ${bookingTime}` : "",
        simulator ? `Simulator: ${simulator}` : "",
        "",
        "Your request has been saved. Payment and final confirmation will be added in a later version.",
        "",
        "Please keep your booking reference safe. We look forward to welcoming you to Tee Time Social.",
        "",
        "Tee Time Social",
        "Regent Street, Barnsley"
      ].filter(Boolean).join("\n"),
      heading: "Booking request received",
      intro: "Thank you for your Tee Time Social simulator booking request.",
      rows: [
        ["Reference", reference || "-"],
        ["Date", bookingDate || "-"],
        ["Time", bookingTime || "-"],
        ["Simulator", simulator || "-"],
        ["Players", payload.group_size ?? "-"],
        ["Deposit estimate", payload.deposit_amount ? `£${payload.deposit_amount}` : "-"]
      ]
    };
  }

  if (type === "Membership waiting list") {
    return {
      subject: "You are on the Tee Time Social membership waiting list",
      text: [
        `Hi ${name},`,
        "",
        "Thank you for joining the Tee Time Social membership waiting list.",
        membershipType ? `Membership interest: ${membershipType}` : "",
        "",
        "We will contact you with founding member updates, launch offers and early access information.",
        "",
        "Tee Time Social",
        "Regent Street, Barnsley"
      ].filter(Boolean).join("\n"),
      heading: "Membership interest received",
      intro: "Thank you for joining the Tee Time Social membership waiting list.",
      rows: [
        ["Membership interest", membershipType || "-"],
        ["Status", "Waiting list"]
      ]
    };
  }

  if (type === "Event enquiry" || type === "Private hire enquiry") {
    return {
      subject: "Tee Time Social event enquiry received",
      text: [
        `Hi ${name},`,
        "",
        "Thank you for your Tee Time Social event/private hire enquiry.",
        eventType ? `Event type: ${eventType}` : "",
        "",
        "Your enquiry has been received and we will come back to you with next steps.",
        "",
        "Tee Time Social",
        "Regent Street, Barnsley"
      ].filter(Boolean).join("\n"),
      heading: "Event enquiry received",
      intro: "Thank you for your Tee Time Social event/private hire enquiry.",
      rows: [
        ["Event type", eventType || "-"],
        ["Preferred date", payload.preferred_date ?? "-"],
        ["Guest count", payload.guest_count ?? "-"]
      ]
    };
  }

  if (type === "Coaching enquiry") {
    return {
      subject: "Tee Time Social coaching enquiry received",
      text: [
        `Hi ${name},`,
        "",
        "Thank you for your Tee Time Social coaching and practice enquiry.",
        coachingInterest ? `Interest: ${coachingInterest}` : "",
        "",
        "We will contact you when coaching, practice sessions and pro shop services are ready.",
        "",
        "Tee Time Social",
        "Regent Street, Barnsley"
      ].filter(Boolean).join("\n"),
      heading: "Coaching enquiry received",
      intro: "Thank you for your Tee Time Social coaching and practice enquiry.",
      rows: [
        ["Coaching interest", coachingInterest || "-"]
      ]
    };
  }

  return {
    subject: "Tee Time Social enquiry received",
    text: [
      `Hi ${name},`,
      "",
      "Thank you for registering your interest in Tee Time Social.",
      "",
      "We will keep you updated with launch news, offers and venue announcements.",
      "",
      "Tee Time Social",
      "Regent Street, Barnsley"
    ].join("\n"),
    heading: "Interest registered",
    intro: "Thank you for registering your interest in Tee Time Social.",
    rows: [
      ["Interest", Array.isArray(payload.interests) ? payload.interests.join(", ") : "-"]
    ]
  };
}

function customerHtml(email) {
  const rows = email.rows
    .map(([label, value]) => `<tr><th align="left" style="padding:12px;border-bottom:1px solid #e5e7eb;color:#0f3527;width:180px;">${escapeHtml(label)}</th><td style="padding:12px;border-bottom:1px solid #e5e7eb;">${escapeHtml(value)}</td></tr>`)
    .join("");

  return `
    <div style="font-family:Arial,sans-serif;color:#071f18;line-height:1.6;background:#f4f1e8;padding:24px;">
      <div style="max-width:680px;margin:auto;background:#ffffff;border-radius:20px;padding:28px;border:1px solid #e5e7eb;">
        <p style="letter-spacing:0.16em;text-transform:uppercase;color:#a8b56b;font-weight:700;font-size:12px;margin:0 0 10px;">Tee Time Social</p>
        <h2 style="color:#0f3527;font-size:28px;margin:0 0 12px;">${escapeHtml(email.heading)}</h2>
        <p style="margin:0 0 20px;color:#334155;">${escapeHtml(email.intro)}</p>
        <table style="border-collapse:collapse;width:100%;margin:18px 0;">${rows}</table>
        <p style="margin:20px 0 0;color:#334155;">We look forward to welcoming you to Tee Time Social.</p>
        <p style="margin:20px 0 0;color:#64748b;">Tee Time Social<br />Regent Street, Barnsley</p>
      </div>
    </div>
  `;
}

app.post("/api/notify", async (req, res) => {
  const { subject, payload } = req.body ?? {};

  if (!subject || !payload || typeof payload !== "object") {
    return res.status(400).json({ ok: false, error: "Missing subject or payload." });
  }

  if (!hasEmailSettings()) {
    console.warn("Email notification skipped. Missing SMTP environment variables.");
    return res.status(200).json({ ok: false, skipped: true });
  }

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: String(process.env.EMAIL_SECURE ?? "true") === "true",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const adminText = [
    subject,
    "",
    formatPayload(payload),
    "",
    "Tee Time Social website notification"
  ].join("\n");

  const adminHtmlRows = Object.entries(payload)
    .map(([key, value]) => {
      const label = key
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());

      const safeValue = Array.isArray(value)
        ? value.join(", ")
        : value === null || value === undefined || value === ""
          ? "-"
          : String(value);

      return `<tr><th align="left" style="padding:10px;border-bottom:1px solid #e5e7eb;color:#0f3527;">${escapeHtml(label)}</th><td style="padding:10px;border-bottom:1px solid #e5e7eb;">${escapeHtml(safeValue)}</td></tr>`;
    })
    .join("");

  const adminHtml = `
    <div style="font-family:Arial,sans-serif;color:#071f18;line-height:1.5;">
      <h2 style="color:#0f3527;">${escapeHtml(subject)}</h2>
      <table style="border-collapse:collapse;width:100%;max-width:720px;">${adminHtmlRows}</table>
      <p style="margin-top:20px;color:#6b7280;">Tee Time Social website notification</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: process.env.EMAIL_TO,
      replyTo: typeof payload.email === "string" ? payload.email : undefined,
      subject,
      text: adminText,
      html: adminHtml
    });

    if (typeof payload.email === "string" && payload.email.includes("@")) {
      const email = getCustomerEmail(payload);

      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: payload.email,
        replyTo: process.env.EMAIL_TO,
        subject: email.subject,
        text: email.text,
        html: customerHtml(email)
      });
    }

    return res.json({ ok: true });
  } catch (error) {
    console.error("Email notification failed:", error);
    return res.status(500).json({ ok: false, error: "Email failed." });
  }
});

app.use(express.static(path.join(__dirname, "dist")));

app.use((_req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Tee Time Social running on port ${PORT}`);
});
