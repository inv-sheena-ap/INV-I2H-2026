import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Button, TextField, Paper, CircularProgress } from '@mui/material';
import { get, getUploadUrl } from '../api/client';

const PLACEHOLDER_IMG = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23eee" width="400" height="300"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle"%3ENo image%3C/text%3E%3C/svg%3E';

export default function ProductView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    get(`/products/${id}`).then((res) => res.json()).then(setProduct).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  const addToCart = () => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existing = cart.find((i) => i.product_id === product.id);
    if (existing) {
      existing.quantity += qty;
    } else {
      cart.push({ product_id: product.id, quantity: qty, name: product.name, description: product.description, price: product.price });
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    navigate('/cart');
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
  if (!product) return <Typography>Product not found</Typography>;

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 2 }}>
      <Paper sx={{ p: 2, overflow: 'hidden' }}>
        <Box sx={{ width: '100%', aspectRatio: '4/3', maxHeight: 320, borderRadius: 1, overflow: 'hidden', mb: 2, bgcolor: 'grey.100' }}>
          <Box
            component="img"
            src={product.image_path ? getUploadUrl(product.image_path) : PLACEHOLDER_IMG}
            alt={product.name}
            onError={(e) => { e.target.src = PLACEHOLDER_IMG; }}
            sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        </Box>
        <Typography variant="h4" sx={{ typography: { xs: 'h5', sm: 'h4' } }}>{product.name}</Typography>
        <Typography variant="body1" sx={{ mt: 1 }}>{product.description}</Typography>
        <Typography variant="h6" sx={{ mt: 2 }}>${product.price}</Typography>
        <Typography variant="body2">Stock: {product.stock}</Typography>
        <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2 }}>
          <TextField
            type="number"
            label="Quantity"
            value={qty}
            onChange={(e) => setQty(Math.max(1, Math.min(product.stock, Number(e.target.value) || 1)))}
            inputProps={{ min: 1, max: product.stock }}
            size="small"
            sx={{ width: { xs: '100%', sm: 120 } }}
          />
          <Button variant="contained" onClick={addToCart} disabled={product.stock < 1 || qty < 1 || qty > product.stock} sx={{ flex: { xs: '1 1 100%', sm: '0 0 auto' } }}>
            Add to cart
          </Button>
        </Box>
        <Button sx={{ mt: 2 }} onClick={() => navigate(-1)}>Back</Button>
      </Paper>
    </Box>
  );
}
