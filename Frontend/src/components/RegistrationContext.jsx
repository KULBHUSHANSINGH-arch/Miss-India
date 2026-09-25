import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

const Ctx = createContext(null);

// Site-wide actions: "Register Now" opens the registration page, "Enquire" opens the enquiry form.
export function RegistrationProvider({ children }) {
  const navigate = useNavigate();
  const [enquiryOpen, setEnquiryOpen] = useState(false);
  const openForm = useCallback(() => navigate('/register'), [navigate]);
  const openEnquiry = useCallback(() => setEnquiryOpen(true), []);
  const closeEnquiry = useCallback(() => setEnquiryOpen(false), []);
  const value = useMemo(
    () => ({ openForm, enquiryOpen, openEnquiry, closeEnquiry }),
    [openForm, enquiryOpen, openEnquiry, closeEnquiry],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useRegistration = () => useContext(Ctx);
