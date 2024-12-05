'use client';

import { LaunchParams, init, postEvent, retrieveLaunchParams } from '@telegram-apps/sdk-react';
import { createContext, useEffect, useState } from 'react';

export type TelegramMiniAppValue = {
  launchParams?: LaunchParams;
};

const defaultTelegramMiniAppValue: TelegramMiniAppValue = {
  launchParams: undefined
};

export const TelegramMiniAppContext = createContext<TelegramMiniAppValue>(defaultTelegramMiniAppValue);

export function TelegramMiniAppProvider({ children }: { children: React.ReactNode }) {
  const [launchParams, setLaunchParams] = useState<LaunchParams | undefined>(undefined);

  useEffect(() => {
    try {
      init();
      setLaunchParams(retrieveLaunchParams());
      postEvent('web_app_expand');
      postEvent('web_app_setup_closing_behavior', { need_confirmation: true });
    } catch (e) {
      console.log('not telegram mini app env');
    }
  }, []);

  return <TelegramMiniAppContext.Provider value={{ launchParams }}>{children}</TelegramMiniAppContext.Provider>;
}
