
def predict_eta_agent(
    input_df,
    eta_model,
    delay_model,
    ETA_FEATURES,
    DELAY_FEATURES
):

    import numpy as np

    # ETA prediction
    predicted_eta_days = float(
        eta_model.predict(
            input_df[ETA_FEATURES]
        )[0]
    )

    # Baseline ETA
    original_eta_days = float(
        input_df["Baseline_ETA_hours"].iloc[0] / 24
    )

    # ETA difference
    delay_days = (
        predicted_eta_days
        - original_eta_days
    )

    # Delay probability
    delay_probability = float(
        delay_model.predict_proba(
            input_df[DELAY_FEATURES]
        )[:, 1][0]
    )

    # Operational risk
    operational_risk = (
        0.25 * input_df["Operational_Stress"].iloc[0]
        +
        0.20 * input_df["Port_Congestion"].iloc[0]
        +
        0.20 * input_df["Weather_Risk"].iloc[0]
        +
        0.15 * input_df["Carrier_Risk"].iloc[0]
        +
        0.20 * input_df["Geo_Risk"].iloc[0]
    )

    # Hybrid risk
    final_delay_probability = (
        0.4 * delay_probability
        +
        0.6 * operational_risk
    )

    final_delay_probability = min(
        final_delay_probability,
        1.0
    )

    # Risk category
    if final_delay_probability < 0.20:
        delay_risk = "LOW"

    elif final_delay_probability < 0.40:
        delay_risk = "MODERATE"

    elif final_delay_probability < 0.70:
        delay_risk = "HIGH"

    else:
        delay_risk = "CRITICAL"

    # ETA status
    if delay_days > 0.5:
        eta_status = "DELAYED"

    elif delay_days < -0.5:
        eta_status = "EARLY"

    else:
        eta_status = "ON_TIME"

    return {
        "Predicted_ETA_days":
            round(predicted_eta_days, 2),

        "Original_ETA_days":
            round(original_eta_days, 2),

        "Expected_Delay_days":
            round(max(delay_days, 0), 2),

        "Early_Arrival_days":
            round(abs(min(delay_days, 0)), 2),

        "Delay_Probability":
            round(
                final_delay_probability * 100,
                2
            ),

        "Delay_Risk":
            delay_risk,

        "ETA_Status":
            eta_status
    }
