-- Per-event role description on participants.
-- e.g. a vendor might be a "florist" generally, but "ceremony arch + reception
-- centerpieces" for this specific shoot.

alter table public.participants
  add column if not exists role_note text;
