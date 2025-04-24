const express = require('express');
const { body, check, validationResult } = require('express-validator');
const pool = require('./db');
const app = express();

app.use(express.urlencoded({extended: true}));
app.use(express.json());