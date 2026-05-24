import { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

// User tiers: guest | account | agent | business | government | admin
const TIER_META = {
  guest:      { label: 'Guest',      color: '#A1A1A6', emoji: '👤' },
  account:    { label: 'Member',     color: '#60A5FA', emoji: '✦'  },
  agent:      { label: 'Agent',      color: '#FFC72C', emoji: '🛡' },
  business:   { label: 'Business',   color: '#A78BFA', emoji: '🏢' },
  government: { label: 'Government', color: '#34D399', emoji: '🏛' },
  admin:      { label: 'Admin',      color: '#F87171', emoji: '⚡'  },
};

function loadUser() {
  try {
    const raw = localStorage.getItem('ppoint_user');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveUser(user) {
  if (user) localStorage.setItem('ppoint_user', JSON.stringify(user));
  else localStorage.removeItem('ppoint_user');
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadUser);

  const tier = user?.tier || 'guest';
  const isGuest = !user;
  const isAgent = tier === 'agent' || tier === 'admin';
  const isBusiness = tier === 'business' || tier === 'admin';
  const isGovernment = tier === 'government' || tier === 'admin';
  const isAdmin = tier === 'admin';

  const signIn = useCallback((userData) => {
    const u = { ...userData, tier: userData.tier || 'account' };
    saveUser(u);
    setUser(u);
  }, []);

  const signOut = useCallback(() => {
    saveUser(null);
    setUser(null);
  }, []);

  const updateTier = useCallback((newTier) => {
    setUser(prev => {
      const updated = { ...prev, tier: newTier };
      saveUser(updated);
      return updated;
    });
  }, []);

  // Mock sign-in for dev/demo (no real auth server yet)
  const mockSignIn = useCallback((tier = 'account') => {
    const names = { agent: 'Emmanuel O.', business: 'Logistics Co', government: 'FIRS Admin', account: 'User' };
    signIn({
      id: Date.now().toString(),
      name: names[tier] || 'User',
      phone: '+234 801 234 5678',
      tier,
      joined: new Date().toISOString(),
    });
  }, [signIn]);

  return (
    <AuthContext.Provider value={{
      user,
      tier,
      isGuest,
      isAgent,
      isBusiness,
      isGovernment,
      isAdmin,
      tierMeta: TIER_META[tier],
      allTierMeta: TIER_META,
      signIn,
      signOut,
      updateTier,
      mockSignIn,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}

export default useAuth;
