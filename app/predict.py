# predict.py
# Complete rule-based disease risk scoring engine
# Based on clinically validated scoring tables with gender adjustments
# Diseases: Diabetes, Heart Disease, Hypertension (BP)
# Supports Stage 1 (lifestyle only) and Stage 2 (lifestyle + medical values)

def score_to_risk(score):
    """Convert total score to risk level."""
    if score <= 3:
        return "Very Low Risk"
    elif score <= 6:
        return "Early Risk"
    elif score <= 10:
        return "Moderate Risk"
    else:
        return "High Risk"


def calculate_scores(data):
    diabetes = 0
    heart    = 0
    bp       = 0

    gender = data.get("gender", "male").lower()
    is_female = (gender == "female")

    # 1. AGE
    age = int(data.get("age", 0))
    if age < 30:
        pass
    elif age <= 39:
        diabetes += 1; heart += 1; bp += 1
    elif age <= 49:
        diabetes += 2; heart += 2; bp += 2
    else:
        diabetes += 3; heart += 3; bp += 3
        if is_female:
            heart += 1; bp += 1

    # 2. BMI
    bmi = float(data.get("bmi", 0))
    if bmi < 18.5:
        pass
    elif bmi < 25:
        pass
    elif bmi < 30:
        diabetes += 1; heart += 1; bp += 1
    elif bmi < 40:
        diabetes += 2; heart += 2; bp += 2
    else:
        diabetes += 3; heart += 3; bp += 3

    # 3. SLEEP
    sleep = data.get("sleep", "7-8")
    if sleep == "5-6":
        diabetes += 1; heart += 1; bp += 1
    elif sleep == "less_than_5":
        diabetes += 2; heart += 2; bp += 2

    # 4. SMOKING
    smoking = data.get("smoking", "none")
    if smoking == "occasional":
        diabetes += 1; heart += 2; bp += 1
    elif smoking == "regular":
        diabetes += 2; heart += 3; bp += 2
        if is_female:
            heart += 1; bp += 1

    # 5. ALCOHOL
    alcohol = data.get("alcohol", "none")
    if alcohol == "occasional":
        diabetes += 1; heart += 1; bp += 1
    elif alcohol == "regular":
        diabetes += 2; heart += 2; bp += 3
        if is_female:
            heart += 1

    # 6. EXERCISE
    exercise = data.get("exercise", "regular")
    if exercise == "occasional":
        diabetes += 1; heart += 1; bp += 1
    elif exercise == "none":
        diabetes += 2; heart += 2; bp += 2
        if is_female:
            heart += 1

    # 7. DIET TYPE
    diet_type = data.get("diet_type", "healthy")
    if diet_type == "moderate":
        diabetes += 1; heart += 1; bp += 1
    elif diet_type == "poor":
        diabetes += 2; heart += 2; bp += 2

    # 8. VEG / FRUIT
    veg_fruit = data.get("veg_fruit", "daily")
    if veg_fruit == "3_4_week":
        diabetes += 1; heart += 1; bp += 1
    elif veg_fruit == "rarely":
        diabetes += 2; heart += 2; bp += 2

    # 9. JUNK FOOD
    junk_food = data.get("junk_food", "rarely")
    if junk_food == "sometimes":
        diabetes += 1; heart += 1; bp += 1
    elif junk_food == "frequently":
        diabetes += 2; heart += 2; bp += 2

    # 10. SUGAR DRINKS
    sugar_drinks = data.get("sugar_drinks", "rarely")
    if sugar_drinks == "occasionally":
        diabetes += 1; heart += 1; bp += 1
    elif sugar_drinks == "daily":
        diabetes += 2; heart += 1; bp += 1

    # 11. SYMPTOMS
    if data.get("fatigue"):
        diabetes += 2; heart += 1; bp += 1
    if data.get("excessive_thirst"):
        diabetes += 3
    if data.get("dizziness"):
        diabetes += 1; heart += 1; bp += 2
    if data.get("chest_pain"):
        heart += 4; bp += 2
        if is_female:
            heart += 1

    # 12. FAMILY HISTORY
    if data.get("family_history"):
        diabetes += 1; heart += 1; bp += 1

    return {
        "diabetes": {"score": diabetes, "risk": score_to_risk(diabetes)},
        "heart":    {"score": heart,    "risk": score_to_risk(heart)},
        "bp":       {"score": bp,       "risk": score_to_risk(bp)}
    }


