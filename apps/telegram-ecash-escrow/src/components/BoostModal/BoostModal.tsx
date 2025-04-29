'use client';

import { UtxoContext } from '@/src/store/context/utxoProvider';
import { withdrawFund } from '@/src/store/escrow';
import { COIN } from '@bcpros/lixi-models';
import {
  BoostForType,
  BoostType,
  CreateBoostInput,
  PostQueryItem,
  Role,
  accountsApi,
  boostApi,
  closeActionSheet,
  closeModal,
  getSelectedWalletPath,
  useSliceDispatch as useLixiSliceDispatch,
  useSliceSelector as useLixiSliceSelector
} from '@bcpros/redux-store';
import { styled } from '@mui/material/styles';

import { BOOST_AMOUNT } from '@/src/store/constants';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Portal, Slide, Typography } from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
import { fromHex, toHex } from 'ecash-lib';
import cashaddr from 'ecashaddrjs';
import React, { useContext, useState } from 'react';
import CustomToast from '../Toast/CustomToast';

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '.MuiPaper-root': {
    background: theme.palette.background.default,
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'cover',
    width: '500px',
    boxSizing: 'border-box',
    padding: '16px',
    margin: '0',
    [theme.breakpoints.down('sm')]: {
      width: '100%'
    }
  },

  '.MuiDialogTitle-root': {
    padding: '0 16px',
    paddingTop: '16px',
    fontSize: '26px',
    textAlign: 'center'
  },

  '.MuiFormControl-root': {
    marginTop: '5px'
  },

  '.MuiDialogContent-root': {
    padding: '0'
  },

  '.MuiDialogActions-root': {
    padding: '0',
    flexDirection: 'column',
    alignItems: 'flex-start',

    '.group-btn': {
      display: 'flex',
      width: '100%',
      gap: '10px'
    },

    '.boost-info': {
      marginTop: '10px',
      marginLeft: '0'
    }
  },

  '.create-boost-btn': {
    color: theme.palette.common.white,
    textTransform: 'none',
    width: '100%'
  },

  '.bold': {
    fontWeight: theme.typography.fontWeightBold
  }
}));

interface BoostModalProps {
  post: PostQueryItem;
  classStyle?: string;
}

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const BoostModal: React.FC<BoostModalProps> = ({ post }: BoostModalProps) => {
  const { totalValidAmount, totalValidUtxos } = useContext(UtxoContext);

  const dispatch = useLixiSliceDispatch();
  const selectedWallet = useLixiSliceSelector(getSelectedWalletPath);
  const { useGetAccountByAddressQuery } = accountsApi;

  const { currentData: accountQueryData } = useGetAccountByAddressQuery(
    { address: selectedWallet?.xAddress },
    { skip: !selectedWallet?.xAddress }
  );

  const [error, setError] = useState(false);
  const [notEnoughMoney, setNotEnoughMoney] = useState(false);
  const [loading, setLoading] = useState(false);
  const [boostSuccess, setBoostSuccess] = useState(false);

  const { useCreateBoostMutation } = boostApi;
  const [createBoostTrigger] = useCreateBoostMutation();

  const handleCloseModal = () => {
    dispatch(closeModal());
  };

  const handleCreateBoost = async (boostType: BoostType) => {
    try {
      setLoading(true);
      const myPk = fromHex(selectedWallet?.publicKey);
      const mySk = fromHex(selectedWallet?.privateKey);
      const GNCAddress = process.env.NEXT_PUBLIC_ADDRESS_GNC;
      const { hash: hashXEC, type: typeXEC } = cashaddr.decode(GNCAddress, false);
      const GNCHash = Buffer.from(hashXEC).toString('hex');

      const amount = BOOST_AMOUNT;
      if (totalValidAmount < amount) {
        setNotEnoughMoney(true);
      }
      const txBuild = withdrawFund(
        totalValidUtxos,
        mySk,
        myPk,
        GNCHash,
        typeXEC.toUpperCase() as 'P2PKH' | 'P2SH',
        amount,
        undefined,
        0
      );

      //create boost
      const createBoostInput: CreateBoostInput = {
        boostedBy: selectedWallet?.hash160,
        boostedValue: amount,
        boostForId: post?.id || '',
        boostForType: BoostForType.Post,
        boostType: boostType,
        txHex: toHex(txBuild)
      };
      await createBoostTrigger({ data: createBoostInput })
        .then(() => {
          setBoostSuccess(true);
          setLoading(false);
        })
        .catch(() => setError(true));
    } catch (err) {
      setError(true);
    }
  };

  return (
    <StyledDialog open={true} onClose={() => handleCloseModal()} TransitionComponent={Transition}>
      <DialogTitle>Boost your offer</DialogTitle>
      <DialogContent>
        <Typography variant="subtitle1" style={{ marginBottom: '5px' }}>
          *Boosted offers (100 XEC) are notified on Telegram channel and are ranked higher in the P2P Market feed
        </Typography>
      </DialogContent>
      <DialogActions style={{ flexBasis: 'column', padding: 0 }}>
        <div className="group-btn">
          {accountQueryData?.getAccountByAddress?.role === Role.Moderator && (
            <Button
              className="create-boost-btn"
              variant="contained"
              style={{ backgroundColor: '#a41208' }}
              onClick={() => handleCreateBoost(BoostType.Down)}
              disabled={loading}
            >
              100 XEC to downvote
            </Button>
          )}
          <Button
            className="create-boost-btn"
            color="info"
            variant="contained"
            onClick={() => handleCreateBoost(BoostType.Up)}
            disabled={loading}
          >
            100 XEC to boost
          </Button>
        </div>
        <Typography component={'div'} className="boost-info">
          <Typography>
            Boosted <span className="bold">{post.boostScore.boostUp / 100}</span> times by you:{' '}
            <span className="bold">{post.boostScore.boostUp}</span> {COIN.XEC}
          </Typography>
          <Typography>
            Downvote <span className="bold">{post.boostScore.boostDown / 100}</span> times by moderator:{' '}
            <span className="bold">{post.boostScore.boostDown}</span> {COIN.XEC}
          </Typography>
        </Typography>
      </DialogActions>
      <Portal>
        <CustomToast
          isOpen={boostSuccess}
          handleClose={() => {
            setBoostSuccess(false);
            handleCloseModal();
            dispatch(closeActionSheet());
          }}
          content="Boost offer successful"
          type="success"
        />
        <CustomToast
          isOpen={error}
          handleClose={() => {
            setError(false);
            handleCloseModal();
            dispatch(closeActionSheet());
          }}
          content="Boost offer failed!"
          type="error"
        />

        <CustomToast
          isOpen={notEnoughMoney}
          handleClose={() => {
            setNotEnoughMoney(false);
            handleCloseModal();
            dispatch(closeActionSheet());
          }}
          content="Not enough XEC to boost!"
          type="error"
        />
      </Portal>
    </StyledDialog>
  );
};

export default BoostModal;
