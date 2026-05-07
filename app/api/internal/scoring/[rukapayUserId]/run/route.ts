import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { proxyInternalRequest } from "@/lib/internal-api-proxy";

type RouteCtx = { params: Promise<{ rukapayUserId: string }> };

export async function POST(req: Request, ctx: RouteCtx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: { code: "unauthorized", message: "Unauthorized" } },
      { status: 401 }
    );
  }

  const { rukapayUserId } = await ctx.params;
  if (!rukapayUserId?.trim()) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "validation_error", message: "rukapayUserId is required" },
      },
      { status: 400 }
    );
  }

  const url = new URL(req.url);
  const walletID = url.searchParams.get("wallet_id") ?? "";
  const qs = walletID ? `?wallet_id=${encodeURIComponent(walletID)}` : "";

  return proxyInternalRequest(
    `/internal/scoring/borrowers/${encodeURIComponent(rukapayUserId)}/run${qs}`,
    { method: "POST" }
  );
}
