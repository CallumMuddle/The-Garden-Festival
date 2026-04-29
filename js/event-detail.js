const EVENTS_URL = "data/events.json";
const PLACEHOLDER_IMAGE = "Web-Assets/Placeholder-image.png";
const root = document.getElementById("event-detail-root");

/* ==============================
   FORMAT HELPERS
============================== */

function getEventIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

function formatDate(dateString, options) {
  return new Date(`${dateString}T12:00:00`).toLocaleDateString(
    "en-GB",
    options,
  );
}

function formatLongDate(startDate, endDate) {
  const options = {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  };

  const startText = formatDate(startDate, options);
  const endText = formatDate(endDate, options);

  return startDate === endDate ? startText : `${startText} – ${endText}`;
}

function formatTopMetaDate(startDate, endDate) {
  const options = {
    day: "numeric",
    month: "long",
    year: "numeric",
  };

  const startText = formatDate(startDate, options);
  const endText = formatDate(endDate, options);

  return startDate === endDate ? startText : `${startText} – ${endText}`;
}

function formatTimeRange(startTime, endTime) {
  if (!startTime && !endTime) return "Time to be confirmed";
  if (startTime && endTime) return `${startTime} - ${endTime}`;
  return startTime || endTime;
}

function buildAddress(location = {}) {
  return [location.street, location.postcode, location.city]
    .filter(Boolean)
    .join(", ");
}

/* ==============================
   RENDER HELPERS
============================== */

function renderTags(tags = [], event = null) {
  const eventTags = [...tags];

  if (event?.cost?.type === "free" && !eventTags.includes("Free")) {
    eventTags.unshift("Free");
  }

  if (event?.cost?.type === "paid" && !eventTags.includes("Paid")) {
    eventTags.unshift("Paid");
  }

  if (event?.cost?.type === "mixed" && !eventTags.includes("Mixed")) {
    eventTags.unshift("Mixed");
  }

  const sortedTags = eventTags.sort((a, b) => {
    const order = {
      Free: 0,
      Paid: 0,
      Mixed: 0,
    };

    return (order[a] ?? 1) - (order[b] ?? 1);
  });

  return sortedTags
    .map((tag) => {
      const className = tag.toLowerCase().replace(/\s+/g, "-");
      return `<span class="event-tag ${className}">${tag}</span>`;
    })
    .join("");
}
function renderBookButton(booking, eventId) {
  if (!booking || booking === "#") {
    return `<button class="book-button" type="button" disabled>Booking details coming soon</button>`;
  }

  if (typeof booking === "string") {
    return `
      <a class="book-button" href="${booking}" target="_blank" rel="noopener noreferrer">
        Book Tickets
      </a>
    `;
  }

  if (booking.type === "eventbrite" && booking.eventbriteId) {
    const buttonId = `eventbrite-widget-modal-trigger-${eventId}`;

    return `
      <button
        id="${buttonId}"
        class="book-button eventbrite-button"
        type="button">
        Book Tickets
      </button>
    `;
  }

  return `<button class="book-button" type="button" disabled>Booking details coming soon</button>`;
}

function renderOrganiserContacts({ organiserName, website, phone, email }) {
  const hasOrganiserContacts = organiserName || website || phone || email;

  if (!hasOrganiserContacts) return "";

  return `
    <section class="event-panel">
      <h2>Organiser contacts</h2>

      <div class="side-info">
        ${
          organiserName
            ? `
          <div class="side-info-block">
            <span class="side-info-label">Organiser</span>
            <div class="side-info-value">${organiserName}</div>
          </div>
        `
            : ""
        }

        ${
          website
            ? `
          <div class="side-info-block">
            <span class="side-info-label">Website</span>
            <div class="side-info-value">
              <a href="${website}" target="_blank" rel="noopener noreferrer">${website}</a>
            </div>
          </div>
        `
            : ""
        }

        ${
          phone
            ? `
          <div class="side-info-block">
            <span class="side-info-label">Phone</span>
            <div class="side-info-value">
              <a href="tel:${phone}">${phone}</a>
            </div>
          </div>
        `
            : ""
        }

        ${
          email
            ? `
          <div class="side-info-block">
            <span class="side-info-label">Email</span>
            <div class="side-info-value">
              <a href="mailto:${email}">${email}</a>
            </div>
          </div>
        `
            : ""
        }
      </div>
    </section>
  `;
}

