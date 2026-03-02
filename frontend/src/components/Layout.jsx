/**
 * App layout: header and footer.
 * - On /login and /signup: header shows only "E-Shop" and the other auth link (Sign up / Login).
 * - On other pages: full nav (Products, Cart, Addresses, Orders), search bar, and user/logout or login/signup.
 * - Footer with copyright and links appears on all pages.
 */
import { useState } from 'react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Box, InputBase, alpha } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import Footer from './Footer';

const navLinks = [
  { to: '/products', label: 'Products' },
  { to: '/cart', label: 'Cart' },
  { to: '/addresses', label: 'Addresses', auth: true },
  { to: '/orders', label: 'Orders', auth: true },
];

export default function Layout({ children }) {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchInput, setSearchInput] = useState('');
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';

  const handleSearch = (e) => {
    e.preventDefault();
    const q = searchInput.trim();
    navigate(q ? `/products?search=${encodeURIComponent(q)}` : '/products');
  };

  const isActive = (path) => {
    if (path === '/products') return location.pathname === '/products' || location.pathname.startsWith('/products/');
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar sx={{ flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="h6" component={RouterLink} to="/" sx={{ color: 'inherit', textDecoration: 'none', mr: 2 }}>
            E-Shop
          </Typography>
          {!isAuthPage && (
            <>
              {navLinks.map(({ to, label, auth }) => {
                if (auth && !isAuthenticated) return null;
                const active = isActive(to);
                return (
                  <Button
                    key={to}
                    color="inherit"
                    component={RouterLink}
                    to={to}
                    sx={{
                      ...(active && {
                        bgcolor: alpha('#fff', 0.2),
                        '&:hover': { bgcolor: alpha('#fff', 0.3) },
                      }),
                    }}
                  >
                    {label}
                  </Button>
                );
              })}
              <Box
                component="form"
                onSubmit={handleSearch}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  ml: { xs: 0, md: 2 },
                  flex: { xs: '1 1 100%', sm: '1 1 auto' },
                  maxWidth: { sm: 320 },
                  bgcolor: alpha('#fff', 0.15),
                  borderRadius: 1,
                  '&:hover': { bgcolor: alpha('#fff', 0.25) },
                }}
              >
                <Box component="span" sx={{ ml: 1.5, color: 'inherit', fontSize: '1.25rem' }} aria-hidden>🔍</Box>
                <InputBase
                  placeholder="Search products or category…"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  sx={{ color: 'inherit', ml: 1, flex: 1, '& input': { py: 1 } }}
                  inputProps={{ 'aria-label': 'search' }}
                />
              </Box>
              {isAuthenticated ? (
                <>
                  <Typography sx={{ ml: 'auto' }}>{user?.username || user?.email || 'User'}</Typography>
                  <Button color="inherit" onClick={() => { logout(); navigate('/login'); }}>Logout</Button>
                </>
              ) : (
                <>
                  <Button color="inherit" component={RouterLink} to="/login">Login</Button>
                  <Button color="inherit" component={RouterLink} to="/signup">Sign up</Button>
                </>
              )}
            </>
          )}
          {isAuthPage && (
            <Box sx={{ ml: 'auto' }}>
              {location.pathname === '/login' && (
                <Button color="inherit" component={RouterLink} to="/signup">Sign up</Button>
              )}
              {location.pathname === '/signup' && (
                <Button color="inherit" component={RouterLink} to="/login">Login</Button>
              )}
            </Box>
          )}
        </Toolbar>
      </AppBar>
      <Box component="main" sx={{ flex: 1 }}>{children}</Box>
      <Footer />
    </Box>
  );
}
