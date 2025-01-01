'use client';

import { UtxoContext } from '@/src/store/context/utxoProvider';
import { withdrawFund } from '@/src/store/escrow';
import { COIN } from '@bcpros/lixi-models';
import {
  boostApi,
  BoostForType,
  BoostType,
  closeModal,
  CreateBoostInput,
  getSelectedWalletPath,
  PostQueryItem,
  useSliceDispatch as useLixiSliceDispatch,
  useSliceSelector as useLixiSliceSelector
} from '@bcpros/redux-store';
import { styled } from '@mui/material/styles';

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Portal,
  Slide,
  Typography,
  useTheme
} from '@mui/material';
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
  amount: number;
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

const BoostModal: React.FC<BoostModalProps> = ({ amount, post }: BoostModalProps) => {
  const { totalValidAmount, totalValidUtxos } = useContext(UtxoContext);

  const dispatch = useLixiSliceDispatch();
  const selectedWallet = useLixiSliceSelector(getSelectedWalletPath);
  const theme = useTheme();

  const [error, setError] = useState(false);
  const [notEnoughMoney, setNotEnoughMoney] = useState(false);
  const [loading, setLoading] = useState(false);
  const [boostSuccess, setBoostSuccess] = useState(false);

  const { useCreateBoostMutation } = boostApi;
  const [createBoostTrigger] = useCreateBoostMutation();

  const handleCloseModal = () => {
    dispatch(closeModal());
  };

  const handleCreateBoost = async () => {
    try {
      setLoading(true);
      const myPk = fromHex(selectedWallet?.publicKey);
      const mySk = fromHex(selectedWallet?.privateKey);
      const GNCAddress = process.env.NEXT_PUBLIC_ADDRESS_GNC;
      const { hash: hashXEC } = cashaddr.decode(GNCAddress, false);
      const GNCHash = Buffer.from(hashXEC).toString('hex');

      if (totalValidAmount < amount) {
        setNotEnoughMoney(true);
      }
      const txBuild = withdrawFund(totalValidUtxos, mySk, myPk, GNCHash, 'P2SH', amount, undefined, 0);

      //create boost
      const createBoostInput: CreateBoostInput = {
        boostedBy: selectedWallet?.hash160,
        boostedValue: amount,
        boostForId: post?.id || '',
        boostForType: BoostForType.Post,
        boostType: BoostType.Up,
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
        <Button
          className="create-boost-btn"
          color="info"
          variant="contained"
          onClick={() => handleCreateBoost()}
          disabled={loading}
        >
          100 XEC to boost
        </Button>
        <Typography className="boost-info">
          Boosted <span className="bold">{post.boostScore.boostScore / 100}</span> times by you:{' '}
          <span className="bold">{post.boostScore.boostScore}</span> {COIN.XEC}
        </Typography>
      </DialogActions>
      <Portal>
        <CustomToast
          isOpen={boostSuccess}
          handleClose={() => {
            setBoostSuccess(false);
            handleCloseModal();
          }}
          content="Boost offer successful"
          type="success"
        />
        <CustomToast
          isOpen={error}
          handleClose={() => {
            setError(false);
            handleCloseModal();
          }}
          content="Boost offer failed!"
          type="error"
        />

        <CustomToast
          isOpen={notEnoughMoney}
          handleClose={() => {
            setNotEnoughMoney(false);
            handleCloseModal();
          }}
          content="Not enough XEC to boost!"
          type="error"
        />
      </Portal>
    </StyledDialog>
  );
};

export default BoostModal;
