-- Track the first time a recipient opens an e-sign link.
-- The document status remains sent until it is signed/voided; CRM views derive
-- an "Opened" display state from opened_at.

alter type contract_status add value if not exists 'opened';

alter table public.contracts
  add column if not exists opened_at timestamptz;
