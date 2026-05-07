import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { proxyInternalRequest } from "@/lib/internal-api-proxy";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: { code: "unauthorized", message: "Unauthorized" } },
      { status: 401 }
    );
  }

  const { id } = await params;
  return proxyInternalRequest(`/internal/loan-applications/${encodeURIComponent(id)}`);
}

