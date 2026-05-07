
-- Enable RLS on realtime.messages and add policies that scope subscriptions by topic.
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies first so this migration is idempotent
DROP POLICY IF EXISTS "Authenticated can subscribe to allowed topics" ON realtime.messages;
DROP POLICY IF EXISTS "Admins can subscribe to admin topics" ON realtime.messages;

-- Allowed topic patterns for any authenticated user:
--  * public:*                — broadcast channels (rankings, quiz status, daily verse, etc.)
--  * user:<auth.uid()>:*     — channels addressed to the caller themselves
--  * notifications:<auth.uid()>:* — per-user notification channels
CREATE POLICY "Authenticated can subscribe to allowed topics"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  realtime.topic() LIKE 'public:%'
  OR realtime.topic() LIKE ('user:' || auth.uid()::text || ':%')
  OR realtime.topic() = ('user:' || auth.uid()::text)
  OR realtime.topic() LIKE ('notifications:' || auth.uid()::text || ':%')
  OR realtime.topic() = ('notifications:' || auth.uid()::text)
);

-- Admins / superadmins additionally get admin-scoped channels (moderation, support, etc.)
CREATE POLICY "Admins can subscribe to admin topics"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  (realtime.topic() LIKE 'admin:%' OR realtime.topic() LIKE 'moderation:%' OR realtime.topic() LIKE 'support:%')
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'superadmin'))
);
