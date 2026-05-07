// form.js
const formState = {
    currentStep: 1,
    totalSteps: 0,
    stage: 1,
    isSubmitting: false,
};

function getSteps() {
    return document.querySelectorAll(".form-step");
}

function showStep(stepNumber) {
    const steps = getSteps();
    steps.forEach((step, index) => {
        step.classList.toggle("form-step--active", index + 1 === stepNumber);
    });
    formState.currentStep = stepNumber;
    updateProgressBar();
    updateNavButtons();
    scrollToFormTop();
}

function nextStep() {
    if (!validateCurrentStep()) return;
    const steps = getSteps();
    if (formState.currentStep < steps.length) {
        showStep(formState.currentStep + 1);
    }
}

function prevStep() {
    if (formState.currentStep > 1) {
        showStep(formState.currentStep - 1);
    }
}

function scrollToFormTop() {
    const form = document.getElementById("multiStepForm");
    if (form) form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function updateProgressBar() {
    const steps = getSteps();
    const total = steps.length;
    const current = formState.currentStep;
    const percentage = Math.round((current / total) * 100);

    const bar = document.getElementById("progressFill");
    if (bar) bar.style.width = percentage + "%";

    const counter = document.getElementById("stepCounter");
    if (counter) counter.textContent = `Step ${current} of ${total}`;

    const percentEl = document.getElementById("progressPercent");
    if (percentEl) percentEl.textContent = percentage + "%";

    document.querySelectorAll(".progress-dot").forEach((dot, index) => {
        dot.classList.remove("progress-dot--active", "progress-dot--done");
        if (index + 1 === current) {
            dot.classList.add("progress-dot--active");
        } else if (index + 1 < current) {
            dot.classList.add("progress-dot--done");
        }
    });
}

function updateNavButtons() {
    const steps = getSteps();
    const backBtn = document.getElementById("backBtn");
    const nextBtn = document.getElementById("nextBtn");
    const submitBtn = document.getElementById("submitBtn");
    const isLast = formState.currentStep === steps.length;
    const isFirst = formState.currentStep === 1;

    if (backBtn) backBtn.style.display = isFirst ? "none" : "inline-flex";
    if (nextBtn) nextBtn.style.display = isLast ? "none" : "inline-flex";
    if (submitBtn) submitBtn.style.display = isLast ? "inline-flex" : "none";
}

function validateCurrentStep() {
    const steps = getSteps();
    const currentStep = steps[formState.currentStep - 1];
    if (!currentStep) return true;

    let isValid = true;

    currentStep.querySelectorAll(".field-error").forEach(el => el.remove());
    currentStep.querySelectorAll(".input-error").forEach(el => {
        el.classList.remove("input-error");
    });

    const requiredFields = currentStep.querySelectorAll("input[required], select[required]");
    requiredFields.forEach(field => {
        if (field.type === "radio") return;
        const value = field.value.trim();
        if (!value) {
            markFieldError(field, "This field is required.");
            isValid = false;
            return;
        }
        if (field.type === "number") {
            const min = parseFloat(field.min);
            const max = parseFloat(field.max);
            const val = parseFloat(value);
            if (!isNaN(min) && val < min) {
                markFieldError(field, `Minimum value is ${min}.`);
                isValid = false;
                return;
            }
            if (!isNaN(max) && val > max) {
                markFieldError(field, `Maximum value is ${max}.`);
                isValid = false;
                return;
            }
        }
    });

    const radioGroups = new Set();
    currentStep.querySelectorAll("input[type='radio'][required]").forEach(radio => {
        radioGroups.add(radio.name);
    });

    radioGroups.forEach(groupName => {
        const checked = currentStep.querySelector(`input[name="${groupName}"]:checked`);
        if (!checked) {
            const group = currentStep.querySelector(`input[name="${groupName}"]`);
            if (group) markFieldError(group, "Please select an option.");
            isValid = false;
        }
    });

    if (!isValid) {
        const firstError = currentStep.querySelector(".field-error");
        firstError?.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    return isValid;
}

function markFieldError(field, message) {
    field.classList.add("input-error");
    const error = document.createElement("span");
    error.className = "field-error";
    error.textContent = message;
    const parent = field.closest(".form-group") || field.parentElement;
    parent.appendChild(error);
}

function initBmiCalculator() {
    const heightInput = document.getElementById("height");
    const weightInput = document.getElementById("weight");
    const bmiInput = document.getElementById("bmi");
    const bmiLabel = document.getElementById("bmiCategory");

    if (!heightInput || !weightInput || !bmiInput) return;

    function calculateBmi() {
        const heightCm = parseFloat(heightInput.value);
        const weightKg = parseFloat(weightInput.value);

        if (!heightCm || !weightKg || heightCm <= 0 || weightKg <= 0) {
            bmiInput.value = "";
            if (bmiLabel) bmiLabel.textContent = "";
            return;
        }

        const heightM = heightCm / 100;
        const bmi = weightKg / (heightM * heightM);
        const rounded = Math.round(bmi * 10) / 10;
        bmiInput.value = rounded;

        if (bmiLabel) {
            let category = "";
            let color = "";
            if (bmi < 18.5) { category = "Underweight"; color = "#3b82f6"; }
            else if (bmi < 25) { category = "Normal"; color = "#00e5a0"; }
            else if (bmi < 30) { category = "Overweight"; color = "#f5c842"; }
            else if (bmi < 40) { category = "Obese"; color = "#ff8c42"; }
            else { category = "Severely Obese"; color = "#ff4d6d"; }

            bmiLabel.textContent = `BMI ${rounded} — ${category}`;
            bmiLabel.style.color = color;
            bmiLabel.style.fontWeight = "600";
        }
    }

    heightInput.addEventListener("input", calculateBmi);
    weightInput.addEventListener("input", calculateBmi);
}

function initSymptomCounter() {
    const symptomBoxes = document.querySelectorAll(".symptom-checkbox");
    const counter = document.getElementById("symptomCount");
    if (!symptomBoxes.length || !counter) return;

    function updateCount() {
        const checked = document.querySelectorAll(".symptom-checkbox:checked").length;
        counter.textContent = `${checked} symptom${checked !== 1 ? "s" : ""} selected`;
        counter.style.color = checked > 0 ? "#ff4d6d" : "#6b7280";
    }

    symptomBoxes.forEach(box => box.addEventListener("change", updateCount));
    updateCount();
}

function initCardOptions() {
    document.querySelectorAll(".option-card").forEach(card => {
        card.addEventListener("click", () => {
            const radio = card.querySelector("input[type='radio']");
            if (!radio) return;

            const group = document.querySelectorAll(`input[name="${radio.name}"]`);
            group.forEach(r => {
                r.checked = false;
                r.closest(".option-card")?.classList.remove("option-card--selected");
            });

            radio.checked = true;
            card.classList.add("option-card--selected");
        });
    });
}

function initFormSubmission() {
    const submitBtn = document.getElementById("submitBtn");
    const form = document.getElementById("multiStepForm");
    if (!submitBtn || !form) return;

    submitBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        if (!validateCurrentStep()) return;
        if (formState.isSubmitting) return;

        formState.isSubmitting = true;
        submitBtn.disabled = true;
        submitBtn.textContent = "Analyzing...";

        const overlay = document.getElementById("loadingOverlay");
        if (overlay) overlay.style.display = "flex";

        try {
            const formData = collectFormData(form);
            const response = await fetch(`/predict/stage${formState.stage}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!response.ok) throw new Error("Prediction failed");

            const data = await response.json();
            sessionStorage.setItem("predictionResult", JSON.stringify(data));
            window.location.href = "/results";

        } catch (err) {
            console.error("Submission error:", err);
            showFormError("Something went wrong. Please try again.");
            submitBtn.disabled = false;
            submitBtn.textContent = "🔍 Get My Results";
            formState.isSubmitting = false;
            if (overlay) overlay.style.display = "none";
        }
    });
}

function collectFormData(form) {
    const data = {};
    Array.from(form.elements).forEach(el => {
        if (!el.name || el.disabled) return;
        if (el.type === "radio") {
            if (el.checked) data[el.name] = el.value;
        } else if (el.type === "checkbox") {
            data[el.name] = el.checked;
        } else if (el.type === "number") {
            data[el.name] = el.value ? parseFloat(el.value) : null;
        } else {
            data[el.name] = el.value.trim();
        }
    });
    data.stage = formState.stage;
    return data;
}

function showFormError(message) {
    const existing = document.getElementById("formGlobalError");
    if (existing) existing.remove();

    const err = document.createElement("div");
    err.id = "formGlobalError";
    err.className = "form-global-error";
    err.textContent = message;

    const form = document.getElementById("multiStepForm");
    form?.prepend(err);
    err.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => err.remove(), 5000);
}

document.addEventListener("DOMContentLoaded", () => {
    const steps = getSteps();
    if (!steps.length) return;

    formState.totalSteps = steps.length;

    const form = document.getElementById("multiStepForm");
    if (form) formState.stage = parseInt(form.dataset.stage || "1", 10);

    document.getElementById("nextBtn")?.addEventListener("click", nextStep);
    document.getElementById("backBtn")?.addEventListener("click", prevStep);

    initBmiCalculator();
    initSymptomCounter();
    initCardOptions();
    initFormSubmission();

    showStep(1);
});