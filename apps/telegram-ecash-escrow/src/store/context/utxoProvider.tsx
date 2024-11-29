import { COIN, coinInfo } from '@bcpros/lixi-models';
import {
  UtxoInNode,
  UtxoInNodeInput,
  escrowOrderApi,
  getSlpBalancesAndUtxosNode,
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
  const [token, setToken] = useState<string | null>(sessionStorage.getItem('Authorization'));
  const utxosNode = useLixiSliceSelector(getSlpBalancesAndUtxosNode);

  const [totalValidAmount, setTotalValidAmount] = useState<number>(0);
  const [totalValidUtxos, setTotalValidUtxos] = useState([]);

  const { useFilterUtxosMutation } = escrowOrderApi;
  const [filterUtxos] = useFilterUtxosMutation();

  const contextValue = useMemo(() => ({ totalValidAmount, totalValidUtxos }), [totalValidAmount, totalValidUtxos]);

  useEffect(() => {
    if (_.isNil(token)) {
      const maximumAttempts = 10;
      let attempts = 0;

      const interval = setInterval(() => {
        const sessionToken = sessionStorage.getItem('Authorization');
        attempts++;
        if (sessionToken) {
          setToken(sessionToken);
          clearInterval(interval); // stop polling once token is set
        } else if (attempts >= maximumAttempts) {
          console.warn('Max attempts reached, interval cleared without finding token'); // Warning log
          clearInterval(interval); // Clear interval after maximum attempts
        }
      }, 500); // check every 500ms

      return () => clearInterval(interval);
    }
  }, []);

  // Call to validate UTXOs
  useEffect(() => {
    if (_.isNil(utxosNode) || utxosNode.length === 0) return;

    const listUtxos: UtxoInNodeInput[] = utxosNode.map(item => ({
      txid: item.outpoint.txid,
      outIdx: item.outpoint.outIdx,
      value: item.value
    }));

    token &&
      (async () => {
        try {
          const listFilterUtxos = await filterUtxos({
            input: listUtxos
          }).unwrap();
          const totalValueUtxos = listFilterUtxos.filterUtxos.reduce((acc, item) => acc + item.value, 0);
          setTotalValidUtxos(listFilterUtxos.filterUtxos);
          setTotalValidAmount(totalValueUtxos / Math.pow(10, coinInfo[COIN.XEC].cashDecimals));
        } catch (error) {
          console.error('Error filtering UTXOs:', error);
        }
      })();
  }, [utxosNode, token]);

  return <UtxoContext.Provider value={contextValue}>{children}</UtxoContext.Provider>;
}
