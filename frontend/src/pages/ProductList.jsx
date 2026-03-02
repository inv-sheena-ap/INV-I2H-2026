import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Box, Card, CardContent, CardActions, Button, Typography, Grid, CircularProgress } from '@mui/material';
import { get, getUploadUrl } from '../api/client';

const PLACEHOLDER_IMG = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23eee" width="400" height="300"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-size="14"%3ENo image%3C/text%3E%3C/svg%3E';

export default function ProductList() {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const search = searchParams.get('search') || '';

  useEffect(() => {
    const params = search ? `?search=${encodeURIComponent(search)}` : '';
    get('/products' + params).then((res) => res.json()).then(setProducts).catch(console.error).finally(() => setLoading(false));
  }, [search]);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;

  return (
    <Box sx={{ p: 2, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom sx={{ typography: { xs: 'h5', sm: 'h4' } }}>Products</Typography>
      <Grid container spacing={2}>
        {products.length === 0 ? (
          <Grid item xs={12}>
            <Box sx={{ textAlign: 'center', py: 6, px: 2 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>No products found</Typography>
              <Typography variant="body2" color="text.secondary">
                {search ? 'Try a different search in the top bar.' : 'The catalog is empty.'}
              </Typography>
            </Box>
          </Grid>
        ) : products.map((p) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={p.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <Box sx={{ position: 'relative', width: '100%', aspectRatio: '4/3', overflow: 'hidden', bgcolor: 'grey.100' }}>
                <Box
                  component="img"
                  src={p.image_path ? getUploadUrl(p.image_path) : PLACEHOLDER_IMG}
                  alt={p.name}
                  onError={(e) => { e.target.src = PLACEHOLDER_IMG; }}
                  sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
              </Box>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" component="h2" noWrap>{p.name}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }} noWrap>{p.description}</Typography>
                <Typography variant="body1" sx={{ mt: 1 }}>${p.price}</Typography>
                <Typography variant="caption" color={p.stock > 0 ? 'text.secondary' : 'error'}>{p.stock > 0 ? 'In stock' : 'Out of stock'}</Typography>
              </CardContent>
              <CardActions>
                <Button component={Link} to={`/products/${p.id}`} size="small">View</Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
