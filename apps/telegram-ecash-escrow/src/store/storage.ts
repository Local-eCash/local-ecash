'use client';

import indexedDbStorage from 'redux-persist-indexeddb-storage';

const createNoopStorage = () => {
  return {
    getItem() {
      return Promise.resolve(null);
    },
    setItem(_key: string, value: number) {
      return Promise.resolve(value);
    },
    removeItem() {
      return Promise.resolve();
    }
  };
};

const storage = typeof window !== 'undefined' ? indexedDbStorage('escrow-indexeddb') : createNoopStorage();

export default storage;
