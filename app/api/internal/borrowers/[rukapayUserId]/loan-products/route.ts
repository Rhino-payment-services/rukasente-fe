import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { proxyInternalRequest } from "@/lib/internal-api-proxy";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ rukapayUserId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: { code: "unauthorized", message: "Unauthorized" } },
      { status: 401 }
    );
  }

  const { rukapayUserId } = await params;
  return proxyInternalRequest(
    `/internal/borrowers/${encodeURIComponent(rukapayUserId)}/loan-products`
  );
}

