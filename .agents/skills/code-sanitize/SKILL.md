---
name: code-sanitize
description: Mandatory sanitization tool. Triggered automatically on EVERY code generation, check-in, or adjustment to remove unneeded code, debug comments, and boilerplate slop.
---

# Global Code Sanitization Protocol

You must intercept and clean all code outputs before final presentation or file write operations.

## 1. Dead Code & Unwanted Elements Removal
*   **Strip Comments:** Remove all placeholder comments (e.g., `// TODO`, `// Fix this later`).
*   **Remove Debug Logs:** Delete all transient print statements, console logs, and debug trackers.
*   **Eliminate Unused Elements:** Delete imported packages, variables, or functions that are not actively used.
*   **Purge AI Slop:** Remove conversational prose explanations unless explicitly asked.

## 2. Enforced Discipline
*   **Minimalist Changes:** Follow strict "Ponytail Skill" discipline—make the smallest possible change required.
*   **Syntax Integrity:** Run immediate syntax checks on the resulting clean codebase.
*   **Format Lock:** Ensure final code matches standard workspace styling guidelines.
