"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const database_1 = require("@monorepo/database");
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.get('/api/health', async (req, res) => {
    let dbStatus = 'disconnected';
    try {
        // Basic test query to verify DB connection
        await database_1.prisma.$queryRaw `SELECT 1`;
        dbStatus = 'connected';
    }
    catch (error) {
        dbStatus = 'error';
        console.error('DB Connection Error:', error);
    }
    const response = {
        status: 'ok',
        message: 'Backend is running with Prisma and Monorepo Shared Types!',
        database: dbStatus,
        timestamp: new Date().toISOString()
    };
    res.json(response);
});
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
//# sourceMappingURL=index.js.map