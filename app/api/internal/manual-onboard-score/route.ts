import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getApiBaseUrl } from "@/lib/config";

type Body = {
  /** Optional legacy UUID; prefer phone — backend resolves RukaPay identity by MSISDN. */
  rukapay_user_id?: string;
  /** Optional — filled from the RukaPay subscriber when looking up by phone. */
  full_name?: string;
  phone: string;
  email?: string;
  wallet_id?: string;
  scoring_wallet_id?: string;
  consent_version?: string;
};

type EnrollData = {
  borrower?: {
    rukapay_user_id?: string;
    scoring_wallet_id?: string;
    wallet_ids?: string[];
  };
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
  if (!body.phone?.trim()) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "validation_error",
          message: "Phone is required (full name and email are filled from RukaPay when available)",
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

  const walletId = body.wallet_id?.trim() || "";
  const enrollBody: Record<string, unknown> = {
    phone: body.phone.trim(),
    email,
  };
  const fullName = body.full_name?.trim() || "";
  if (fullName) {
    enrollBody.full_name = fullName;
  }
  if (body.rukapay_user_id?.trim()) {
    enrollBody.rukapay_user_id = body.rukapay_user_id.trim();
  }
  if (walletId) {
    enrollBody.wallet_ids = [walletId];
    enrollBody.scoring_wallet_id =
      body.scoring_wallet_id?.trim() || walletId;
  }

  const enrollRes = await fetch(`${base}/internal/borrowers/enroll`, {
    method: "POST",
    headers,
    cache: "no-store",
    body: JSON.stringify(enrollBody),
  });
  const enrollPayload = await enrollRes.json();
  if (!enrollRes.ok || !enrollPayload?.success) {
    return NextResponse.json(enrollPayload, { status: enrollRes.status });
  }

  const enrollData = enrollPayload.data as EnrollData | undefined;
  const rukapayUserId =
    enrollData?.borrower?.rukapay_user_id?.trim() ||
    body.rukapay_user_id?.trim() ||
    "";
  const scoringWallet =
    enrollData?.borrower?.scoring_wallet_id?.trim() ||
    body.scoring_wallet_id?.trim() ||
    walletId ||
    enrollData?.borrower?.wallet_ids?.[0]?.trim() ||
    "";

  if (!rukapayUserId || !scoringWallet) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "enroll_incomplete",
          message:
            "Enrollment succeeded but RukaPay user or wallet could not be resolved. Ensure the phone is registered in RukaPay with a PERSONAL wallet.",
        },
      },
      { status: 502 }
    );
  }

  const consentVersion = body.consent_version?.trim() || "v1";
  const consentRes = await fetch(
    `${base}/internal/borrowers/${encodeURIComponent(
      rukapayUserId
    )}/consents?wallet_id=${encodeURIComponent(scoringWallet)}`,
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
      rukapayUserId
    )}/run?wallet_id=${encodeURIComponent(scoringWallet)}`,
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
        rukapayUserId
      )}/latest`,
      { headers, cache: "no-store" }
    ),
    fetch(
      `${base}/internal/borrowers/${encodeURIComponent(
        rukapayUserId
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
      resolved: {
        rukapay_user_id: rukapayUserId,
        wallet_id: scoringWallet,
      },
    },
  });
}
