/** Option lists shared by the support pages (plain data, safe for server and client). */
export const TICKET_STATUSES = [
  { value: "open", label: "Open" },
  { value: "pending", label: "Pending" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

export const TICKET_CATEGORIES = [
  { value: "payment", label: "Payment" },
  { value: "session", label: "Session" },
  { value: "astrologer", label: "Astrologer" },
  { value: "account", label: "Account" },
  { value: "technical", label: "Technical" },
];

export const TICKET_PRIORITIES = [
  { value: "urgent", label: "Urgent" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];
