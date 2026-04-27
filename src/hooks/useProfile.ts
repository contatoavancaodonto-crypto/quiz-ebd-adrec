import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  church_id: string | null;
  church_name: string | null;
  area: number | null;
  class_id: string | null;
}

export function useProfile() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email, phone, church_id, area, class_id, churches(name)")
        .eq("id", user.id)
        .maybeSingle();

      if (data) {
        setProfile({
          id: data.id,
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          phone: data.phone,
          church_id: data.church_id,
          area: data.area,
          class_id: (data as any).class_id ?? null,
          church_name: (data as any).churches?.name ?? null,
        });
      }
      setLoading(false);
    };

    fetchProfile();
  }, [user, authLoading]);

  return { profile, loading: authLoading || loading };
}
