/**
 * BUG 25: This page calls GET /auth/users without requiring login.
 * Anyone can open /users (or click "Users" in the nav) and see the full user list.
 */
import { useState, useEffect } from 'react';
import { Box, Typography, List, ListItem, ListItemText, Paper } from '@mui/material';
import { get } from '../api/client';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // No auth required by backend for this endpoint (bug)
    get('/auth/users')
      .then((res) => res.json())
      .then(setUsers)
      .catch((err) => setError(err.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Box sx={{ p: 2 }}><Typography>Loading…</Typography></Box>;
  if (error) return <Box sx={{ p: 2 }}><Typography color="error">{error}</Typography></Box>;

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 2 }}>
      <Typography variant="h5" gutterBottom>Users</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        List of registered users (this page is reachable without logging in).
      </Typography>
      <List component={Paper}>
        {users.map((u) => (
          <ListItem key={u.id}>
            <ListItemText primary={u.username || u.email} secondary={u.email} />
          </ListItem>
        ))}
      </List>
    </Box>
  );
}
