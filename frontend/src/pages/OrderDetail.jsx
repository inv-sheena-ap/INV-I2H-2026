import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, Button, CircularProgress } from '@mui/material';
import { get, getUploadUrl } from '../api/client';

const PLACEHOLDER_IMG = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64"%3E%3Crect fill="%23eee" width="64" height="64"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-size="10"%3E?%3C/text%3E%3C/svg%3E';

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    get(`/orders/${id}`)
      .then((res) => res.ok ? res.json() : null)
      .then(setOrder)
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
  if (!order) return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 2, textAlign: 'center' }}>
      <Typography variant="h6" color="text.secondary" gutterBottom>Order not found</Typography>
      <Typography variant="body2" color="text.secondary">The order may not exist or you don&apos;t have access to it.</Typography>
      <Button sx={{ mt: 2 }} onClick={() => navigate('/orders')}>Back to my orders</Button>
    </Box>
  );

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 2 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5">Order #{order.id}</Typography>
        <Typography>Status: {order.status}</Typography>
        <Typography>Total: ${order.total}</Typography>
        <Typography sx={{ whiteSpace: 'pre-wrap' }}>Shipping: {order.shipping_address_text}</Typography>
        {order.expected_delivery_date && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Expected delivery: {new Date(order.expected_delivery_date).toLocaleDateString()}
          </Typography>
        )}
        {order.items && order.items.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1">Items:</Typography>
            {order.items.map((item, i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Box
                  component="img"
                  src={item.product_image_path ? getUploadUrl(item.product_image_path) : PLACEHOLDER_IMG}
                  alt={item.product_name || 'Product'}
                  onError={(e) => { e.target.src = PLACEHOLDER_IMG; }}
                  sx={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 1 }}
                />
                <Box>
                  <Typography variant="body1">{item.product_name || `Product #${item.product_id}`}</Typography>
                  <Typography variant="body2" color="text.secondary">{item.quantity} × ${item.unit_price} = ${(item.quantity * item.unit_price).toFixed(2)}</Typography>
                </Box>
              </Box>
            ))}
          </Box>
        )}
        <Button sx={{ mt: 2 }} onClick={() => navigate('/orders')}>My orders</Button>
      </Paper>
    </Box>
  );
}
