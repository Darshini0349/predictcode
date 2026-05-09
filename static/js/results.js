// results.js

const RISK_COLORS = {
    "Very Low Risk": { stroke: "#22c55e", bg: "#dcfce7", text: "#15803d" },
    "Early Risk": { stroke: "#eab308", bg: "#fef9c3", text: "#a16207" },
    "Moderate Risk": { stroke: "#f97316", bg: "#ffedd5", text: "#c2410c" },
    "High Risk": { stroke: "#ef4444", bg: "#fee2e2", text: "#b91c1c" },
};

/** Matches app.predict.get_score_maxima (for old sessionStorage before score_max existed). */
const FALLBACK_SCORE_MAX = {
    1: {
        female: { diabetes: 29, heart: 33, bp: 29 },
        male: { diabetes: 29, heart: 28, bp: 27 },
    },
    2: {
        female: { diabetes: 35, heart: 40, bp: 37 },
        male: { diabetes: 35, heart: 34, bp: 34 },
    },
};

const PIE_RISK_PALETTE = {
    diabetes: { fill: "rgba(239, 68, 68, 0.92)", border: "rgba(239, 68, 68, 0.45)" },
    heart: { fill: "rgba(249, 115, 22, 0.92)", border: "rgba(249, 115, 22, 0.45)" },
    bp: { fill: "rgba(59, 130, 246, 0.92)", border: "rgba(59, 130, 246, 0.45)" },
};

const SAFE_SLICE = { fill: "rgba(34, 197, 94, 0.9)", border: "rgba(34, 197, 94, 0.4)" };

let breakdownChartRef = null;
let riskPieChartRefs = [];

function resolveScoreMax(results, apiPayload) {
    if (results && results.score_max) return results.score_max;
    const g = String(apiPayload?.gender || "male").toLowerCase() === "female" ? "female" : "male";
    const st = apiPayload?.stage === 2 || results?.stage === 2 ? 2 : 1;
    return FALLBACK_SCORE_MAX[st][g];
}

function setRiskBadge(diseaseKey, riskLabel) {
    const badge = document.querySelector(`[data-risk-badge="${diseaseKey}"]`);
    if (!badge) return;
    const colors = RISK_COLORS[riskLabel] || RISK_COLORS["Very Low Risk"];
    badge.style.backgroundColor = colors.bg;
    badge.style.color = colors.text;
    badge.textContent = riskLabel;
}

/**
 * Pie = your score (disease color) vs remaining safe headroom (green).
 * risk% = min(score,max)/max*100, safe% = max(0,(max-score)/max*100 — same denominator (max from predict.py).
 */
function initRiskPies(results, apiPayload) {
    if (!results || typeof Chart === "undefined") return;

    const scoreMax = resolveScoreMax(results, apiPayload);
    const diseases = [
        { key: "diabetes", canvasId: "diabetesPie", statsId: "diabetesPieStats" },
        { key: "heart", canvasId: "heartPie", statsId: "heartPieStats" },
        { key: "bp", canvasId: "bpPie", statsId: "bpPieStats" },
    ];

    riskPieChartRefs.forEach((c) => {
        try {
            c.destroy();
        } catch (_) {}
    });
    riskPieChartRefs = [];

    diseases.forEach(({ key, canvasId, statsId }) => {
        const canvas = document.getElementById(canvasId);
        const statsEl = document.getElementById(statsId);
        const block = results[key];
        if (!canvas || !block) return;

        const max = Math.max(1, scoreMax[key] ?? 1);
        const score = Number(block.total_score) || 0;
        const riskSlice = Math.min(Math.max(0, score), max);
        const safeSlice = Math.max(0, max - score);

        const riskPct = Math.min(100, Math.round((score / max) * 100));
        const safePct = Math.max(0, Math.round(((max - score) / max) * 100));

        if (statsEl) {
            statsEl.innerHTML = `
                <div class="mini-pie-pts"><strong>${score}</strong> / ${max} pts</div>
                <div class="mini-pie-pct">Your score: ${riskPct}% of max · Safe headroom: ${safePct}%</div>
                <div class="mini-pie-formula">risk% = (score / max)×100 · safe% = ((max - score) / max)×100</div>
            `;
        }

        setRiskBadge(key, block.risk);

        const pal = PIE_RISK_PALETTE[key];
        const chart = new Chart(canvas, {
            type: "doughnut",
            data: {
                labels: ["Your score (pts)", "Safe headroom (pts)"],
                datasets: [
                    {
                        data: riskSlice + safeSlice > 0 ? [riskSlice, safeSlice] : [0, max],
                        backgroundColor: [pal.fill, SAFE_SLICE.fill],
                        borderColor: [pal.border, SAFE_SLICE.border],
                        borderWidth: 2,
                        hoverOffset: 4,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                cutout: "58%",
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label(ctx) {
                                const v = ctx.raw;
                                const pct = max > 0 ? Math.round((v / max) * 100) : 0;
                                return ` ${ctx.label}: ${v} pts (${pct}% of max)`;
                            },
                        },
                    },
                },
            },
        });
        riskPieChartRefs.push(chart);
    });
}

