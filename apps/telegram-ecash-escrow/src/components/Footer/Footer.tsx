'use client';

import {
  Role,
  accountsApi,
  getSelectedWalletPath,
  useSliceSelector as useLixiSliceSelector
} from '@bcpros/redux-store';
import styled from '@emotion/styled';
import { Menu, SettingsOutlined, Wallet } from '@mui/icons-material';
import GavelOutlinedIcon from '@mui/icons-material/GavelOutlined';
import InventoryOutlinedIcon from '@mui/icons-material/InventoryOutlined';
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { IconButton, Popover, Slide, SvgIconTypeMap, Typography } from '@mui/material';
import { OverridableComponent } from '@mui/material/OverridableComponent';
import { useSession } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import useAuthorization from '../Auth/use-authorization.hooks';
import { WrapFooter } from '../layout/MobileLayout';

const Tabs = styled.div`
  position: fixed;
  z-index: 999;
  bottom: 0;
  display: grid;
  justify-items: center;
  width: 100%;
  max-width: 100%;
  background: rgba(255, 255, 255, 0.07);
  padding: 8px 0;
  backdrop-filter: blur(8px);
`;

const TabMenu = styled.div`
  width: 100%;
  text-align: center;

  button {
    padding-bottom: 4px;
    color: #696f74;
    svg {
      font-size: 28px;
    }
  }

  p {
    color: #696f74;
    font-size: 12px;
  }

  &.active {
    button {
      color: white;
    }

    p {
      color: white;
      font-weight: 600;
    }
  }
`;

const PopoverStyled = styled.div`
  .content-action {
    padding: 10px;
    display: flex;
    flex-direction: column;
    gap: 10px;

    .item-action {
      display: flex;
      gap: 5px;
      padding: 3px 0;
      button {
        padding: 0;
      }
      button,
      p {
        color: #c7cdd3;
      }
    }
  }
`;

type PropsFooter = {
  hidden?: boolean;
};

export default function Footer({ hidden = true }: PropsFooter) {
  const router = useRouter();
  const pathName = usePathname();
  const { status } = useSession();
  const askAuthorization = useAuthorization();
  const { useGetAccountByAddressQuery } = accountsApi;
  const [isArbiMod, setIsArbiMod] = useState(false);
  const selectedWalletPath = useLixiSliceSelector(getSelectedWalletPath);

  const { currentData: accountQueryData } = useGetAccountByAddressQuery(
    { address: selectedWalletPath?.xAddress },
    { skip: !selectedWalletPath }
  );

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

  const handleIconClick = (pathName: string) => {
    if (status === 'loading') return;

    if (status === 'unauthenticated') {
      askAuthorization();
    } else {
      router.push(pathName);
    }
  };

  useEffect(() => {
    accountQueryData &&
      (accountQueryData?.getAccountByAddress.role === Role.Arbitrator ||
        accountQueryData?.getAccountByAddress.role === Role.Moderator) &&
      setIsArbiMod(true);
  }, [accountQueryData]);

  const ItemAction = ({
    Icon,
    content,
    navigateContent,
    isAuthor
  }: {
    Icon: OverridableComponent<SvgIconTypeMap<object, 'svg'>> & {
      muiName: string;
    };
    content: string;
    navigateContent: string;
    isAuthor: boolean;
  }) => {
    return (
      <div
        className="item-action"
        onClick={() => (isAuthor ? handleIconClick(navigateContent) : router.push(navigateContent))}
      >
        <IconButton>
          <Icon />
        </IconButton>
        <Typography>{content}</Typography>
      </div>
    );
  };

  const contentMoreAction = (
    <PopoverStyled>
      <div className="content-action">
        <ItemAction Icon={SettingsOutlined} content="Setting" navigateContent="/setting" isAuthor={false} />
        <ItemAction Icon={Wallet} content="Wallet" navigateContent="/wallet" isAuthor={true} />
      </div>
    </PopoverStyled>
  );

  return (
    <WrapFooter>
      <Slide direction="up" in={hidden} className="Footer-content">
        <Tabs style={{ gridTemplateColumns: isArbiMod ? 'repeat(5, 1fr)' : 'repeat(4, 1fr)' }}>
          <TabMenu className={`${pathName === '/' && 'active'}`}>
            <IconButton onClick={() => router.push('/')}>
              <SwapHorizIcon />
            </IconButton>
            <Typography variant="body2">Home</Typography>
          </TabMenu>
          <TabMenu className={`${pathName === '/my-offer' && 'active'}`}>
            <IconButton onClick={() => handleIconClick('my-offer')}>
              <LocalOfferOutlinedIcon />
            </IconButton>
            <Typography variant="body2">Offers</Typography>
          </TabMenu>
          <TabMenu className={`${pathName === '/my-order' && 'active'}`}>
            <IconButton onClick={() => handleIconClick('my-order')}>
              <InventoryOutlinedIcon />
            </IconButton>
            <Typography variant="body2">Orders</Typography>
          </TabMenu>
          {isArbiMod && (
            <TabMenu className={`${pathName === '/my-dispute' && 'active'}`}>
              <IconButton onClick={() => handleIconClick('my-dispute')}>
                <GavelOutlinedIcon />
              </IconButton>
              <Typography variant="body2">Dispute</Typography>
            </TabMenu>
          )}
          <TabMenu aria-owns={open ? 'mouse-over-popover' : undefined} aria-haspopup="true" onClick={handlePopoverOpen}>
            <IconButton>
              <Menu />
            </IconButton>
            <Typography variant="body2">Menu</Typography>
            <Popover
              id="menu-popover"
              open={open}
              anchorEl={anchorEl}
              style={{ cursor: 'pointer' }}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right'
              }}
              transformOrigin={{
                vertical: 'bottom',
                horizontal: 'right'
              }}
            >
              {contentMoreAction}
            </Popover>
          </TabMenu>
        </Tabs>
      </Slide>
    </WrapFooter>
  );
}