/* ==============================
   MAIN EVENT RENDER
============================== */

function renderEventPage(event) {
  const thumbnail = event.media?.thumbnail || "";
  const coverImage = event.media?.cover || "";
  const galleryImages = event.media?.gallery || [];

  const gallery = [thumbnail, coverImage, ...galleryImages]
    .filter(Boolean)
    .filter((image, index, array) => array.indexOf(image) === index);

  if (!gallery.length) {
    gallery.push(PLACEHOLDER_IMAGE);
  }

  const cover = coverImage || thumbnail || gallery[0] || PLACEHOLDER_IMAGE;

  document.body.classList.add("event-bg");
  document.body.style.setProperty("--event-bg-image", `url("${cover}")`);
  console.log("Background image:", cover);
  const address = buildAddress(event.location);
  const mapsQuery = encodeURIComponent(address || event.venue || event.name);

  const timeText = formatTimeRange(
    event.datetime.startTime,
    event.datetime.endTime,
  );

  const longDate = formatLongDate(
    event.datetime.startDate,
    event.datetime.endDate,
  );

  const topDate = formatTopMetaDate(
    event.datetime.startDate,
    event.datetime.endDate,
  );

  const organiserName = event.organiser?.name || "";
  const website = event.organiser?.website || "";
  const email = event.organiser?.email || "";
  const phone = event.organiser?.phone || "";

  const bookingUrl = event.booking || event.bookingUrl || "";
  const panoramaUrl = event.media?.panorama || "";

  const mapsEmbedUrl = `https://www.google.com/maps?q=${mapsQuery}&output=embed`;
  const mapsLinkUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;

  document.title = `${event.name} | Winchester Garden Festival`;

  root.innerHTML = `
    <div class="event-detail-page">
      <a class="event-back-link" href="events.html">← Back to events</a>

      <section class="event-top">
        <div class="event-title-bar large">${event.name}</div>

        <div class="event-top-meta">
          <span>${topDate}</span>
          <span>|</span>
          <span>${timeText}</span>
        </div>
      </section>

      <section class="event-split-hero">
        <div class="event-split-media">
          <div class="event-hero-media">
            <button class="media-arrow left" id="mediaPrev" aria-label="Previous image">‹</button>

            <img
              id="heroImage"
              src="${cover}"
              alt="${event.name}"
              data-full-image="${cover}"
              onerror="this.onerror=null;this.src='${PLACEHOLDER_IMAGE}';"
            >

            <div
              id="panoContainer"
              class="pano-container hidden"
              data-panorama="${panoramaUrl}">
            </div>

            <button class="media-arrow right" id="mediaNext" aria-label="Next image">›</button>
          </div>

          <div class="media-toggle">
            <button class="media-toggle-btn active" id="photosTab" type="button">Photos</button>
            <button class="media-toggle-btn" id="view360Tab" type="button">360° View</button>
          </div>
        </div>

        <aside class="event-split-details">
          <article class="event-panel">
            <div class="side-title">About this event</div>
            <div class="event-description">
              ${event.details || `<p>${event.snippet || "More details coming soon."}</p>`}
            </div>

            ${renderBookButton(event.booking || event.bookingUrl, event.id)}
          </article>
        </aside>
      </section>

      <section class="event-panel">
        <h2>Event details</h2>

      <div class="side-info-block">
  <span class="side-info-label">Time</span>
  <div class="side-info-value">${timeText}</div>
</div>


<div class="side-info-block">
  <span class="side-info-label">Venue</span>
  <div class="side-info-value">${event.venue || "Venue to be confirmed"}</div>
</div>

<div class="side-info-block">
  <span class="side-info-label">Address</span>
  <div class="side-info-value">
    ${
      address
        ? `<a href="${mapsLinkUrl}" target="_blank" rel="noopener noreferrer">${address}</a>`
        : "Address to be confirmed"
    }
  </div>
</div>



          <div class="side-info-block">
            <span class="side-info-label">Event tags</span>
            <div class="event-detail-tags">${renderTags(event.tags || [], event)}</div>
          </div>
          <div class="side-info-block">
  <span class="side-info-label">Price</span>
  <div class="side-info-value event-price ${event.cost?.type || ""}">
    ${renderPrice(event)}
  </div>
</div>
        </div>
      </section>

      <section class="event-panel">
        <h2>Location</h2>

        <div class="event-map">
          <iframe
            id="eventMapFrame"
            src="${mapsEmbedUrl}"
            title="Map for ${event.venue || event.name}"
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade"
            allowfullscreen>
          </iframe>
        </div>

        <a
          class="event-map-link"
          href="${mapsLinkUrl}"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="View ${event.venue || event.name} on Google Maps">
          View on Google Maps
        </a>
      </section>

      ${renderOrganiserContacts({ organiserName, website, phone, email })}
    </div>
  `;

  setupEventbriteCheckout(event);
  setupMediaGallery(gallery);
  setupMediaTabs();
  setupLightbox(gallery);
}

