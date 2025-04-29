'use client';

import {
  OfferFilterInput,
  OfferOrderField,
  OrderDirection,
  closeModal,
  getOfferFilterConfig,
  saveOfferFilterConfig,
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
  NativeSelect,
  Slide,
  Typography
} from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
import React, { useState } from 'react';

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
    padding: '0',

    '.item': {
      marginBottom: '1rem'
    }
  },

  '.MuiDialogActions-root': {
    padding: '0',
    flexDirection: 'row',
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

  '.bold': {
    fontWeight: theme.typography.fontWeightBold
  }
}));

interface SortOfferModalProps {
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

const SortOfferModal: React.FC<SortOfferModalProps> = () => {
  const dispatch = useLixiSliceDispatch();
  const offerFilterConfig = useLixiSliceSelector(getOfferFilterConfig);

  const [offerOrderField, setOfferOrderField] = useState<OfferOrderField>(
    offerFilterConfig?.offerOrder?.field ?? OfferOrderField.Relevance
  );
  const [offerOrderDirection, setOfferOrderDirection] = useState<OrderDirection>(
    offerFilterConfig?.offerOrder?.direction ?? OrderDirection.Desc
  );

  const offerOrderFieldOptions = [
    {
      id: 1,
      value: OfferOrderField.Relevance,
      label: 'Relevance score'
    },
    {
      id: 2,
      value: OfferOrderField.Price,
      label: 'Price'
    },
    {
      id: 3,
      value: OfferOrderField.Trades,
      label: 'Trades'
    },
    {
      id: 4,
      value: OfferOrderField.DonationAmount,
      label: 'Donation amount'
    }
  ];

  const offerDirectionOptions = [
    {
      id: 1,
      value: OrderDirection.Desc,
      label: 'Descending'
    },
    {
      id: 2,
      value: OrderDirection.Asc,
      label: 'Ascending'
    }
  ];

  const handleCloseModal = () => {
    dispatch(closeModal());
  };

  function handleSort(isReset = false): void {
    const offerFilterInput: OfferFilterInput = {
      ...offerFilterConfig,
      offerOrder: {
        field: isReset ? OfferOrderField.Relevance : offerOrderField,
        direction: isReset ? OrderDirection.Desc : offerOrderDirection
      }
    };

    dispatch(saveOfferFilterConfig(offerFilterInput));
    handleCloseModal();
  }

  return (
    <StyledDialog open={true} onClose={() => handleCloseModal()} TransitionComponent={Transition}>
      <DialogTitle>Sort Options</DialogTitle>
      <DialogContent>
        <div className="item">
          <Typography variant="subtitle1" className="title">
            Sort by
          </Typography>
          <NativeSelect
            fullWidth
            id="select-field"
            defaultValue={offerOrderField}
            onChange={e => setOfferOrderField(e.target.value as OfferOrderField)}
          >
            {offerOrderFieldOptions.map(item => {
              return (
                <option key={item.id} value={item.value}>
                  {item.label}
                </option>
              );
            })}
          </NativeSelect>
        </div>
        <div className="item">
          <Typography variant="subtitle1" className="title">
            Order
          </Typography>
          <NativeSelect
            fullWidth
            id="select-direction"
            defaultValue={offerOrderDirection}
            onChange={e => setOfferOrderDirection(e.target.value as OrderDirection)}
          >
            {offerDirectionOptions.map(item => {
              return (
                <option key={item.id} value={item.value}>
                  {item.label}
                </option>
              );
            })}
          </NativeSelect>
        </div>
      </DialogContent>
      <DialogActions>
        <Button fullWidth color="info" variant="contained" onClick={() => handleSort(true)}>
          Reset
        </Button>
        <Button fullWidth color="info" variant="contained" onClick={() => handleSort()}>
          Apply
        </Button>
      </DialogActions>
    </StyledDialog>
  );
};

export default SortOfferModal;
