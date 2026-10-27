
import { NextResponse } from "next/server";

const TOKEN = "Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6ImF0K2p3dCJ9.eyJuYmYiOjE3OTMxMTkwMjUsImV4cCI6MTc5MzE2MjIyNSwiaXNzIjoiaHR0cDovL3RyYWluLWlhbS5zaG9ob3ouY29tIiwiYXVkIjoic2hvaG96LmlhbS50cmFpbiIsImNsaWVudF9pZCI6InRyYWluLXRpY2tldC11c2VyIiwiY2xpZW50X3RlbmFudF9pZCI6IjY3YTUxNjNjLTU2NWQtNGNhMC1iMTE3LTg3YzcwMWY2NTRmOSIsImNsaWVudF92ZXJ0aWNhbF9pZCI6IjA2OGU4MDRmLTJkYjctNDQ4OS05OTYzLTc4OWZiN2UwMmJkZiIsInN1YiI6ImEzNzAzZDhhLTQ4ZTktNDJmYi1hNTI1LTJhNzM1ZjZhOTY5YSIsImF1dGhfdGltZSI6MTc5MzExOTAyNSwiaWRwIjoibG9jYWwiLCJwaG9uZV9udW1iZXIiOiIwMTcxNTEwMzYwNiIsImVtYWlsIjoia2F3c2FyYWhtZWQuZGV2QGdtYWlsLmNvbSIsInVzZXJuYW1lIjoiMDE3MTUxMDM2MDYiLCJkaXNwbGF5X25hbWUiOiJLQVdTQVIgQUhNRUQiLCJsb2NhbGUiOiJibi1CRCIsIm5pZG4iOiI3MzUxNjc3NzU3IiwibmlkbnQiOiJOSUQiLCJyb2xlIjpbInVzZXIiLCJhbm9ueW1vdXMiXSwic2NvcGUiOlsic2hvaG96LmlhbS50cmFpbiIsIm9mZmxpbmVfYWNjZXNzIl0sImFtciI6WyJwd2QiXX0.UNKhMZABtG7c4dxMkF6_BaWCO452bDOydIQXYc4mRU3vU0mSXCXWVV7W9iPGDRNgtp9BxjesObYXajtkkQHRBQ97bTO6qEYDrFz9A8lAmZt5R6p36RFKIExDxTvUhqOgD4KXZPddejIV1ynYr8B8mv5ksDK5Q6fzrZQRXp8z_YX1JpJTdabAz83trVpHkX8VYV6uAw38jw9BMAY4qGAn7poy7QWNRccpv-MRQ9G8d331ogRruxSkYZThwjSvTo0JsYzpzHshJgo-cMCwHBZO8cOTjHJoal4tXoL2p9d4vHv5tCRNkOuMuxtt5q5GhlgoV-zsNNIIJPp6ynmDHjiDNw";
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
