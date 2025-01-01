'use client';

import { UtxoContext } from '@/src/store/context/utxoProvider';
import { COIN } from '@bcpros/lixi-models';
import {
  getSelectedWalletPath,
  parseCashAddressToPrefix,
  useSliceSelector as useLixiSliceSelector
} from '@bcpros/redux-store';
import { CopyAllOutlined, SettingsOutlined, Wallet } from '@mui/icons-material';
import AccountCircleRoundedIcon from '@mui/icons-material/AccountCircleRounded';
import { Button, IconButton, Popover, Portal, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import React, { useContext, useState } from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';
import useAuthorization from '../Auth/use-authorization.hooks';
import CustomToast from '../Toast/CustomToast';

const StyledHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',

  '.greeting': {
    marginBottom: 16,
    '.handle-name': {
      fontWeight: 600
    }
  }
}));

const PopoverStyled = styled('div')(({ theme }) => ({
  padding: '8px 10px',
  background: theme.palette.background.paper,

  '.heading-profile': {
    fontWeight: 600,
    fontSize: 20,
    marginBottom: 5,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  '.item-address, .item-amount': {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: 7
  },
  '.address-amount': {
    fontSize: 14,
    color: theme.palette.text.secondary
  },
  '.no-border-btn': {
    padding: 0,
    minWidth: 0
  },

  button: {
    color: theme.palette.text.secondary
  }
}));

const StyledAvatar = styled('div')(({ theme }) => ({
  width: '1.55em',
  height: '1.55em',
  borderRadius: 50,
  overflow: 'hidden',
  display: 'inline-block',
  border: '2px solid #0076c4',
  backgroundImage: 'url("./eCash.svg")',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
  '& img': {
    width: '100%',
    objectFit: 'cover'
  }
}));

export default function Header() {
  const router = useRouter();
  const { data, status } = useSession();
  const askAuthorization = useAuthorization();
  const { totalValidAmount } = useContext(UtxoContext);
  const selectedWalletPath = useLixiSliceSelector(getSelectedWalletPath);

  const [address, setAddress] = useState(parseCashAddressToPrefix(COIN.XEC, selectedWalletPath?.cashAddress));
  const [copy, setCopy] = useState(false);
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  const handlePopoverOpen = (event: React.MouseEvent<HTMLElement>) => {
    if (status === 'loading') return;

    if (status === 'unauthenticated') {
      askAuthorization();
    } else {
      setAnchorEl(anchorEl ? null : event.currentTarget);
    }
  };

  const formatAddress = (address: string) => {
    if (!address) return;

    return address.slice(0, 5) + '...' + address.slice(-8);
  };

  const contentMoreAction = (
    <PopoverStyled>
      <Typography onClick={() => router.push('/wallet')} className="heading-profile">
        <span>Wallet</span>
        <Button className="no-border-btn" endIcon={<Wallet />} />
      </Typography>
      <Typography variant="body1" align="center" className="item-address">
        <span className="address-amount"> {formatAddress(address)}</span>
        <CopyToClipboard text={address} onCopy={() => setCopy(true)}>
          <Button className="no-border-btn" endIcon={<CopyAllOutlined />} />
        </CopyToClipboard>
      </Typography>
      <Typography className="item-amount">
        <span className="address-amount">
          {totalValidAmount} {COIN.XEC}
        </span>
      </Typography>
      <Typography onClick={() => router.push('/settings')} className="heading-profile">
        <span>Settings</span>
        <Button className="no-border-btn" endIcon={<SettingsOutlined />} />
      </Typography>
    </PopoverStyled>
  );

  return (
    <StyledHeader>
      <div className="greeting">
        <Typography variant="body2">Hala</Typography>
        <Typography className="handle-name" variant="body1">
          {data?.user.name ?? 'Anonymous'}
        </Typography>
      </div>
      <div className="wallet-minimals">
        <IconButton onClick={e => handlePopoverOpen(e)}>
          {data && data.user.image ? (
            <StyledAvatar>
              <picture>
                <img src={data.user.image} alt="" />
              </picture>
            </StyledAvatar>
          ) : (
            <AccountCircleRoundedIcon fontSize="large" />
          )}
        </IconButton>
        <Popover
          id="mouse-over-popover"
          onClose={() => setAnchorEl(null)}
          open={open}
          anchorEl={anchorEl}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right'
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right'
          }}
        >
          {contentMoreAction}
        </Popover>
      </div>
      <Portal>
        <CustomToast
          isOpen={copy}
          content="Address copied to clipboard"
          handleClose={() => setCopy(false)}
          type="success"
        />
      </Portal>
    </StyledHeader>
  );
}
