import { useEffect, useState } from "react";
import { Text, View } from "react-native";

import { signOut } from "@/components/sign-out-button";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { shortName } from "@/lib/names";
import { supabase } from "@/lib/supabase";

type Account = { fullName: string | null; email: string; coopName: string | null };

// Same layout as the commuter Account tab, plus the coop; signOut also ends a running trip.
export default function DriverAccount() {
  const [account, setAccount] = useState<Account | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getSession();
      if (!auth.session) return; // the root layout's guard sends logged-out users to sign-in
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, coop:coops(name)")
        .eq("id", auth.session.user.id)
        .single();
      if (error) return setError(error.message);
      const coop = data.coop as unknown as { name: string } | null;
      setAccount({
        fullName: data.full_name,
        email: auth.session.user.email ?? "",
        coopName: coop?.name ?? null,
      });
    })();
  }, [attempt]);

  return (
    <View className="flex-1 gap-6 bg-background p-6">
      {error ? (
        <ErrorState
          message={`Could not load your account: ${error}`}
          onRetry={() => {
            setError(null);
            setAttempt((n) => n + 1);
          }}
        />
      ) : account ? (
        <View className="gap-1">
          <Text className="text-2xl font-semibold text-foreground">
            {account.fullName ?? "No name set"}
          </Text>
          <Text className="text-muted">{account.email}</Text>
          <Text className="mt-2 text-foreground">{account.coopName ?? "No coop set"}</Text>
          <Text className="text-muted">Riders see you as {shortName(account.fullName)}</Text>
        </View>
      ) : (
        <LoadingState />
      )}
      <Button label="Sign out" variant="outline" onPress={signOut} />
    </View>
  );
}
