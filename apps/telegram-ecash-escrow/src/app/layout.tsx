'use client';

import { AppRouterCacheProvider } from '@mui/material-nextjs/v13-appRouter';
import React from 'react';
import ActionSheet from '../components/ActionSheet/ActionSheet';
import MiniAppBackdrop from '../components/Common/MiniAppBackdrop';
import Footer from '../components/Footer/Footer';
import ModalManager from '../components/ModalManager';
import ToastNotificationManage from '../components/ToastNotificationManage';
import { AppThemeProvider } from '../store/context/appThemeProvider';
import { SettingProvider } from '../store/context/settingProvider';
import { UtxoProvider } from '../store/context/utxoProvider';
import ReduxProvider from '../store/provider';
import { TelegramAuthProvider } from '../store/telegram-auth-provider';
import { TelegramMiniAppProvider } from '../store/telegram-mini-app-provider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, interactive-widget=resizes-content"
        />
        <title>Local eCash</title>
        <meta name="description" content="P2P trading platform with on chain escrow. No middleman." />
        <meta name="theme-color" content="#04080F" />
        <meta name="application-name" content="Local eCash" />

        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/favicon.ico" />

        <link rel="manifest" href="/manifest.json" />
        <meta name="version" content={process.env.NEXT_PUBLIC_APP_VERSION} />
        <meta name="commit-hash" content={process.env.NEXT_PUBLIC_COMMIT_HASH} />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="en_US" />
        <meta property="og:url" content="https://localecash.com" />
        <meta property="og:site_name" content="Local eCash" />
        <meta property="og:title" content="Local eCash" />
        <meta property="og:description" content="P2P trading platform with on chain escrow. No middleman." />
        <meta property="og:image" content="https://localecash.com/favicon.ico" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="627" />
        <meta property="og:image:alt" content="Local eCash" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Local eCash" />
        <meta name="twitter:description" content="P2P trading platform with on chain escrow. No middleman." />
        <meta name="twitter:image" content="https://localecash.com/favicon.ico" />
        <meta name="twitter:image:width" content="1200" />
        <meta name="twitter:image:height" content="627" />
        <meta name="twitter:image:alt" content="Local eCash" />

        {/* Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="en_US" />
        <meta property="og:url" content="https://localecash.com" />
        <meta property="og:site_name" content="Local eCash" />
        <meta property="og:title" content="Local eCash" />
        <meta property="og:description" content="P2P trading platform with on chain escrow. No middleman." />
        <meta property="og:image" content="https://localecash.com/favicon.ico" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="627" />
        <meta property="og:image:alt" content="Local eCash" />
      </head>
      <body style={{ background: '#04080F', margin: '0' }}>
        <TelegramAuthProvider>
          <ReduxProvider>
            <TelegramMiniAppProvider>
              <AppRouterCacheProvider>
                <SettingProvider>
                  <UtxoProvider>
                    <AppThemeProvider>
                      <MiniAppBackdrop />
                      <ModalManager />
                      <ToastNotificationManage />
                      {children}
                      <ActionSheet />
                      <Footer />
                    </AppThemeProvider>
                  </UtxoProvider>
                </SettingProvider>
              </AppRouterCacheProvider>
            </TelegramMiniAppProvider>
          </ReduxProvider>
        </TelegramAuthProvider>
      </body>
    </html>
  );
}
