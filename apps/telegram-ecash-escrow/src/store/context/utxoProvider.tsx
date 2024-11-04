import { COIN, coinInfo } from '@bcpros/lixi-models';
import {
  UtxoInNode,
  UtxoInNodeInput,
  escrowOrderApi,
  getSelectedWalletPath,
  getWalletUtxosNode,
  useSliceSelector as useLixiSliceSelector
} from '@bcpros/redux-store';
import _ from 'lodash';
import { createContext, useEffect, useMemo, useState } from 'react';

export interface UtxoContextType {
  totalValidAmount: number;
  totalValidUtxos: Array<UtxoInNode>;
}
// Create the Context
export const UtxoContext = createContext<UtxoContextType>(undefined);

export function UtxoProvider({ children }) {
  const utxos = useLixiSliceSelector(getWalletUtxosNode);
  const selectedWalletPath = useLixiSliceSelector(getSelectedWalletPath);

  const [totalValidAmount, setTotalValidAmount] = useState<number>(0);
  const [totalValidUtxos, setTotalValidUtxos] = useState([]);

  const { useFilterUtxosMutation } = escrowOrderApi;
  const [filterUtxos] = useFilterUtxosMutation();

  const contextValue = useMemo(() => ({ totalValidAmount, totalValidUtxos }), [totalValidAmount, totalValidUtxos]);

  // Call to validate UTXOs
  useEffect(() => {
    if (_.isNil(utxos) || utxos.length === 0) return;

    const listUtxos: UtxoInNodeInput[] = utxos.map(item => ({
      txid: item.outpoint.txid,
      outIdx: item.outpoint.outIdx,
      value: item.value
    }));

    (async () => {
      try {
        const listFilterUtxos = await filterUtxos({
          input: listUtxos,
          hash160: selectedWalletPath.hash160
        }).unwrap();
        const totalValueUtxos = listFilterUtxos.filterUtxos.reduce((acc, item) => acc + item.value, 0);
        setTotalValidUtxos(listFilterUtxos.filterUtxos);
        setTotalValidAmount(totalValueUtxos / Math.pow(10, coinInfo[COIN.XEC].cashDecimals));
      } catch (error) {
        console.error('Error filtering UTXOs:', error);
      }
    })();
  }, [utxos]);

  return <UtxoContext.Provider value={contextValue}>{children}</UtxoContext.Provider>;
}
