import AsyncStorage from "@react-native-async-storage/async-storage";

// shortcut: the flag lives on this phone only (Decisions D2), move it to the database if drivers switch phones.
const KEY = "larga.wantsDriver";

export async function getWantsDriver(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(KEY)) === "true";
  } catch {
    return false;
  }
}

// A lost write only skips the Waiting screen (the driver lands on commuter Home), so it never blocks navigation.
export async function setWantsDriver(v: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, String(v));
  } catch {}
}
