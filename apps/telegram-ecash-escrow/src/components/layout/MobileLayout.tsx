/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *
 */
'use client';

import { styled } from '@mui/material/styles';
import React from 'react';

const WrapMobile = styled('div')(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  background: theme.custom.bgMain
}));

const Content = styled('div')(({ theme }) => ({
  position: 'relative',
  width: '500px',
  minHeight: '100vh',
  boxShadow: '0px 0px 24px 1px',
  background: theme.palette.background.default, // Background from the theme
  backgroundRepeat: 'no-repeat',
  backgroundSize: 'cover',
  [theme.breakpoints.down('sm')]: {
    width: '100%',
    boxShadow: 'none'
  }
}));

export const WrapFooter = styled('div')(({ theme }) => ({
  '.Footer-content': {
    paddingBottom: '16px',
    width: '500px',
    [theme.breakpoints.down('sm')]: {
      paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
      width: '100%',
      boxShadow: 'none'
    }
  }
}));

export default function MobileLayout({ children }: { children: React.ReactNode }) {
  return (
    <WrapMobile>
      <Content>{children}</Content>
    </WrapMobile>
  );
}
