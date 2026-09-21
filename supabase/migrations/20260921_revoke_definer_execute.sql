-- Keep helper RPCs off the anon API; RLS still uses them as authenticated.
revoke execute on function public.enforce_profile_update() from public, anon, authenticated;
revoke execute on function public.enforce_role_update() from public, anon, authenticated;
revoke execute on function public.enforce_ticket_update() from public, anon, authenticated;

revoke execute on function public.is_superadmin() from public, anon;
revoke execute on function public.is_admin() from public, anon;
revoke execute on function public.is_staff() from public, anon;

grant execute on function public.is_superadmin() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_staff() to authenticated;