/* ==============================
   HERO GALLERY
============================== */

function setupMediaGallery(images = []) {
  const heroImage = document.getElementById("heroImage");
  const prevBtn = document.getElementById("mediaPrev");
  const nextBtn = document.getElementById("mediaNext");

  if (!heroImage || !prevBtn || !nextBtn) return;

  let currentIndex = 0;

  function updateImage() {
    const newSrc = images[currentIndex] || PLACEHOLDER_IMAGE;

    heroImage.src = newSrc;
    heroImage.setAttribute("data-full-image", newSrc);
  }

  function goToImage(direction) {
    if (images.length <= 1) return;

    if (direction === "right") {
      currentIndex = (currentIndex + 1) % images.length;
    } else {
      currentIndex = (currentIndex - 1 + images.length) % images.length;
    }

    updateImage();
  }

  if (images.length <= 1) {
    prevBtn.style.display = "none";
    nextBtn.style.display = "none";
    return;
  }

  prevBtn.onclick = (e) => {
    e.stopPropagation();
    goToImage("left");
  };

  nextBtn.onclick = (e) => {
    e.stopPropagation();
    goToImage("right");
  };

  // set initial image
  updateImage();
}

/* ==============================
   PHOTOS / 360 TABS
============================== */

function setupMediaTabs() {
  const photosTab = document.getElementById("photosTab");
  const view360Tab = document.getElementById("view360Tab");
  const heroImage = document.getElementById("heroImage");
  const mediaPrev = document.getElementById("mediaPrev");
  const mediaNext = document.getElementById("mediaNext");
  const panoContainer = document.getElementById("panoContainer");

  if (!photosTab || !view360Tab || !heroImage || !panoContainer) return;

  let panoViewer = null;
  const panoramaUrl = panoContainer.getAttribute("data-panorama");

  photosTab.addEventListener("click", () => {
    photosTab.classList.add("active");
    view360Tab.classList.remove("active");

    document.getElementById("heroImage").style.display = "block";
    panoContainer.classList.add("hidden");

    if (mediaPrev) mediaPrev.style.display = "";
    if (mediaNext) mediaNext.style.display = "";
  });

  view360Tab.addEventListener("click", () => {
    view360Tab.classList.add("active");
    photosTab.classList.remove("active");

    document.getElementById("heroImage").style.display = "none";
    panoContainer.classList.remove("hidden");

    if (mediaPrev) mediaPrev.style.display = "none";
    if (mediaNext) mediaNext.style.display = "none";

    if (!panoramaUrl) {
      panoContainer.innerHTML = `
        <div class="lightbox-360-placeholder">
          <div>
            <h2>360° View</h2>
            <p>No 360° media has been added yet.</p>
          </div>
        </div>
      `;
      return;
    }

    if (!panoViewer) {
      if (typeof pannellum !== "undefined") {
        panoViewer = pannellum.viewer("panoContainer", {
          type: "equirectangular",
          panorama: panoramaUrl,
          autoLoad: true,
          showZoomCtrl: true,
          mouseZoom: true,
          draggable: true,
        });
      } else {
        panoContainer.innerHTML = `
          <div class="lightbox-360-placeholder">
            <div>
              <h2>360° View</h2>
              <p>Pannellum did not load correctly.</p>
            </div>
          </div>
        `;
      }
    }
  });
}

