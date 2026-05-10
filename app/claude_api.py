from google import genai
import os
import random

def get_client():
    # Collect all available keys
    keys = [
        os.getenv("AlzaSyAiowf4y3IZCML4wKna5_FIC1t7cXIPDC8"),
    
        os.getenv("AIzaSyChlJv8yxN7OyqLzZs2uPgf_A0Fx9EGui8"),
        os.getenv("zaSyAj0z7Qprx8AprIwbEILtDC1zFEV_QVvKI"),
        
    ]
    # Remove empty keys
    valid_keys = [k for k in keys if k]
    # Pick a random key
    api_key = random.choice(valid_keys)
    client  = genai.Client(api_key=api_key)
    return client

def get_advice(user_data, results):
    try:
        client   = get_client()
        diabetes = results["diabetes"]
        heart    = results["heart"]
        bp       = results["bp"]

        prompt = f"""
You are a helpful health advisor. Based on the following user lifestyle data and disease risk scores, give personalized health advice.

User Profile:
- Gender: {user_data.get('gender')}
- Age: {user_data.get('age')}
- BMI: {user_data.get('bmi')}
- Smoking: {user_data.get('smoking')}
- Alcohol: {user_data.get('alcohol')}
- Exercise: {user_data.get('exercise')}
- Sleep: {user_data.get('sleep')} hours
- Diet: {user_data.get('diet_type')}

Risk Scores:
- Diabetes: {diabetes['total_score']} points -> {diabetes['risk']}
- Heart Disease: {heart['total_score']} points -> {heart['risk']}
- Blood Pressure: {bp['total_score']} points -> {bp['risk']}

Please provide:
1. A brief summary of their overall health risk (2-3 sentences)
2. Top 3 lifestyle changes they should make immediately
3. A simple 7-day action plan (one tip per day)
4. Whether they should see a doctor (Yes/No and urgency level)

Keep the language simple, friendly and encouraging.
"""
        response = client.models.generate_content(
            model="gemini-1.5-flash",
            contents=prompt
        )
        return response.text

    except Exception as e:
        print(f"Gemini advice error: {e}")
        return "Unable to generate advice at this time."


def chat_response(message, context):
    try:
        client = get_client()

        diabetes_risk = "Unknown"
        heart_risk    = "Unknown"
        bp_risk       = "Unknown"

        if context:
            results = context.get("results", {})
            if results:
                diabetes_risk = results.get("diabetes", {}).get("risk", "Unknown")
                heart_risk    = results.get("heart",    {}).get("risk", "Unknown")
                bp_risk       = results.get("bp",       {}).get("risk", "Unknown")

        prompt = f"""
You are LifeGuard AI, a friendly health assistant. The user has just received their disease risk prediction results.

Their risk levels:
- Diabetes Risk: {diabetes_risk}
- Heart Disease Risk: {heart_risk}
- Blood Pressure Risk: {bp_risk}

The user is asking: {message}

Answer in a helpful, simple and friendly way in 3-4 sentences.
Always remind them to consult a doctor for medical decisions.
"""
        response = client.models.generate_content(
            model="gemini-1.5-flash",
            contents=prompt
        )
        return response.text

    except Exception as e:
        print(f"Gemini chat error: {e}")
        return "Sorry, I could not get a response right now."