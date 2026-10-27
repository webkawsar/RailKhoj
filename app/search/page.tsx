
"use client";

import { useEffect, useState, type FormEvent } from "react";
import StationAutocomplete, {
  type RailwayCity,
} from "@/components/search/StationAutocomplete";
import "./SearchForm.css";

export default function SearchPage() {
  // Station selection: no default values
  const [fromStation, setFromStation] =
    useState<RailwayCity | null>(null);

  const [toStation, setToStation] =
    useState<RailwayCity | null>(null);

  // Empty station inputs initially
  const [fromInput, setFromInput] = useState("");
  const [toInput, setToInput] = useState("");

  const [journeyDate, setJourneyDate] = useState("");
  const [message, setMessage] = useState("");
  const [minDate, setMinDate] = useState("");
  const [maxDate, setMaxDate] = useState("");

  // Allow journey dates from today through the next 10 days
  useEffect(() => {
    function formatDate(date: Date): string {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");

      return `${year}-${month}-${day}`;
    }

    const today = new Date();

    const lastAllowedDate = new Date(today);
    lastAllowedDate.setDate(lastAllowedDate.getDate() + 10);

    setMinDate(formatDate(today));
    setMaxDate(formatDate(lastAllowedDate));
  }, []);

  // Swap starting and destination stations
  function handleSwapStations() {
    setFromStation(toStation);
    setToStation(fromStation);

    setFromInput(toInput);
    setToInput(fromInput);

    setMessage("");
  }

  // Check whether the form is ready for submission
  const isSearchReady =
    fromStation !== null &&
    toStation !== null &&
    fromStation.city_id !== toStation.city_id &&
    journeyDate !== "" &&
    minDate !== "" &&
    maxDate !== "" &&
    journeyDate >= minDate &&
    journeyDate <= maxDate;

  // Validate the search form
  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!fromStation || !toStation || !journeyDate) {
      setMessage(
        "Please select a valid starting station, destination, and journey date."
      );
      return;
    }

    if (fromStation.city_id === toStation.city_id) {
      setMessage(
        "Starting and ending stations cannot be the same."
      );
      return;
    }

    if (
      !minDate ||
      !maxDate ||
      journeyDate < minDate ||
      journeyDate > maxDate
    ) {
      setMessage(
        "Journey date must be between today and the next 10 days."
      );
      return;
    }

    // These values will be used for Railway search API integration
    console.log("Railway search details:", {
      from_city_id: fromStation.city_id,
      from_city_name: fromStation.city_name,
      to_city_id: toStation.city_id,
      to_city_name: toStation.city_name,
      date_of_journey: journeyDate,
    });

    setMessage(
      "Your search details are valid. Railway search API integration is pending."
    );
  }

  return (
    <main className="rail-search">
      {/* Header */}
      <header className="rail-search__header">
        <a href="/search" className="rail-search__brand">
          <span
            className="rail-search__brand-icon"
            aria-hidden="true"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <rect x="4" y="3" width="16" height="15" rx="4" />
              <path d="M7 8h10M7 12h10M8 18l-2 3m10-3 2 3M8 15h.01M16 15h.01" />
            </svg>
          </span>

          <span>
            <strong>RailKhoj</strong>
            <small>Bangladesh Railway</small>
          </span>
        </a>

        <div className="rail-search__secure">
          <span className="rail-search__secure-dot" />
          Railway Seat Finder
        </div>
      </header>

      {/* Hero Section */}
      <section className="rail-search__hero">
        <div className="rail-search__hero-content">
          <span className="rail-search__eyebrow">
            YOUR JOURNEY STARTS HERE
          </span>

          <h1>
            Find your next
            <br />
            <span>train journey.</span>
          </h1>

          <p>
            Search your route, choose your travel date, and get ready
            for your next journey across Bangladesh.
          </p>

          <div className="rail-search__features">
            <span>
              <span aria-hidden="true">✓</span> Simple route search
            </span>

            <span>
              <span aria-hidden="true">✓</span> Easy date selection
            </span>
          </div>
        </div>

        {/* Train Illustration */}
        <div
          className="rail-search__illustration"
          aria-hidden="true"
        >
          <div className="rail-search__sun" />

          <div className="rail-search__hill rail-search__hill--back" />

          <div className="rail-search__hill rail-search__hill--front" />

          <div className="rail-search__train">
            <div className="rail-search__train-window">
              <span />
              <span />
              <span />
            </div>

            <div className="rail-search__train-body" />

            <div className="rail-search__train-lights" />

            <div className="rail-search__train-wheel rail-search__train-wheel--one" />

            <div className="rail-search__train-wheel rail-search__train-wheel--two" />

            <div className="rail-search__train-wheel rail-search__train-wheel--three" />
          </div>

          <div className="rail-search__track" />
          <div className="rail-search__track-line" />
        </div>
      </section>

      {/* Search Panel */}
      <section className="rail-search__panel">
        <div className="rail-search__panel-heading">
          <div>
            <span className="rail-search__section-label">
              PLAN YOUR TRIP
            </span>

            <h2>Search train tickets</h2>
          </div>

          {/* <span className="rail-search__step">
            01 / SEARCH
          </span> */}
        </div>

        <form
          className="rail-search__form"
          onSubmit={handleSearch}
        >
          {/* Starting and Destination Stations */}
          <div className="rail-search__route">
            <StationAutocomplete
              label="FROM"
              placeholder="Starting station"
              inputValue={fromInput}
              onInputChange={(value) => {
                setFromInput(value);
                setFromStation(null);
                setMessage("");
              }}
              selectedCity={fromStation}
              onSelect={(city) => {
                setFromStation(city);
                setMessage("");
              }}
              fromOnly
            />

            {/* Swap Stations */}
            <button
              className="rail-search__swap"
              type="button"
              onClick={handleSwapStations}
              aria-label="Swap starting and ending stations"
              title="Swap stations"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                aria-hidden="true"
              >
                <path d="M7 7h13l-3-3m3 3-3 3M17 17H4l3 3m-3-3 3-3" />
              </svg>
            </button>

            <StationAutocomplete
              label="TO"
              placeholder="Destination station"
              inputValue={toInput}
              onInputChange={(value) => {
                setToInput(value);
                setToStation(null);
                setMessage("");
              }}
              selectedCity={toStation}
              onSelect={(city) => {
                setToStation(city);
                setMessage("");
              }}
            />
          </div>

          <div className="rail-search__divider" />

          {/* Journey Date and Search Button */}
          <div className="rail-search__bottom">
            <div className="rail-search__field rail-search__date-field">
              <label htmlFor="journeyDate">
                JOURNEY DATE
              </label>

              <div className="rail-search__input-wrap">
                <span
                  className="rail-search__field-icon"
                  aria-hidden="true"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <rect
                      x="3"
                      y="5"
                      width="18"
                      height="16"
                      rx="2"
                    />
                    <path d="M16 3v4M8 3v4M3 10h18" />
                  </svg>
                </span>

                <input
                  id="journeyDate"
                  name="journeyDate"
                  type="date"
                  min={minDate}
                  max={maxDate}
                  value={journeyDate}
                  onChange={(event) => {
                    setJourneyDate(event.target.value);
                    setMessage("");
                  }}
                  required
                />
              </div>

              {/* <small>Select your travel date (within 10 days)</small> */}
            </div>

            <button
              className="rail-search__submit"
              type="submit"
              disabled={!isSearchReady}
            >
              Search Trains

              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M5 12h14m-6-6 6 6-6 6" />
              </svg>
            </button>
          </div>

          {/* Validation / Status Message */}
          {message && (
            <p
              className="rail-search__message"
              role="status"
              aria-live="polite"
            >
              {message}
            </p>
          )}
        </form>

        {/* <p className="rail-search__note">
          <span aria-hidden="true">ⓘ</span>
          Train availability will be displayed after the Railway
          search API is connected.
        </p> */}
      </section>

      {/* Footer */}
      <footer className="rail-search__footer">
        <span>RailKhoj</span>
        <span>
          Made for easier train journeys in Bangladesh.
        </span>
      </footer>
    </main>
  );
}