/* ==============================
   LIGHTBOX
============================== */

function setupLightbox(images = []) {
  const lightbox = document.getElementById("mediaLightbox");
  const content = document.getElementById("lightboxContent");
  const closeBtn = document.getElementById("lightboxClose");
  const backdrop = document.getElementById("lightboxBackdrop");
  const prevBtn = document.getElementById("lightboxPrev");
  const nextBtn = document.getElementById("lightboxNext");
  const heroImage = document.getElementById("heroImage");

  if (
    !lightbox ||
    !content ||
    !closeBtn ||
    !backdrop ||
    !prevBtn ||
    !nextBtn ||
    !heroImage
  ) {
    return;
  }

  let currentIndex = 0;

  function showImage() {
    const src = images[currentIndex] || heroImage.src || PLACEHOLDER_IMAGE;
    content.innerHTML = `<img src="${src}" alt="${heroImage.alt}">`;
  }

  function openLightbox(index = 0) {
    currentIndex = index;
    showImage();

    lightbox.classList.remove("hidden");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    const showArrows = images.length > 1;
    prevBtn.style.display = showArrows ? "block" : "none";
    nextBtn.style.display = showArrows ? "block" : "none";
  }

  function closeLightbox() {
    lightbox.classList.add("hidden");
    lightbox.setAttribute("aria-hidden", "true");
    content.innerHTML = "";
    document.body.style.overflow = "";
  }

  function nextImage() {
    if (images.length <= 1) return;
    currentIndex = (currentIndex + 1) % images.length;
    showImage();
  }

  function previousImage() {
    if (images.length <= 1) return;
    currentIndex = (currentIndex - 1 + images.length) % images.length;
    showImage();
  }

  heroImage.onclick = () => {
    const currentSrc =
      heroImage.getAttribute("data-full-image") || heroImage.src;
    const index = images.indexOf(currentSrc);
    openLightbox(index >= 0 ? index : 0);
  };

  closeBtn.onclick = closeLightbox;

  backdrop.onclick = (event) => {
    if (event.target === backdrop) {
      closeLightbox();
    }
  };

  prevBtn.onclick = (event) => {
    event.stopPropagation();
    previousImage();
  };

  nextBtn.onclick = (event) => {
    event.stopPropagation();
    nextImage();
  };

  document.onkeydown = (event) => {
    if (lightbox.classList.contains("hidden")) return;

    if (event.key === "Escape") closeLightbox();
    if (event.key === "ArrowRight") nextImage();
    if (event.key === "ArrowLeft") previousImage();
  };
}

/* ==============================
   ERROR STATE + INIT
============================== */

function renderNotFound() {
  root.innerHTML = `
    <div class="event-not-found">
      <h1>Event not found</h1>
      <p>We couldn’t find that event.</p>
      <a class="book-button" href="events.html">Back to events</a>
    </div>
  `;
}

async function initEventDetailPage() {
  const eventId = getEventIdFromUrl();

  if (!eventId) {
    renderNotFound();
    return;
  }

  try {
    const response = await fetch(EVENTS_URL);
    const events = await response.json();
    const event = events.find((item) => item.id === eventId);

    if (!event) {
      renderNotFound();
      return;
    }

    renderEventPage(event);
  } catch (error) {
    console.error("Failed to load event details:", error);
    renderNotFound();
  }
}

function setupEventbriteCheckout(event) {
  const booking = event.booking || event.bookingUrl;

  if (!booking || booking.type !== "eventbrite" || !booking.eventbriteId)
    return;

  const buttonId = `eventbrite-widget-modal-trigger-${event.id}`;

  if (typeof window.EBWidgets === "undefined") {
    console.warn("Eventbrite widget script has not loaded.");
    return;
  }

  window.EBWidgets.createWidget({
    widgetType: "checkout",
    eventId: booking.eventbriteId,
    modal: true,
    modalTriggerElementId: buttonId,
  });
}

function renderPrice(event) {
  if (!event.cost) return "Price to be confirmed";

  return event.cost.label || "Price to be confirmed";
}

initEventDetailPage();
