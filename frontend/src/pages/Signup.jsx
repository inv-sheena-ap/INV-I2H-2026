import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Box, TextField, Button, Typography, Paper, Alert } from '@mui/material';
import { post } from '../api/client';

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', full_name: '', username: '', address: '', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (form.password.length < 8) {
        throw new Error('Password must be at least 8 characters');
      }
      if (!/[A-Z]/.test(form.password)) {
        throw new Error('Password must contain at least one uppercase letter');
      }
      if (!/[a-z]/.test(form.password)) {
        throw new Error('Password must contain at least one lowercase letter');
      }
      if (!/\d/.test(form.password)) {
        throw new Error('Password must contain at least one number');
      }
      const res = await post('/auth/signup', form);
      let data = {};
      try {
        const text = await res.text();
        if (text && res.headers.get('content-type')?.includes('application/json')) {
          data = JSON.parse(text);
        } else if (!res.ok && text) {
          data = { detail: text.slice(0, 200) };
        }
      } catch (_) {
        data = { detail: res.statusText || 'Request failed' };
      }
      if (!res.ok) {
        let msg = typeof data.detail === 'string' ? data.detail : (Array.isArray(data.detail) ? data.detail[0]?.msg : data.detail);
        if (msg === 'Email already registered') msg = 'This email is already registered. Use another or log in.';
        if (msg === 'Username already taken') msg = 'This username is already taken. Please choose another.';
        throw new Error(msg || `Server error (${res.status}). Ensure backend is running at ${import.meta.env.VITE_API_URL || 'http://localhost:8000'}.`);
      }
      navigate('/login');
    } catch (err) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', mt: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>Sign up</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Email and username must be unique.</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <form onSubmit={handleSubmit}>
          <TextField fullWidth name="email" label="Email" type="email" value={form.email} onChange={handleChange} margin="normal" required />
          {/* BUG 9: password visible (type="text" instead of "password") */}
          <TextField fullWidth name="password" label="Password" type="text" value={form.password} onChange={handleChange} margin="normal" required />
          <TextField fullWidth name="full_name" label="Full name" value={form.full_name} onChange={handleChange} margin="normal" required />
          <TextField fullWidth name="username" label="Username" value={form.username} onChange={handleChange} margin="normal" required />
          <TextField fullWidth name="address" label="Address" value={form.address} onChange={handleChange} margin="normal" />
          <TextField fullWidth name="phone" label="Phone" value={form.phone} onChange={handleChange} margin="normal" />
          <Button type="submit" fullWidth variant="contained" sx={{ mt: 2 }} disabled={loading}>Sign up</Button>
        </form>
        {/* BUG 10: swapped label - says Sign up instead of Login */}
        <Typography sx={{ mt: 2 }}>Already have an account? <Link to="/login">Sign up</Link></Typography>
      </Paper>
    </Box>
  );
}
