import process from 'node:process';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import router from './routes/index.js';

dotenv.config();

mongoose.connect(process.env.MONGO_URL);

const app = express();
mongoose.connection.on('error', (err) => {
  console.log('MongoDB connection error: ', err);
  process.exit(1);
});
app.use(express.json());
app.use(cors({
  origin: 'http://127.0.0.1:5500',
  methods: 'GET',
  allowedHeaders: 'Content-Type'
}));

app.use(router);

app.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    message: err.message
  });
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => { console.log('Server is running on port 3000') });
