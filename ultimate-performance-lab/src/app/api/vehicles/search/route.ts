import { ok } from "@/lib/api";
import { searchVehicles } from "@/lib/data/search";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.slice(0, 200) ?? "";
  return ok(searchVehicles(q));
}
