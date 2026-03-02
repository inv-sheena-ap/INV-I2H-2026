import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Box, Typography, Button, Table, TableBody, TableCell, TableHead, TableRow, Paper, Radio, RadioGroup, FormControlLabel, FormControl, FormLabel } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { get, post } from '../api/client';

export default function Cart() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem('cart');
    setCart(JSON.parse(raw || '[]'));
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      get('/addresses').then((res) => res.json()).then((list) => {
        setAddresses(list);
        if (list.length && !selectedAddressId) setSelectedAddressId(list.find((a) => a.is_default)?.id ?? list[0].id);
      }).catch(console.error);
    }
  }, [isAuthenticated]);

  const updateQty = (index, delta) => {
    const next = [...cart];
    next[index].quantity = Math.max(0, (next[index].quantity || 1) + delta);
    if (next[index].quantity === 0) next.splice(index, 1);
    setCart(next);
    localStorage.setItem('cart', JSON.stringify(next));
  };

  const total = Math.round(cart.reduce((sum, i) => sum + (i.price * (i.quantity || 1)), 0) * 100) / 100;

  const placeOrder = async () => {
    if (!isAuthenticated) return navigate('/login');
    if (!selectedAddressId) return alert('Select a delivery address');
    if (addresses.length === 0) return alert('Add an address first from the Addresses page');
    setPlacing(true);
    try {
      const body = {
        items: cart.map((i) => ({ product_id: i.product_id, quantity: i.quantity || 1 })),
        address_id: selectedAddressId,
        payment_method: 'cod',
      };
      const res = await post('/orders', body);
      const data = await res.json();
      if (!res.ok) throw new Error(Array.isArray(data.detail) ? data.detail[0]?.msg || 'Order failed' : (data.detail || 'Order failed'));
      localStorage.removeItem('cart');
      setCart([]);
      navigate(`/orders/${data.id}`);
    } catch (err) {
      alert(err.message || 'Order failed');
    } finally {
      setPlacing(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 2 }}>
      <Typography variant="h4" gutterBottom>Cart</Typography>
      {cart.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6, px: 2 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>Your cart is empty</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Add items from the product list to place an order.
          </Typography>
          <Button variant="contained" onClick={() => navigate('/products')}>Browse products</Button>
        </Box>
      ) : (
        <>
          <Paper sx={{ overflow: 'auto', width: '100%' }}>
            <Table size="small" sx={{ minWidth: 320 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Product</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell>Quantity</TableCell>
                  <TableCell>Subtotal</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {cart.map((item, i) => (
                  <TableRow key={item.product_id ? `${item.product_id}-${i}` : i}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>${item.price}</TableCell>
                    <TableCell>
                      <Button size="small" onClick={() => updateQty(i, -1)}>-</Button>
                      {item.quantity}
                      <Button size="small" onClick={() => updateQty(i, 1)}>+</Button>
                    </TableCell>
                    <TableCell>${(item.price * (item.quantity || 1)).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
          <Typography variant="h6" sx={{ mt: 2 }}>Total: ${total.toFixed(2)}</Typography>
          <FormControl component="fieldset" sx={{ mt: 2, display: 'block' }}>
            <FormLabel component="legend">Delivery address</FormLabel>
            {addresses.length === 0 ? (
              <Typography color="text.secondary" sx={{ mt: 1 }}>
                No addresses saved. <Button component={Link} to="/addresses" size="small">Add address</Button>
              </Typography>
            ) : (
              <RadioGroup value={selectedAddressId ?? ''} onChange={(e) => setSelectedAddressId(Number(e.target.value))} sx={{ mt: 1 }}>
                {addresses.map((a) => (
                  <FormControlLabel
                    key={a.id}
                    value={a.id}
                    control={<Radio />}
                    label={
                      <Box>
                        <Typography variant="body2"><strong>{a.label}</strong></Typography>
                        <Typography variant="body2" color="text.secondary">{a.line1}{a.line2 ? `, ${a.line2}` : ''}, {a.city}, {a.state} – {a.pincode}{a.phone ? ` · ${a.phone}` : ''}</Typography>
                      </Box>
                    }
                  />
                ))}
              </RadioGroup>
            )}
          </FormControl>
          <Button variant="contained" sx={{ mt: 2 }} onClick={placeOrder} disabled={placing || addresses.length === 0}>
            {placing ? 'Processing...' : 'Place order (COD)'}
          </Button>
        </>
      )}
      <Button sx={{ mt: 2 }} onClick={() => navigate('/products')}>Continue shopping</Button>
    </Box>
  );
}
