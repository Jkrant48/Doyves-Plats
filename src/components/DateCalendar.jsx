import { useState } from "react";

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function DateCalendar({
  selectedDate,
  onSelect,
  minDate,
  markedDates = [],
  label = "Choose a date",
}) {
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const initialDate = selectedDate ? parseDate(selectedDate) : new Date();
    return new Date(initialDate.getFullYear(), initialDate.getMonth(), 1);
  });
  const firstDay = new Date(
    visibleMonth.getFullYear(),
    visibleMonth.getMonth(),
    1,
  ).getDay();
  const daysInMonth = new Date(
    visibleMonth.getFullYear(),
    visibleMonth.getMonth() + 1,
    0,
  ).getDate();
  const today = formatDate(new Date());
  const earliestDate = minDate ? parseDate(minDate) : null;
  const markedDateSet = new Set(markedDates);
  const monthLabel = visibleMonth.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
  const previousMonth = new Date(
    visibleMonth.getFullYear(),
    visibleMonth.getMonth() - 1,
    1,
  );
  const canGoBack =
    !earliestDate ||
    previousMonth >= new Date(earliestDate.getFullYear(), earliestDate.getMonth(), 1);

  return (
    <div className="date-calendar" role="group" aria-label={label}>
      <div className="date-calendar-header">
        <button
          type="button"
          className="date-calendar-nav"
          aria-label="Previous month"
          disabled={!canGoBack}
          onClick={() => setVisibleMonth(previousMonth)}
        >
          &lsaquo;
        </button>
        <strong aria-live="polite">{monthLabel}</strong>
        <button
          type="button"
          className="date-calendar-nav"
          aria-label="Next month"
          onClick={() =>
            setVisibleMonth(
              new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1),
            )
          }
        >
          &rsaquo;
        </button>
      </div>
      <div className="date-calendar-grid" role="group" aria-label={monthLabel}>
        {weekdays.map((weekday) => (
          <span className="date-calendar-weekday" key={weekday}>
            {weekday}
          </span>
        ))}
        {Array.from({ length: firstDay + daysInMonth }, (_, index) => {
          if (index < firstDay) {
            return (
              <span
                className="date-calendar-empty"
                key={`empty-${index}`}
              />
            );
          }

          const day = index - firstDay + 1;
          const date = new Date(
            visibleMonth.getFullYear(),
            visibleMonth.getMonth(),
            day,
          );
          const dateValue = formatDate(date);
          const isSunday = date.getDay() === 0;
          const isBeforeMinimum = earliestDate && date < earliestDate;
          const isDisabled = isSunday || isBeforeMinimum;
          const isSelected = dateValue === selectedDate;
          const isMarked = markedDateSet.has(dateValue);

          return (
            <button
              className={[
                "date-calendar-day",
                isSelected ? "selected" : "",
                isMarked ? "marked" : "",
                dateValue === today ? "today" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              key={dateValue}
              type="button"
              aria-label={`${date.toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}${isSunday ? ", unavailable on Sundays" : ""}${isMarked ? ", has an availability override" : ""}`}
              aria-pressed={isSelected}
              disabled={isDisabled}
              onClick={() => onSelect(dateValue)}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default DateCalendar;
