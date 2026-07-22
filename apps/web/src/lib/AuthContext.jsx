import React, { createContext, useContext, useEffect, useState } from "react";
import pb from "@/lib/pocketbaseClient";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(pb.authStore.record);

  useEffect(() => {
    const unsub = pb.authStore.onChange((_t, rec) => setUser(rec));
    return unsub;
  }, []);

  const value = {
    user,
    isAuthed: pb.authStore.isValid,
    role: user?.role || (user ? "customer" : null),
    login: (email, password) => pb.collection("users").authWithPassword(email, password),
    signup: async (data) => {
      await pb.collection("users").create({
        email: data.email,
        password: data.password,
        passwordConfirm: data.password,
        fullName: data.fullName,
        phone: data.phone || "",
        role: "customer",
      });
      return pb.collection("users").authWithPassword(data.email, data.password);
    },
    forgot: (email) => pb.collection("users").requestPasswordReset(email),
    logout: () => pb.authStore.clear(),
  };

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
