import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const NavigationContext = createContext();

// Root path for each bottom tab
const TAB_ROOTS = ['/', '/find-timeline', '/my-collection', '/community', '/settings'];

function getOwningTab(path) {
  // Find the tab that owns this path
  for (const tab of TAB_ROOTS) {
    if (tab === path) return tab;
    if (tab !== '/' && path.startsWith(tab)) return tab;
  }
  return '/';
}

export const NavigationProvider = ({ children }) => {
  const [activeTab, setActiveTab] = useState('/');
  const [prevTab, setPrevTab] = useState('/');

  // Per-tab history stacks: { [tabRoot]: string[] }
  const tabHistories = useRef({ '/': ['/'], '/find-timeline': ['/find-timeline'], '/my-collection': ['/my-collection'], '/community': ['/community'], '/settings': ['/settings'] });

  // Per-tab scroll positions
  const scrollPositions = useRef({});

  const saveScrollPosition = useCallback((tab, y) => {
    scrollPositions.current[tab] = y;
  }, []);

  const getScrollPosition = useCallback((tab) => {
    return scrollPositions.current[tab] ?? 0;
  }, []);

  // Called when user taps a bottom nav item
  const selectTab = useCallback((tab) => {
    setActiveTab(prev => {
      if (prev !== tab) setPrevTab(prev);
      return tab;
    });
  }, []);

  // Push a path onto the owning tab's history stack
  const pushToTabHistory = useCallback((path) => {
    const tab = getOwningTab(path);
    const stack = tabHistories.current[tab] || [tab];
    // Avoid duplicate consecutive entries
    if (stack[stack.length - 1] !== path) {
      tabHistories.current[tab] = [...stack, path];
    }
  }, []);

  // Get the previous path in the owning tab's history stack
  const popTabHistory = useCallback((currentPath) => {
    const tab = getOwningTab(currentPath);
    const stack = tabHistories.current[tab] || [tab];
    if (stack.length > 1) {
      const newStack = stack.slice(0, -1);
      tabHistories.current[tab] = newStack;
      return newStack[newStack.length - 1];
    }
    return tab; // fallback to tab root
  }, []);

  // Get the current path for a tab (top of its stack)
  const getTabCurrentPath = useCallback((tab) => {
    const stack = tabHistories.current[tab] || [tab];
    return stack[stack.length - 1];
  }, []);

  return (
    <NavigationContext.Provider value={{
      activeTab,
      prevTab,
      selectTab,
      saveScrollPosition,
      getScrollPosition,
      pushToTabHistory,
      popTabHistory,
      getTabCurrentPath,
      getOwningTab,
    }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useTabNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) throw new Error('useTabNavigation must be used within NavigationProvider');
  return context;
};