-- No changes needed to the table structure, but we'll use 'admin' as a value for the scope column
-- We can also add an index to scope if it's not already there for performance
CREATE INDEX IF NOT EXISTS idx_notifications_scope ON public.notifications(scope);
