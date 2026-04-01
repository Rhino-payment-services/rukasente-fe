"use client";

import { createContext, useContext } from "react";

type BorrowerContextValue = {
  rukapayUserId: string;
};

const BorrowerContext = createContext<BorrowerContextValue>({
  rukapayUserId: "user_123",
});

export function BorrowerProvider({
  children,
  rukapayUserId = "user_123",
}: {
  children: React.ReactNode;
  rukapayUserId?: string;
}) {
  return (
    <BorrowerContext.Provider value={{ rukapayUserId }}>
      {children}
    </BorrowerContext.Provider>
  );
}

export function useBorrowerContext() {
  return useContext(BorrowerContext);
}
