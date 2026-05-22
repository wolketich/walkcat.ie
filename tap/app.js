const contact = {
  firstName: "Vladislav",
  lastName: "Cernega",
  fullName: "Vladislav Cernega",
  phoneDisplay: "089 471 4339",
  phoneIntl: "+353894714339",
  email: "vladislav@walkcat.net",
  website: "https://walkcat.net",
  tain: "81569Q"
};

function buildVCard() {
  return [
    "BEGIN:VCARD",
    "VERSION:3.0",
    "N:Cernega;Vladislav;;;",
    "FN:Vladislav Cernega",
    "ORG:Vladislav Cernega",
    "TITLE:Registered Tax Agent",
    `TEL;TYPE=CELL:${contact.phoneIntl}`,
    `EMAIL;TYPE=INTERNET:${contact.email}`,
    `URL:${contact.website}`,
    "NOTE:Registered Tax Agent. TAIN: 81569Q. Accounting, bookkeeping, tax advice, websites, SEO, Google Ads, and practical business support.",
    "END:VCARD"
  ].join("\\n");
}

function saveContact() {
  const vcard = buildVCard();
  const blob = new Blob([vcard], { type: "text/vcard;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "Vladislav-Cernega.vcf";
  link.style.display = "none";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function bindSaveButtons() {
  const buttons = [
    document.getElementById("saveContactTop"),
    document.getElementById("saveContactBottom")
  ];

  buttons.forEach((button) => {
    if (!button) return;
    button.addEventListener("click", saveContact);
  });
}

document.addEventListener("DOMContentLoaded", bindSaveButtons);