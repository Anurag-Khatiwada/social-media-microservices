const express = require('express');
const {registerUser, userLogin, userRefreshToken, userLogout} = require('../controllers/identity-controller')

const router = express.Router();


router.post('/register',registerUser);
router.post('/login',userLogin);
router.post('/refresh-token',userRefreshToken);
router.post('/logout',userLogout);



module.exports = router