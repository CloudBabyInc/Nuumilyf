import React, { createContext, useContext, ReactNode } from 'react';
import { usePresence, UserPresence } from '@/hooks/usePresence';

interface PresenceContextType {
  presenceState: UserPresence;
  currentUserStatus: 'online' | 'away' | 'offline';
  isConnected: boolean;
  getUserStatus: (userId: string) => 'online' | 'away' | 'offline';
  getUserLastSeen: (userId: string) => string | null;
  getOnlineUsersCount: () => number;
  updatePresence: (status: 'online' | 'away' | 'offline') => Promise<void>;
}

const PresenceContext = createContext<PresenceContextType | undefined>(undefined);

interface PresenceProviderProps {
  children: ReactNode;
}

export const PresenceProvider: React.FC<PresenceProviderProps> = ({ children }) => {
  const presenceData = usePresence();

  return (
    <PresenceContext.Provider value={presenceData}>
      {children}
    </PresenceContext.Provider>
  );
};

export const usePresenceContext = () => {
  const context = useContext(PresenceContext);
  if (context === undefined) {
    throw new Error('usePresenceContext must be used within a PresenceProvider');
  }
  return context;
};

export default PresenceProvider;
