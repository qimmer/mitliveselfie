export function formatDate(date: Date) {
  return new Date(date).toLocaleString("da-DK", {
    timeZone: "Europe/Copenhagen",
    dateStyle: "medium",
    timeStyle: "short",
  });
}
