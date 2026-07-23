import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getApiBaseUrl } from "@/lib/config";

type Body = {
  rukapay_user_id: string;
  full_name: string;
  phone: string;
  email: string;
  wallet_id: string;
  scoring_wallet_id?: string;
  consent_version?: string;
};

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: { code: "unauthorized", message: "Unauthorized" } },
      { status: 401 }
    );
  }

  const body = (await req.json()) as Body;
  if (
    !body.rukapay_user_id?.trim() ||
    !body.full_name?.trim() ||
    !body.phone?.trim() ||
    !body.wallet_id?.trim()
  ) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "validation_error",
          message: "Missing required fields (email is optional)",
        },
      },
      { status: 400 }
    );
  }

  const email = body.email?.trim() || "";
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "validation_error", message: "Invalid email address" },
      },
      { status: 400 }
    );
  }

  const base = getApiBaseUrl();
  const internalKey = process.env.RUKA_INTERNAL_API_KEY ?? "";
  const headers = {
    "Content-Type": "application/json",
    "X-Internal-API-Key": internalKey,
  };

  const enrollRes = await fetch(`${base}/internal/borrowers/enroll`, {
    method: "POST",
    headers,
    cache: "no-store",
    body: JSON.stringify({
      rukapay_user_id: body.rukapay_user_id,
      full_name: body.full_name,
      phone: body.phone,
      email,
      wallet_ids: [body.wallet_id],
      scoring_wallet_id: body.scoring_wallet_id || body.wallet_id,
    }),
  });
  const enrollPayload = await enrollRes.json();
  if (!enrollRes.ok || !enrollPayload?.success) {
    return NextResponse.json(enrollPayload, { status: enrollRes.status });
  }

  const consentVersion = body.consent_version?.trim() || "v1";
  const consentRes = await fetch(
    `${base}/internal/borrowers/${encodeURIComponent(
      body.rukapay_user_id
    )}/consents?wallet_id=${encodeURIComponent(body.wallet_id)}`,
    {
      method: "POST",
      headers,
      cache: "no-store",
      body: JSON.stringify({
        consents: [
          {
            consent_type: "terms_and_conditions",
            consent_version: consentVersion,
            accepted: true,
          },
          {
            consent_type: "privacy_policy",
            consent_version: consentVersion,
            accepted: true,
          },
          {
            consent_type: "credit_assessment_consent",
            consent_version: consentVersion,
            accepted: true,
          },
          {
            consent_type: "data_sharing_consent",
            consent_version: consentVersion,
            accepted: true,
          },
        ],
      }),
    }
  );
  const consentPayload = await consentRes.json();
  if (!consentRes.ok || !consentPayload?.success) {
    return NextResponse.json(consentPayload, { status: consentRes.status });
  }

  const runRes = await fetch(
    `${base}/internal/scoring/borrowers/${encodeURIComponent(
      body.rukapay_user_id
    )}/run?wallet_id=${encodeURIComponent(body.wallet_id)}`,
    {
      method: "POST",
      headers,
      cache: "no-store",
    }
  );
  const runPayload = await runRes.json();
  if (!runRes.ok || !runPayload?.success) {
    return NextResponse.json(runPayload, { status: runRes.status });
  }

  const [latestRes, subscriptionRes] = await Promise.all([
    fetch(
      `${base}/internal/scoring/borrowers/${encodeURIComponent(
        body.rukapay_user_id
      )}/latest`,
      { headers, cache: "no-store" }
    ),
    fetch(
      `${base}/internal/borrowers/${encodeURIComponent(
        body.rukapay_user_id
      )}/subscription`,
      { headers, cache: "no-store" }
    ),
  ]);

  const latestPayload = await latestRes.json();
  const subscriptionPayload = await subscriptionRes.json();

  return NextResponse.json({
    success: true,
    data: {
      enroll: enrollPayload.data,
      consents: consentPayload.data,
      scoring_run: runPayload.data,
      latest_score: latestPayload?.data ?? null,
      subscription: subscriptionPayload?.data ?? null,
    },
  });
}

