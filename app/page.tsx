
"use client";

import { useState } from "react";

export default function Home() {
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function checkApi() {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/railway", {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || `Server error: ${response.status}`
        );
      }

      setResult(result);

      if (!result.ok) {
        setError(`Railway API returned HTTP ${result.status}`);
      }
    } catch (err) {
      setError(err.message || "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        maxWidth: 900,
        margin: "40px auto",
        padding: 24,
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1>Bangladesh Railway API Test</h1>

      <p>
        Route: Dhaka → Sylhet
        <br />
        Journey Date: 31-Oct-2026
        <br />
        Seat Class: F_SEAT
      </p>

      <button
        type="button"
        onClick={checkApi}
        disabled={loading}
        style={{
          padding: "12px 20px",
          background: "#dc2626",
          color: "#fff",
          border: 0,
          borderRadius: 6,
          cursor: loading ? "wait" : "pointer",
        }}
      >
        {loading ? "Checking..." : "Check API"}
      </button>

      {error && (
        <p style={{ color: "#dc2626", marginTop: 20 }}>
          {error}
        </p>
      )}

      {result && (
        <section style={{ marginTop: 24 }}>
          <h2>API Response</h2>

          <p>
            <strong>Railway HTTP Status:</strong> {result.status}
          </p>

          <pre
            style={{
              padding: 16,
              background: "#f3f4f6",
              color: "#111827",
              borderRadius: 6,
              whiteSpace: "pre-wrap",
              overflowWrap: "anywhere",
              overflowX: "auto",
            }}
          >
            {JSON.stringify(result.data, null, 2)}
          </pre>
        </section>
      )}
    </main>
  );
}
