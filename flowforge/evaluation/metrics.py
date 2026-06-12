from typing import Dict, List, Any

def calculate_precision(tp: int, fp: int) -> float:
    if tp + fp == 0:
        return 1.0
    return tp / (tp + fp)

def calculate_recall(tp: int, fn: int) -> float:
    if tp + fn == 0:
        return 1.0
    return tp / (tp + fn)

def calculate_f1(precision: float, recall: float) -> float:
    if precision + recall == 0.0:
        return 0.0
    return 2 * (precision * recall) / (precision + recall)

def calculate_accuracy(correct: int, total: int) -> float:
    if total == 0:
        return 1.0
    return correct / total

def compute_evaluation_report(trials: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Computes summary metrics from a list of validation trials.
    Each trial contains:
        {
            "injected": bool,
            "detected": bool,
            "expected_type": str,
            "diagnosed_type": str,
            "expected_severity": str,
            "diagnosed_severity": str,
            "latency_ms": float
        }
    """
    total = len(trials)
    if total == 0:
        return {}
        
    tp = 0
    fp = 0
    fn = 0
    tn = 0
    
    correct_diagnosis = 0
    correct_severity = 0
    latencies = []
    
    for t in trials:
        injected = t["injected"]
        detected = t["detected"]
        
        # Classification for anomaly detection
        if injected and detected:
            tp += 1
        elif not injected and detected:
            fp += 1
        elif injected and not detected:
            fn += 1
        else:
            tn += 1
            
        # Diagnosis metrics (only relevant if detected and injected)
        if injected and detected:
            if t["expected_type"] == t["diagnosed_type"]:
                correct_diagnosis += 1
            if t["expected_severity"] == t["diagnosed_severity"]:
                correct_severity += 1
                
        latencies.append(t.get("latency_ms", 0.0))
        
    precision = calculate_precision(tp, fp)
    recall = calculate_recall(tp, fn)
    f1 = calculate_f1(precision, recall)
    
    detection_accuracy = calculate_accuracy(tp + tn, total)
    diagnosis_accuracy = calculate_accuracy(correct_diagnosis, tp) if tp > 0 else 1.0
    severity_accuracy = calculate_accuracy(correct_severity, tp) if tp > 0 else 1.0
    avg_latency = sum(latencies) / len(latencies) if latencies else 0.0
    
    return {
        "total_trials": total,
        "true_positives": tp,
        "false_positives": fp,
        "false_negatives": fn,
        "true_negatives": tn,
        "detection_precision": round(precision, 4),
        "detection_recall": round(recall, 4),
        "detection_f1": round(f1, 4),
        "detection_accuracy": round(detection_accuracy, 4),
        "diagnosis_accuracy": round(diagnosis_accuracy, 4),
        "severity_classification_accuracy": round(severity_accuracy, 4),
        "average_resolution_time_ms": round(avg_latency, 2)
    }
