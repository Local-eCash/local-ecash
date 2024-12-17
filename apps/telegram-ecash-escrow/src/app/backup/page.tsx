'use client';
import CustomToast from '@/src/components/Toast/CustomToast';
import MobileLayout from '@/src/components/layout/MobileLayout';
import { SettingContext } from '@/src/store/context/settingProvider';
import { UpdateSettingCommand } from '@bcpros/lixi-models';
import {
  getSelectedAccountId,
  getWalletMnemonic,
  settingApi,
  useSliceDispatch as useLixiSliceDispatch,
  useSliceSelector as useLixiSliceSelector
} from '@bcpros/redux-store';
import styled from '@emotion/styled';
import { CheckCircleOutline, Close } from '@mui/icons-material';
import { Alert, Button, IconButton, Typography } from '@mui/material';
import { useRouter, useSearchParams } from 'next/navigation';
import { useContext, useEffect, useMemo, useState } from 'react';
import BackupSeed, { BackupWordModel } from './backup-seed';

const ContainerBackupGame = styled.div`
  padding: 1rem;
  .setting-info {
    margin-top: 1rem;
    display: flex;
    align-items: center;
    gap: 10px;

    .back-btn {
      padding: 0;
      border-radius: 12px;

      svg {
        font-size: 32px;
      }
    }
  }
  .setting-content {
    padding: 0 0 1rem;
    .setting-item {
      margin-bottom: 1rem;
      .title {
        padding-bottom: 1rem;
        font-size: 14px;
        color: #edeff099;
      }
      .ico-alert {
        align-self: center !important;
      }
    }
  }
`;

const WordGuessContainer = styled.div`
  padding: 1rem;
  background: #2c2c2c;
  font-size: 14px;
  border-radius: 10px;
  color: #fff;
  .word-guess-content {
    display: flex;
    gap: 1rem;
    margin-top: 1rem;
    .random-word {
      padding: 0.5rem 1rem;
      border: 1px solid gray;
      background: #161b22;
      border-radius: 8px;
      font-size: 14px;
    }
  }
`;

