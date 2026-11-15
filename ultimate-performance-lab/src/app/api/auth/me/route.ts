import { z } from "zod";
import { currentUser, handle, ok, requireUser } from "@/lib/api";
import { updateProfile } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  return handle(async () => ok({ user: await currentUser() }));
}

const patch = z.object({ name: z.string().trim().min(2).max(80).optional(), settings: z.record(z.string(), z.unknown()).optional() });

export async function PATCH(req: Request) {
  return handle(async () => {
    const user = await requireUser();
    const b = patch.parse(await req.json());
    return ok({ user: await updateProfile(user.id, b) });
  });
}
