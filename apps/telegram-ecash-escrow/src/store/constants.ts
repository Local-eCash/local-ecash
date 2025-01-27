export enum TabType {
  ACTIVE = 'Active',
  ARCHIVED = 'Archived',
  RESOLVED = 'Resolved',
  BUYER = 'Buyer',
  SELLER = 'Seller',
  PENDING = 'Pending',
  ESCROWED = 'Escrowed',
  SEND = 'Send',
  RECEIVE = 'Receive'
}

export const COIN_OTHERS = 'Others';
export const COIN_USD_STABLECOIN = 'USD Stablecoins';
export const COIN_USD_STABLECOIN_TICKER = 'USD';

export const LIST_COIN = [
  {
    id: 1,
    name: 'Bitcoin',
    ticker: 'BTC',
    fixAmount: 1
  },
  {
    id: 2,
    name: 'Bitcoin Cash',
    ticker: 'BCH',
    fixAmount: 100
  },
  {
    id: 3,
    name: 'eCash',
    ticker: 'XEC',
    fixAmount: 1000
  },
  {
    id: 4,
    name: 'Ethereum',
    ticker: 'ETH',
    fixAmount: 100
  },
  {
    id: 6,
    name: 'DogeCoin',
    ticker: 'DOGE',
    fixAmount: 100
  },
  {
    id: 7,
    name: 'XRP',
    ticker: 'XRP',
    fixAmount: 100
  },
  {
    id: 8,
    name: 'LiteCoin',
    ticker: 'LTC',
    fixAmount: 100
  },
  {
    id: 9,
    name: COIN_USD_STABLECOIN,
    ticker: COIN_USD_STABLECOIN_TICKER,
    fixAmount: 100
  }
];

export const THEMES_TYPE = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system'
};

export const BOOST_AMOUNT = 100;
