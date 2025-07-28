const express = require('express');
const router = express.Router();
const odsController = require('../controllers/ods.controller');
const {verifyToken, requireRole} = require('../middleware/authMiddleware')

router.get('/', odsController.getAllODS);

router.put('/:id',verifyToken,requireRole('admin','developer') ,odsController.updateODS);


module.exports = router;