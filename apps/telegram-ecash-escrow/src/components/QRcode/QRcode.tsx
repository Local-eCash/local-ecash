'use client';

import styled from '@emotion/styled';
import { CopyAllOutlined } from '@mui/icons-material';
import { Button, Portal, Stack, Typography } from '@mui/material';
import RawQRCode from 'qrcode.react';
import React, { useState } from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';
import CustomToast from '../Toast/CustomToast';

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
  const [copy, setCopy] = useState(false);
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
        <CopyToClipboard text={address} onCopy={() => setCopy(true)}>
          <Button className="no-border-btn" endIcon={<CopyAllOutlined />} />
        </CopyToClipboard>
      </Typography>

      <Portal>
        <CustomToast
          isOpen={copy}
          content="Address copied to clipboard"
          handleClose={() => setCopy(false)}
          type="success"
        />
      </Portal>
    </Stack>
  );
};

export default QRCode;
