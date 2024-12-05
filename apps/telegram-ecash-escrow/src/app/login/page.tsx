'use client';
import MobileLayout from '@/src/components/layout/MobileLayout';
import { AccountType, COIN, GenerateAccountType } from '@bcpros/lixi-models';
import {
  axiosClient,
  generateAccount,
  getSelectedWalletPath,
  showToast,
  useSliceDispatch as useLixiSliceDispatch,
  useSliceSelector as useLixiSliceSelector
} from '@bcpros/redux-store';
import styled from '@emotion/styled';
import { Box, Skeleton, Typography } from '@mui/material';
import { LoginButton, TelegramAuthData } from '@telegram-auth/react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

function LoadingPlaceholder() {
  return (
    <Box padding="6">
      <Skeleton variant="rectangular" />
    </Box>
  );
}

const ContainerHome = styled.div`
  display: grid;
  grid-template-rows: 85% 15%;
  padding: 1rem;
  height: 100vh;
  text-align: center;
`;

const FeatureEducation = styled.div`
  img {
    max-width: 100%;
  }
  .feature-title {
    font-weight: 600;
    align-items: center;
    text-align: center;
    line-height: 34px;
  }
  .feature-subtitle {
    font-size: 16px;
    text-align: center;
    color: #9aa5ac;
    font-weight: 300;
    padding-top: 15px;
    line-height: 28px;
  }
`;

const FunctionalBar = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  row-gap: 0.5rem;
`;

const WrapLoginPage = styled.div`
  background-color: rgba(255, 255, 255, 0.08);
  margin-top: 40%;
  padding: 20px;
  border-radius: 25px;
`;

export default function Login() {
  const router = useRouter();
  const { status } = useSession();
  const dispatch = useLixiSliceDispatch();
  const selectedWalletPath = useLixiSliceSelector(getSelectedWalletPath);

  const [data, setData] = useState<TelegramAuthData | null>(null);

  useEffect(() => {
    (async () => {
      const country = await axiosClient
        .get(`/api/countries/ipaddr`)
        .then(result => {
          return result.data;
        })
        .catch(({ response }) => {
          console.log(response.data.message);
        });

      if (country && country === 'US') {
        return router.push('/not-available');
      }
    })();
  }, []);

  useEffect(() => {
    if (selectedWalletPath && status === 'unauthenticated' && data) {
      (async () => {
        await signIn('telegram-login', { redirect: true, callbackUrl: '/' }, data as any);
      })();
    }
  }, [selectedWalletPath, status]);

  if (status === 'loading') {
    return (
      <MobileLayout>
        <LoadingPlaceholder />
      </MobileLayout>
    );
  }

  if (status === 'authenticated') {
    return (
      <MobileLayout>
        <Typography variant="h4" margin={'10px 20px'}>
          You already signed in
        </Typography>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <WrapLoginPage>
        <Typography variant="h5">Welcome to Local-ecash</Typography>
        <h2 style={{ color: 'white' }}>Please login to continue</h2>
        <LoginButton
          botUsername={process.env.NEXT_PUBLIC_BOT_USERNAME!}
          onAuthCallback={async (data: TelegramAuthData) => {
            try {
              await axiosClient.get(`/api/accounts/telegram/${data.id}`);
              await signIn('telegram-login', { redirect: true, callbackUrl: `/import?id=${data.id}` }, data as any);
            } catch {
              const dataGenerateAccount: GenerateAccountType = {
                coin: COIN.XEC,
                telegramId: data.id!.toString(),
                accountType: AccountType.NORMAL
              };
              dispatch(generateAccount(dataGenerateAccount));
              dispatch(
                showToast('success', {
                  message: 'Success',
                  description: 'Congrats on your new wallet! Redirecting to home...'
                })
              );
              setData(data);
            }
          }}
        />
      </WrapLoginPage>
    </MobileLayout>
  );
}