function initBreakdownChart() {
    const ctx = document.getElementById("breakdownChart");
    if (!ctx || typeof Chart === "undefined") return;

    if (breakdownChartRef) {
        breakdownChartRef.destroy();
        breakdownChartRef = null;
    }

    const factorData = window.FACTOR_BREAKDOWN || {};
    const labels = Object.keys(factorData);
    if (!labels.length) return;

    const diabetes = labels.map((k) => factorData[k].diabetes || 0);
    const heart = labels.map((k) => factorData[k].heart || 0);
    const bp = labels.map((k) => factorData[k].bp || 0);

    breakdownChartRef = new Chart(ctx, {
        type: "bar",
        data: {
            labels,
            datasets: [
                { label: "Diabetes", data: diabetes, backgroundColor: "rgba(239,68,68,0.75)", borderRadius: 6, borderSkipped: false },
                { label: "Heart", data: heart, backgroundColor: "rgba(249,115,22,0.75)", borderRadius: 6, borderSkipped: false },
                { label: "BP", data: bp, backgroundColor: "rgba(59,130,246,0.75)", borderRadius: 6, borderSkipped: false },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            animation: { duration: 1200, easing: "easeOutQuart" },
            plugins: {
                legend: { position: "top", labels: { font: { size: 13 }, padding: 16 } },
                tooltip: { callbacks: { label: (c) => ` ${c.dataset.label}: +${c.raw} pts` } },
            },
            scales: {
                x: { grid: { display: false }, ticks: { font: { size: 11 } } },
                y: {
                    beginAtZero: true,
                    grid: { color: "rgba(0,0,0,0.05)" },
                    ticks: { stepSize: 1, font: { size: 11 }, callback: (val) => `+${val}` },
                    title: { display: true, text: "Points added to score", font: { size: 12 }, color: "#6b7280" },
                },
            },
        },
    });
}

const chatState = {
    isLoading: false,
    sessionId: Date.now().toString(),
};

function initChatbot() {
    const input = document.getElementById("chatInput");
    const sendBtn = document.getElementById("chatSend");
    const box = document.getElementById("chatMessages");

    if (!input || !box) return;

    input.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    sendBtn?.addEventListener("click", sendMessage);

    document.querySelectorAll(".quick-question").forEach((btn) => {
        btn.addEventListener("click", () => {
            input.value = btn.textContent.trim();
            sendMessage();
        });
    });
}

function appendMessage(role, text) {
    const box = document.getElementById("chatMessages");
    if (!box) return;

    const div = document.createElement("div");
    div.className = `chat-msg chat-msg--${role}`;
    div.innerHTML = `
        <div class="chat-bubble">
            <span class="chat-role">${role === "user" ? "You" : "LifeGuard AI"}</span>
            <p>${escapeHtml(text).replace(/\n/g, "<br>")}</p>
        </div>`;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
}

function appendTypingIndicator() {
    const box = document.getElementById("chatMessages");
    if (!box) return;

    const div = document.createElement("div");
    div.className = "chat-msg chat-msg--assistant chat-typing";
    div.id = "typingIndicator";
    div.innerHTML = `
        <div class="chat-bubble">
            <span class="chat-role">LifeGuard AI</span>
            <div class="typing-dots"><span></span><span></span><span></span></div>
        </div>`;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
}

function removeTypingIndicator() {
    document.getElementById("typingIndicator")?.remove();
}

async function sendMessage() {
    const input = document.getElementById("chatInput");
    if (!input || chatState.isLoading) return;

    const text = input.value.trim();
    if (!text) return;

    input.value = "";
    chatState.isLoading = true;
    toggleChatInput(false);
    appendMessage("user", text);
    appendTypingIndicator();

    try {
        const response = await fetch("/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message: text,
                session_id: chatState.sessionId,
                context: window.PREDICTION_CONTEXT || {},
            }),
        });

        removeTypingIndicator();
        if (!response.ok) throw new Error("Server error");

        const data = await response.json();
        appendMessage("assistant", data.reply || "Sorry, I could not get a response.");
    } catch (err) {
        removeTypingIndicator();
        appendMessage("assistant", "Sorry, something went wrong. Please try again.");
        console.error("Chat error:", err);
    } finally {
        chatState.isLoading = false;
        toggleChatInput(true);
        document.getElementById("chatInput")?.focus();
    }
}

