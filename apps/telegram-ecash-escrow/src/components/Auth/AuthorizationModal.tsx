import { closeModal, useSliceDispatch as useLixiSliceDispatch } from '@bcpros/redux-store';
import { Box, Button, Modal } from '@mui/material';
import { useRouter } from 'next/navigation';
import { AuthorizationOptions } from './Authorization.interface';

// export const MaybeLaterLink = styled.a`
//   width: 100%;
//   margin-bottom: 60px;
//   font-size: 16px;
//   color: ${(props) => props.theme.wallet.text.secondary};
//   text-decoration: underline;
//   color: ${(props) => props.theme.primary};
//   text-align: center;
// `;

// const AuthorizationButton = styled(Button)`
//   background: rgb(158, 42, 156);
//   color: white;
//   display: flex;
//   align-items: center;
//   text-align: center;
//   font-weight: 400;
//   font-size: 14px;
//   width: 49%;
//   height: 40px;
//   border-radius: var(--border-radius-primary) !important;
//   justify-content: center;

//   &.cancel {
//     &:hover {
//       color: #fff;
//     }
//   }
//   &.registration {
//     &:hover {
//       color: #fff;
//     }
//     margin-left: 8px !important;
//   }
// `;

interface AuthorizationModalProps {
  options?: AuthorizationOptions;
  classStyle?: string;
}

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  pt: 2,
  px: 4,
  pb: 3
};

export const AuthorizationModal = ({ classStyle }: AuthorizationModalProps) => {
  const dispatch = useLixiSliceDispatch();
  const router = useRouter();

  const handleOnCancel = () => {
    dispatch(closeModal());
  };

  const handleLogIn = () => {
    dispatch(closeModal());
    //TODO: remove existing account before login
    router.push('/login');
  };

  return (
    <Modal
      open={true}
      onClose={handleOnCancel}
      aria-labelledby="child-modal-title"
      aria-describedby="child-modal-description"
    >
      <Box sx={{ ...style, width: 300 }}>
        <h2 style={{ color: 'white' }}>Log in to continue using app</h2>
        <Button onClick={() => handleLogIn()}>Log In</Button>
      </Box>
    </Modal>
  );
};
