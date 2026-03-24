export function formatPrice(amount: number, currency = "EUR"): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function generateInvoiceNumber(year: number, sequence: number): string {
  return `KRETZ-${year}-${sequence.toString().padStart(4, "0")}`;
}

export function generateIcsEvent(event: {
  title: string;
  description?: string;
  location?: string;
  startsAt: Date | string;
  endsAt?: Date | string;
}): string {
  const formatIcsDate = (d: Date | string) =>
    new Date(d)
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "");

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Kretz Club//Events//FR",
    "BEGIN:VEVENT",
    `DTSTART:${formatIcsDate(event.startsAt)}`,
  ];

  if (event.endsAt) {
    lines.push(`DTEND:${formatIcsDate(event.endsAt)}`);
  }

  lines.push(`SUMMARY:${event.title}`);

  if (event.description) {
    lines.push(`DESCRIPTION:${event.description.replace(/\n/g, "\\n")}`);
  }

  if (event.location) {
    lines.push(`LOCATION:${event.location}`);
  }

  lines.push(
    `UID:${crypto.randomUUID()}@kretz.club`,
    `DTSTAMP:${formatIcsDate(new Date())}`,
    "END:VEVENT",
    "END:VCALENDAR"
  );

  return lines.join("\r\n");
}
