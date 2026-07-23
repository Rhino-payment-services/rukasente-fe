import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { proxyInternalRequest } from "@/lib/internal-api-proxy";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: { code: "unauthorized", message: "Unauthorized" } },
      { status: 401 }
    );
  }

  const body = await req.json();
  return proxyInternalRequest("/internal/loan-applications", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

