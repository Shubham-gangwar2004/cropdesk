import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import Feed from './pages/Feed';
import ProductDetails from './pages/ProductDetails';
import AddProduct from './pages/AddProduct';
import MyListings from './pages/MyListings';
import ChatList from './pages/ChatList';
import ChatWindow from './pages/ChatWindow';
import MyAccount from './pages/MyAccount';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import FAQ from './pages/FAQ';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import VerifyEmail from './pages/VerifyEmail';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/login' element={<Login />} />
        <Route path='/register' element={<Register />} />
        <Route path='/about' element={<About />} />
        <Route path='/contact' element={<Contact />} />
        <Route path='/feed' element={<Feed />} />
        <Route path='/product/:id' element={<ProductDetails />} />
        <Route path='/add-product' element={<AddProduct />} />
        <Route path='/my-listings' element={<MyListings />} />
        <Route path='/chats' element={<ChatList />} />
        <Route path='/chat/:chatId' element={<ChatWindow />} />
        <Route path='/my-account' element={<MyAccount />} />
        <Route path='/forgot-password' element={<ForgotPassword />} />
        <Route path='/verify-email' element={<VerifyEmail />} />
        <Route path='/reset-password/:token' element={<ResetPassword />} />
        <Route path='/faq' element={<FAQ />} />
        <Route path='/help' element={<FAQ />} />
        <Route path='/privacy' element={<PrivacyPolicy />} />
        <Route path='/terms' element={<TermsOfService />} />
      </Routes>
      <Footer />
    </Router>
  );
}

export default App;