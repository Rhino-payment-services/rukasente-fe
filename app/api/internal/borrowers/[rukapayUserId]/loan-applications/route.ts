import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { proxyInternalRequest } from "@/lib/internal-api-proxy";

export async function GET(
  req: Request,
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
  const url = new URL(req.url);
  const page = url.searchParams.get("page") ?? "1";
  const pageSize = url.searchParams.get("page_size") ?? "20";

  return proxyInternalRequest(
    `/internal/borrowers/${encodeURIComponent(rukapayUserId)}/loan-applications?page=${encodeURIComponent(
      page
    )}&page_size=${encodeURIComponent(pageSize)}`
  );
}

