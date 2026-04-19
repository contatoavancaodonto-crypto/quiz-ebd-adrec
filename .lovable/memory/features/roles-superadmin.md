---
name: Roles & Superadmin
description: Two-tier role system. superadmin (global, manages roles), admin (church-scoped via user_roles.church_id). Only superadmin can promote/demote.
type: feature
---

Enum `app_role` has: `superadmin`, `admin`, `moderator`, `user`.

`user_roles` table now has `church_id UUID NULL REFERENCES churches(id)`.
- `superadmin`: church_id = NULL, full access, only role that manages other roles.
- `admin`: church_id = required, scoped to that church.

RLS on `user_roles`: only `has_role(auth.uid(),'superadmin')` can SELECT all / INSERT / UPDATE / DELETE. Users still see their own roles.

Helper SQL function: `current_admin_church_id()` returns the church_id of the logged-in church admin (NULL otherwise).

Frontend:
- `useRoles()` hook → `{ isSuperadmin, isChurchAdmin, isAdmin, churchId }`, realtime via user_roles channel.
- `AdminGuard` allows admin OR superadmin.
- `AdminSidebar` hides superadmin-only items (Usuários, Igrejas, Turmas, Quizzes, Temporadas, Badges, Versículos) for church admins. They see Visão Geral, Tentativas, Materiais.
- `AdminUsers` page only renders for superadmin (Navigate redirect otherwise). Promote dialog asks role + church.

Bootstrap superadmin: `contatoavancaodonto@gmail.com` (user id `b9f228cf-a022-40a9-be07-b519bf0319e3`).
