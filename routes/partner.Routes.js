const router = require('express').Router();
const ctrl = require('../controllers/partner.controller');
const {verifyToken, requireRole} = require('../middleware/authMiddleware');
const multer = require('multer').memoryStorage();
const upload = require('multer')({ storage: multer });

router.get('/', ctrl.getActivePartners);
router.get('/odscolors', ctrl.getOdsColors);
router.get('/all', verifyToken, requireRole('admin','developer'), ctrl.getAllPartners);

router.post('/',verifyToken,requireRole('admin','developer'),upload.single('logo'),ctrl.createPartner);
router.put('/:id',verifyToken,requireRole('admin','developer'),upload.single('logo'),ctrl.updatePartner);
router.patch('/:id/status',verifyToken,requireRole('admin','developer'),ctrl.togglePartnerStatus);

module.exports = router;
