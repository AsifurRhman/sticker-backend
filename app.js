import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import connectDB, { seedSuperAdmin } from './config/db.js';
import router from './src/routes/index.js';
import { createServer } from 'node:http';
import { initSocketIO } from './src/utils/socket.js';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';
import morgan from "morgan"
// Define __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

const app = express();
//socket setup
// Create the HTTP server and bind it with Socket.IO      

const server = http.createServer(app);
initSocketIO(server);

// Middleware to parse JSON bodies
app.use(express.json());
app.use(cors({
  origin: 'http://192.168.10.230:5173', // Include the port number for the Vite development server
  credentials: true, // Allow credentials (cookies, authorization headers, etc.)
}));


app.use(morgan(':method :url :status :res[content-length] - :response-time ms'))

// Routes
app.use(router);

// Add a route handler for the root path
app.get('/', (req, res) => {
  res.send('Welcome to the Pmoji App!');
});

// Serve static files from the 'public' directory
app.use('/images', express.static(path.join(__dirname, 'public/images')));

    
seedSuperAdmin()
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
