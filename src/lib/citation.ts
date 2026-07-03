function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function formatInitials(name: string) {
  const trimmed = normalizeWhitespace(name);
  if (!trimmed) return "";
  if (trimmed.includes(",")) {
    const [lastName, rest] = trimmed.split(",").map((part) => normalizeWhitespace(part));
    if (!rest) return lastName;
    return `${formatInitials(rest)} ${lastName}`.trim();
  }

  const parts = trimmed.split(" ").filter(Boolean);
  if (parts.length === 1) return parts[0];

  const surname = parts[parts.length - 1];
  const initials = parts
    .slice(0, -1)
    .map((part) => {
      const cleaned = part.replace(/\./g, "");
      if (!cleaned) return "";
      if (cleaned.length <= 2) return `${cleaned.toUpperCase()}.`;
      return `${cleaned.charAt(0).toUpperCase()}.`;
    })
    .filter(Boolean)
    .join(" ");
  return `${initials} ${surname}`;
}

function formatEdition(value: unknown) {
  if (value === null || value === undefined) return "";
  const raw = String(value).trim();
  if (!raw) return "";
  if (/ed\.?$/i.test(raw)) return raw.endsWith(".") ? raw : `${raw}.`;

  const numeric = Number(raw);
  if (Number.isFinite(numeric)) {
    const suffix = numeric % 10 === 1 && numeric % 100 !== 11
      ? "st"
      : numeric % 10 === 2 && numeric % 100 !== 12
      ? "nd"
      : numeric % 10 === 3 && numeric % 100 !== 13
      ? "rd"
      : "th";
    return `${numeric}${suffix} ed.`;
  }

  return raw.endsWith(".") ? raw : `${raw}.`;
}

function collectNames(item: any) {
  const names: string[] = [];

  const addName = (value: unknown) => {
    const name = normalizeWhitespace(String(value || ""));
    if (name) names.push(name);
  };

  if (Array.isArray(item?.authorsJson)) {
    for (const author of item.authorsJson) addName(author?.name);
  }

  if (Array.isArray(item?.authors)) {
    for (const author of item.authors) addName(author?.name || author);
  }

  if (item?.authorUser?.fullName) addName(item.authorUser.fullName);
  if (item?.originalAuthorName) addName(item.originalAuthorName);

  if (Array.isArray(item?.coAuthors)) {
    for (const author of item.coAuthors) addName(author?.name || author);
  }

  return Array.from(new Set(names));
}

function formatNameList(item: any) {
  return collectNames(item).map(formatInitials).filter(Boolean).join(" and ");
}

export function buildCitation(item: any) {
  const authorText = formatNameList(item);
  const title = normalizeWhitespace(String(item?.title || "").trim());
  const edition = formatEdition(item?.edition || item?.editionNumber || item?.editions);
  const publisher = normalizeWhitespace(String(item?.publisher || "").trim());
  const location = normalizeWhitespace(String(item?.location || item?.place || item?.city || "").trim());
  const yearValue = item?.year || item?.publishedYear || item?.publishYear || item?.publishedAt || item?.createdAt || item?.created_at;
  let year = "";
  if (typeof yearValue === "number" && Number.isFinite(yearValue)) {
    year = String(yearValue);
  } else if (yearValue) {
    const parsed = new Date(yearValue);
    year = Number.isNaN(parsed.getTime()) ? String(yearValue).trim() : String(parsed.getFullYear());
  }

  const citationParts: string[] = [];
  if (authorText) citationParts.push(authorText);
  if (title) citationParts.push(title);
  if (edition) citationParts.push(edition);
  if (location || publisher) {
    const imprint = [location, publisher].filter(Boolean).join(": ");
    if (imprint) citationParts.push(imprint);
  }
  if (year) citationParts.push(year);

  const citation = citationParts.join(", ");
  return citation ? `${citation}.` : "Citation unavailable.";
}

function formatYear(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (!value) return "";
  const parsed = new Date(value as string);
  return Number.isNaN(parsed.getTime()) ? String(value).trim() : String(parsed.getFullYear());
}

function appendSection(lines: string[], label: string, value: unknown) {
  const text = normalizeWhitespace(String(value || ""));
  if (text) lines.push(`${label}: ${text}`);
}

function formatKeywordList(item: any) {
  if (Array.isArray(item?.keywords)) {
    return item.keywords.map((keyword: any) => normalizeWhitespace(String(keyword || ""))).filter(Boolean).join(", ");
  }
  if (typeof item?.keywords === "string") {
    return item.keywords.split(",").map((keyword: string) => normalizeWhitespace(keyword)).filter(Boolean).join(", ");
  }
  return "";
}

export function buildFullDocumentText(item: any) {
  const lines: string[] = [];
  const authors = formatNameList(item);
  const title = normalizeWhitespace(String(item?.title || "").trim());
  const year = formatYear(item?.year || item?.publishedYear || item?.publishYear || item?.publishedAt || item?.createdAt || item?.created_at);

  if (authors) lines.push(authors);
  if (title) lines.push(title);
  if (year) lines.push(year);

  const citation = buildCitation(item);
  if (citation && citation !== "Citation unavailable.") {
    lines.push("");
    lines.push(citation);
  }

  if (item?.authorUser?.fullName || item?.originalAuthorName) {
    appendSection(lines, "Author", item?.authorUser?.fullName || item?.originalAuthorName);
  }
  if (item?.authorUser?.institution || item?.institution) {
    appendSection(lines, "Institution", item?.authorUser?.institution || item?.institution);
  }
  if (item?.venue) appendSection(lines, "Venue", item.venue);
  if (item?.publisher) appendSection(lines, "Publisher", item.publisher);
  if (item?.location || item?.place || item?.city) {
    appendSection(lines, "Location", item.location || item.place || item.city);
  }
  if (year) appendSection(lines, "Year", year);
  if (item?.edition || item?.editionNumber || item?.editions) appendSection(lines, "Edition", formatEdition(item.edition || item.editionNumber || item.editions));

  const keywords = formatKeywordList(item);
  if (keywords) appendSection(lines, "Keywords", keywords);

  const abstract = normalizeWhitespace(String(item?.abstract || item?.summary || "").trim());
  if (abstract) {
    lines.push("");
    lines.push("Abstract");
    lines.push(abstract);
  }

  const body = normalizeWhitespace(String(item?.body || "").trim());
  if (body) {
    lines.push("");
    lines.push("Full Content");
    lines.push(String(item.body).trim());
  }

  const manuscriptUrl = normalizeWhitespace(String(item?.manuscriptUrl || item?.pdfUrl || "").trim());
  if (manuscriptUrl) appendSection(lines, "Document URL", manuscriptUrl);

  return lines.join("\n").trim();
}

export async function copyToClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}