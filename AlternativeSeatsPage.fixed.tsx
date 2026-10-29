"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";

import Link from "next/link";

import { useParams, useSearchParams } from "next/navigation";

import "./SingleTrain.css";

type SeatCounts = { online?: number; offline?: number };

type SeatType = {

  trip_id?: string | number;

  type?: string;

  fare?: string | number;

  seat_counts?: SeatCounts;

};

type Train = {

  trip_number?: string;

  train_model?: string | number;

  travel_time?: string;

  departure_date_time?: string;

  arrival_date_time?: string;

  departure_full_date?: string;

  origin_city_name?: string;

  destination_city_name?: string;

  seat_types?: SeatType[];

};

type RouteInfo = { from?: string; to?: string; date?: string };

type StoredAlternative = {

  route?: RouteInfo;

  train?: Train;

  trainId?: string | number;

};

type RouteStation = {

  id: string;

  name: string;

  sequence: number;

};

type SeatClassResult = {

  type: string;

  online: number | null;

  fare?: string | number;

};

type Combination = {

  from: string;

  to: string;

  fromId?: string;

  toId?: string;

  availableCount: number | null;

  seatClasses: SeatClassResult[];

};

type ApiState = "idle" | "loading" | "success" | "error";

function objectOf(value: unknown): Record<string, unknown> | null {

  return value !== null && typeof value === "object"

    ? (value as Record<string, unknown>)

    : null;

}

function unwrap(value: unknown): unknown {

  let current = value;

  for (let i = 0; i < 5; i += 1) {

    const obj = objectOf(current);

    if (!obj) break;

    if (obj.data !== undefined) {

      current = obj.data;

      continue;

    }

    break;

  }

  return current;

}

function displayName(value?: string | number): string {

  if (value === undefined || value === null || value === "") return "Unknown";

  return String(value)

    .replace(/\_/g, " ")

    .replace(/\b\w/g, (letter) => letter.toUpperCase());

}

