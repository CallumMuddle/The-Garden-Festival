const EVENTS_URL = "data/events.json";
const TAGS_URL = "data/tags.json";

const searchInput = document.getElementById("search");
const tagBar = document.getElementById("tagBar");
const filterGroups = document.getElementById("filterGroups");
const eventsGroups = document.getElementById("events-groups");
const dateSelect = document.getElementById("dateSelect");

const filterDrawer = document.getElementById("filterDrawer");
const filterOverlay = document.getElementById("filterOverlay");
const closeFiltersBtn = document.getElementById("closeFilters");
const clearFiltersBtn = document.getElementById("clearFilters");
const applyFiltersBtn = document.getElementById("applyFiltersButton");

const DEFAULT_EVENTS_BG = "images/events/default-background.jpg";

let allEvents = [];
let tagsData = null;

let selectedTopTags = new Set();
let selectedDrawerTags = new Set();
let selectedDate = "all";

const FILTER_START = "2026-06-20";
const FILTER_END = "2026-07-05";

function formatChipDate(dateStr) {
  const date = new Date(`${dateStr}T12:00:00`);
  return {
    day: date.toLocaleDateString("en-GB", { day: "numeric" }),
    month: date.toLocaleDateString("en-GB", { month: "short" }),
    weekday: date.toLocaleDateString("en-GB", { weekday: "short" }),
  };
}

function formatEventDate(startDate, endDate) {
  const start = new Date(`${startDate}T12:00:00`);
  const end = new Date(`${endDate}T12:00:00`);

  const startText = start.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
  });

  const endText = end.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
  });

  return startDate === endDate ? startText : `${startText} – ${endText}`;
}

