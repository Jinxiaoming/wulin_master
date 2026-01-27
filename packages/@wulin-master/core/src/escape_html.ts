export function escapeHtml(html: string): string {
  const text = document.createTextNode(html);
  const p = document.createElement("p");
  p.appendChild(text);
  return p.innerHTML;
}

export function simpleFormat(str: string): string {
  if (!str) return '';
  str = str.replace(/\r\n?/, "\n");
  str = str.trim();
  if (str.length > 0) {
    str = str.replace(/\n\n+/g, "</p><p>");
    str = str.replace(/\n/g, "<br />");
    str = "<p>" + str + "</p>";
  }
  return str;
}

// Global exposure for legacy
const win = window as any;
win.escapeHtml = escapeHtml;
win.simpleFormat = simpleFormat;
