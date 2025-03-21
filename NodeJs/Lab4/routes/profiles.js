import express from 'express';

const router = express.Router();

router.post('/');
router.get('/');
router.delete('/:id');
router.patch('/:id');
router.get('/:id/leaves');

export default router;
