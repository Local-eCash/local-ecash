export enum TabType {
  ACTIVE = 'Active',
  ARCHIVED = 'Archived',
  RESOLVED = 'Resolved',
  BUYER = 'Buyer',
  SELLER = 'Seller',
  PENDING = 'Pending',
  ESCROWED = 'Escrowed',
  SEND = 'Send',
  RECEIVE = 'Receive',
  FIAT = 'Fiat currency',
  CRYPTO = 'Crypto',
  GOODS_SERVICES = 'Goods services'
}

export const COIN_OTHERS = 'Others';
export const COIN_USD_STABLECOIN = 'USD Stablecoin';
export const COIN_USD_STABLECOIN_TICKER = 'USD';

export const LIST_COIN = [
  {
    id: 1,
    name: 'Bitcoin',
    ticker: 'BTC',
    fixAmount: 1,
    isDisplayTicker: true
  },
  {
    id: 2,
    name: 'Bitcoin Cash',
    ticker: 'BCH',
    fixAmount: 100,
    isDisplayTicker: true
  },
  {
    id: 3,
    name: 'eCash',
    ticker: 'XEC',
    fixAmount: 1000,
    isDisplayTicker: true
  },
  {
    id: 4,
    name: 'Ethereum',
    ticker: 'ETH',
    fixAmount: 100,
    isDisplayTicker: true
  },
  {
    id: 5,
    name: 'Lotus',
    ticker: 'XPI',
    fixAmount: 10000,
    isDisplayTicker: true
  },
  {
    id: 6,
    name: 'DogeCoin',
    ticker: 'DOGE',
    fixAmount: 100,
    isDisplayTicker: true
  },
  {
    id: 7,
    name: 'XRP',
    ticker: 'XRP',
    fixAmount: 100,
    isDisplayTicker: true
  },
  {
    id: 8,
    name: 'LiteCoin',
    ticker: 'LTC',
    fixAmount: 100,
    isDisplayTicker: true
  },
  {
    id: 9,
    name: COIN_USD_STABLECOIN,
    ticker: COIN_USD_STABLECOIN_TICKER,
    fixAmount: 100,
    isDisplayTicker: false
  },
  {
    id: 10,
    name: COIN_OTHERS,
    ticker: COIN_OTHERS,
    fixAmount: 100,
    isDisplayTicker: false
  }
];

export const LIST_USD_STABLECOIN = [
  {
    id: 1,
    name: 'USDT'
  },
  {
    id: 2,
    name: 'USDC'
  }
];

export const THEMES_TYPE = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system'
};

export const IDENTITY_TYPE = {
  TELEGRAM: 'Telegram handle',
  ANONYMOUS: 'Anonymous username'
};

export const BOOST_AMOUNT = 100;

export const AllPaymentMethodIds = [1, 2, 3, 4, 5];
export const AllPaymentMethodIdsFiat = [1, 2, 3];

export const NAME_PAYMENT_METHOD = {
  PAYMENT_METHOD: 'Payment-method',
  CASH_IN_PERSON: 'Cash in person',
  BANK_TRANSFER: 'Bank transfer',
  PAYMENT_APP: 'Payment app',
  CRYPTO: 'Crypto',
  GOODS_SERVICES: 'Goods/services'
};

export const ALL_CURRENCIES = 'All currencies';
export const ALL_CATEGORIES = 'All categories';
export const ALL = 'All';

export const securityDepositPercentage = 1;
