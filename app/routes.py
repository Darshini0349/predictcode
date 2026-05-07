from flask import Blueprint, render_template, request, jsonify, session
from app.predict import predict
from app.claude_api import get_advice, chat_response
from app.pdf_report import generate_pdf
import os

main = Blueprint("main", __name__)

# ── Landing page ───────────────────────────────────────────────
@main.route("/")
def index():
    return render_template("index.html")

# ── Stage 1 form page ──────────────────────────────────────────
@main.route("/stage1")
def stage1():
    return render_template("stage1.html")

# ── Stage 2 form page ──────────────────────────────────────────
@main.route("/stage2")
def stage2():
    return render_template("stage2.html")

# ── Results page ───────────────────────────────────────────────
@main.route("/results")
def results():
    return render_template("results.html")

# ── History page ───────────────────────────────────────────────
@main.route("/history")
def history():
    return render_template("history.html")

# ── Stage 1 prediction endpoint ────────────────────────────────
@main.route("/predict/stage1", methods=["POST"])
def predict_stage1():
    data = request.get_json()
    result = predict(data, stage=1)
    advice = get_advice(data, result)
    return jsonify({
        "results": result,
        "advice": advice,
        "stage": 1,
        "gender": data.get("gender"),
        "age": data.get("age"),
    })

# ── Stage 2 prediction endpoint ────────────────────────────────
@main.route("/predict/stage2", methods=["POST"])
def predict_stage2():
    data = request.get_json()
    result = predict(data, stage=2)
    advice = get_advice(data, result)
    return jsonify({
        "results": result,
        "advice": advice,
        "stage": 2,
        "gender": data.get("gender"),
        "age": data.get("age"),
    })

# ── Chatbot endpoint ───────────────────────────────────────────
@main.route("/chat", methods=["POST"])
def chat():
    data    = request.get_json()
    message = data.get("message", "")
    context = data.get("context", {})
    reply   = chat_response(message, context)
    return jsonify({"reply": reply})

# ── PDF download endpoint ──────────────────────────────────────
@main.route("/download-report", methods=["POST"])
def download_report():
    data = request.get_json()
    pdf  = generate_pdf(data)
    return pdf