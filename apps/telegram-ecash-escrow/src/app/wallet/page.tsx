'use client';

import { BackupModalProps } from '@/src/components/Common/BackupModal';
import Header from '@/src/components/Header/Header';
import QRCode from '@/src/components/QRcode/QRcode';
import SendComponent from '@/src/components/Send/send';
import { TabPanel } from '@/src/components/Tab/Tab';
import AuthorizationLayout from '@/src/components/layout/AuthorizationLayout';
import MobileLayout from '@/src/components/layout/MobileLayout';
import { TabType } from '@/src/store/constants';
import { SettingContext } from '@/src/store/context/settingProvider';
import { UtxoContext } from '@/src/store/context/utxoProvider';
import { formatNumber } from '@/src/store/util';
import { COIN, coinInfo } from '@bcpros/lixi-models';
import {
  WalletContextNode,
  chronikNode,
  convertHashToEcashAddress,
  fiatCurrencyApi,
  formatDate,
  getOfferFilterConfig,
  getSeedBackupTime,
  getSelectedWalletPath,
  getWalletState,
  openModal,
  parseCashAddressToPrefix,
  useSliceDispatch as useLixiSliceDispatch,
  useSliceSelector as useLixiSliceSelector
} from '@bcpros/redux-store';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import SendIcon from '@mui/icons-material/Send';
import { Box, Card, CardContent, CircularProgress, Link, Stack, Tab, Tabs, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Tx_InNode } from 'chronik-client';
import { fromHex } from 'ecash-lib';
import _, { Dictionary } from 'lodash';
import React, { useContext, useEffect, useState } from 'react';
import SwipeableViews from 'react-swipeable-views';

const { getTxHistoryChronik: getTxHistoryChronikNode } = chronikNode;

const WrapWallet = styled('div')(({ theme }) => ({
  position: 'relative',
  backgroundRepeat: 'no-repeat',
  padding: '1rem',
  paddingBottom: '85px',
  minHeight: '100svh',

  '.MuiTab-root': {
    color: theme.custom.colorPrimary,
    textTransform: 'none',
    fontWeight: 600,
    fontSize: '16px',
    '&.Mui-selected': {
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      backdropFilter: 'blur(8px)'
    }
  },

  '.MuiTabs-indicator': {
    backgroundColor: '#0076c4'
  }
}));

const WrapContentWallet = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  '.balance-amount': {
    h5: {
      fontWeight: 'bold'
    },
    '.amount': {
      margin: '16px 0',
      backgroundColor: theme.custom.bgTertiary,
      padding: '28px 16px',
      borderRadius: '16px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      '.coin-ticker': {
        fontSize: '13px'
      }
    }
  }
}));

const ReceiveWrap = styled('div')(({ theme }) => ({
  display: 'flex',
  textAlign: 'center',
  marginTop: '10px'
}));

const SendWrap = styled('div')(({ theme }) => ({
  backgroundColor: theme.custom.bgQuaternary,
  borderRadius: '20px',
  padding: '15px',
  marginTop: '10px'
}));

