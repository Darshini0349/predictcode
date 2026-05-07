// main.js
// Global utilities used across all pages

// ── Dark Mode Toggle ──────────────────────────────────────────
function toggleDark() {
    document.body.classList.toggle("light");
    const btn = document.querySelector(".dark-toggle");
    if (document.body.classList.contains("light")) {
        btn.textContent = "🌙 Dark Mode";
        localStorage.setItem("theme", "light");
    } else {
        btn.textContent = "☀️ Light Mode";
        localStorage.setItem("theme", "dark");
    }
}

// Load saved theme on page load
document.addEventListener("DOMContentLoaded", () => {
    const saved = localStorage.getItem("theme");
    if (saved === "light") {
        document.body.classList.add("light");
        const btn = document.querySelector(".dark-toggle");
        if (btn) btn.textContent = "🌙 Dark Mode";
    }
});