function buildDateRange(startStr, endStr) {
  const dates = [];
  const current = new Date(`${startStr}T12:00:00`);
  const end = new Date(`${endStr}T12:00:00`);

  while (current <= end) {
    dates.push(current.toISOString().split("T")[0]);
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

function eventMatchesDate(event, selectedDateValue) {
  if (selectedDateValue === "all") return true;

  const start = new Date(`${event.datetime.startDate}T00:00:00`);
  const end = new Date(`${event.datetime.endDate}T23:59:59`);
  const target = new Date(`${selectedDateValue}T12:00:00`);

  return target >= start && target <= end;
}

function eventMatchesSearch(event, term) {
  if (!term) return true;

  const haystack = [
    event.name,
    event.venue,
    event.location?.street,
    event.location?.postcode,
    event.location?.city,
    event.organiser?.name,
    event.snippet,
    event.details,
    ...(event.tags || []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(term.toLowerCase());
}

function eventMatchesTags(event) {
  const eventTags = event.tags || [];

  const matchesTop =
    selectedTopTags.size === 0 ||
    [...selectedTopTags].every((tag) => eventTags.includes(tag));

  const matchesDrawer =
    selectedDrawerTags.size === 0 ||
    [...selectedDrawerTags].every((tag) => eventTags.includes(tag));

  return matchesTop && matchesDrawer;
}

function getFilteredEvents() {
  const term = searchInput.value.trim();

  return allEvents.filter((event) => {
    return (
      eventMatchesSearch(event, term) &&
      eventMatchesTags(event) &&
      eventMatchesDate(event, selectedDate)
    );
  });
}

function renderDateDropdown() {
  if (!dateSelect) return;

  const range = buildDateRange(FILTER_START, FILTER_END);

  dateSelect.innerHTML = `
    <option value="all">All dates</option>
    ${range
      .map((dateStr) => {
        const date = new Date(`${dateStr}T12:00:00`);
        const label = date.toLocaleDateString("en-GB", {
          weekday: "short",
          day: "numeric",
          month: "short",
        });

        return `<option value="${dateStr}">${label}</option>`;
      })
      .join("")}
  `;

  dateSelect.value = selectedDate;
}

dateSelect?.addEventListener("change", () => {
  selectedDate = dateSelect.value;
  renderEvents();
});

function renderActiveFilters() {
  const el = document.getElementById("activeFilters");
  if (!el) return;

  const parts = [];

  if (selectedDate !== "all") {
    const d = new Date(selectedDate);
    parts.push(
      d.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
      }),
    );
  }

  parts.push(...selectedTopTags);
  parts.push(...selectedDrawerTags);

  const count = getFilteredEvents().length;

  if (parts.length === 0) {
    el.innerHTML = `Showing ${count} events`;
  } else {
    el.innerHTML = `Showing ${count} events · ${parts.join(" · ")}`;
  }
}

function clearAllTagFilters() {
  selectedTopTags.clear();
  selectedDrawerTags.clear();
}

function renderTopTags() {
  if (!tagsData || !tagBar) return;

  const topTags = tagsData.top || [];

  tagBar.innerHTML = topTags
    .map((tag) => {
      const isAll = tag === "All";
      const isFilters = tag === "Filters";
      const isActive = isAll
        ? selectedTopTags.size === 0 && selectedDrawerTags.size === 0
        : selectedTopTags.has(tag);

      return `
      <button class="tag-chip ${isActive ? "active" : ""}" data-tag="${tag}">
        ${
          isFilters
            ? `<img class="filter-icon" src="Web-Assets/tune_24dp_000000_FILL0_wght400_GRAD0_opsz24.svg" alt="">`
            : tag
        }
      </button>
    `;
    })
    .join("");

  tagBar.querySelectorAll(".tag-chip").forEach((button) => {
    button.addEventListener("click", () => {
      const tag = button.dataset.tag;

      if (tag === "Filters") {
        openFilters();
        return;
      }

      if (tag === "All") {
        clearAllTagFilters();
        renderTopTags();
        renderFilterGroups();
        renderEvents();
        return;
      }

      if (selectedTopTags.has(tag)) {
        selectedTopTags.delete(tag);
      } else {
        selectedTopTags.add(tag);
      }

      renderTopTags();
      renderEvents();
    });
  });
}

function renderFilterGroups() {
  if (!tagsData || !filterGroups) return;

  const groups = tagsData.groups || {};

  filterGroups.innerHTML = Object.entries(groups)
    .map(
      ([groupName, options]) => `
    <div class="filter-group">
      <h3>${groupName}</h3>
      <div class="filter-options">
        ${options
          .map(
            (option) => `
          <button
            type="button"
            class="tag-chip ${selectedDrawerTags.has(option) ? "active" : ""}"
            data-filter-tag="${option}">
            ${option}
          </button>
        `,
          )
          .join("")}
      </div>
    </div>
  `,
    )
    .join("");

  filterGroups.querySelectorAll("[data-filter-tag]").forEach((button) => {
    button.addEventListener("click", () => {
      const tag = button.dataset.filterTag;

      if (selectedDrawerTags.has(tag)) {
        selectedDrawerTags.delete(tag);
      } else {
        selectedDrawerTags.add(tag);
      }

      renderFilterGroups();
      renderTopTags();
      renderEvents();
    });
  });
}

function createEventCard(event) {
  const thumb = event.media?.thumbnail || "Web-Assets/Placeholder-image.png";

  const sortedTags = [...(event.tags || [])].sort((a, b) => {
    const order = { Free: 0, Paid: 0 };

    const aOrder = order[a] ?? 1;
    const bOrder = order[b] ?? 1;

    return aOrder - bOrder;
  });

  const tags = sortedTags
    .map((tag) => {
      const lower = tag.toLowerCase().replace(/\s+/g, "-");
      return `<span class="event-tag ${lower}">${tag}</span>`;
    })
    .join("");
  const dateText = formatEventDate(
    event.datetime.startDate,
    event.datetime.endDate,
  );

  const timeText =
    event.datetime.startTime && event.datetime.endTime
      ? `${event.datetime.startTime} – ${event.datetime.endTime}`
      : "";

  const locationParts = [event.venue, event.location?.city].filter(Boolean);

  return `
    <a href="event.html?id=${event.id}" class="event-card-link">
      <article class="event-card" data-bg="${event.media?.cover || DEFAULT_EVENTS_BG}">

        <div class="event-title-bar">${event.name}</div>

        <div class="event-thumbnail">
          <img 
            src="${thumb}" 
            alt="${event.name}"
            onerror="this.onerror=null;this.src='Web-Assets/Placeholder-image.png';"
          >
        </div>

        <div class="event-location">${locationParts.join(", ")}</div>

        <p class="event-snippet">${event.snippet || ""}</p>

        <div class="event-datetime">
          <strong>${dateText}</strong>
          ${timeText}
        </div>

        <div class="event-tags">${tags}</div>

      </article>
    </a>
  `;
}

function renderEvents() {
  if (!eventsGroups) return;

  const filtered = getFilteredEvents();

  renderActiveFilters();

  if (!filtered.length) {
    eventsGroups.innerHTML = `
      <div class="empty-state">
        <p>No events match your filters.</p>
        <button id="clearFiltersEmpty">Clear filters</button>
      </div>
    `;

    document.getElementById("clearFiltersEmpty").onclick = () => {
      clearAllTagFilters();
      selectedDate = "all";
      searchInput.value = "";

      renderTopTags();
      renderFilterGroups();
      renderDateDropdown();
      renderEvents();
    };

    return;
  }

  eventsGroups.innerHTML = `
    <div class="events-grid">
      ${filtered.map(createEventCard).join("")}
    </div>
  `;

  //setupEventCardBackgrounds();
}

function openFilters() {
  filterDrawer?.classList.add("open");
  filterOverlay?.classList.add("open");
  filterDrawer?.setAttribute("aria-hidden", "false");
  filterOverlay?.setAttribute("aria-hidden", "false");
}

function closeFilters() {
  filterDrawer?.classList.remove("open");
  filterOverlay?.classList.remove("open");
  filterDrawer?.setAttribute("aria-hidden", "true");
  filterOverlay?.setAttribute("aria-hidden", "true");
}

function renderActiveFilters() {
  const el = document.getElementById("activeFilters");
  if (!el) return;

  const parts = [];

  if (selectedDate !== "all") {
    const d = new Date(selectedDate);
    parts.push(
      d.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
      }),
    );
  }

  if (selectedTopTags.size > 0) {
    parts.push(...selectedTopTags);
  }

  if (selectedDrawerTags.size > 0) {
    parts.push(...selectedDrawerTags);
  }

  const count = getFilteredEvents().length;

  if (parts.length === 0) {
    el.innerHTML = `Showing ${count} events`;
  } else {
    el.innerHTML = `Showing ${count} events · ${parts.join(" · ")}`;
  }
}

