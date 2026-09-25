import { createContext, useContext, useState, useCallback } from 'react';

const Ctx = createContext(null);

export function RegistrationProvider({ children }) {
  const [open, setOpen] = useState(false);
  const openForm = useCallback(() => setOpen(true), []);
  const closeForm = useCallback(() => setOpen(false), []);
  return <Ctx.Provider value={{ open, openForm, closeForm }}>{children}</Ctx.Provider>;
}

export const useRegistration = () => useContext(Ctx);
