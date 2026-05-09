# predict.py
# Complete rule-based disease risk scoring engine
# Based on clinically validated scoring tables with gender adjustments
# Diseases: Diabetes, Heart Disease, Hypertension (BP)
# Supports Stage 1 (lifestyle only) and Stage 2 (lifestyle + medical values)

def _to_str(value, default=""):
    if value is None:
        return default
    return str(value)


def _to_int(value, default=0):
    if value is None or value == "":
        return default
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return default


def _to_float(value, default=0.0):
    if value is None or value == "":
        return default
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _to_bool(value, default=False):
    if value is None:
        return default
    if isinstance(value, bool):
        return value
    s = str(value).strip().lower()
    if s in {"true", "1", "yes", "y", "on"}:
        return True
    if s in {"false", "0", "no", "n", "off"}:
        return False
    return default


def _norm_choice(value, default):
    s = _to_str(value, default).strip().lower()
    return s if s else default


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

    gender = _norm_choice(data.get("gender"), "male")
    is_female = (gender == "female")

    # 1. AGE
    age = _to_int(data.get("age"), 0)
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
    bmi = _to_float(data.get("bmi"), 0.0)
    if bmi < 18.5:
        pass
    elif bmi < 24.9:
        pass
    elif bmi < 29.9:
        diabetes += 2; heart += 1; bp += 1
    elif bmi < 39.9:
        diabetes += 2; heart += 2; bp += 2
    else:
        diabetes += 3; heart += 2; bp += 2

    # 3. SLEEP
    sleep = _norm_choice(data.get("sleep"), "7-8")
    if sleep == "5-6":
        diabetes += 1; heart += 1; bp += 1
    elif sleep == "less_than_5":
        diabetes += 2; heart += 2; bp += 2

    # 4. SMOKING
    smoking = _norm_choice(data.get("smoking"), "none")
    if smoking == "occasional":
        diabetes += 1; heart += 2; bp += 1
    elif smoking == "regular":
        diabetes += 2; heart += 3; bp += 2
        if is_female:
            heart += 1; bp += 1

    # 5. ALCOHOL
    alcohol = _norm_choice(data.get("alcohol"), "none")
    if alcohol == "occasional":
        diabetes += 1; heart += 1; bp += 2
    elif alcohol == "regular":
        diabetes += 2; heart += 2; bp += 3
        if is_female:
            heart += 1

    # 6. EXERCISE
    exercise = _norm_choice(data.get("exercise"), "regular")
    if exercise == "occasional":
        diabetes += 1; heart += 1; bp += 1
    elif exercise == "none":
        diabetes += 2; heart += 2; bp += 2
        if is_female:
            heart += 1

    # 7. DIET TYPE
    diet_type = _norm_choice(data.get("diet_type"), "healthy")
    if diet_type == "moderate":
        diabetes += 1; heart += 1; bp += 1
    elif diet_type == "poor":
        diabetes += 2; heart += 2; bp += 2

    # 8. VEG / FRUIT
    veg_fruit = _norm_choice(data.get("veg_fruit"), "daily")
    if veg_fruit == "3_4_week":
        diabetes += 1; heart += 1; bp += 1
    elif veg_fruit == "rarely":
        diabetes += 2; heart += 2; bp += 2

    # 9. JUNK FOOD
    junk_food = _norm_choice(data.get("junk_food"), "rarely")
    if junk_food == "sometimes":
        diabetes += 1; heart += 1; bp += 1
    elif junk_food == "frequently":
        diabetes += 2; heart += 2; bp += 2

    # 10. SUGAR DRINKS
    sugar_drinks = _norm_choice(data.get("sugar_drinks"), "rarely")
    if sugar_drinks == "occasionally":
        diabetes += 1; heart += 1; bp += 1
    elif sugar_drinks == "daily":
        diabetes += 2; heart += 1; bp += 1

    # 11. SYMPTOMS
    if not _to_bool(data.get("none_of_the_above"), False) and not _to_bool(data.get("none_of_above"), False):
        if _to_bool(data.get("fatigue"), False):
            diabetes += 2; heart += 1; bp += 1
        if _to_bool(data.get("excessive_thirst"), False):
            diabetes += 3
        if _to_bool(data.get("dizziness"), False):
            diabetes += 1; heart += 1; bp += 2
        if _to_bool(data.get("chest_pain"), False):
            heart += 4; bp += 2
            if is_female:
                heart += 1

    # 12. FAMILY HISTORY
    if _to_bool(data.get("family_history"), False):
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

    gender    = _norm_choice(data.get("gender"), "male")
    is_female = (gender == "female")

    # 1. SYSTOLIC BP
    systolic = _to_int(data.get("systolic"), 0)
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
    diastolic = _to_int(data.get("diastolic"), 0)
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
    glucose = _to_float(data.get("fasting_glucose"), 0.0)
    if glucose < 100:
        pass
    elif glucose <= 125:
        diabetes += 1
        if is_female: diabetes += 1
    else:
        diabetes += 3

    # 4. HbA1c
    hba1c = _to_float(data.get("hba1c"), 0.0)
    if hba1c < 5.7:
        pass
    elif hba1c <= 6.4:
        diabetes += 1
        if is_female: diabetes += 1
    else:
        diabetes += 3

    # 5. CHOLESTEROL
    cholesterol = _to_float(data.get("cholesterol"), 0.0)
    if cholesterol < 200:
        pass
    elif cholesterol <= 239:
        heart += 1; bp += 1
    else:
        heart += 2; bp += 1
        if is_female: heart += 1

    # 6. HEART RATE
    heart_rate = _to_int(data.get("heart_rate"), 0)
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
    data = data or {}
    lifestyle = calculate_scores(data)

    stage_int = _to_int(stage, 1)
    if stage_int == 2:
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