def calculate_medical_scores(data):
    diabetes = 0
    heart    = 0
    bp       = 0

    gender    = data.get("gender", "male").lower()
    is_female = (gender == "female")

    # 1. SYSTOLIC BP
    systolic = int(data.get("systolic", 0))
    if systolic < 120:
        pass
    elif systolic <= 129:
        bp += 1
    elif systolic <= 139:
        bp += 2
        if is_female: bp += 1
    elif systolic <= 159:
        bp += 3; heart += 1
        if is_female: bp += 1
    else:
        bp += 4; heart += 2
        if is_female: bp += 1

    # 2. DIASTOLIC BP
    diastolic = int(data.get("diastolic", 0))
    diastolic_score = 0
    if diastolic < 80:
        diastolic_score = 0
    elif diastolic <= 89:
        diastolic_score = 2
        if is_female: diastolic_score += 1
    elif diastolic <= 99:
        diastolic_score = 3
        if is_female: diastolic_score += 1
    else:
        diastolic_score = 4
        if is_female: diastolic_score += 1

    if diastolic_score > bp:
        bp = diastolic_score

    # 3. FASTING GLUCOSE
    glucose = float(data.get("fasting_glucose", 0))
    if glucose < 100:
        pass
    elif glucose <= 125:
        diabetes += 1
        if is_female: diabetes += 1
    else:
        diabetes += 3

    # 4. HbA1c
    hba1c = float(data.get("hba1c", 0))
    if hba1c < 5.7:
        pass
    elif hba1c <= 6.4:
        diabetes += 1
        if is_female: diabetes += 1
    else:
        diabetes += 3

    # 5. CHOLESTEROL
    cholesterol = float(data.get("cholesterol", 0))
    if cholesterol < 200:
        pass
    elif cholesterol <= 239:
        heart += 1; bp += 1
    else:
        heart += 2; bp += 1
        if is_female: heart += 1

    # 6. HEART RATE
    heart_rate = int(data.get("heart_rate", 0))
    if heart_rate < 60:
        heart += 1
    elif heart_rate <= 100:
        pass
    elif heart_rate <= 109:
        heart += 1; bp += 1
    else:
        heart += 2; bp += 2

    return {
        "diabetes": diabetes,
        "heart":    heart,
        "bp":       bp
    }


def predict(data, stage=1):
    lifestyle = calculate_scores(data)

    if stage == 2:
        medical = calculate_medical_scores(data)

        final_diabetes = lifestyle["diabetes"]["score"] + medical["diabetes"]
        final_heart    = lifestyle["heart"]["score"]    + medical["heart"]
        final_bp       = lifestyle["bp"]["score"]       + medical["bp"]

        return {
            "stage": 2,
            "diabetes": {
                "lifestyle_score": lifestyle["diabetes"]["score"],
                "medical_score":   medical["diabetes"],
                "total_score":     final_diabetes,
                "risk":            score_to_risk(final_diabetes)
            },
            "heart": {
                "lifestyle_score": lifestyle["heart"]["score"],
                "medical_score":   medical["heart"],
                "total_score":     final_heart,
                "risk":            score_to_risk(final_heart)
            },
            "bp": {
                "lifestyle_score": lifestyle["bp"]["score"],
                "medical_score":   medical["bp"],
                "total_score":     final_bp,
                "risk":            score_to_risk(final_bp)
            }
        }

    return {
        "stage": 1,
        "diabetes": {
            "lifestyle_score": lifestyle["diabetes"]["score"],
            "medical_score":   0,
            "total_score":     lifestyle["diabetes"]["score"],
            "risk":            lifestyle["diabetes"]["risk"]
        },
        "heart": {
            "lifestyle_score": lifestyle["heart"]["score"],
            "medical_score":   0,
            "total_score":     lifestyle["heart"]["score"],
            "risk":            lifestyle["heart"]["risk"]
        },
        "bp": {
            "lifestyle_score": lifestyle["bp"]["score"],
            "medical_score":   0,
            "total_score":     lifestyle["bp"]["score"],
            "risk":            lifestyle["bp"]["risk"]
        }
    }