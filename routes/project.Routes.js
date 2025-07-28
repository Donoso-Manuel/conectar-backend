const router = require('express').Router();
const ctrl = require('../controllers/project.controller');
const {verifyToken, requireRole} = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');


router.get('/', ctrl.getActiveProjects);
router.get('/:id', ctrl.getProjectDetails);

router.get('/all/list',verifyToken,requireRole('admin','developer'), ctrl.getAllProjects);
router.post('/',verifyToken,requireRole('admin','developer'), upload.single('image'), ctrl.createProject);
router.put('/:id',verifyToken,requireRole('admin','developer'), upload.single('image'),ctrl.updateProject);
router.patch('/:id/status',verifyToken,requireRole('admin','developer'), ctrl.toggleProjectStatus);
router.patch('/:id/close-registration',verifyToken,requireRole('admin','developer'), ctrl.closeRegistration);
router.delete('/:id',verifyToken,requireRole('admin','developer'), ctrl.deleteProject);

router.post('/:id/observation',verifyToken,requireRole('admin','developer'), ctrl.addObservation);

router.delete('/:projectId/gallery/:imageId', verifyToken, requireRole('admin','developer'), ctrl.deleteProjectImage)
router.post('/:id/gallery',verifyToken,requireRole('admin','developer'), upload.array('images', 20), ctrl.addGalleryImages);
router.get('/:id/gallery', ctrl.getGalleryImages);

module.exports = router;
