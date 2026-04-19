import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { CompleteProfileModal } from "@/components/CompleteProfileModal";

/**
 * Global gate: after authentication, checks if the user's profile has
 * the required fields (phone, area, church_id). If not, forces the
 * complete-profile modal to appear before allowing access to the app.
 */
export const ProfileGate = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [needsCompletion, setNeedsCompletion] = useState(false);
  const [checking, setChecking] = useState(false);

  const check = async (uid: string) => {
    setChecking(true);
    const { data } = await supabase
      .from("profiles")
      .select("phone, area, church_id")
      .eq("id", uid)
      .maybeSingle();
    const incomplete = !data || !data.phone || !data.area || !data.church_id;
    setNeedsCompletion(incomplete);
    setChecking(false);
  };

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setNeedsCompletion(false);
      return;
    }
    check(user.id);
  }, [user, loading]);

  // Don't show the modal on the auth page itself
  if (!user || loading || checking) return null;
  if (location.pathname === "/auth") return null;

  return (
    <CompleteProfileModal
      open={needsCompletion}
      userId={user.id}
      onCompleted={() => setNeedsCompletion(false)}
    />
  );
};