function toggleChatInput(enabled) {
    const input = document.getElementById("chatInput");
    const sendBtn = document.getElementById("chatSend");
    if (input) input.disabled = !enabled;
    if (sendBtn) sendBtn.disabled = !enabled;
}

function initPdfDownload() {
    const btn = document.getElementById("downloadPdf");
    if (!btn) return;

    btn.addEventListener("click", async () => {
        btn.disabled = true;
        btn.textContent = "Generating PDF...";

        try {
            const response = await fetch("/download-report", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(window.PREDICTION_CONTEXT || {}),
            });

            if (!response.ok) throw new Error("PDF generation failed");

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "LifeGuard_Health_Report.pdf";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            btn.textContent = "Downloaded!";
            setTimeout(() => {
                btn.disabled = false;
                btn.textContent = "📄 Download PDF Report";
            }, 3000);
        } catch (err) {
            console.error("PDF error:", err);
            btn.textContent = "Download failed. Try again.";
            btn.disabled = false;
        }
    });
}

function initHospitalFinder() {
    const btn = document.getElementById("findHospitals");
    if (!btn) return;

    btn.addEventListener("click", () => {
        if (!navigator.geolocation) {
            window.open("https://www.google.com/maps/search/hospitals+near+me", "_blank");
            return;
        }

        btn.textContent = "Finding your location...";
        btn.disabled = true;

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                window.open(`https://www.google.com/maps/search/hospitals/@${latitude},${longitude},14z`, "_blank");
                btn.textContent = "🏥 Find Nearby Hospitals";
                btn.disabled = false;
            },
            () => {
                window.open("https://www.google.com/maps/search/hospitals+near+me", "_blank");
                btn.textContent = "🏥 Find Nearby Hospitals";
                btn.disabled = false;
            }
        );
    });
}

function saveToHistory() {
    const ctx = window.PREDICTION_CONTEXT;
    if (!ctx) return;

    try {
        const history = JSON.parse(localStorage.getItem("lifeguard_history") || "[]");
        const entry = {
            id: Date.now(),
            date: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
            stage: ctx.stage,
            gender: ctx.gender,
            age: ctx.age,
            diabetes: ctx.results?.diabetes,
            heart: ctx.results?.heart,
            bp: ctx.results?.bp,
        };
        history.unshift(entry);
        if (history.length > 20) history.splice(20);
        localStorage.setItem("lifeguard_history", JSON.stringify(history));
    } catch (err) {
        console.warn("Could not save to history:", err);
    }
}

function escapeHtml(str) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

document.addEventListener("DOMContentLoaded", () => {
    initChatbot();
    initPdfDownload();
    initHospitalFinder();
    saveToHistory();
});
