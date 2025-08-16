'use client';

import { showToast, useSliceDispatch as useLixiSliceDispatch } from '@bcpros/redux-store';
import styled from '@emotion/styled';
import { CopyAllOutlined } from '@mui/icons-material';
import { Button, Stack, Typography } from '@mui/material';
import RawQRCode from 'qrcode.react';
import React from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';

export const StyledRawQRCode = styled(RawQRCode)`
  cursor: pointer;
  border-radius: 26px;
`;

interface QRCodeProps {
  address: string;
  amount?: number;
  width?: string;
}

const QRCode: React.FC<QRCodeProps> = ({ address, amount, width }) => {
  const dispatch = useLixiSliceDispatch();
  const formatAddress = (address: string) => {
    if (!address) return;

    return address.slice(0, 5) + '...' + address.slice(-8);
  };

  return (
    <Stack style={{ margin: 'auto', alignItems: 'center' }}>
      <StyledRawQRCode
        width={width ? width : '100%'}
        height={'75%'}
        includeMargin
        value={amount ? `${address}?amount=${amount}` : address}
        renderAs={'svg'}
        className="Qrcode"
      />
      <Typography variant="body1" align="center">
        {formatAddress(address)}
        <CopyToClipboard
          text={address}
          onCopy={() => {
            dispatch(
              showToast('info', {
                message: 'info',
                description: 'Address copied to clipboard'
              })
            );
          }}
        >
          <Button className="no-border-btn" endIcon={<CopyAllOutlined />} />
        </CopyToClipboard>
      </Typography>
    </Stack>
  );
};

export default QRCode;