export default function Wallet() {
  const dispatch = useLixiSliceDispatch();
  const selectedWalletPath = useLixiSliceSelector(getSelectedWalletPath);
  const lastSeedBackupTimeOnDevice = useLixiSliceSelector(getSeedBackupTime);
  const walletState = useLixiSliceSelector(getWalletState);
  const offerFilterConfig = useLixiSliceSelector(getOfferFilterConfig);
  const fiatCurrencyFilter = offerFilterConfig?.fiatCurrency ?? 'USD';

  const Wallet = useContext(WalletContextNode);
  const settingContext = useContext(SettingContext);
  const { totalValidAmount, totalValidUtxos } = useContext(UtxoContext);

  const [value, setValue] = useState(1);
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState(parseCashAddressToPrefix(COIN.XEC, selectedWalletPath?.cashAddress));
  const [walletHistory, setWalletHistory] = useState<
    Dictionary<
      (Tx_InNode & {
        parsed: chronikNode.ParsedChronikTx_InNode;
      })[]
    >
  >();
  const [rateData, setRateData] = useState(null);
  const [amountConverted, setAmountConverted] = useState(0);

  const { useGetAllFiatRateQuery } = fiatCurrencyApi;
  const { data: fiatData } = useGetAllFiatRateQuery();

  const { XPI, chronik } = Wallet;
  const seedBackupTime = settingContext?.setting?.lastSeedBackupTime ?? lastSeedBackupTimeOnDevice ?? '';

  const formatAddress = (address: string) => {
    if (!address) return;

    return address.slice(-8);
  };

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    if (newValue === 0 && !isBackup()) {
      return;
    }
    setValue(newValue);
  };

  const handleChangeIndex = (index: number) => {
    if (index === 0 && !isBackup()) {
      return;
    }
    setValue(index);
  };

  const isBackup = () => {
    //check backup
    const oneMonthLater = new Date(seedBackupTime);
    oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
    const currentDate = new Date();
    const isGreaterThanOneMonth = currentDate > oneMonthLater;

    const backupModalProps: BackupModalProps = {
      isFromSetting: true,
      isFromHome: false
    };

    if (!seedBackupTime || isGreaterThanOneMonth) {
      dispatch(openModal('BackupModal', backupModalProps));

      return false;
    }

    return true;
  };

  const convertXECToAmount = async () => {
    if (!rateData) return 0;

    const rateArrayXec = rateData.find(item => item.coin === 'xec');
    const latestRateXec = rateArrayXec?.rate;
    const amountConverted = totalValidAmount * latestRateXec;
    setAmountConverted(parseFloat(amountConverted.toFixed(2)));
  };

  useEffect(() => {
    (async () => {
      setLoading(true);

      await getTxHistoryChronikNode(chronik, XPI, walletState, 0)
        .then(({ chronikTxHistory }) => {
          const orderedWalletParsedHistory = _.orderBy(chronikTxHistory, x => x.timeFirstSeen, 'desc');

          const walletParsedHistoryGroupByDate = _.groupBy(orderedWalletParsedHistory, item => {
            const currentMonth = new Date().getMonth();
            const dateTime = new Date(formatDate(item.timeFirstSeen.toString()));
            if (currentMonth == dateTime.getMonth()) return 'Recent';
            const month = dateTime.toLocaleString('en', { month: 'long' });

            return month + ' ' + dateTime.getFullYear();
          });

          setWalletHistory(walletParsedHistoryGroupByDate);
        })
        .catch(e => {
          console.log('Error when getTxHistoryChronikNode', e);
        });

      setLoading(false);
    })();
  }, [walletState.walletStatusNode]);

  useEffect(() => {
    const rateData = fiatData?.getAllFiatRate?.find(item => item.currency === fiatCurrencyFilter);
    setRateData(rateData?.fiatRates);
  }, [fiatData?.getAllFiatRate]);

  //convert to fiat
  useEffect(() => {
    convertXECToAmount();
  }, [rateData]);

  return (
    <MobileLayout>
      <AuthorizationLayout>
        <WrapWallet>
          <Header />

          <WrapContentWallet>
            <div className="balance-amount">
              <Typography variant="h5">Balance</Typography>
              <div className="amount">
                <Typography variant="h5">
                  {formatNumber(totalValidAmount ?? 0)} <span className="coin-ticker">XEC</span>
                </Typography>
                <Typography variant="h6" style={{ fontSize: '16px' }}>
                  ~{formatNumber(amountConverted ?? 0)} <span className="coin-ticker">{fiatCurrencyFilter}</span>
                </Typography>
              </div>
            </div>
            <div>
              <Tabs
                value={value}
                onChange={handleChange}
                indicatorColor="secondary"
                textColor="inherit"
                variant="fullWidth"
              >
                <Tab
                  label={TabType.SEND}
                  id={`full-width-tab-${TabType.SEND}`}
                  aria-controls={`full-width-tabpanel-${TabType.SEND}`}
                />
                <Tab
                  label={TabType.RECEIVE}
                  id={`full-width-tab-${TabType.RECEIVE}`}
                  aria-controls={`full-width-tabpanel-${TabType.RECEIVE}`}
                />
              </Tabs>
              <SwipeableViews index={value} onChangeIndex={handleChangeIndex}>
                <TabPanel value={value} index={0}>
                  <SendWrap>
                    <SendComponent totalValidAmount={totalValidAmount} totalValidUtxos={totalValidUtxos} />
                  </SendWrap>
                </TabPanel>
                <TabPanel value={value} index={1}>
                  <ReceiveWrap>
                    <QRCode address={address} />
                  </ReceiveWrap>
                  <Typography variant="h5" align="center" marginTop="10px" fontWeight="bold">
                    Transaction History
                  </Typography>
                  {loading ? (
                    <Box sx={{ height: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CircularProgress color="primary" />
                    </Box>
                  ) : (
                    <React.Fragment>
                      {!_.isEmpty(walletHistory) ? (
                        Object.keys(walletHistory).map(index => {
                          return (
                            <React.Fragment key={index}>
                              <Typography variant="h6" marginTop="10px" fontWeight="bold">
                                {index}
                              </Typography>
                              {walletHistory[index].map(item => {
                                return (
                                  <Card key={item.txid} sx={{ marginTop: '10px' }}>
                                    <CardContent sx={{ padding: '10px !important' }}>
                                      <div
                                        style={{
                                          display: 'flex',
                                          justifyContent: 'space-between',
                                          alignItems: 'center'
                                        }}
                                      >
                                        <Stack direction={'row'} spacing={1.5}>
                                          {item.parsed.incoming ? (
                                            <FileDownloadIcon sx={{ fontSize: '40px' }} color="primary" />
                                          ) : (
                                            <SendIcon sx={{ fontSize: '40px' }} />
                                          )}
                                          <Stack spacing={0.5}>
                                            <Typography>
                                              <span>{item.parsed.incoming ? 'Received from: ' : 'Sent to: '}</span>
                                              <Link
                                                style={{ fontWeight: 'bold' }}
                                                href={`${coinInfo[COIN.XEC].blockExplorerUrl}/address/${item.parsed.incoming ? convertHashToEcashAddress(fromHex(item.parsed.replyAddressHash)) : convertHashToEcashAddress(fromHex(item.parsed.destinationAddressHash))}`}
                                                target="_blank"
                                                rel="noopener"
                                              >
                                                {item.parsed.incoming
                                                  ? formatAddress(
                                                      convertHashToEcashAddress(fromHex(item.parsed.replyAddressHash))
                                                    )
                                                  : formatAddress(
                                                      convertHashToEcashAddress(
                                                        fromHex(item.parsed.destinationAddressHash)
                                                      )
                                                    )}
                                              </Link>
                                            </Typography>
                                            <Typography fontSize="12px">
                                              {new Date(item.timeFirstSeen * 1000).toLocaleString('vi-VN')}
                                            </Typography>
                                          </Stack>
                                        </Stack>
                                        <Stack spacing={0.5}>
                                          <Typography fontSize="17px" fontWeight={'bold'}>
                                            {item.parsed.incoming ? '+ ' : '- '}
                                            {formatNumber(parseFloat(item.parsed.xecAmount) ?? 0)} XEC
                                          </Typography>
                                          <Link
                                            style={{ textAlign: 'right' }}
                                            href={`${coinInfo[COIN.XEC].blockExplorerUrl}/tx/${item.txid}`}
                                            target="_blank"
                                            rel="noopener"
                                          >
                                            <OpenInNewIcon fontSize="small" sx={{ cursor: 'pointer' }} />
                                          </Link>
                                        </Stack>
                                      </div>
                                    </CardContent>
                                  </Card>
                                );
                              })}
                            </React.Fragment>
                          );
                        })
                      ) : (
                        <Typography variant="body1" align="center" marginTop="10px">
                          So empty... Maybe this wallet need some XEC?
                        </Typography>
                      )}
                    </React.Fragment>
                  )}
                </TabPanel>
              </SwipeableViews>
            </div>
          </WrapContentWallet>
        </WrapWallet>
      </AuthorizationLayout>
    </MobileLayout>
  );
}
