import * as React from 'react';

import { AuthContext } from '@/contexts/auth-context';

export const useAuthContext = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext debe usarse dentro de AuthProvider.');
  }
  return context;
};
