"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const feedbackController_1 = require("./controllers/feedbackController");
const validateRequest_1 = require("./middleware/validateRequest");
const errorHandler_1 = require("./middleware/errorHandler");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
app.use((0, cors_1.default)({
    origin: 'http://localhost:3000',
    credentials: true
}));
app.use(express_1.default.json());
// API Routes
app.post('/api/feedback', validateRequest_1.validateRequest, feedbackController_1.getFeedback);
app.post('/api/explanation', feedbackController_1.getExplanation); // NEW: Detailed walkthrough endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});
app.use(errorHandler_1.errorHandler);
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📡 API endpoints:`);
    console.log(`   - POST /api/feedback (corrective/positive feedback)`);
    console.log(`   - POST /api/explanation (detailed walkthrough)`);
    console.log(`   - GET  /health (health check)`);
});
