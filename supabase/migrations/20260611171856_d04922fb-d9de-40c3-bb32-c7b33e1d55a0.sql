REVOKE EXECUTE ON FUNCTION public.is_room_owner(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_room_owner(uuid, uuid) TO authenticated, service_role;