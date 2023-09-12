import express from 'express';

import { router } from './routes';
import cors from 'cors';

require('dotenv').config();
require('./database/database.ts').connect();
const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.get('/', (req, res) => {
	res.send({ message: 'Hello, nodemon!' });
});

app.use('/api', router);
app.use(cors());

app.listen(port, () => {
	console.log(`app is listening at http://localhost:${port}`);
});
