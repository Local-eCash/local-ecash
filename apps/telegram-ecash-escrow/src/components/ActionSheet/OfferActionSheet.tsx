import {
  OfferQueryItem,
  OfferStatus,
  UpdateOfferStatusInput,
  closeActionSheet,
  offerApi,
  openModal,
  useSliceDispatch as useLixiSliceDispatch
} from '@bcpros/redux-store';
import { Box, List, ListItem, ListItemButton, ListItemText, SwipeableDrawer, styled } from '@mui/material';
import { useState } from 'react';

const ListStyled = styled(List)`
  background-color: #121212;
  padding: 8px 5px;

  li {
    background-color: #494949;
    border-radius: 10px;
    margin-top: 7px;
  }
`;

interface OfferActionSheetProps {
  offer: OfferQueryItem;
}

export default function OfferActionSheet({ offer }: OfferActionSheetProps) {
  const dispatch = useLixiSliceDispatch();
  const [open, setOpen] = useState(true);

  const { useUpdateOfferStatusMutation } = offerApi;
  const [triggerUpdateOfferStatus] = useUpdateOfferStatusMutation();

  const editOffer = () => {
    dispatch(openModal('CreateOfferModal', { offer: offer, isEdit: true }));
    dispatch(closeActionSheet());
  };

  const handleClickArchive = () => {
    const input: UpdateOfferStatusInput = {
      id: offer.postId,
      status: OfferStatus.Archive
    };
    triggerUpdateOfferStatus({ input });
  };

  const handleClose = () => {
    setOpen(false);
    setTimeout(() => {
      dispatch(closeActionSheet());
    }, 500);
  };

  const list = () => (
    <Box role="presentation">
      <ListStyled>
        <ListItem key={'Edit'} disablePadding>
          <ListItemButton onClick={editOffer}>
            <ListItemText primary={'Edit offer'} />
          </ListItemButton>
        </ListItem>
        <ListItem key={'Archived'} disablePadding>
          <ListItemButton onClick={handleClickArchive}>
            <ListItemText primary={'Archived offer'} />
          </ListItemButton>
        </ListItem>
      </ListStyled>
    </Box>
  );

  return (
    <SwipeableDrawer
      anchor={'bottom'}
      open={open}
      onClose={handleClose}
      onOpen={() => console.log('open')}
      PaperProps={{
        sx: {
          width: {
            xs: '100%',
            sm: 500
          },
          left: {
            sm: '50%'
          },
          transform: {
            sm: 'translateX(-50%)'
          }
        }
      }}
    >
      {list()}
    </SwipeableDrawer>
  );
}
