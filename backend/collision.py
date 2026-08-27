from datetime import datetime


def analyze_workload(tasks, availability):

    required_hours = sum(task["hours"] for task in tasks)
    available_hours = sum(availability.values())

    deficit = required_hours - available_hours

    high_difficulty_count = sum(
        1 for task in tasks
        if task["difficulty"].lower() == "high"
    )

    # Convert due dates from strings into real dates
    due_dates = []

    for task in tasks:
        due_date = datetime.strptime(
            task["due_date"],
            "%Y-%m-%d"
        )

        due_dates.append(due_date)

    # Sort dates from earliest to latest
    due_dates.sort()

    collision_detected = False

    # Check whether any two deadlines are within 2 days
    for i in range(len(due_dates) - 1):
        difference = due_dates[i + 1] - due_dates[i]

        if difference.days <= 2:
            collision_detected = True

    # Determine risk
    if deficit > 5 or high_difficulty_count >= 2 or collision_detected:
        risk = "HIGH"
    elif deficit > 0:
        risk = "MEDIUM"
    else:
        risk = "LOW"

    return {
        "required_hours": required_hours,
        "available_hours": available_hours,
        "deficit": deficit,
        "high_difficulty_tasks": high_difficulty_count,
        "collision_detected": collision_detected,
        "risk": risk
    }