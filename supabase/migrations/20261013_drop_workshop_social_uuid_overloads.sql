-- PostgREST cannot pick between toggle_workshop_save(text) and
-- toggle_workshop_save(uuid) when the client sends a UUID string.
-- Keep the text overloads (they resolve share ids and uuids).

drop function if exists public.toggle_workshop_save(uuid);
drop function if exists public.toggle_workshop_like(uuid);
