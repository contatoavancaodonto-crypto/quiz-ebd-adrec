---
name: Admin Dashboard
description: Hidden admin route /painel-ebd-2025 with sidebar layout and full CRUD modules (users, churches, classes, quizzes, seasons, attempts, badges, verses, materials).
type: feature
---

The admin panel lives at `/painel-ebd-2025` and uses a dedicated sidebar layout (`AdminLayout` + `AdminSidebar` + `AdminGuard`).

Access is restricted to users with the `admin` role (checked via `has_role` RPC); non-admins are redirected to `/`.

Sub-routes:
- `/painel-ebd-2025` — Overview (counts of users, churches, classes, attempts, badges, verses, active season)
- `/usuarios` — Promote/remove admin role on profiles
- `/igrejas` — Approve church requests, create/edit/soft-deactivate churches
- `/turmas` — Create/edit/soft-deactivate classes (`active` flag)
- `/quizzes` — CRUD quizzes (soft toggle `active`) + nested questions manager: add single, bulk import via TXT (P/A/B/C/D/R/E format, `---` separator), and "Apagar tudo" — all use **soft-delete** (`questions.active=false`) to preserve historical attempts/gabarito. Questions list realtime-syncs via supabase channel filtered by quiz_id.
- `/temporadas` — Create new seasons, close active season (triggers badges)
- `/tentativas` — View last 500 attempts; admin can DELETE attempts
- `/badges` — CRUD badges (soft `active` toggle)
- `/versiculos` — CRUD verses (soft `active` toggle)
- `/materiais` — Reuses existing `ClassMaterialsManager`

Soft-delete: `churches`, `classes`, `participants`, `verses`, `badges`, `questions` have `active BOOLEAN DEFAULT true`. Quizzes already had `active`. Quiz.tsx filters `questions.active=true` so hidden questions never reach students.

Real DELETE allowed only for: `quiz_attempts` (admin).
