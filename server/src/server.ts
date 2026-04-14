import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { getFeedback, getExplanation } from './controllers/feedbackController';
import { validateRequest } from './middleware/validateRequest';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// API Routes
app.post('/api/feedback', validateRequest, getFeedback);
app.post('/api/explanation', getExplanation);  // NEW: Detailed walkthrough endpoint

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 API endpoints:`);
  console.log(`   - POST /api/feedback (corrective/positive feedback)`);
  console.log(`   - POST /api/explanation (detailed walkthrough)`);
  console.log(`   - GET  /health (health check)`);
});