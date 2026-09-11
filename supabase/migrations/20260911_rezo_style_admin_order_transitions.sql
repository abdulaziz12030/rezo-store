-- REZO STYLE — audited admin order transitions
-- Payment state remains provider-controlled. Admins may only advance fulfillment
-- after a verified payment, or cancel an unpaid order via the safe cancellation primitive.

create or replace function public.rezo_style_admin_advance_order(
  p_order_id uuid,
  p_target_status text,
  p_actor_user_id uuid,
  p_note text default null
)
returns public.orders
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_before public.orders%rowtype;
  v_after public.orders%rowtype;
  v_fulfillment text;
begin
  if p_actor_user_id is null then
    raise exception 'admin_actor_required';
  end if;

  select * into v_before
  from public.orders
  where id = p_order_id
  for update;

  if not found then raise exception 'order_not_found'; end if;
  if v_before.status = 'cancelled' then raise exception 'order_cancelled'; end if;
  if v_before.payment_status <> 'paid' then raise exception 'verified_payment_required'; end if;

  if p_target_status = v_before.status then
    return v_before;
  end if;

  case p_target_status
    when 'processing' then
      if v_before.status <> 'paid' then raise exception 'invalid_order_transition'; end if;
      v_fulfillment := 'processing';
    when 'ready_to_ship' then
      if v_before.status <> 'processing' then raise exception 'invalid_order_transition'; end if;
      v_fulfillment := 'ready';
    when 'shipped' then
      if v_before.status <> 'ready_to_ship' then raise exception 'invalid_order_transition'; end if;
      v_fulfillment := 'shipped';
    when 'completed' then
      if v_before.status <> 'shipped' then raise exception 'invalid_order_transition'; end if;
      v_fulfillment := 'delivered';
    else
      raise exception 'unsupported_target_status';
  end case;

  update public.orders
  set status = p_target_status,
      fulfillment_status = v_fulfillment,
      completed_at = case when p_target_status = 'completed' then coalesce(completed_at, now()) else completed_at end,
      admin_note = case
        when nullif(trim(coalesce(p_note,'')),'') is null then admin_note
        else concat_ws(E'\n', nullif(admin_note,''), trim(p_note))
      end
  where id = p_order_id
  returning * into v_after;

  insert into public.admin_audit_logs(
    actor_user_id, action, entity_type, entity_id, before_data, after_data, metadata
  ) values (
    p_actor_user_id,
    'order_status_change',
    'order',
    p_order_id::text,
    jsonb_build_object(
      'status', v_before.status,
      'payment_status', v_before.payment_status,
      'fulfillment_status', v_before.fulfillment_status
    ),
    jsonb_build_object(
      'status', v_after.status,
      'payment_status', v_after.payment_status,
      'fulfillment_status', v_after.fulfillment_status
    ),
    jsonb_build_object('note', nullif(trim(coalesce(p_note,'')),''))
  );

  return v_after;
end;
$$;

create or replace function public.rezo_style_admin_cancel_unpaid_order(
  p_order_id uuid,
  p_actor_user_id uuid,
  p_reason text default null
)
returns public.orders
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_before public.orders%rowtype;
  v_after public.orders%rowtype;
begin
  if p_actor_user_id is null then
    raise exception 'admin_actor_required';
  end if;

  select * into v_before
  from public.orders
  where id = p_order_id;

  if not found then raise exception 'order_not_found'; end if;

  v_after := public.rezo_style_cancel_unpaid_order(p_order_id, p_reason);

  if v_before.status <> 'cancelled' then
    insert into public.admin_audit_logs(
      actor_user_id, action, entity_type, entity_id, before_data, after_data, metadata
    ) values (
      p_actor_user_id,
      'order_cancel',
      'order',
      p_order_id::text,
      jsonb_build_object(
        'status', v_before.status,
        'payment_status', v_before.payment_status,
        'fulfillment_status', v_before.fulfillment_status
      ),
      jsonb_build_object(
        'status', v_after.status,
        'payment_status', v_after.payment_status,
        'fulfillment_status', v_after.fulfillment_status
      ),
      jsonb_build_object('reason', nullif(trim(coalesce(p_reason,'')),''))
    );
  end if;

  return v_after;
end;
$$;

revoke all on function public.rezo_style_admin_advance_order(uuid,text,uuid,text) from public, anon, authenticated;
revoke all on function public.rezo_style_admin_cancel_unpaid_order(uuid,uuid,text) from public, anon, authenticated;
grant execute on function public.rezo_style_admin_advance_order(uuid,text,uuid,text) to service_role;
grant execute on function public.rezo_style_admin_cancel_unpaid_order(uuid,uuid,text) to service_role;
