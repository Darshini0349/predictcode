from flask import Blueprint, render_template, request, jsonify
from app.predict import predict
from app.claude_api import get_advice, chat_response
from app.pdf_report import generate_pdf

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
    from app.database import get_all_predictions
    predictions = get_all_predictions()
    return render_template("history.html", predictions=predictions)


@main.route("/history/clear", methods=["POST"])
def clear_history():
    try:
        from app.database import delete_all_predictions
        delete_all_predictions()
        return jsonify({"ok": True})
    except Exception as e:
        print(f"Clear history error: {e}")
        return jsonify({"ok": False, "error": str(e)}), 500

# ── Stage 1 prediction endpoint ────────────────────────────────
@main.route("/predict/stage1", methods=["POST"])
def predict_stage1():
    try:
        data   = request.get_json()
        result = predict(data, stage=1)
        advice = get_advice(data, result)

        from app.database import save_prediction
        save_prediction(data, result, advice)

        return jsonify({
            "results": result,
            "advice":  advice,
            "stage":   1,
            "gender":  data.get("gender"),
            "age":     data.get("age"),
        })
    except Exception as e:
        print(f"Stage1 error: {e}")
        return jsonify({"error": str(e)}), 500

# ── Stage 2 prediction endpoint ────────────────────────────────
@main.route("/predict/stage2", methods=["POST"])
def predict_stage2():
    try:
        data   = request.get_json()
        result = predict(data, stage=2)
        advice = get_advice(data, result)

        from app.database import save_prediction
        save_prediction(data, result, advice)

        return jsonify({
            "results": result,
            "advice":  advice,
            "stage":   2,
            "gender":  data.get("gender"),
            "age":     data.get("age"),
        })
    except Exception as e:
        print(f"Stage2 error: {e}")
        return jsonify({"error": str(e)}), 500

# ── Chatbot endpoint ───────────────────────────────────────────
@main.route("/chat", methods=["POST"])
def chat():
    try:
        data    = request.get_json()
        message = data.get("message", "")
        context = data.get("context", {})
        print(f"Chat received: {message}")
        reply   = chat_response(message, context)
        print(f"Chat reply: {reply}")
        return jsonify({"reply": reply})
    except Exception as e:
        print(f"Chat route error: {e}")
        return jsonify({"reply": f"Error: {str(e)}"}), 500

# ── PDF download endpoint ──────────────────────────────────────
@main.route("/download-report", methods=["POST"])
def download_report():
    try:
        data = request.get_json()
        pdf  = generate_pdf(data)
        return pdf
    except Exception as e:
        print(f"PDF error: {e}")
        return jsonify({"error": str(e)}), 500