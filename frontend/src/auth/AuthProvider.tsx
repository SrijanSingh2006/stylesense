import React, { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "./state";
import { refreshSession, api } from "../services/api";
import { useCartStore } from "../store/useCartStore";
import { useUserStore, GUEST_USER } from "../store/useUserStore";
export function AuthProvider({ children }: React.PropsWithChildren) {
  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);
  const query = useQueryClient();
  const previous = useRef<number | null>(null);
  const [readyFor, setReadyFor] = useState<number | null>(null);
  useEffect(() => {
    try {
      localStorage.removeItem("stylesense-user-storage");
    } catch {
      /* Auth does not require localStorage. */
    }
    refreshSession().catch(() => {});
  }, []);
  useEffect(() => {
    let cancelled = false;
    if (previous.current !== (user?.id ?? null)) query.clear();
    if (user) {
      useUserStore
        .getState()
        .setCurrentUser({
          ...GUEST_USER,
          id: user.customer_id || 0,
          display_name: user.full_name,
        });
      useCartStore.getState().connect(user);
      if (user.customer_id && user.permissions.includes("preferences.manage"))
        api
          .get("/users/me/preferences")
          .then(({ data }) => {
            if (!cancelled)
              useUserStore
                .getState()
                .setCurrentUser({
                  id: user.customer_id!,
                  display_name: user.full_name,
                  ...data,
                });
          })
          .catch(() => {});
    } else {
      useUserStore.getState().setCurrentUser(GUEST_USER);
      if (previous.current !== null) useCartStore.getState().resetLocal();
    }
    previous.current = user?.id ?? null;
    setReadyFor(user?.id ?? null);
    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.full_name, user?.role, query]);
  if (status === "restoring")
    return (
      <div role="status" className="p-12 text-center">
        Restoring your secure session…
      </div>
    );
  if (readyFor !== (user?.id ?? null))
    return (
      <div role="status" className="p-12 text-center">
        Opening your account…
      </div>
    );
  return <React.Fragment key={user?.id ?? "guest"}>{children}</React.Fragment>;
}
