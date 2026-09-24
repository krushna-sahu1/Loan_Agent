create or replace function private.protect_application_fields()
returns trigger
language plpgsql
set search_path = ''
as $function$
begin
  if current_setting('loan_agent.allow_risk_write', true) = 'on' then
    return new;
  end if;
  if not private.is_admin() then
    new.user_id := old.user_id;
    new.status := old.status;
    new.risk_level := old.risk_level;
    new.risk_probability := old.risk_probability;
    new.jev_confidence := old.jev_confidence;
    new.jev_model := old.jev_model;
    new.assessed_at := old.assessed_at;
    new.decided_at := old.decided_at;
  end if;
  return new;
end;
$function$;

create or replace function public.save_loan_assessment(
  p_id bigint,
  p_risk_level text,
  p_risk_probability numeric,
  p_jev_confidence numeric,
  p_jev_model text
)
returns public.loan_applications
language plpgsql
security definer
set search_path = ''
as $function$
declare
  rec public.loan_applications;
begin
  if not private.is_admin() then
    raise exception 'Only admins can save Jev assessments';
  end if;

  if p_risk_level is null or p_risk_level not in ('low', 'medium', 'high') then
    raise exception 'Invalid risk level';
  end if;

  perform set_config('loan_agent.allow_risk_write', 'on', true);

  update public.loan_applications
  set
    risk_level = p_risk_level,
    risk_probability = p_risk_probability,
    jev_confidence = p_jev_confidence,
    jev_model = p_jev_model,
    assessed_at = now()
  where id = p_id
  returning * into rec;

  if rec.id is null then
    raise exception 'Application not found';
  end if;

  return rec;
end;
$function$;

revoke all on function public.save_loan_assessment(bigint, text, numeric, numeric, text) from public;
grant execute on function public.save_loan_assessment(bigint, text, numeric, numeric, text) to authenticated;
