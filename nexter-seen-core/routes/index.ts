const router = require('express').Router();
const userController = require('../controllers/user');

router.post('/signup', userController.signup);

router.get('/verify/:confirmationToken', userController.verifyEmail);

module.exports = router;
