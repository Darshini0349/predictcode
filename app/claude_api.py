import google.generativeai as genai
import os

def get_client():
    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
    return genai.GenerativeModel("gemini-1.5-flash")

def get_advice(user_data, results):
    try:
        model = get_client()

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
- Diabetes: {diabetes['total_score']} points → {diabetes['risk']}
- Heart Disease: {heart['total_score']} points → {heart['risk']}
- Blood Pressure: {bp['total_score']} points → {bp['risk']}

Please provide:
1. A brief summary of their overall health risk (2-3 sentences)
2. Top 3 lifestyle changes they should make immediately
3. A simple 7-day action plan (one tip per day)
4. Whether they should see a doctor (Yes/No and urgency level)

Keep the language simple, friendly and encouraging.
"""
        response = model.generate_content(prompt)
        return response.text

    except Exception as e:
        print(f"Gemini API error: {e}")
        return "Unable to generate advice at this time. Please check your API key."


def chat_response(message, context):
    try:
        model = get_client()

        prompt = f"""
You are LifeGuard AI, a friendly health assistant. The user has just received their disease risk prediction results.

Their context:
- Diabetes Risk: {context.get('diabetes', {}).get('risk', 'Unknown')}
- Heart Disease Risk: {context.get('heart', {}).get('risk', 'Unknown')}
- Blood Pressure Risk: {context.get('bp', {}).get('risk', 'Unknown')}

The user is now asking: {message}

Answer in a helpful, simple, and friendly way. Keep it short — max 3-4 sentences.
Always remind them to consult a doctor for medical decisions.
"""
        response = model.generate_content(prompt)
        return response.text

    except Exception as e:
        print(f"Gemini chat error: {e}")
        return "Sorry, I could not get a response right now."

