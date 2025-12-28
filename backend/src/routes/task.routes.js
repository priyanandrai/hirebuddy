const express = require('express');
const router = express.Router();
const { createTask } = require('../controllers/task.controller');
const auth = require('../middlewares/auth.middleware');

router.post('/', auth, createTask);

module.exports = router;
