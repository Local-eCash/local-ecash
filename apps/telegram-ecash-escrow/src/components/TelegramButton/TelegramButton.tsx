'use client';

import { escrowOrderApi } from '@bcpros/redux-store';
import styled from '@emotion/styled';
import { Alert, Button, Snackbar } from '@mui/material';
import Image from 'next/image';
import React, { useState } from 'react';

const TelegramButtonWrap = styled(Button)`
  width: 100%;
  margin: 16px 0;
  color: white;
  font-weight: 600;
  display: flex;
  gap: 8px;
  text-transform: none;
  padding: 12px;
`;

type TelegramButtonProps = {
  escrowOrderId: string;
  username?: string;
  isSeller?: boolean;
};

const TelegramButton: React.FC<TelegramButtonProps> = ({ escrowOrderId, username, isSeller }) => {
  const { useLazyUserRequestTelegramChatQuery } = escrowOrderApi;
  const [trigger, { isFetching, isLoading }] = useLazyUserRequestTelegramChatQuery();
  const [request, setRequest] = useState(false);
  const [fail, setFail] = useState(false);

  const handleTelegramClick = async () => {
    if (username && username.includes('@')) {
      const url = `https://t.me/${username.substring(1)}`;
      window.open(url, '_blank');
    } else {
      await trigger({ id: escrowOrderId })
        .then(() => setRequest(true))
        .catch(() => setFail(true));
    }
  };

  return (
    <React.Fragment>
      <TelegramButtonWrap
        color="info"
        variant="contained"
        onClick={() => handleTelegramClick()}
        disabled={isFetching || isLoading}
      >
        {isSeller ? `Chat with buyer` : `Chat with seller`}
        <Image src={'/ico-telegram.svg'} width={32} height={32} alt="" />
      </TelegramButtonWrap>

      <Snackbar open={request} autoHideDuration={3500} onClose={() => setRequest(false)}>
        <Alert severity="success" variant="filled" sx={{ width: '100%' }}>
          Chat requested!
        </Alert>
      </Snackbar>

      <Snackbar open={fail} autoHideDuration={3500} onClose={() => setFail(false)}>
        <Alert severity="error" variant="filled" sx={{ width: '100%' }}>
          Failed to request chat...
        </Alert>
      </Snackbar>
    </React.Fragment>
  );
};

export default TelegramButton;
