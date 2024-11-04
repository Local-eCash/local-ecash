import { getActionSheet, useSliceSelector as useLixiSliceSelector } from '@bcpros/redux-store';
import _ from 'lodash';
import OfferActionSheet from './OfferActionSheet';

const actionSheetComponentLookupTable = {
  OfferActionSheet
};

const ActionSheet = () => {
  const currentActionSheet = useLixiSliceSelector(getActionSheet);

  const renderedActionSheet = currentActionSheet.map((actionSheetDescription, index) => {
    const { actionSheetType, actionSheetProps = {} } = actionSheetDescription;
    const actionSheetPropsClone = _.cloneDeep(actionSheetProps);
    let newActionSheetProps = { ...actionSheetPropsClone };
    const DrawerComponent = actionSheetComponentLookupTable[actionSheetType];

    return <DrawerComponent {...newActionSheetProps} key={actionSheetType + index} />;
  });

  return <>{renderedActionSheet}</>;
};

export default ActionSheet;
