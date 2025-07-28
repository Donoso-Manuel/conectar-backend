const express =  require('express');
const router = express.Router();
const newsController =  require('../controllers/news.controller');
const upload =  require('../middleware/upload')
const {verifyToken, requireRole} =  require('../middleware/authMiddleware');

router.get('/', newsController.getAllActiveNews);

router.get('/all', verifyToken, requireRole('admin','developer'), newsController.getAllNews)

router.post('/create', verifyToken, requireRole('admin', 'developer'),upload.single('image'), newsController.createNews);

router.put('/:id', verifyToken, requireRole('admin', 'developer'),upload.single('image'),newsController.updateNews)

router.patch('/:id/status', verifyToken, requireRole('admin', 'developer'), newsController.changeNewsStatus);

module.exports = router;
