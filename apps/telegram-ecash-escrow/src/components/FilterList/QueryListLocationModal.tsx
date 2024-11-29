'use client';

import styled from '@emotion/styled';
import { ChevronLeft } from '@mui/icons-material';
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  IconButton,
  Slide,
  TextField,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
import React, { useState } from 'react';

interface QueryListLocationModalProps {
  isOpen: boolean;
  listItems: any;
  loading?: boolean;
  handleChange: (value: any) => void;
  onDissmissModal?: (value: boolean) => void;
  setSelectedItem?: (value: any) => void;
}

const StyledDialog = styled(Dialog)`
  .MuiPaper-root {
    background-image: url('/bg-dialog.svg');
    background-repeat: no-repeat;
    background-size: cover;
    width: 500px;
    height: 100vh;
    max-height: 100%;
    margin: 0;
    @media (max-width: 576px) {
      width: 100%;
    }
  }

  .MuiIconButton-root {
    width: fit-content;
    svg {
      font-size: 32px;
    }
  }

  .MuiDialogTitle-root {
    padding: 0 16px;
    padding-top: 16px;
    font-size: 26px;
    text-align: center;
  }

  .MuiDialogContent-root {
    padding: 0;
  }
`;

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement;
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const QueryListLocationModal: React.FC<QueryListLocationModalProps> = props => {
  const { isOpen, listItems, loading, onDissmissModal, setSelectedItem, handleChange } = props;
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

  const [searchTerm, setSearchTerm] = useState('');

  const handleSelect = value => {
    setSelectedItem(value);
    onDissmissModal(false);
  };

  return (
    <React.Fragment>
      <StyledDialog
        fullScreen={fullScreen}
        open={isOpen}
        onClose={() => props.onDissmissModal!(false)}
        TransitionComponent={Transition}
      >
        <IconButton className="back-btn" onClick={() => props.onDissmissModal!(false)}>
          <ChevronLeft />
        </IconButton>
        <DialogContent>
          <Box sx={{ p: 2, width: '90%' }}>
            <TextField
              label="Search"
              variant="filled"
              fullWidth
              onChange={e => {
                handleChange(e);
                setSearchTerm(e.target.value);
              }}
              value={searchTerm}
            />
            <Box sx={{ mt: 1 }}>
              {listItems.map(option => (
                <Button
                  key={option?.primaryId}
                  onClick={() => handleSelect(option)}
                  fullWidth
                  variant="text"
                  style={{ textTransform: 'capitalize', color: '#fff', fontSize: '1.1rem' }}
                  sx={{ justifyContent: 'flex-start', textAlign: 'left' }}
                >
                  {`${option?.cityAscii}, ${option?.adminNameAscii}, ${option?.country}`}
                </Button>
              ))}
              {listItems.length === 0 && !loading && (
                <Button
                  variant="text"
                  style={{ textTransform: 'capitalize', color: '#fff', fontSize: '1.1rem' }}
                  sx={{ justifyContent: 'flex-start', textAlign: 'left' }}
                >
                  Nothing here
                </Button>
              )}
              {loading && (
                <Button
                  variant="text"
                  style={{ textTransform: 'capitalize', color: '#fff', fontSize: '1.1rem' }}
                  sx={{ justifyContent: 'flex-start', textAlign: 'left' }}
                >
                  Loading...
                </Button>
              )}
            </Box>
          </Box>
        </DialogContent>
      </StyledDialog>
    </React.Fragment>
  );
};

export default QueryListLocationModal;
