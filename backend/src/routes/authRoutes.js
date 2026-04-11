const express = require('express');
const router = express.Router();
const { registerUser, verifyOTP, resendOTP, loginUser, forgotPassword, resetPassword, getMe } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/register', registerUser);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.get('/me', protect, getMe); 

module.exports = router;