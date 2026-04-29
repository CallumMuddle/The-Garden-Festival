const openButton = document.getElementById("open-sidebar-button");
const closeButton = document.getElementById("close-sidebar-button");
const navbar = document.getElementById("navbar");
const overlay = document.getElementById("overlay");

const media = window.matchMedia("(width < 800px)");

function updateNavbar(e) {
  const isMobile = e.matches;

  if (isMobile) {
    navbar.setAttribute("inert", "");
  } else {
    navbar.removeAttribute("inert");
    navbar.classList.remove("show");
    openButton?.setAttribute("aria-expanded", "false");
  }
}

function openSidebar() {
  navbar.classList.add("show");
  openButton?.setAttribute("aria-expanded", "true");
  navbar.removeAttribute("inert");
}

function closeSidebar() {
  navbar.classList.remove("show");
  openButton?.setAttribute("aria-expanded", "false");

  if (media.matches) {
    navbar.setAttribute("inert", "");
  }
}

openButton?.addEventListener("click", openSidebar);
closeButton?.addEventListener("click", closeSidebar);
overlay?.addEventListener("click", closeSidebar);

media.addEventListener("change", updateNavbar);
updateNavbar(media);

const EVENTS_URL = "data/events.json";

// 👇 YOU CONTROL THIS
const FEATURED_IDS = [
  "swedish-midsommar-celebration-06-19",
  "opera-in-the-garden-06-21",
  "market-garden-dinner-07-03",
];

async function loadFeaturedEvents() {
  try {
    const res = await fetch(EVENTS_URL);
    const events = await res.json();

    const featured = events.filter((e) => FEATURED_IDS.includes(e.id));

    renderFeatured(featured);
  } catch (err) {
    console.error("Failed to load featured events", err);
  }
}
function createFeaturedCard(event) {
  const thumb = event.media?.thumbnail || "Web-Assets/Placeholder-image.png";

  const date = new Date(event.datetime.startDate).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });

  return `
    <a href="event.html?id=${event.id}" class="event-card-link">
      <article class="event-card">
        <img src="${thumb}" alt="${event.name}">
        <h3>${event.name}</h3>
        <p>${event.venue}</p>
        <div class="event-date">${date}</div>
      </article>
    </a>
  `;
}
function renderFeatured(events) {
  const container = document.getElementById("featuredGrid");
  if (!container) return;

  container.innerHTML = events.map(createFeaturedCard).join("");
}
loadFeaturedEvents();
