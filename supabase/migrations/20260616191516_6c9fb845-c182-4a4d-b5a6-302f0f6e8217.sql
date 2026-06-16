
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_registration() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.enqueue_registration_webhook() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_registration_webhook() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_post_comment() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.on_auth_user_created() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_welcome_email_trigger() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.on_profile_created_send_welcome() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_registration_and_updates() FROM anon, authenticated, public;
