import { Setting } from '@bcpros/lixi-models';
import { getSelectedAccount, settingApi, useSliceSelector as useLixiSliceSelector } from '@bcpros/redux-store';
import { createContext, useEffect, useMemo, useState } from 'react';

export interface SettingContextType {
  setting: Setting | null; // or `Setting | undefined` depending on your preference
  setSetting: React.Dispatch<React.SetStateAction<Setting | null>>; // SetState function type
}

// Create the Context
export const SettingContext = createContext<SettingContextType>(undefined);

export function SettingProvider({ children }) {
  const selectedAccount = useLixiSliceSelector(getSelectedAccount);
  const [setting, setSetting] = useState<Setting>(null);

  const { getSetting } = settingApi;

  const contextValue = useMemo(() => {
    return { setting, setSetting };
  }, [setting]);

  //get setting
  useEffect(() => {
    if (selectedAccount?.id) {
      (async () => {
        const data = (await getSetting(selectedAccount?.id)) as Setting;
        setSetting(data);
      })();
    }
  }, [selectedAccount?.id]);

  return <SettingContext.Provider value={contextValue}>{children}</SettingContext.Provider>;
}
