'use client';

import { Button, FormControl, FormControlLabel, FormLabel, Radio, RadioGroup, TextField } from '@mui/material';

export default function NewOrder() {
  return (
    <div style={{ display: 'flex', gap: 10, flexDirection: 'column' }}>
      OrderId: 123456789
      <span>
        <TextField id="outlined-basic" label="Price" variant="outlined" />
        /
        <TextField id="outlined-basic" label="Amount" variant="outlined" />
        XEC
      </span>
      <FormControl>
        <FormLabel id="demo-radio-buttons-group-label">Payment Method</FormLabel>
        <RadioGroup aria-labelledby="demo-radio-buttons-group-label" defaultValue="female" name="radio-buttons-group">
          <FormControlLabel value="female" control={<Radio />} label="Cash in person" />
          <FormControlLabel value="male" control={<Radio />} label="Crypto" />
          <FormControlLabel value="other" control={<Radio />} label="Bank transfer" />
        </RadioGroup>
      </FormControl>
      <Button>Create new order</Button>
    </div>
  );
}
