const EVENTS_URL = "data/events.json";
const TAGS_URL = "data/tags.json";

const dateSelect = document.getElementById("mapDateSelect");
const tagBar = document.getElementById("mapTagBar");
const activeFiltersEl = document.getElementById("mapActiveFilters");
const panel = document.getElementById("mapEventPanel");

let map;
let markersLayer;

let allEvents = [];
let tagsData = null;

let selectedDate = "all";
let selectedTags = new Set();

const FILTER_START = "2026-05-20";
const FILTER_END = "2026-07-05";

/* =========================
   DATE HELPERS
========================= */
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

function formatDateLabel(dateStr) {
  const d = new Date(`${dateStr}T12:00:00`);
  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

/* =========================
   FILTER LOGIC
========================= */
function eventMatchesDate(event) {
  if (selectedDate === "all") return true;

  const start = new Date(`${event.datetime.startDate}T00:00:00`);
  const end = new Date(`${event.datetime.endDate}T23:59:59`);
  const target = new Date(`${selectedDate}T12:00:00`);

  return target >= start && target <= end;
}

function eventMatchesTags(event) {
  if (selectedTags.size === 0) return true;

  const tags = event.tags || [];
  return [...selectedTags].every((t) => tags.includes(t));
}

function getFilteredEvents() {
  return allEvents.filter((e) => eventMatchesDate(e) && eventMatchesTags(e));
}

/* =========================
   RENDER DATE DROPDOWN
========================= */
function renderDateDropdown() {
  const range = buildDateRange(FILTER_START, FILTER_END);

  dateSelect.innerHTML = `
    <option value="all">All dates</option>
    ${range
      .map((d) => `<option value="${d}">${formatDateLabel(d)}</option>`)
      .join("")}
  `;

  dateSelect.value = selectedDate;
}

/* =========================
   TAG BAR
========================= */
function renderTags() {
  if (!tagsData) return;

  const topTags = tagsData.top || [];

  tagBar.innerHTML = topTags
    .map((tag) => {
      const isActive =
        tag === "All" ? selectedTags.size === 0 : selectedTags.has(tag);

      return `
        <button class="tag-chip ${isActive ? "active" : ""}" data-tag="${tag}">
          ${tag}
        </button>
      `;
    })
    .join("");

  tagBar.querySelectorAll(".tag-chip").forEach((btn) => {
    btn.onclick = () => {
      const tag = btn.dataset.tag;

      if (tag === "All") {
        selectedTags.clear();
      } else {
        if (selectedTags.has(tag)) {
          selectedTags.delete(tag);
        } else {
          selectedTags.add(tag);
        }
      }

      renderTags();
      updateMap();
    };
  });
}

/* =========================
   ACTIVE FILTER TEXT
========================= */
function renderActiveFilters() {
  const parts = [];

  if (selectedDate !== "all") {
    parts.push(formatDateLabel(selectedDate));
  }

  parts.push(...selectedTags);

  const count = getFilteredEvents().length;

  activeFiltersEl.innerHTML =
    parts.length === 0
      ? `Showing ${count} events`
      : `Showing ${count} events · ${parts.join(" · ")}`;
}

/* =========================
   MAP SETUP
========================= */
function initMap() {
  map = L.map("festivalMap").setView([51.0629, -1.3162], 13);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap",
  }).addTo(map);

  markersLayer = L.layerGroup().addTo(map);

  setTimeout(() => {
    map.invalidateSize();
  }, 200);
}

/* =========================
   MARKERS
========================= */
function updateMap() {
  markersLayer.clearLayers();

  const events = getFilteredEvents();

  renderActiveFilters();

  events.forEach((event) => {
    const lat = event.location?.lat;
    const lng = event.location?.lng;

    if (!lat || !lng) return;

    const marker = L.marker([lat, lng]).addTo(markersLayer);

    marker.on("click", () => {
      showEventPanel(event);
    });
  });
}

/* =========================
   SIDE PANEL
========================= */
function showEventPanel(event) {
  panel.classList.remove("hidden");

  const thumb = event.media?.thumbnail || "Web-Assets/Placeholder-image.png";

  const dateText =
    event.datetime.startDate === event.datetime.endDate
      ? event.datetime.startDate
      : `${event.datetime.startDate} – ${event.datetime.endDate}`;

  panel.innerHTML = `
    <img class="map-panel-image" src="${thumb}" alt="${event.name}" />

    <div class="map-panel-content">
      <h2 class="map-panel-title">${event.name}</h2>
      <p><strong>${event.venue || ""}</strong></p>
      <p>${dateText}</p>
      <p>${event.snippet || ""}</p>

      <a href="event.html?id=${event.id}" class="book-button">
        View event
      </a>
    </div>
  `;
}

/* =========================
   INIT
========================= */
async function initMapPage() {
  try {
    const [eventsRes, tagsRes] = await Promise.all([
      fetch(EVENTS_URL),
      fetch(TAGS_URL),
    ]);

    allEvents = await eventsRes.json();
    tagsData = await tagsRes.json();

    initMap();
    renderDateDropdown();
    renderTags();
    updateMap();
  } catch (err) {
    console.error("Map failed to load:", err);
  }
}

/* =========================
   EVENTS
========================= */
dateSelect?.addEventListener("change", () => {
  selectedDate = dateSelect.value;
  updateMap();
});

initMapPage();
