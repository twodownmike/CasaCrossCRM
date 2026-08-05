-- Freeze the signed document per signer on open contracts.
-- body_md_snapshot stores the contract body with the signer's typed name
-- substituted in at the moment of signing, so the artifact each person
-- agreed to survives later edits to the contract body.

alter table public.contract_signatures
  add column if not exists body_md_snapshot text;

create or replace function public.sign_open_contract(
  token text,
  signer_name text,
  signer_email_in text,
  signature_url_in text,
  signer_ip_in text,
  signer_ua_in text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  rec public.contracts%rowtype;
  sig_id uuid;
  snapshot text;
begin
  select * into rec
    from public.contracts
   where share_token = token
     and kind = 'open'
     and status = 'sent'
   for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'This link is no longer open for signatures.');
  end if;

  if signer_email_in is not null and signer_email_in <> '' then
    if exists (
      select 1 from public.contract_signatures
       where contract_id = rec.id
         and lower(signer_email) = lower(signer_email_in)
    ) then
      return jsonb_build_object('ok', false, 'error', 'This email address has already signed this agreement.');
    end if;
  end if;

  snapshot := replace(
    replace(rec.body_md, '{{participant_name}}', signer_name),
    '{{participant_legal_name}}', signer_name
  );

  insert into public.contract_signatures
    (contract_id, signed_name, signer_email, signature_url, signer_ip, signer_ua, body_md_snapshot)
  values
    (rec.id, signer_name, nullif(signer_email_in, ''), signature_url_in, signer_ip_in, signer_ua_in, snapshot)
  returning id into sig_id;

  update public.contracts
     set opened_at = coalesce(opened_at, now())
   where id = rec.id;

  return jsonb_build_object('ok', true, 'id', rec.id, 'signature_id', sig_id);
end;
$$;

revoke all on function public.sign_open_contract(text, text, text, text, text, text) from public;
grant execute on function public.sign_open_contract(text, text, text, text, text, text) to anon, authenticated;
