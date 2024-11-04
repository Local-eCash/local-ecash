import { openModal, useSliceDispatch as useLixiSliceDispatch } from '@bcpros/redux-store';
import { AuthorizationOptions } from './Authorization.interface';

export type HanldeAuthorization = (options?: AuthorizationOptions) => void;
const useAuthorization = () => {
  const dispatch = useLixiSliceDispatch();

  return (options?: AuthorizationOptions) => {
    dispatch(openModal('AuthorizationModal', { options: options }));
  };
};

export default useAuthorization;
