import React, { createContext, useContext, useState, useCallback } from 'react';

const NavigationContext = createContext();

export const NavigationProvider = ({ children }) => {
  const [activeTab, setActiveTab] = useState('/');
  const [tabHistory, setTabHistory] = useState({
    '/': [],
    '/find-timeline': [],
    '/my-collection': [],
    '/community': [],
    '/settings': [],
  });

  const resetTabStack = useCallback((tab) => {
    setTabHistory(prev => ({
      ...prev,
      [tab]: [],
    }));
  }, []);

  const selectTab = useCallback((tab) => {
    if (activeTab === tab) {
      // Tab is already active, reset its stack
      resetTabStack(tab);
    }
    setActiveTab(tab);
  }, [activeTab, resetTabStack]);

  return (
    <NavigationContext.Provider value={{ activeTab, selectTab, tabHistory }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useTabNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useTabNavigation must be used within NavigationProvider');
  }
  return context;
};