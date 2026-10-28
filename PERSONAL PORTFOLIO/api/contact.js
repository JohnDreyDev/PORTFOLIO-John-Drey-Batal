"use strict";

const nodemailer = require("nodemailer");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 5;
const requestCounts = new Map();

function sendJson(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(data));
}

function clientKey(req) {
  const forwarded = req.headers["x-forwarded-for"];
  const ip = typeof forwarded === "string"
    ? forwarded.split(",")[0].trim()
    : "";

  return ip || req.socket?.remoteAddress || "unknown";
}

function isRateLimited(key) {
  const now = Date.now();
  const record = requestCounts.get(key);

  if (!record || now - record.startedAt >= WINDOW_MS) {
    requestCounts.set(key, {
      startedAt: now,
      count: 1
    });
    return false;
  }

  record.count += 1;
  return record.count > MAX_REQUESTS;
}

module.exports = async function contactHandler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");

    return sendJson(res, 405, {
      error: "Please submit the form through the website."
    });
  }

  // Reject requests coming from a different website.
  const origin = req.headers.origin;
  const requestHost =
    req.headers["x-forwarded-host"] || req.headers.host;

  if (origin && requestHost) {
    try {
      const originHost = new URL(origin).host;

      if (originHost.toLowerCase() !== String(requestHost).toLowerCase()) {
        return sendJson(res, 403, {
          error: "This request could not be verified. Refresh the page and try again."
        });
      }
    } catch {
      return sendJson(res, 403, {
        error: "This request could not be verified. Refresh the page and try again."
      });
    }
  }

  const body =
    req.body && typeof req.body === "object"
      ? req.body
      : {};

  const name = typeof body.name === "string"
    ? body.name.trim()
    : "";

  const email = typeof body.email === "string"
    ? body.email.trim()
    : "";

  const message = typeof body.message === "string"
    ? body.message.trim()
    : "";

  const website = typeof body.website === "string"
    ? body.website.trim()
    : "";

  // Honeypot: silently ignore simple bot submissions.
  if (website) {
    return sendJson(res, 200, { ok: true });
  }

  if (isRateLimited(clientKey(req))) {
    return sendJson(res, 429, {
      error: "Too many messages were sent. Please wait a few minutes and try again."
    });
  }

  if (name.length < 2 || name.length > 100) {
    return sendJson(res, 400, {
      error: "Please enter a name between 2 and 100 characters."
    });
  }

  if (!EMAIL_RE.test(email) || email.length > 254) {
    return sendJson(res, 400, {
      error: "Please enter a valid email address."
    });
  }

  if (message.length < 10 || message.length > 5000) {
    return sendJson(res, 400, {
      error: "Please write a message between 10 and 5,000 characters."
    });
  }

  const gmailUser = process.env.GMAIL_USER;
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;
  const recipient = process.env.CONTACT_TO || gmailUser;

  if (!gmailUser || !gmailAppPassword || !recipient) {
    return sendJson(res, 503, {
      error: "The contact form isn't configured yet. Please email johndrey.va@gmail.com directly for now."
    });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: gmailUser,
        pass: gmailAppPassword.replace(/\s+/g, "")
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000
    });

    await transporter.sendMail({
      from: {
        name: "Portfolio Contact Form",
        address: gmailUser
      },
      to: recipient,
      replyTo: {
        name,
        address: email
      },
      subject: `Portfolio message from ${name}`,
      text:
        `You received a new message through your portfolio.\n\n` +
        `Name: ${name}\n` +
        `Email: ${email}\n\n` +
        `Message:\n${message}\n`,
      headers: {
        "X-Portfolio-Contact": "true"
      }
    });

    return sendJson(res, 200, { ok: true });

  } catch (error) {
    // Do not expose server details to website visitors.
    console.error(
      "Portfolio contact email failed:",
      error?.code || error?.name || "unknown error"
    );

    return sendJson(res, 502, {
      error: "Your message could not be delivered right now. Please try again later or email johndrey.va@gmail.com directly."
    });
  }
};