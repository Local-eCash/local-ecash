'use client';
import { Backdrop, Stack, Typography } from '@mui/material';

export default function NotAvailable() {
  return (
    <Backdrop sx={theme => ({ color: '#fff', zIndex: theme.zIndex.drawer + 1 })} open={true}>
      <Stack alignItems="center" justifyContent="center">
        <Typography variant="h5">{`Sorry :(`}</Typography>
        <Typography variant="h5">App is not available in your country</Typography>
      </Stack>
    </Backdrop>
  );
}
