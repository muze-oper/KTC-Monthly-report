import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

const ALLOWED_DOMAIN = process.env.ALLOWED_EMAIL_DOMAIN ?? "muze.co.th";

// Real, secure auth check — call this in every page/route that touches
// KTC ticket data. The proxy-level check (src/proxy.ts) is optimistic only.
export async function verifySession() {
  const session = await auth();
  const email = session?.user?.email ?? "";

  if (!session || !email.toLowerCase().endsWith(`@${ALLOWED_DOMAIN}`)) {
    redirect("/login");
  }

  return session;
}
