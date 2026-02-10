import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { getFeedback } from './controllers/feedbackController';
import { validateRequest } from './middleware/validateRequest';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.post('/api/feedback', validateRequest, getFeedback);

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
