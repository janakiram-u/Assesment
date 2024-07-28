const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const bookRoutes = require('./routes/book');
const loggerMiddleware = require('./middleware/logger');
const errorHandlerMiddleware = require('./middleware/errorHandler');
const setupSwagger = require('./swagger');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;


app.use(express.json());

app.use(loggerMiddleware);

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));


app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);


setupSwagger(app);


app.use(errorHandlerMiddleware);


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
