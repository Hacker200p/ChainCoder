'use strict';

const express = require('express');

const { publicVerifyAsset } = require('../controllers/assetController');

const router = express.Router();

router.get('/asset/:assetId', publicVerifyAsset);

module.exports = router;
