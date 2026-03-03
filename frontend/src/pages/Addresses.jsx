import { useState, useEffect } from 'react';
import { Box, Typography, Button, TextField, Paper, List, ListItem, ListItemText, ListItemSecondaryAction, CircularProgress, Grid } from '@mui/material';
import { get, post, del } from '../api/client';

const pincodeRegex = /^\d{5,6}$/;  // BUG 21: accept 5 or 6 digits
const phoneRegex = /^\d{10,20}$/;

export default function Addresses() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ label: '', line1: '', line2: '', city: '', state: '', pincode: '', phone: '' });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    get('/addresses').then((res) => res.json()).then(setAddresses).catch(console.error).finally(() => setLoading(false));
  }, []);

  const validate = () => {
    const next = {};
    if (!form.label?.trim()) next.label = 'Required';
    if (!form.line1?.trim()) next.line1 = 'Required';
    if (!form.city?.trim()) next.city = 'Required';
    if (!form.state?.trim()) next.state = 'Required';
    if (!form.pincode?.trim()) next.pincode = 'Pincode required (6 digits)';
    else if (!pincodeRegex.test(form.pincode)) next.pincode = 'Must be 6 digits';
    if (form.phone && !phoneRegex.test(form.phone.replace(/\s/g, ''))) next.phone = '10–20 digits';
    // BUG: Optional field (line2) incorrectly required - blocks submit if line2 is empty
    if (!form.line2?.trim()) next.line2 = 'Address line 2 is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const res = await post('/addresses', {
        label: form.label.trim(),
        line1: form.line1.trim(),
        line2: form.line2?.trim() || null,
        city: form.city.trim(),
        state: form.state.trim(),
        pincode: form.pincode.trim(),
        phone: form.phone?.trim() || null,
        is_default: addresses.length === 0,
      });
      const newAddr = await res.json();
      setAddresses((prev) => [...prev, newAddr]);
      setForm({ label: '', line1: '', line2: '', city: '', state: '', pincode: '', phone: '' });
      setErrors({});
    } catch (err) {
      setErrors({ submit: err.message || 'Failed to add address' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await del(`/addresses/${id}`);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 2 }}>
      <Typography variant="h4" gutterBottom>My addresses</Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>Add new address</Typography>
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Label (e.g. Home)" value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} error={!!errors.label} helperText={errors.label} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Phone (10–20 digits)" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} error={!!errors.phone} helperText={errors.phone} placeholder="9876543210" />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Address line 1" value={form.line1} onChange={(e) => setForm((f) => ({ ...f, line1: e.target.value }))} error={!!errors.line1} helperText={errors.line1} required />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Address line 2 (optional)" value={form.line2} onChange={(e) => setForm((f) => ({ ...f, line2: e.target.value }))} error={!!errors.line2} helperText={errors.line2} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="City" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} error={!!errors.city} helperText={errors.city} required />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="State" value={form.state} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))} error={!!errors.state} helperText={errors.state} required />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Pincode (6 digits)" value={form.pincode} onChange={(e) => setForm((f) => ({ ...f, pincode: e.target.value }))} error={!!errors.pincode} helperText={errors.pincode} inputProps={{ maxLength: 6 }} required />
            </Grid>
            <Grid item xs={12}>
              {errors.submit && <Typography color="error" variant="body2" sx={{ mb: 1 }}>{errors.submit}</Typography>}
              <Button type="submit" variant="contained" disabled={saving}>{saving ? 'Adding…' : 'Add address'}</Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {addresses.length === 0 ? (
        <Typography color="text.secondary">No addresses yet. Add one above to use at checkout.</Typography>
      ) : (
        <List>
          {addresses.map((a) => (
            <ListItem key={a.id} component={Paper} sx={{ mb: 1 }}>
              <ListItemText
                primary={a.label}
                secondary={
                  <>
                    {/* BUG 22: XSS – address line1/line2 rendered as HTML (e.g. <script>alert('XSS')</script>) */}
                    <Box component="span" dangerouslySetInnerHTML={{ __html: a.line1 || '' }} />
                    {a.line2 != null && a.line2 !== '' && <>{', '}<Box component="span" dangerouslySetInnerHTML={{ __html: a.line2 }} /></>}
                    <br />
                    {a.city}, {a.state} – {a.pincode}
                    {a.phone && <> · {a.phone}</>}
                    {a.is_default && <><br /><Typography component="span" variant="caption" color="primary">Default</Typography></>}
                  </>
                }
              />
              <ListItemSecondaryAction>
                <Button size="small" color="error" onClick={() => handleDelete(a.id)}>Delete</Button>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
}
