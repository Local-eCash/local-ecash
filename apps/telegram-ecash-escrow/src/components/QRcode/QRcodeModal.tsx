import { closeModal, useSliceDispatch as useLixiSliceDispatch } from '@bcpros/redux-store';
import styled from '@emotion/styled';
import { Modal } from '@mui/material';
import QRCode from './QRcode';

interface QRcodeModalProps {
  address: string;
  amount: number;
  classStyle?: string;
}

const WrapQrCode = styled.div`
  background-color: dimgray;
  width: 90%;
  .Qrcode {
    border-radius: 0;
  }
  width: 500px;
  height: 100vh;
  max-height: 100%;
  margin: 0;
  @media (max-width: 576px) {
    width: 100%;
  }
`;

const WrapModal = styled(Modal)`
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const QRcodeModal = ({ classStyle, address, amount }: QRcodeModalProps) => {
  const dispatch = useLixiSliceDispatch();

  const handleOnCancel = () => {
    dispatch(closeModal());
  };

  return (
    <WrapModal
      open={true}
      onClose={handleOnCancel}
      aria-labelledby="child-modal-title"
      aria-describedby="child-modal-description"
    >
      <WrapQrCode>
        <QRCode address={address} amount={amount} />
      </WrapQrCode>
    </WrapModal>
  );
};
