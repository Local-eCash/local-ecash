/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 *
 */
'use client';

import styled from '@emotion/styled';
import React from 'react';

const WrapMobile = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(to right, #0f2027, #203a43, #2c5364);
`;
const Content = styled.div`
  position: relative;
  width: 500px;
  min-height: 100vh;
  box-shadow: 0px 0px 24px 1px;
  background-color: black;
  background-image: url(/bg-dialog.svg);
  background-repeat: no-repeat;
  background-size: cover;
  @media (max-width: 576px) {
    width: 100%;
    box-shadow: none;
  }
`;
export const WrapFooter = styled.div`
  .Footer-content {
    width: 500px;
    @media (max-width: 576px) {
      width: 100%;
      box-shadow: none;
    }
  }
`;

export default function MobileLayout({ children }: { children: React.ReactNode }) {
  return (
    <WrapMobile>
      <Content>{children}</Content>
    </WrapMobile>
  );
}
