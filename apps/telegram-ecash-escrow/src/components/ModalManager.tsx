import { getCurrentThemes, getModals, useSliceSelector as useLixiSliceSelector } from '@bcpros/redux-store';
import { AuthorizationModal } from './Auth/AuthorizationModal';
import BoostModal from './BoostModal/BoostModal';
import { BackupModal } from './Common/BackupModal';
import { RequiredUsernameModal } from './Common/RequiredUsernameModal';
import ShareSocialModal from './Common/ShareSocialModal';
import CreateOfferModal from './CreateOfferModal/CreateOfferModal';
import SortOfferModal from './FilterOffer/SortOfferModal';
import PlaceAnOrderModal from './PlaceAnOrderModal/PlaceAnOrderModal';
import { QRcodeModal } from './QRcode/QRcodeModal';
import ReasonDisputeModal from './ReasonDisputeModal/ReasonDisputeModal';

const modalComponentLookupTable = {
  AuthorizationModal,
  QRcodeModal,
  ReasonDisputeModal,
  BoostModal,
  CreateOfferModal,
  BackupModal,
  PlaceAnOrderModal,
  RequiredUsernameModal,
  ShareSocialModal,
  SortOfferModal
};

const ModalManager = () => {
  const currentModals = useLixiSliceSelector(getModals);
  const currentTheme = useLixiSliceSelector(getCurrentThemes);
  const renderedModals = currentModals.map((modalDescription, index) => {
    const { modalType, modalProps = {} } = modalDescription;
    const newModalProps = { ...modalProps };
    newModalProps.classStyle = currentTheme === 'dark' ? 'ant-modal-dark' : '';
    const ModalComponent = modalComponentLookupTable[modalType];

    return <ModalComponent {...newModalProps} key={index} />;
  });

  return <span>{renderedModals}</span>;
};

export default ModalManager;
