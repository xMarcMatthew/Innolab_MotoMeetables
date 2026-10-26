import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { endTrip, isOnTrip } from "@/lib/trip";

// End a running trip first: once signed out, the GPS task could no longer send, but would keep running.
export async function signOut() {
  if (await isOnTrip()) await endTrip().catch(() => {});
  await supabase.auth.signOut();
}

// The root layout's guard sees the session end and moves to sign-in.
export function SignOutButton() {
  return <Button label="Sign out" variant="link" onPress={signOut} />;
}
