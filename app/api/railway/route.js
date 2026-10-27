
import { NextResponse } from "next/server";

const TOKEN = "Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6ImF0K2p3dCJ9.eyJuYmYiOjE3OTMxMTEzNzMsImV4cCI6MTc5MzE1NDU3MywiaXNzIjoiaHR0cDovL3RyYWluLWlhbS5zaG9ob3ouY29tIiwiYXVkIjoic2hvaG96LmlhbS50cmFpbiIsImNsaWVudF9pZCI6InRyYWluLXRpY2tldC11c2VyIiwiY2xpZW50X3RlbmFudF9pZCI6IjY3YTUxNjNjLTU2NWQtNGNhMC1iMTE3LTg3YzcwMWY2NTRmOSIsImNsaWVudF92ZXJ0aWNhbF9pZCI6IjA2OGU4MDRmLTJkYjctNDQ4OS05OTYzLTc4OWZiN2UwMmJkZiIsInN1YiI6ImEzNzAzZDhhLTQ4ZTktNDJmYi1hNTI1LTJhNzM1ZjZhOTY5YSIsImF1dGhfdGltZSI6MTc5MzExMTM3MywiaWRwIjoibG9jYWwiLCJwaG9uZV9udW1iZXIiOiIwMTcxNTEwMzYwNiIsImVtYWlsIjoia2F3c2FyYWhtZWQuZGV2QGdtYWlsLmNvbSIsInVzZXJuYW1lIjoiMDE3MTUxMDM2MDYiLCJkaXNwbGF5X25hbWUiOiJLQVdTQVIgQUhNRUQiLCJsb2NhbGUiOiJibi1CRCIsIm5pZG4iOiI3MzUxNjc3NzU3IiwibmlkbnQiOiJOSUQiLCJyb2xlIjpbInVzZXIiLCJhbm9ueW1vdXMiXSwic2NvcGUiOlsic2hvaG96LmlhbS50cmFpbiIsIm9mZmxpbmVfYWNjZXNzIl0sImFtciI6WyJwd2QiXX0.oaMYOTLi1jzKpni5G5xx8dBEr0rX4dQT2pN95c-C6_GjTDwUv2yPAriSUmrNTxMBzEgkHlmTeJOf7WBJr9WvQT081uV-QLh-CEIFHUdiDllY0Se6i1UpZWPQY2_3ShGQO0FuOlbC5tNhjAbia_2E_ufoCZN05Ci9q1UdJVdhxZd-mmWPwZuBkqN0Lht2DAe49TQY82ySzvD7ClFT60uOnnGrjvyAOkYxcN3kSg-MffpCe8A-A4htBwJeq_9niqcCc9f9AR4doLswuu69B53BATWC_PvDn5sHDKRLDiVlvFY6RwXy2SuBG5OILPpNEX12BwCaJhrClbAoHfbabxYQZw";
const DEVICE_ID = "ae6c27c17c6fb3ffae4653c2ec6503c6";
const DEVICE_KEY = "01fb64dbb5224ee9f38551ed33d9f58e24017c810a8e7abb825e0169272533356b3f627108ce6e9cef34105f742cd37e45b34d6e52e972d3a0b0bd3862efeb7e6b4d263dedb2899274e6a3170da5ce22";

export async function GET() {
  const params = new URLSearchParams({
    from_city: "Dhaka",
    to_city: "Sylhet",
    date_of_journey: "31-Oct-2026",
    seat_class: "F_SEAT",
  });

  const url =
    "https://railspaapi.shohoz.com/v1.0/web/bookings/search-trips-v2?" +
    params.toString();

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${TOKEN}`,
        "x-device-id": DEVICE_ID,
        "x-device-key": DEVICE_KEY,
        "x-requested-with": "XMLHttpRequest",
      },
      cache: "no-store",
    });

    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    return NextResponse.json(
      {
        status: response.status,
        ok: response.ok,
        data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Railway API error:", error.message);

    return NextResponse.json(
      { error: "Could not connect to Railway API" },
      { status: 502 }
    );
  }
}
