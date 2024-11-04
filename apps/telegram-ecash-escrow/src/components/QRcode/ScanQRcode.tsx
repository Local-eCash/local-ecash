'use client';

import styled from '@emotion/styled';
import { Dialog } from '@mui/material';
import { Scanner } from '@yudiel/react-qr-scanner';
import React from 'react';

const StyledDialog = styled(Dialog)``;

interface ScanQRcodeProps {
  isOpen: boolean;
  onDissmissModal: (value: boolean) => void;
  setAddress: (addr: string) => void;
}

const ScanQRcode: React.FC<ScanQRcodeProps> = ({ isOpen, onDissmissModal, setAddress }) => {
  return (
    <>
      <StyledDialog open={isOpen} onClose={() => onDissmissModal(false)}>
        <div>
          <Scanner
            onScan={result => {
              setAddress(result[0]?.rawValue ?? '');
              onDissmissModal(false);
            }}
            onError={err => {
              console.log(err);
            }}
          />
        </div>
      </StyledDialog>
    </>
  );
};

export default ScanQRcode;
