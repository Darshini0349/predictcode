// results.js

const GAUGE_CONFIG = {
    maxScore: 30,
    radius: 70,
    strokeWidth: 12,
    animDuration: 1500,
};

const RISK_COLORS = {
    "Very Low Risk": { stroke: "#22c55e", bg: "#dcfce7", text: "#15803d" },
    "Early Risk": { stroke: "#eab308", bg: "#fef9c3", text: "#a16207" },
    "Moderate Risk": { stroke: "#f97316", bg: "#ffedd5", text: "#c2410c" },
    "High Risk": { stroke: "#ef4444", bg: "#fee2e2", text: "#b91c1c" },
};

function buildGauge(canvasId, score, maxScore, riskLabel) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const r = GAUGE_CONFIG.radius;
    const sw = GAUGE_CONFIG.strokeWidth;
    const colors = RISK_COLORS[riskLabel] || RISK_COLORS["Very Low Risk"];

    const startAngle = Math.PI * 0.75;
    const endAngle = Math.PI * 2.25;
    const fullArc = endAngle - startAngle;
    const targetArc = fullArc * Math.min(score / maxScore, 1);

    let startTime = null;

    function easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    function draw(currentArc) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.beginPath();
        ctx.arc(cx, cy, r, startAngle, endAngle);
        ctx.strokeStyle = "#e5e7eb";
        ctx.lineWidth = sw;
        ctx.lineCap = "round";
        ctx.stroke();

        if (currentArc > 0) {
            ctx.beginPath();
            ctx.arc(cx, cy, r, startAngle, startAngle + currentArc);
            ctx.strokeStyle = colors.stroke;
            ctx.lineWidth = sw;
            ctx.lineCap = "round";
            ctx.stroke();
        }

        ctx.fillStyle = colors.text;
        ctx.font = "bold 28px 'Segoe UI', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(Math.round((currentArc / fullArc) * score), cx, cy - 10);

        ctx.fillStyle = "#6b7280";
        ctx.font = "12px 'Segoe UI', sans-serif";
        ctx.fillText("score", cx, cy + 14);
    }

    function animate(timestamp) {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / GAUGE_CONFIG.animDuration, 1);
        const easedArc = easeOutCubic(progress) * targetArc;
        draw(easedArc);
        if (progress < 1) requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
}

function initGauges() {
    const gauges = document.querySelectorAll("[data-gauge]");
    gauges.forEach(el => {
        const id = el.id;
        const score = parseInt(el.dataset.score, 10);
        const risk = el.dataset.risk;
        buildGauge(id, score, GAUGE_CONFIG.maxScore, risk);

        const badge = document.querySelector(`[data-risk-badge="${el.dataset.disease}"]`);
        if (badge) {
            const colors = RISK_COLORS[risk] || RISK_COLORS["Very Low Risk"];
            badge.style.backgroundColor = colors.bg;
            badge.style.color = colors.text;
            badge.textContent = risk;
        }
    });
}

function initBreakdownChart() {
    const ctx = document.getElementById("breakdownChart");
    if (!ctx || typeof Chart === "undefined") return;

    const factorData = window.FACTOR_BREAKDOWN || {};
    const labels = Object.keys(factorData);
    const diabetes = labels.map(k => factorData[k].diabetes || 0);
    const heart = labels.map(k => factorData[k].heart || 0);
    const bp = labels.map(k => factorData[k].bp || 0);

    new Chart(ctx, {
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
                tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: +${ctx.raw} pts` } },
            },
            scales: {
                x: { grid: { display: false }, ticks: { font: { size: 11 } } },
                y: {
                    beginAtZero: true,
                    grid: { color: "rgba(0,0,0,0.05)" },
                    ticks: { stepSize: 1, font: { size: 11 }, callback: val => `+${val}` },
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

    input.addEventListener("keydown", e => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    sendBtn?.addEventListener("click", sendMessage);

    document.querySelectorAll(".quick-question").forEach(btn => {
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
            pos => {
                const { latitude, longitude } = pos.coords;
                window.open(`https://www.google.com/maps/search/hospitals/@${latitude},${longitude},14z`, "_blank");
                btn.textContent = "🏥 Find Nearby Hospitals";
                btn.disabled = false;
            },
            err => {
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
    initGauges();
    initBreakdownChart();
    initChatbot();
    initPdfDownload();
    initHospitalFinder();
    saveToHistory();
});