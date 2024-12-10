import React, { createContext, useContext, useState, type ReactNode } from 'react';

interface TokenContextType {
  token: string | null;
  setToken: React.Dispatch<React.SetStateAction<string | null>>;
}

const TokenStateContext = createContext<TokenContextType | undefined>(undefined);

const TokenStateProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('backend_token');
  });

  return <TokenStateContext.Provider value={{ token, setToken }}>{children}</TokenStateContext.Provider>;
};

export const useTokenState = (): TokenContextType => {
  const context = useContext(TokenStateContext);

  if (!context) {
    throw new Error('useTokenState must be used within a TokenStateProvider');
  }

  return context;
};

export default TokenStateProvider;
