const EVENTS_URL = "data/events.json";

const organiserSelect = document.getElementById("eventSelect");
const organiserDisplay = document.getElementById("selectedOrganiser");
const sendButton = document.getElementById("sendMailButton");

const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const messageInput = document.getElementById("message");
const reasonInput = document.getElementById("reason");

let organisers = [];

async function loadOrganisersForContact() {
  const res = await fetch(EVENTS_URL);
  const events = await res.json();

  const uniqueOrganisers = new Map();

  events.forEach((event) => {
    const organiser = event.organiser;

    if (!organiser?.name || (!organiser.email && !organiser.phone)) return;

    const key = (organiser.email || organiser.name).trim().toLowerCase();

    if (!uniqueOrganisers.has(key)) {
      uniqueOrganisers.set(key, {
        name: organiser.name,
        email: organiser.email || "",
        phone: organiser.phone || "",
      });
    }
  });

  organisers = [...uniqueOrganisers.values()].sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  organiserSelect.innerHTML = `
    <option value="">General festival enquiry</option>
    ${organisers
      .map(
        (organiser, index) =>
          `<option value="${index}">${organiser.name}</option>`,
      )
      .join("")}
  `;

  updateOrganiserDisplay();
  updateMailto();
}

function getSelectedOrganiser() {
  if (organiserSelect.value === "") return null;
  return organisers[Number(organiserSelect.value)];
}

function updateOrganiserDisplay() {
  const organiser = getSelectedOrganiser();

  if (!organiser) {
    organiserDisplay.innerHTML = `
      General festival enquiry<br>
      Email: <a href="mailto:calummuddle@gmail.com">calummuddle@gmail.com</a>
    `;
    return;
  }

  const cleanPhone = organiser.phone ? organiser.phone.replace(/\s+/g, "") : "";

  organiserDisplay.innerHTML = `
    Contacting: <strong>${organiser.name}</strong><br>
    ${
      organiser.email
        ? `Email: <a href="mailto:${organiser.email}">${organiser.email}</a><br>`
        : ""
    }
    ${
      organiser.phone
        ? `Phone: <a href="tel:${cleanPhone}">${organiser.phone}</a>`
        : ""
    }
  `;
}

function updateMailto() {
  const organiser = getSelectedOrganiser();

  const recipient = organiser?.email || "calummuddle@gmail.com";
  const subject = reasonInput?.value || "Festival Contact";

  const body = `
Name: ${nameInput.value || ""}
Email: ${emailInput.value || ""}
To: ${organiser?.name || "Festival team"}

Message:
${messageInput.value || ""}
  `.trim();

  sendButton.href = `mailto:${recipient}?subject=${encodeURIComponent(
    subject,
  )}&body=${encodeURIComponent(body)}`;
}

organiserSelect.addEventListener("change", () => {
  updateOrganiserDisplay();
  updateMailto();
});

[nameInput, emailInput, messageInput, reasonInput].forEach((input) => {
  input?.addEventListener("input", updateMailto);
  input?.addEventListener("change", updateMailto);
});

loadOrganisersForContact();
