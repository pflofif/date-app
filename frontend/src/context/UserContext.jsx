import { createContext, useContext } from 'react';

export const UserContext = createContext({
  currentUser: 'User 1',
  setCurrentUser: () => {}
});

export const useUser = () => useContext(UserContext);
