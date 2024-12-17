export enum TabType {
  ACTIVE = 'Active',
  ARCHIVED = 'Archived',
  RESOLVED = 'Resolved',
  BUYER = 'Buyer',
  SELLER = 'Seller',
  PENDING = 'Pending',
  ESCROWED = 'Escrowed'
}

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
    id: 5,
    name: 'Lotus',
    ticker: 'XPI',
    fixAmount: 1000000
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
  }
];
