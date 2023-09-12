const router = require('express').Router();
import { signup, verifyEmail } from '../controllers/user';

router.post('/user/signup', signup);

router.get('/verify/:confirmationToken', verifyEmail);

export { router };
