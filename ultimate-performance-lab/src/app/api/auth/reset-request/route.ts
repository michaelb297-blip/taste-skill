import { z } from "zod";
import { handle, ok } from "@/lib/api";
import { requestPasswordReset } from "@/lib/auth";

const body = z.object({ email: z.string().max(200) });

async function sendMail(to: string, link: string): Promise<boolean> {
  if (!process.env.RESEND_API_KEY || !process.env.MAIL_FROM) return false;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.MAIL_FROM, to, subject: "Passwort zurücksetzen – Ultimate Performance Lab", text: `Über diesen Link kannst du ein neues Passwort vergeben (eine Stunde gültig):\n\n${link}\n\nWenn du das nicht angefordert hast, ignoriere diese Nachricht.` }),
  });
  return res.ok;
}

export async function POST(req: Request) {
  return handle(async () => {
    const b = body.parse(await req.json());
    const r = await requestPasswordReset(b.email);
    let devLink: string | undefined;
    if (r) {
      const base = process.env.APP_URL || new URL(req.url).origin;
      const link = `${base}/konto/passwort-neu?token=${encodeURIComponent(r.token)}`;
      const sent = await sendMail(r.email, link).catch(() => false);
      if (!sent) {
        // Ohne Mailversand: Link nur im Server-Log, in der Entwicklung zusätzlich in der Antwort
        console.info(`[auth] Passwort-Reset-Link: ${link}`);
        if (process.env.NODE_ENV !== "production") devLink = link;
      }
    }
    // Antwort verrät nicht, ob ein Konto existiert
    return ok({ ok: true, message: "Falls ein Konto existiert, wurde ein Link zum Zurücksetzen erzeugt.", devLink });
  });
}
