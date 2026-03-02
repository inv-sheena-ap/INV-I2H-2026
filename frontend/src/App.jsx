/**
 * App entry: theme, auth provider, router.
 * Protected routes (products, cart, addresses, orders) require login; else redirect to /login.
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ProductList from './pages/ProductList';
import ProductView from './pages/ProductView';
import Cart from './pages/Cart';
import Addresses from './pages/Addresses';
import OrderList from './pages/OrderList';
import OrderDetail from './pages/OrderDetail';

const theme = createTheme({
  palette: { mode: 'light', primary: { main: '#1976d2' } },
});

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout><Navigate to="/products" replace /></Layout>} />
            <Route path="/login" element={<Layout><Login /></Layout>} />
            <Route path="/signup" element={<Layout><Signup /></Layout>} />
            <Route path="/products" element={<Layout><ProtectedRoute><ProductList /></ProtectedRoute></Layout>} />
            <Route path="/products/:id" element={<Layout><ProtectedRoute><ProductView /></ProtectedRoute></Layout>} />
            <Route path="/cart" element={<Layout><ProtectedRoute><Cart /></ProtectedRoute></Layout>} />
            <Route path="/addresses" element={<Layout><ProtectedRoute><Addresses /></ProtectedRoute></Layout>} />
            <Route path="/orders" element={<Layout><ProtectedRoute><OrderList /></ProtectedRoute></Layout>} />
            <Route path="/orders/:id" element={<Layout><ProtectedRoute><OrderDetail /></ProtectedRoute></Layout>} />
            <Route path="*" element={<Navigate to="/products" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
