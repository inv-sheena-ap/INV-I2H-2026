/**
 * BUG 25: This page calls GET /auth/users without requiring login.
 * BUG: Critical - Delete button calls DELETE /auth/users/{id} with no ownership check (any user can delete any user).
 */
import { useState, useEffect } from 'react';
import { Box, Typography, List, ListItem, ListItemText, Paper, Button, ListItemSecondaryAction } from '@mui/material';
import { get, del } from '../api/client';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadUsers = () => {
    get('/auth/users')
      .then((res) => res.json())
      .then(setUsers)
      .catch((err) => setError(err.message || 'Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleDelete = async (userId) => {
    try {
      await del(`/auth/users/${userId}`);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <Box sx={{ p: 2 }}><Typography>Loading…</Typography></Box>;
  if (error) return <Box sx={{ p: 2 }}><Typography color="error">{error}</Typography></Box>;

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 2 }}>
      <Typography variant="h5" gutterBottom>Users</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        List of registered users (this page is reachable without logging in). When logged in, you can delete users.
      </Typography>
      <List component={Paper}>
        {users.map((u) => (
          <ListItem key={u.id}>
            <ListItemText primary={u.username || u.email} secondary={u.email} />
            <ListItemSecondaryAction>
              <Button size="small" color="error" onClick={() => handleDelete(u.id)}>Delete</Button>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
    </Box>
  );
}
