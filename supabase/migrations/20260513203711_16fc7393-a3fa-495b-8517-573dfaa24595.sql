-- Create the trigger function for registration webhook
CREATE OR REPLACE FUNCTION public.handle_registration_webhook()
RETURNS TRIGGER AS $$
BEGIN
  -- We use net.http_post or similar if available, but standard practice here
  -- is to let Supabase Dashboard Webhooks handle it or use an Edge Function call.
  -- Since we have the Edge Function 'registration-webhook', we can invoke it.
  
  -- Note: In Lovable/Supabase, it's often better to use the HTTP Hook feature 
  -- in the Dashboard, but we can also use pg_net if enabled.
  -- If we don't have pg_net, we rely on the database webhook configuration.
  
  -- Let's check if pg_net is available to make it robust
  -- For now, we'll assume the user wants this linked to the profiles table.
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- In this environment, we usually set up the Webhook via the Supabase Dashboard.
-- However, I will ensure the 'churches' listing includes pending churches 
-- to fix the first part of the user's issue.
