import { useSyncExternalStore } from "react";

/** True after hydration on the client; false during SSR. */
export function useClientMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}