closeFiltersBtn?.addEventListener("click", closeFilters);
filterOverlay?.addEventListener("click", closeFilters);

clearFiltersBtn?.addEventListener("click", () => {
  clearAllTagFilters();
  selectedDate = "all";
  if (searchInput) searchInput.value = "";

  renderTopTags();
  renderFilterGroups();
  renderActiveFilters();
  renderDateDropdown();
  renderEvents();
});

applyFiltersBtn?.addEventListener("click", () => {
  renderTopTags();
  renderFilterGroups();
  renderEvents();
  closeFilters();
});

searchInput?.addEventListener("input", renderEvents);

async function initEventsPage() {
  try {
    const [eventsRes, tagsRes] = await Promise.all([
      fetch(EVENTS_URL),
      fetch(TAGS_URL),
    ]);

    allEvents = await eventsRes.json();
    tagsData = await tagsRes.json();

    // ✅ ADD THIS
    setEventsBackground(DEFAULT_EVENTS_BG);

    renderDateDropdown();
    renderTopTags();
    renderFilterGroups();
    renderEvents();
  } catch (error) {
    console.error("Failed to load events page data:", error);
    if (eventsGroups) {
      eventsGroups.innerHTML = `<p>Sorry, the events could not be loaded.</p>`;
    }
  }
}

function setEventsBackground(imageUrl = DEFAULT_EVENTS_BG) {
  document.body.classList.add("events-bg");

  // set next image
  document.body.style.setProperty(
    "--events-bg-image-next",
    `url("${imageUrl}")`,
  );

  // trigger fade
  document.body.classList.add("fade-bg");

  // after animation, swap images
  setTimeout(() => {
    document.body.style.setProperty("--events-bg-image", `url("${imageUrl}")`);
    document.body.classList.remove("fade-bg");
  }, 600);
}

function setupEventCardBackgrounds() {
  if (window.innerWidth < 768) return;

  document.querySelectorAll(".event-card").forEach((card) => {
    card.addEventListener("mouseenter", () => {
      const bg = card.dataset.bg;
      if (bg) setEventsBackground(bg);
    });

    card.addEventListener("mouseleave", () => {
      setEventsBackground(DEFAULT_EVENTS_BG);
    });
  });
}
initEventsPage();
