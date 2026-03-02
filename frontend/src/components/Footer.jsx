/** Footer shown on all pages: copyright only, centered. */
import { Box, Typography } from '@mui/material';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        bgcolor: 'grey.100',
        borderTop: 1,
        borderColor: 'divider',
        textAlign: 'center',
      }}
    >
      <Typography variant="body2" color="text.secondary">
        © {currentYear} E-Shop. All rights reserved.
      </Typography>
    </Box>
  );
}
