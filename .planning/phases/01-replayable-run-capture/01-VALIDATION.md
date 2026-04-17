---
phase: 1
slug: replayable-run-capture
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-13
---

# Phase 1 - Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | other (TypeScript compiler gate plus targeted `tsx` smoke commands) |
| **Config file** | `tsconfig.json` |
| **Quick run command** | `npm run lint` |
| **Full suite command** | `npm run lint` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run lint`
- **After every plan wave:** Run `npm run lint`
- **Before `$gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 1 | DATA-01, DATA-05 | static + import smoke | `npm run lint` | ✅ | ⬜ pending |
| 1-02-01 | 02 | 2 | DATA-02, DATA-03, DATA-04 | static | `npm run lint` | ✅ | ⬜ pending |
| 1-03-01 | 03 | 3 | DATA-01, DATA-02, DATA-03, DATA-04, DATA-05 | integration + schema smoke | `npm run lint` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Existing browser flow still feels unchanged after capture is added | DATA-02, DATA-03, DATA-04, DATA-05 | The single-run UX is rendered in the browser, while this phase mainly changes server internals | Start the app, submit one known FASTA/question pair, confirm the right-hand report still renders and the response shape matches the pre-phase surface |

---

## Validation Sign-Off

- [x] All tasks have automated verify commands or existing infrastructure support
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all missing references
- [x] No watch-mode flags
- [x] Feedback latency < 10s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending 2026-04-13
