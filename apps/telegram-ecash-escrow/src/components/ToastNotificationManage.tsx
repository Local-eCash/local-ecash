import {
  closeToast,
  getCurrentThemes,
  getToastNotification,
  ToastType,
  useSliceDispatch as useLixiSliceDispatch,
  useSliceSelector as useLixiSliceSelector
} from '@bcpros/redux-store';
import _ from 'lodash';
import { useEffect, useState } from 'react';
import intl from 'react-intl-universal';
import CustomToast from './Toast/CustomToast';

const DURATION_DEFAULT = 3;

const ToastNotificationManage = () => {
  const currentToast = useLixiSliceSelector(getToastNotification);
  const currentTheme = useLixiSliceSelector(getCurrentThemes);
  const dispatch = useLixiSliceDispatch();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(DURATION_DEFAULT);

  useEffect(() => {
    if (currentToast) {
      const { type, config, isLink, linkDescription } = currentToast;
      if (config && !_.isEmpty(config.description)) {
        const newConfig = _.cloneDeep(config);

        //process link
        if (isLink) {
          newConfig.description = (
            <a href={`${newConfig.description}`} target="_blank" rel="noopener noreferrer">
              <p>{linkDescription}</p>
            </a>
          );
        }

        newConfig.placement = 'topLeft'; //fault of lib (top is topLeft, topLeft is top)
        newConfig.className = `custom-toast-notification ${
          currentTheme === 'dark' ? 'custom-toast-notification-dark' : 'custom-toast-notification-light'
        }`;
        newConfig.description = newConfig?.description || intl.get(`toast.${type}`);
        newConfig.duration = newConfig?.duration || DURATION_DEFAULT;

        setType(type);
        setDescription(newConfig?.description as string);
        setDuration(newConfig.duration);

        setOpen(true);
        dispatch(closeToast());
      }
    }
  }, [currentToast]);

  return (
    <CustomToast
      isOpen={open}
      content={description}
      handleClose={() => setOpen(false)}
      autoHideDuration={duration * 1000}
      type={type as Exclude<ToastType, 'open' | 'burn'>}
    />
  );
};

export default ToastNotificationManage;
