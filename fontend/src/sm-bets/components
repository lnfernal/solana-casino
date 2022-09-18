import * as React from 'react';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import Collapse from '@mui/material/Collapse';


export default function TransitionAlerts(props: any) {
  const [open, setOpen] = React.useState(props.openBool);

  return (
    //<Snackbar autoHideDuration={200}>
      <Box sx={{ width: '25%' }}>
        <Collapse in={open}>
          <Alert
            action={
              <IconButton
                aria-label="close"
                color="inherit"
                size="small"
                onClick={() => {
                  setOpen(false);
                }}
              >
                <p>Close</p>
              </IconButton>
            }
            sx={{ mb: 2 }}
          >
            {props.alert}
          </Alert>
        </Collapse> 
      </Box>

  );
}
