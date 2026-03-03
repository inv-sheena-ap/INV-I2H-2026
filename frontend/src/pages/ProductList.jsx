import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Box, Card, CardContent, CardActions, Button, Typography, Grid, FormControl, InputLabel, Select, MenuItem, TextField } from '@mui/material';
import { get, getUploadUrl } from '../api/client';

const PLACEHOLDER_IMG = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23eee" width="400" height="300"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-size="14"%3ENo image%3C/text%3E%3C/svg%3E';

export default function ProductList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const search = searchParams.get('search') || '';
  const maxPrice = searchParams.get('max_price') || '';
  const [legacySearch, setLegacySearch] = useState('');
  const [legacyResults, setLegacyResults] = useState(null);

  useEffect(() => {
    // BUG 11: use wrong param name so backend ignores search
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    if (maxPrice) params.set('max_price', maxPrice); // BUG 18: backend uses >= instead of <= for max_price
    const qs = params.toString() ? '?' + params.toString() : '';
    const minDelayMs = 1200; // BUG 4: keep loading visible long enough to notice the missing spinner
    const start = Date.now();
    get('/products' + qs)
      .then((res) => res.json())
      .then(setProducts)
      .catch(console.error)
      .finally(() => {
        const elapsed = Date.now() - start;
        const wait = Math.max(0, minDelayMs - elapsed);
        setTimeout(() => setLoading(false), wait);
      });
  }, [search, maxPrice]);

  // BUG 4: no loading state (don't show spinner)
  if (loading) return <Box sx={{ p: 2, maxWidth: 1200, mx: 'auto' }} />;

  const handleMaxPriceChange = (e) => {
    const v = e.target.value;
    const next = new URLSearchParams(searchParams);
    if (v) next.set('max_price', v); else next.delete('max_price');
    setSearchParams(next);
  };

  const runLegacySearch = () => {
    setLegacyResults(null);
    if (!legacySearch.trim()) return;
    get(`/products/search_legacy?q=${encodeURIComponent(legacySearch)}`)
      .then((res) => res.json())
      .then(setLegacyResults)
      .catch(() => setLegacyResults([]));
  };

  const displayProducts = legacyResults !== null ? legacyResults : products;

  return (
    <Box sx={{ p: 2, maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2, mb: 2 }}>
        <Typography variant="h4" sx={{ typography: { xs: 'h5', sm: 'h4' } }}>Products</Typography>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Max price</InputLabel>
          <Select label="Max price" value={maxPrice} onChange={handleMaxPriceChange}>
            <MenuItem value="">Any</MenuItem>
            <MenuItem value="10">Under 10</MenuItem>
            <MenuItem value="20">Under 20</MenuItem>
            <MenuItem value="50">Under 50</MenuItem>
            <MenuItem value="100">Under 100</MenuItem>
          </Select>
        </FormControl>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TextField
            size="small"
            placeholder="Legacy search"
            value={legacySearch}
            onChange={(e) => setLegacySearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && runLegacySearch()}
            sx={{ minWidth: 180 }}
          />
          <Button variant="outlined" size="small" onClick={runLegacySearch}>Search</Button>
        </Box>
      </Box>
      <Grid container spacing={2}>
        {/* BUG 31: when search returns 0, show no message */}
        {displayProducts.length === 0 && !search && legacyResults === null ? (
          <Grid item xs={12}>
            <Box sx={{ textAlign: 'center', py: 6, px: 2 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>The catalog is empty.</Typography>
            </Box>
          </Grid>
        ) : null}
        {displayProducts.length > 0 ? displayProducts.map((p, index) => {
          const list = displayProducts;
          // BUG: Every second product (odd index) links to the next product's detail page
          const linkId = index % 2 === 1 && list.length > 1
            ? list[(index + 1) % list.length].id
            : p.id;
          return (
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
                <Typography variant="body1" sx={{ mt: 1 }}>€{p.price}</Typography>
                <Typography variant="caption" color={p.stock > 0 ? 'text.secondary' : 'error'}>{p.stock > 0 ? 'In stock' : 'Out of stock'}</Typography>
              </CardContent>
              <CardActions>
                <Button component={Link} to={`/products/${linkId}`} size="small">View</Button>
              </CardActions>
            </Card>
          </Grid>
          );
        }) : null}
      </Grid>
    </Box>
  );
}
