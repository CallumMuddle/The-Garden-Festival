const EVENTS_URL = "data/events.json";

const galleryGrid = document.getElementById("galleryGrid");
const gallerySearch = document.getElementById("gallerySearch");

let galleryItems = [];

function buildGalleryItems(events) {
  const items = [];

  events.forEach((event) => {
    const images = event.media?.gallery?.length
      ? event.media.gallery
      : event.media?.cover
        ? [event.media.cover]
        : event.media?.thumbnail
          ? [event.media.thumbnail]
          : [];

    images.forEach((src, index) => {
      items.push({
        id: `${event.id}-${index}`,
        eventId: event.id,
        eventName: event.name,
        venue: event.venue || "",
        image: src,
        alt: `${event.name} gallery image ${index + 1}`,
      });
    });
  });

  return items;
}

function renderGallery(items) {
  if (!galleryGrid) return;

  if (!items.length) {
    galleryGrid.innerHTML = `
      <div class="empty-state">
        <p>No gallery images match your search.</p>
      </div>
    `;
    return;
  }

  galleryGrid.innerHTML = items
    .map(
      (item) => `
        <article class="gallery-card">
          <button
            class="gallery-image-button"
            type="button"
            data-image="${item.image}"
            data-alt="${item.alt}">
            <img
              src="${item.image}"
              alt="${item.alt}"
              loading="lazy"
              onerror="this.onerror=null;this.src='Web-Assets/Placeholder-image.png';"
            >
          </button>

          <div class="gallery-card-body">
            <h3>${item.eventName}</h3>
            <p>${item.venue}</p>
            <a class="gallery-event-link" href="event.html?id=${item.eventId}">
              View event
            </a>
          </div>
        </article>
      `,
    )
    .join("");

  setupGalleryLightbox();
}

function filterGallery() {
  const term = gallerySearch?.value.trim().toLowerCase() || "";

  if (!term) {
    renderGallery(galleryItems);
    return;
  }

  const filtered = galleryItems.filter((item) => {
    return (
      item.eventName.toLowerCase().includes(term) ||
      item.venue.toLowerCase().includes(term)
    );
  });

  renderGallery(filtered);
}

function setupGalleryLightbox() {
  const buttons = document.querySelectorAll(".gallery-image-button");
  const lightbox = document.getElementById("galleryLightbox");
  const lightboxContent = document.getElementById("galleryLightboxContent");
  const lightboxClose = document.getElementById("galleryLightboxClose");
  const lightboxBackdrop = document.getElementById("galleryLightboxBackdrop");

  if (!lightbox || !lightboxContent || !lightboxClose || !lightboxBackdrop)
    return;

  function openLightbox(imageSrc, altText) {
    lightboxContent.innerHTML = `<img src="${imageSrc}" alt="${altText}">`;
    lightbox.classList.remove("hidden");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    lightbox.classList.add("hidden");
    lightbox.setAttribute("aria-hidden", "true");
    lightboxContent.innerHTML = "";
    document.body.style.overflow = "";
  }

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      openLightbox(button.dataset.image, button.dataset.alt || "Gallery image");
    });
  });

  lightboxClose.onclick = closeLightbox;

  lightboxBackdrop.onclick = (event) => {
    if (event.target === lightboxBackdrop) {
      closeLightbox();
    }
  };

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !lightbox.classList.contains("hidden")) {
      closeLightbox();
    }
  });
}

async function initGalleryPage() {
  try {
    const response = await fetch(EVENTS_URL);
    const events = await response.json();

    galleryItems = buildGalleryItems(events);
    renderGallery(galleryItems);
  } catch (error) {
    console.error("Failed to load gallery:", error);
    if (galleryGrid) {
      galleryGrid.innerHTML = `<p>Sorry, the gallery could not be loaded.</p>`;
    }
  }
}

gallerySearch?.addEventListener("input", filterGallery);

initGalleryPage();
