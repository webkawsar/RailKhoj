
import { NextRequest, NextResponse } from "next/server";

// export const runtime = "nodejs";

const RAILWAY_API_URL =
  "https://railspaapi.shohoz.com/v1.0/web/train-routes";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const model = searchParams.get("model");
  const departureDate = searchParams.get("date");
  console.log(searchParams, "searchParams")

  if (!model || !departureDate) {
    return NextResponse.json(
      {
        ok: false,
        error: "Train model and journey date are required.",
      },
      { status: 400 }
    );
  }

  const token = process.env.RAILWAY_TOKEN;
  const deviceId = process.env.RAILWAY_DEVICE_ID;
  const deviceKey = process.env.RAILWAY_DEVICE_KEY;

  if (!token || !deviceId || !deviceKey) {
    return NextResponse.json(
      {
        ok: false,
        error: "Railway API credentials are not configured.",
      },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(RAILWAY_API_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: token.startsWith("Bearer ")
          ? token
          : `Bearer ${token}`,
        "x-device-id": deviceId,
        "x-device-key": deviceKey,
        "x-requested-with": "XMLHttpRequest",
        Referer: "https://eticket.railway.gov.bd/",
      },
      body: JSON.stringify({
        model,
        departure_date_time: departureDate,
      }),
      cache: "no-store",
    });

    const responseText = await response.text();

    let data: unknown;

    try {
      data = JSON.parse(responseText);
    } catch {
      data = { rawResponse: responseText };
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          ok: false,
          upstreamStatus: response.status,
          error: "Railway API rejected the train-route request.",
          data,
        },
        { status: 502 }
      );
    }

    const payload = data as {
      data?: {
        routes?: unknown[];
        train_name?: string;
      };
    };

    const routeData = payload?.data;

    return NextResponse.json({
      ok: true,
      upstreamStatus: response.status,
      data,
      routeCount: routeData?.routes?.length ?? 0,
      hasRoutes: (routeData?.routes?.length ?? 0) > 0,
      message:
        (routeData?.routes?.length ?? 0) > 0
          ? "Train route loaded successfully."
          : "API returned no stations. Verify the model and journey date.",
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "Could not connect to Railway API.",
      },
      { status: 502 }
    );
  }
}
