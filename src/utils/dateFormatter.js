export function formatDate(date) {
  return date.toLocaleDateString('en-AU', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
}