function formatDate(value?: string): string {

  if (!value) return "Date not provided";

  const datePart = value.includes("T") ? value.split("T")[0] : value;

  const parsed = new Date(`${datePart}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) return value;

  return new Intl.DateTimeFormat("en-BD", {

    weekday: "short",

    day: "2-digit",

    month: "short",

    year: "numeric",

  }).format(parsed);

}

function formatTime(value?: string): string {

  if (!value) return "—";

  const parts = value.split(", ");

  return parts[parts.length - 1] || value;

}

function money(value?: string | number): string {

  if (value === undefined || value === null || value === "") return "—";

  const amount = Number(value);

  if (!Number.isFinite(amount)) return String(value);

  return new Intl.NumberFormat("en-BD", {

    style: "currency",

    currency: "BDT",

    maximumFractionDigits: 0,

  }).format(amount);

}

function getArray(obj: Record<string, unknown> | null, keys: string[]): unknown[] {

  if (!obj) return [];

  for (const key of keys) {

    if (Array.isArray(obj[key])) return obj[key] as unknown[];

  }

  return [];

}

function normalizeStation(item: unknown, index: number): RouteStation | null {

  const obj = objectOf(item);

  if (!obj) return null;

  const name = String(

    obj.station_name ?? obj.city_name ?? obj.location_name ?? obj.name ?? ""

  );

  if (!name) return null;

  const id = String(obj.station_id ?? obj.city_id ?? obj.location_id ?? obj.id ?? name);

  const seq = Number(obj.city_sequence ?? obj.station_sequence ?? obj.sequence ?? obj.order ?? index);

  return { id, name, sequence: Number.isFinite(seq) ? seq : index };

}

function normalizeSeatClass(item: unknown): SeatClassResult | null {

  const obj = objectOf(item);

  if (!obj) return null;

  const type = String(obj.type ?? obj.seat_type ?? obj.class_name ?? obj.name ?? "");

  if (!type) return null;

  const counts = objectOf(obj.seat_counts ?? obj.counts ?? obj.availability);

  const rawOnline = counts?.online ?? obj.available_seats ?? obj.available_count ?? obj.seats_available;

  const online = rawOnline === undefined || rawOnline === null || rawOnline === "" ? null : Number(rawOnline);

  return {

    type,

    online: online !== null && Number.isFinite(online) ? Math.max(0, online) : null,

    fare: (obj.fare ?? obj.price) as string | number | undefined,

  };

}

function normalizeCombination(item: unknown): Combination | null {

  const obj = objectOf(item);

  if (!obj) return null;

  const from = String(obj.from_station_name ?? obj.from_city_name ?? obj.from_name ?? obj.from ?? obj.origin ?? "");

  const to = String(obj.to_station_name ?? obj.to_city_name ?? obj.to_name ?? obj.to ?? obj.destination ?? "");

  if (!from || !to) return null;

  const rawClasses = getArray(obj, ["seat_types", "seat_classes", "classes", "availability"])

    .map(normalizeSeatClass)

    .filter((seat): seat is SeatClassResult => Boolean(seat));

  const rawCount = obj.available_count ?? obj.available_seats ?? obj.online_seats ?? obj.total_available_seats;

  const count = rawCount === undefined || rawCount === null || rawCount === "" ? null : Number(rawCount);

  const classCounts = rawClasses.map((seat) => seat.online).filter((n): n is number => n !== null);

  const availableCount = count !== null && Number.isFinite(count)

    ? Math.max(0, count)

    : classCounts.length > 0

      ? classCounts.reduce((sum, n) => sum + n, 0)

      : null;

  return {

    from,

    to,

    fromId: String(obj.from_station_id ?? obj.from_city_id ?? obj.from_id ?? "") || undefined,

    toId: String(obj.to_station_id ?? obj.to_city_id ?? obj.to_id ?? "") || undefined,

    availableCount,

    seatClasses: rawClasses,

  };

}

function extractRouteData(payload: unknown): { stations: RouteStation[]; combinations: Combination[] } {

  const root = objectOf(unwrap(payload));

  if (!root) return { stations: [], combinations: [] };

  const stations = getArray(root, ["stations", "route_stations", "cities", "stops", "station_list"])

    .map(normalizeStation)

    .filter((station): station is RouteStation => Boolean(station))

    .sort((a, b) => a.sequence - b.sequence);

  const combinations = getArray(root, ["combinations", "segments", "journeys", "results", "available_routes"])

    .map(normalizeCombination)

    .filter((combination): combination is Combination => Boolean(combination));

  return { stations, combinations };

}

function seatClassLabel(value: string): string {

  const labels: Record<string, string> = {

    S_CHAIR: "Shovon Chair",

    SHOVAN: "Shovon",

    SNIGDHA: "Snigdha",

    F_SEAT: "First Seat",

    F_CHAIR: "First Chair",

    AC_S: "AC Seat",

    AC_B: "AC Berth",

    AC_CHAIR: "AC Chair",

    F_BERTH: "First Berth",

  };

  return labels[value] ?? displayName(value);

}

function AlternativeSeatsContent() {

  const params = useParams<{ trainId: string }>();

  const searchParams = useSearchParams();

  const pathTrainId = String(params?.trainId ?? "");

  const queryFrom = searchParams.get("from") ?? "";

  const queryTo = searchParams.get("to") ?? "";

  const queryDate = searchParams.get("date") ?? "";

  const queryRouteId = searchParams.get("routeId") ?? "";

  const [stored, setStored] = useState<StoredAlternative | null>(null);

  const [loadedStored, setLoadedStored] = useState(false);

  const [apiState, setApiState] = useState<ApiState>("idle");

  const [apiMessage, setApiMessage] = useState("");

  const [stations, setStations] = useState<RouteStation[]>([]);

  const [combinations, setCombinations] = useState<Combination[]>([]);

  const [fromFilter, setFromFilter] = useState("all");

  const [toFilter, setToFilter] = useState("all");

  const [availableOnly, setAvailableOnly] = useState(false);

  const [searchText, setSearchText] = useState("");

  useEffect(() => {

    try {

      const raw = sessionStorage.getItem("railkhoj-alternative-search");

      if (raw) setStored(JSON.parse(raw) as StoredAlternative);

    } catch {

      setStored(null);

    } finally {

      setLoadedStored(true);

    }

  }, []);

  const train = stored?.train;

  const from = displayName(queryFrom || stored?.route?.from || train?.origin_city_name);

  const to = displayName(queryTo || stored?.route?.to || train?.destination_city_name);

  const date = queryDate || stored?.route?.date || train?.departure_full_date || "";

  const trainId = pathTrainId || String(stored?.trainId ?? train?.seat_types?.[0]?.trip_id ?? train?.train_model ?? "");

  const loadRouteData = useCallback(async () => {

    if (!trainId) {

      setApiState("error");

      setApiMessage("Train information is missing. Return to search results and choose a train again.");

      return;

    }

    setApiState("loading");

    setApiMessage("");

    try {

      const params = new URLSearchParams({ trainId });

      if (queryFrom || stored?.route?.from) params.set("from", queryFrom || stored?.route?.from || "");

      if (queryTo || stored?.route?.to) params.set("to", queryTo || stored?.route?.to || "");

      if (date) params.set("date", date);

      if (queryRouteId) params.set("routeId", queryRouteId);

      const response = await fetch(`/api/train-route?${params.toString()}`, { cache: "no-store" });

      const payload: unknown = await response.json();

      const root = objectOf(payload);

      if (!response.ok || root?.ok === false || root?.error) {

        const message = String(root?.error ?? "Unable to load this train's route information.");

        throw new Error(message);

      }

      const parsed = extractRouteData(payload);

      setStations(parsed.stations);

      setCombinations(parsed.combinations);

      if (parsed.stations.length === 0 && parsed.combinations.length === 0) {

        setApiState("error");

        setApiMessage("The route API responded, but its response did not include station or seat-combination data in a recognized format.");

        return;

      }

      setApiState("success");

      if (parsed.combinations.length === 0) {

        setApiMessage("Route stations loaded. Segment-wise seat counts will appear when the API returns combination availability.");

      }

    } catch (error) {

      setApiState("error");

      setApiMessage(error instanceof Error ? error.message : "Could not connect to the route service.");

    }

  }, [trainId, queryFrom, queryTo, queryRouteId, date, stored]);

  useEffect(() => {

    if (loadedStored) void loadRouteData();

  }, [loadedStored, loadRouteData]);

  const filteredCombinations = useMemo(() => {

    const query = searchText.trim().toLocaleLowerCase();

    return combinations.filter((item) => {

      const fromOk = fromFilter === "all" || item.fromId === fromFilter || item.from === fromFilter;

      const toOk = toFilter === "all" || item.toId === toFilter || item.to === toFilter;

      const availableOk = !availableOnly || (item.availableCount !== null && item.availableCount > 0);

      const searchOk = !query || `${item.from} ${item.to} ${item.seatClasses.map((seat) => seat.type).join(" ")}`.toLocaleLowerCase().includes(query);

      return fromOk && toOk && availableOk && searchOk;

    });

  }, [combinations, fromFilter, toFilter, availableOnly, searchText]);

  const availableCombinationCount = combinations.filter((item) => item.availableCount !== null && item.availableCount > 0).length;

  const noSeatCombinationCount = combinations.filter((item) => item.availableCount === 0).length;

  const unknownCount = combinations.filter((item) => item.availableCount === null).length;

  if (!loadedStored) {

    return <main className="rk-alt"><div className="rk-alt__loading"><span className="rk-alt__spinner" />Loading selected train…</div></main>;

  }

  return (

    <main className="rk-alt">

      <header className="rk-alt__header">

        <Link href="/search" className="rk-alt__brand" aria-label="RailKhoj home">

          <span className="rk-alt__brand-mark" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="4" y="3" width="16" height="15" rx="4"/><path d="M7 8h10M7 12h10M8 18l-2 3m10-3 2 3"/></svg></span>

          <span><strong>RailKhoj</strong><small>Bangladesh Railway</small></span>

        </Link>

        <Link href="/search/results" className="rk-alt__back"><span aria-hidden="true">←</span> Back to train results</Link>

      </header>

      <section className="rk-alt__hero">

        <div className="rk-alt__hero-top">

          <div>

            <span className="rk-alt__eyebrow">ALTERNATIVE SEAT FINDER</span>

            <h1>Find seats along this train route</h1>

            <p>Explore station-to-station combinations to see whether a shorter journey has seats available.</p>

          </div>

          <div className="rk-alt__train-chip"><span className="rk-alt__train-chip-icon" aria-hidden="true">▤</span><span><small>SELECTED TRAIN</small><strong>{displayName(train?.trip_number || `Train ${trainId || pathTrainId || "—"}`)}</strong><em>ID: {trainId || pathTrainId || "—"}</em></span></div>

        </div>

        <div className="rk-alt__route-summary">

          <div><span>SEARCH ROUTE</span><strong>{from}</strong><small>Starting station</small></div>

          <span className="rk-alt__route-arrow" aria-hidden="true"><span />→<span /></span>

          <div><span>DESTINATION</span><strong>{to}</strong><small>Destination station</small></div>

          <div className="rk-alt__date"><span>JOURNEY DATE</span><strong>{formatDate(date)}</strong><small>{train?.travel_time ? `Direct journey · ${train.travel_time}` : "Selected journey"}</small></div>

        </div>

      </section>

      <section className="rk-alt__stats" aria-label="Availability summary">

        <article className="rk-alt__stat"><span className="rk-alt__stat-icon rk-alt__stat-icon--green">✓</span><div><strong>{apiState === "success" ? availableCombinationCount : "—"}</strong><span>Combinations with seats</span></div></article>

        <article className="rk-alt__stat"><span className="rk-alt__stat-icon rk-alt__stat-icon--red">×</span><div><strong>{apiState === "success" ? noSeatCombinationCount : "—"}</strong><span>Combinations sold out</span></div></article>

        <article className="rk-alt__stat"><span className="rk-alt__stat-icon rk-alt__stat-icon--neutral">↔</span><div><strong>{apiState === "success" ? combinations.length : "—"}</strong><span>Total combinations returned</span></div></article>

      </section>

      <section className="rk-alt__content">

        <div className="rk-alt__content-heading"><div><h2>Station combinations</h2><p>Seat counts are shown only when returned by the Railway API.</p></div><button type="button" className="rk-alt__refresh" onClick={() => void loadRouteData()} disabled={apiState === "loading"}><span aria-hidden="true">↻</span>{apiState === "loading" ? "Refreshing…" : "Refresh availability"}</button></div>

        {apiState === "loading" && <div className="rk-alt__notice rk-alt__notice--loading"><span className="rk-alt__spinner" />Loading route and availability data…</div>}

        {apiState === "error" && <div className="rk-alt__notice rk-alt__notice--error"><strong>Could not load alternative seats</strong><p>{apiMessage}</p><button type="button" onClick={() => void loadRouteData()}>Try again</button></div>}

        {apiState === "success" && apiMessage && <div className="rk-alt__notice rk-alt__notice--info"><span aria-hidden="true">ⓘ</span><p>{apiMessage}</p></div>}

        {stations.length > 0 && <div className="rk-alt__route-stations"><div><strong>Route stations</strong><span>{stations.length} stations received from the API</span></div><div className="rk-alt__station-track">{stations.map((station, index) => <span className="rk-alt__station-stop" key={`${station.id}-${index}`}><i />{displayName(station.name)}</span>)}</div></div>}

        <div className="rk-alt__filters">

          <label className="rk-alt__filter"><span>FROM STATION</span><select value={fromFilter} onChange={(event) => setFromFilter(event.target.value)}><option value="all">All starting stations</option>{stations.map((station) => <option key={station.id} value={station.id}>{displayName(station.name)}</option>)}</select></label>

          <label className="rk-alt__filter"><span>TO STATION</span><select value={toFilter} onChange={(event) => setToFilter(event.target.value)}><option value="all">All destination stations</option>{stations.map((station) => <option key={station.id} value={station.id}>{displayName(station.name)}</option>)}</select></label>

          <label className="rk-alt__filter rk-alt__filter--search"><span>SEARCH</span><input value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Search station or seat class" /></label>

          <label className="rk-alt__available-toggle"><input type="checkbox" checked={availableOnly} onChange={(event) => setAvailableOnly(event.target.checked)} /><span className="rk-alt__toggle-ui" /><span>Available only</span></label>

        </div>

        {apiState === "success" && combinations.length > 0 && <div className="rk-alt__result-caption">Showing <strong>{filteredCombinations.length}</strong> of <strong>{combinations.length}</strong> station combinations</div>}

        {apiState === "success" && combinations.length > 0 && filteredCombinations.length > 0 && <div className="rk-alt__combination-list">{filteredCombinations.map((item, index) => {

          const hasSeats = item.availableCount !== null && item.availableCount > 0;

          const soldOut = item.availableCount === 0;

          const status = hasSeats ? "available" : soldOut ? "sold" : "unknown";

          return <article className={`rk-alt__combination rk-alt__combination--${status}`} key={`${item.from}-${item.to}-${index}`}>

            <div className="rk-alt__combination-route"><div className="rk-alt__combination-station"><small>FROM</small><strong>{displayName(item.from)}</strong></div><div className="rk-alt__combination-line"><span /> <i aria-hidden="true">→</i> <span /></div><div className="rk-alt__combination-station rk-alt__combination-station--end"><small>TO</small><strong>{displayName(item.to)}</strong></div></div>

            <div className="rk-alt__combination-availability"><strong>{item.availableCount === null ? "—" : item.availableCount}</strong><span>{hasSeats ? "seats available" : soldOut ? "seats available" : "count unavailable"}</span></div>

            <span className={`rk-alt__status rk-alt__status--${status}`}>{hasSeats ? "SEATS AVAILABLE" : soldOut ? "NO SEATS" : "NOT REPORTED"}</span>

            {item.seatClasses.length > 0 && <div className="rk-alt__classes">{item.seatClasses.map((seat, seatIndex) => <div className={`rk-alt__class ${seat.online === null ? "rk-alt__class--unknown" : seat.online > 0 ? "rk-alt__class--available" : "rk-alt__class--sold"}`} key={`${seat.type}-${seatIndex}`}><div><strong>{seatClassLabel(seat.type)}</strong><small>{seat.type}</small></div><strong className="rk-alt__class-count">{seat.online === null ? "—" : seat.online}<small>{seat.online === 1 ? "seat" : "seats"}</small></strong><span>{seat.fare !== undefined ? money(seat.fare) : "Fare not returned"}</span></div>)}</div>}

          </article>;

        })}</div>}

        {apiState === "success" && combinations.length === 0 && <div className="rk-alt__empty"><span aria-hidden="true">⌕</span><h3>No station combinations returned yet</h3><p>The route information may be available, but the API response did not include segment-wise seat counts. Connect the route API to return each station pair and its seat-class availability.</p></div>}

        {apiState === "success" && combinations.length > 0 && filteredCombinations.length === 0 && <div className="rk-alt__empty"><span aria-hidden="true">⌕</span><h3>No matching combinations</h3><p>Try changing the station filters or turning off “Available only”.</p><button type="button" onClick={() => { setFromFilter("all"); setToFilter("all"); setAvailableOnly(false); setSearchText(""); }}>Clear filters</button></div>}

        <div className="rk-alt__footnote"><span aria-hidden="true">ⓘ</span><p>Availability can change at any time. A zero count means the API reported no online seats for that station combination at the time of the response. Confirm final availability on the official Bangladesh Railway booking service.</p></div>

      </section>

      <footer className="rk-alt__footer"><strong>RailKhoj</strong><span>Made for easier train journeys in Bangladesh.</span></footer>

    </main>

  );

}

export default function AlternativeSeatsPage() {
  return (
    <Suspense
      fallback={
        <main className="rk-alt">
          <div className="rk-alt__loading">
            <span className="rk-alt__spinner" />
            Loading selected train…
          </div>
        </main>
      }
    >
      <AlternativeSeatsContent />
    </Suspense>
  );
}