export default function Backup() {
  const settingContext = useContext(SettingContext);
  const { setSetting } = settingContext;
  const dispatch = useLixiSliceDispatch();
  const searchParams = useSearchParams();
  const walletMnemonic = useLixiSliceSelector(getWalletMnemonic);
  const selectedAccountId = useLixiSliceSelector(getSelectedAccountId);
  const [mnemonicWordsConverted, setMnemonicWordsConverted] = useState<Array<BackupWordModel>>(
    walletMnemonic
      ? walletMnemonic.split(' ').map(item => {
          return {
            word: item,
            isCorrect: true,
            isBlur: true
          };
        })
      : []
  );
  const [isPlayGame, setIsPlayGame] = useState<boolean>(false);
  const [countWord, setCountWord] = useState(0);
  const [libWord, setLibWord] = useState<string[]>([]);
  const [randomListFinal, setRandomListFinal] = useState<string[]>([]);
  const [finished, setFinished] = useState(false);

  const router = useRouter();
  const finalStep = async () => {
    //set time backup
    try {
      const updateSettingCommand: UpdateSettingCommand = {
        accountId: selectedAccountId,
        lastSeedBackupTime: new Date()
      };
      if (selectedAccountId) {
        const updatedSetting = await settingApi.updateSetting(updateSettingCommand);
        setSetting(updatedSetting);
      }
    } catch (err) {
      console.log('err when update setting: ', err);
    }

    setFinished(true);
    //router after 2s
    setTimeout(() => {
      const isFromSetting = searchParams.get('isFromSetting');
      const isFromHome = searchParams.get('isFromHome');
      const offerId = searchParams.get('offerId');
      isFromSetting
        ? router.push('/settings')
        : router.push(isFromHome && offerId ? `/?offerId=${offerId}` : `offer-detail?id=${offerId}`);
    }, 2000);
  };

  const memoizedLibWord = useMemo(() => {
    return libWord;
  }, [libWord]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    createRandom();
  }, [memoizedLibWord]);

  const fetchData = () => {
    fetch('/backup-word.txt')
      .then(response => response.text())
      .then(data => {
        const result = data.split(/\r\n|\n/);
        setLibWord(result);
      });
  };

  const createRandom = (tempCount?: number) => {
    if (mnemonicWordsConverted.length === 0) return;
    const randomList = [mnemonicWordsConverted[tempCount || countWord]?.word];
    for (let i = 0; i < 2; i++) {
      let isDone = true;
      while (isDone) {
        const randomNumber = Math.floor(Math.random() * libWord.length);
        const wordRandom = libWord[randomNumber];
        if (wordRandom !== mnemonicWordsConverted[tempCount || countWord]?.word) {
          randomList.push(wordRandom);
          isDone = false;
        }
      }
    }
    shuffleArray(randomList);
    setRandomListFinal([...randomList]);
  };

  const shuffleArray = (array: string[]) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  };

  const checkWord = async (word: string) => {
    if (countWord === 12) return;
    if (word === mnemonicWordsConverted[countWord].word) {
      setMnemonicWordsConverted(prev => {
        const updatedArray = [...prev];
        updatedArray[countWord] = {
          ...updatedArray[countWord],
          isCorrect: true,
          isBlur: false
        };

        return updatedArray;
      });
      setCountWord(countWord + 1);
      const tempCount = countWord + 1;
      if (tempCount === 12) {
        finalStep();
      } else {
        createRandom(tempCount);
      }
    } else {
      setMnemonicWordsConverted(prev => {
        const updatedArray = [...prev];
        updatedArray[countWord] = {
          ...updatedArray[countWord],
          isCorrect: false
        };

        return updatedArray;
      });
    }
  };

  return (
    <MobileLayout>
      <ContainerBackupGame>
        <div className="setting-info">
          <IconButton className="back-btn" onClick={() => router.back()}>
            <Close />
          </IconButton>
          <Typography variant="h5">{!isPlayGame ? 'Your recovery phrase' : 'Verify your phrase'}</Typography>
        </div>
        <div className="setting-content">
          <div className="setting-item">
            <p className="title">
              {!isPlayGame
                ? `Your recovery key is composed of 12 randomly selected words. Please
                carefully write down each word in the order it appears.`
                : `Let check your wrote down the phrase correctly. Please select each word in the numbered order.`}
            </p>
            {!isPlayGame ? (
              <Alert icon={<CheckCircleOutline className="ico-alert" fontSize="inherit" />} severity="warning">
                Never share your recovery phrase with anyone, store it securely !
              </Alert>
            ) : (
              <WordGuessContainer>
                <div className="word-guess-title">{'Word #' + (countWord + 1 > 12 ? 12 : countWord + 1)}</div>
                <div className="word-guess-content">
                  {randomListFinal &&
                    randomListFinal.map((word, index) => {
                      return (
                        <div key={index} className="random-word" onClick={() => checkWord(word)}>
                          {word}
                        </div>
                      );
                    })}
                </div>
              </WordGuessContainer>
            )}
          </div>

          <BackupSeed mnemonicWords={mnemonicWordsConverted} isPlayGame={isPlayGame} />
        </div>
        {!isPlayGame ? (
          <Button
            onClick={() => {
              setIsPlayGame(true);
            }}
            variant="contained"
            fullWidth
          >
            Continue
          </Button>
        ) : (
          <Button
            onClick={() => {
              setIsPlayGame(false);
            }}
            variant="contained"
            fullWidth
          >
            Back
          </Button>
        )}
        <CustomToast
          isOpen={finished}
          content="Congratulation!! Please store these seed in a secure place"
          handleClose={() => setFinished(false)}
          type="success"
        />
      </ContainerBackupGame>
    </MobileLayout>
  );
}
