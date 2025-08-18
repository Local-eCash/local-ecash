'use client';

import {
  Role,
  accountsApi,
  escrowOrderApi,
  getSelectedWalletPath,
  offerApi,
  useSliceDispatch as useLixiSliceDispatch,
  useSliceSelector as useLixiSliceSelector,
  useSocket
} from '@bcpros/redux-store';
import { Wallet } from '@mui/icons-material';
import CircleIcon from '@mui/icons-material/Circle';
import GavelOutlinedIcon from '@mui/icons-material/GavelOutlined';
import InventoryOutlinedIcon from '@mui/icons-material/InventoryOutlined';
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { IconButton, Slide, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useSession } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import useAuthorization from '../Auth/use-authorization.hooks';

const Tabs = styled('div')(({}) => ({
  position: 'fixed',
  zIndex: 999,
  bottom: 0,
  display: 'grid',
  justifyItems: 'center',
  width: '100%',
  maxWidth: '100%',
  background: 'rgba(255, 255, 255, 0.07)',
  padding: '8px 0',
  backdropFilter: 'blur(8px)'
}));

const TabMenu = styled('div')(({ theme }) => ({
  width: '100%',
  textAlign: 'center',
  button: {
    paddingBottom: '4px',
    color: '#696f74',
    svg: {
      fontSize: '28px'
    },
    '&:hover': {
      color: theme.palette.primary.main
    }
  },

  p: {
    color: '#696f74',
    fontSize: '12px',
    cursor: 'pointer'
  },

  '&.active button': {
    color: theme.custom.colorPrimary
  },
  '&.active p': {
    color: theme.custom.colorPrimary,
    fontWeight: 600
  }
}));

const StyledSlide = styled(Slide)`
  padding-bottom: 16px;
  width: 500px;
  left: 50%;
  // Slide transform is broken in PC so this is the bypass. Need to better way to handle this
  ${props => props.in && 'transform: translateX(-50%) !important'};
  ${props => !props.in && 'transform: translateY(1000px) !important'};
  @media (max-width: 576px) {
    padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 16px);
    width: 100%;
    box-shadow: none;
  }
`;

export default function Footer() {
  const prevRef = useRef(0);
  const router = useRouter();
  const { socket } = useSocket();
  const currentPath = usePathname();
  const { status } = useSession();
  const dispatch = useLixiSliceDispatch();
  const askAuthorization = useAuthorization();

  const [visible, setVisible] = useState(true);
  const [isArbiMod, setIsArbiMod] = useState(false);
  const [newOrder, setNewOrder] = useState(false);
  const selectedWalletPath = useLixiSliceSelector(getSelectedWalletPath);
  const { useGetAccountByAddressQuery } = accountsApi;

  const { currentData: accountQueryData } = useGetAccountByAddressQuery(
    { address: selectedWalletPath?.xAddress },
    { skip: !selectedWalletPath }
  );

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleScroll = () => {
        const currentScrollPos = window.scrollY;
        setVisible(prevRef.current > currentScrollPos || currentScrollPos < 20);
        prevRef.current = currentScrollPos;
      };
      window.addEventListener('scroll', handleScroll);

      return () => {
        window.removeEventListener('scroll', handleScroll);
      };
    }
  }, []);

  const handleIconClick = (path: string) => {
    if (status === 'loading') return;

    if (status === 'unauthenticated') {
      askAuthorization();

      return;
    }

    if (path === '/' && currentPath === '/') {
      console.log('reset home api query');
      dispatch(offerApi.api.util.resetApiState());

      return;
    }

    if (path === '/my-order' && currentPath === '/my-order') {
      console.log('reset escrow api query');
      dispatch(escrowOrderApi.api.util.resetApiState());
      setNewOrder(false);

      return;
    }

    router.push(path);
  };

  useEffect(() => {
    if (!accountQueryData) return;

    //check if user is moderator or arbitrator
    if (
      accountQueryData?.getAccountByAddress.role === Role.Arbitrator ||
      accountQueryData?.getAccountByAddress.role === Role.Moderator
    ) {
      setIsArbiMod(true);
    }
  }, [accountQueryData]);

  useEffect(() => {
    socket &&
      socket.on('recievedEscrowOrder', () => {
        setNewOrder(true);
      });
  }, [socket]);

  //No footer at offer detail and order-detail
  return (
    currentPath !== '/order-detail' &&
    currentPath !== '/offer-detail' && (
      <StyledSlide direction="up" in={visible} className="Footer-content">
        <Tabs style={{ gridTemplateColumns: isArbiMod ? 'repeat(5, 1fr)' : 'repeat(4, 1fr)' }}>
          <TabMenu className={`${currentPath === '/' && 'active'}`} onClick={() => handleIconClick('/')}>
            <IconButton>
              <SwapHorizIcon />
            </IconButton>
            <Typography variant="body2">P2P Trading</Typography>
          </TabMenu>
          <TabMenu
            className={`${currentPath === '/my-offer' && 'active'}`}
            onClick={() => handleIconClick('/my-offer')}
          >
            <IconButton>
              <LocalOfferOutlinedIcon />
            </IconButton>
            <Typography variant="body2">My offers</Typography>
          </TabMenu>
          <TabMenu
            className={`${currentPath === '/my-order' && 'active'}`}
            onClick={() => handleIconClick('/my-order')}
          >
            <IconButton>
              <InventoryOutlinedIcon />
              {newOrder && (
                <CircleIcon
                  style={{ color: '#0076c4', position: 'absolute', right: '0px', top: '0px', fontSize: '15px' }}
                />
              )}
            </IconButton>
            <Typography variant="body2">My orders</Typography>
          </TabMenu>
          {isArbiMod && (
            <TabMenu
              className={`${currentPath === '/my-dispute' && 'active'}`}
              onClick={() => handleIconClick('/my-dispute')}
            >
              <IconButton>
                <GavelOutlinedIcon />
              </IconButton>
              <Typography variant="body2">Dispute</Typography>
            </TabMenu>
          )}
          <TabMenu className={`${currentPath === '/wallet' && 'active'}`} onClick={() => handleIconClick('/wallet')}>
            <IconButton>
              <Wallet />
            </IconButton>
            <Typography variant="body2">Wallet</Typography>
          </TabMenu>
        </Tabs>
      </StyledSlide>
    )
  );
}
