/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *
 */
'use client';

import { Button, Typography } from '@mui/material';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import React from 'react';

export default function AuthorizationLayout({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const router = useRouter();

  return (
    <React.Fragment>
      {status === 'authenticated' ? (
        children
      ) : (
        <React.Fragment>
          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <Typography>Need to login to using app</Typography>
            <Button variant="contained" onClick={() => router.push('/login')}>
              Login
            </Button>
          </div>
        </React.Fragment>
      )}
    </React.Fragment>
  );
}
