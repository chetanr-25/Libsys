require('dotenv').config();
require("./db");
const express = require('express');
const cors    = require('cors');

const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static frontend files from parent directory
app.use(express.static(path.join(__dirname, '../')));

app.use('/api/books',      require('./routes/books'));
app.use('/api/members',    require('./routes/members'));
app.use('/api/borrow',     require('./routes/borrow'));
app.use('/api/publishers', require('./routes/publishers'));

app.listen(3000, () => console.log('Server running on http://localhost:3000'));