// Popup UI: focus the input, and on Enter hand the query to the background
// script (which does the actual fan-out) then close.
const input = document.getElementById("q");

input.focus();

input.addEventListener("keydown", (e) => {
  if (e.key !== "Enter") return;
  const query = input.value.trim();
  if (!query) return;
  browser.runtime.sendMessage({ type: "launch", query });
  window.close();
});
