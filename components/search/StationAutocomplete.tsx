
"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

import railwayData from "@/data/railway-data.json";
import "./StationAutocomplete.css";

export type RailwayCity = {
  city_id: number;
  city_name: string;
  city_sequence: number;
  is_top_city: boolean;
  is_enable_for_from: number;
};

type StationAutocompleteProps = {
  label: string;
  placeholder: string;
  inputValue: string;
  onInputChange: (value: string) => void;
  selectedCity: RailwayCity | null;
  onSelect: (city: RailwayCity | null) => void;
  fromOnly?: boolean;
};

const cities = railwayData.cities as RailwayCity[];

function displayCityName(name: string) {
  return name.replace(/_/g, " ");
}

function normalize(value: string) {
  return value.replace(/_/g, " ").trim().toLocaleLowerCase();
}

export default function StationAutocomplete({
  label,
  placeholder,
  inputValue,
  onInputChange,
  selectedCity,
  onSelect,
  fromOnly = false,
}: StationAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside the component
  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  // Filter suggestions: station name must start with the typed text
  const suggestions = useMemo(() => {
    const eligibleCities = fromOnly
      ? cities.filter((city) => city.is_enable_for_from === 1)
      : cities;

    const searchText = normalize(inputValue);

    // Do not return suggestions for an empty input
    if (!searchText) {
      return [];
    }

    const matchingCities = eligibleCities.filter((city) =>
      normalize(city.city_name).startsWith(searchText)
    );

    return matchingCities.slice(0, 8);
  }, [inputValue, fromOnly]);

  // Select a station from the suggestions
  function chooseCity(city: RailwayCity) {
    onInputChange(displayCityName(city.city_name));
    onSelect(city);

    setIsOpen(false);
    setActiveIndex(0);
  }

  // Keyboard navigation
  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      if (suggestions.length === 0) return;

      event.preventDefault();
      setIsOpen(true);

      setActiveIndex((index) =>
        (index + 1) % suggestions.length
      );
    } else if (event.key === "ArrowUp") {
      if (suggestions.length === 0) return;

      event.preventDefault();
      setIsOpen(true);

      setActiveIndex((index) =>
        (index - 1 + suggestions.length) % suggestions.length
      );
    } else if (
      event.key === "Enter" &&
      isOpen &&
      suggestions.length > 0
    ) {
      event.preventDefault();

      chooseCity(
        suggestions[activeIndex] ?? suggestions[0]
      );
    } else if (event.key === "Escape") {
      setIsOpen(false);
    }
  }

  const listId = `rail-station-list-${label.toLowerCase()}`;

  return (
    <div
      className="rail-search__field rail-station"
      ref={wrapperRef}
    >
      <label>{label}</label>

      <div className="rail-search__input-wrap rail-station__input-wrap">
        <span
          className="rail-search__field-icon"
          aria-hidden="true"
        >
          {fromOnly ? (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <circle cx="12" cy="12" r="8" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
              <circle cx="12" cy="10" r="2.5" />
            </svg>
          )}
        </span>

        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-label={
            label === "FROM"
              ? "Starting station"
              : "Destination station"
          }
          aria-autocomplete="list"
          aria-expanded={
            isOpen &&
            inputValue.trim().length > 0 &&
            suggestions.length > 0
          }
          aria-controls={listId}
          placeholder={placeholder}
          value={inputValue}
          autoComplete="off"
          spellCheck={false}
          onFocus={() => {
            // Focus alone must not open suggestions
            if (inputValue.trim().length > 0) {
              setIsOpen(true);
            }
          }}
          onChange={(event) => {
            const value = event.target.value;

            onInputChange(value);
            onSelect(null);

            setActiveIndex(0);
            setIsOpen(value.trim().length > 0);
          }}
          onKeyDown={handleKeyDown}
        />

        {inputValue && (
          <button
            type="button"
            className="rail-station__clear"
            aria-label={`Clear ${label.toLowerCase()} station`}
            onClick={() => {
              onInputChange("");
              onSelect(null);

              setActiveIndex(0);
              setIsOpen(false);

              inputRef.current?.focus();
            }}
          >
            ×
          </button>
        )}
      </div>

      {isOpen && inputValue.trim().length > 0 && (
        <ul
          id={listId}
          className="rail-station__suggestions"
          role="listbox"
        >
          {suggestions.length > 0 ? (
            suggestions.map((city, index) => (
              <li
                key={city.city_id}
                role="option"
                aria-selected={
                  selectedCity?.city_id === city.city_id
                }
              >
                <button
                  type="button"
                  className={
                    index === activeIndex
                      ? "rail-station__option rail-station__option--active"
                      : "rail-station__option"
                  }
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => chooseCity(city)}
                >
                  <span
                    className="rail-station__option-icon"
                    aria-hidden="true"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
                      <circle cx="12" cy="10" r="2.5" />
                    </svg>
                  </span>

                  <span className="rail-station__option-name">
                    {displayCityName(city.city_name)}
                  </span>
                </button>
              </li>
            ))
          ) : (
            <li className="rail-station__empty">
              No matching stations found
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
