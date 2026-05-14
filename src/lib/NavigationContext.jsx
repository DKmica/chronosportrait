import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

const NavigationContext = createContext();

export const NavigationProvider = ({ children }) => {
  const [activeTab, setActiveTab] = useState('/');
  const [prevTab, setPrevTab] = useState('/');

  // Per-tab scroll position memory
  const scrollPositions = useRef({});

  const saveScrollPosition = useCallback((tab, y) => {
    scrollPositions.current[tab] = y;
  }, []);

  const getScrollPosition = useCallback((tab) => {
    return scrollPositions.current[tab] ?? 0;
  }, []);

  const selectTab = useCallback((tab) => {
    setActiveTab(prev => {
      if (prev !== tab) setPrevTab(prev);
      return tab;
    });
  }, []);

  return (
    <NavigationContext.Provider value={{ activeTab, prevTab, selectTab, saveScrollPosition, getScrollPosition }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useTabNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) throw new Error('useTabNavigation must be used within NavigationProvider');
  return context;
};