import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Box, Typography, List, ListItem, ListItemText, Button, Card, CardContent, CardActionArea, Grid } from '@mui/material';
import { get, getUploadUrl } from '../api/client';

const PLACEHOLDER_IMG = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64"%3E%3Crect fill="%23eee" width="64" height="64"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-size="10"%3E?%3C/text%3E%3C/svg%3E';

export default function OrderList() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    get('/orders').then((res) => res.json()).then(setOrders).catch(console.error);
  }, []);

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 2 }}>
      <Typography variant="h4" gutterBottom>My orders</Typography>
      {orders.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6, px: 2 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>No orders yet</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            When you place an order, it will show up here.
          </Typography>
          <Button variant="contained" component={Link} to="/products">Browse products</Button>
        </Box>
      ) : (
        <List disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {orders.map((o) => (
            <ListItem key={o.id} disablePadding>
              <Card sx={{ width: '100%' }}>
                <CardActionArea component={Link} to={`/orders/${o.id}`} sx={{ display: 'block' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                      <Typography variant="h6">Order #{o.id}</Typography>
                      <Typography variant="body2" color="text.secondary">${o.total} · {o.status}</Typography>
                    </Box>
                    <Grid container spacing={1}>
                      {(o.items || []).map((item, idx) => (
                        <Grid item xs={12} sm={6} key={item.product_id + '-' + idx} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box
                            component="img"
                            src={item.product_image_path ? getUploadUrl(item.product_image_path) : PLACEHOLDER_IMG}
                            alt={item.product_name || 'Product'}
                            onError={(e) => { e.target.src = PLACEHOLDER_IMG; }}
                            sx={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 1, flexShrink: 0 }}
                          />
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="body2" noWrap>{item.product_name || `Product #${item.product_id}`}</Typography>
                            <Typography variant="caption" color="text.secondary">Qty: {item.quantity} × ${item.unit_price}</Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </CardActionArea>
              </Card>
            </ListItem>
          ))}
        </List>
      )}
      <Button sx={{ mt: 2 }} onClick={() => window.history.back()}>Back</Button>
    </Box>
  );
}
