import express from 'express';
import LeavesController from '../controllers/leaves.js';
import authentication from '../middlewares/authentication.js';

const router = express.Router();

router.post('/', authentication, async (req, res, next) => {
  try {
    const leave = await LeavesController.create(req.body);
    res.status(201).json(leave);
  } catch (err) {
    console.log(err);
    next(err);
  }
});
router.get('/', async (req, res, next) => {
  try {
    const {limit, skip, status} = req.query;
    const leaves = await LeavesController.getFiltered({limit, skip, status});
    res.status(200).json(leaves);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const updatedLeave = await LeavesController.update(req.params.id, req.body);
    res.status(200).json(updatedLeave);
  } catch (err) {
    next(err);
  }
});

export default router;
