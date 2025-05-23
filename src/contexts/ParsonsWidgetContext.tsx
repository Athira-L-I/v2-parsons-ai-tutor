import React, { createContext, useContext, ReactNode } from 'react';
import {
  useParsonsWidget,
  UseParsonsWidgetReturn,
} from '@/hooks/useParsonsWidget';

const ParsonsWidgetContext = createContext<UseParsonsWidgetReturn | null>(null);

interface ParsonsWidgetProviderProps {
  children: ReactNode;
}

export const ParsonsWidgetProvider: React.FC<ParsonsWidgetProviderProps> = ({
  children,
}) => {
  const parsonsWidget = useParsonsWidget();

  return (
    <ParsonsWidgetContext.Provider value={parsonsWidget}>
      {children}
    </ParsonsWidgetContext.Provider>
  );
};

export const useParsonsWidgetContext = (): UseParsonsWidgetReturn => {
  const context = useContext(ParsonsWidgetContext);
  if (!context) {
    throw new Error(
      'useParsonsWidgetContext must be used within a ParsonsWidgetProvider'
    );
  }
  return context;
};
