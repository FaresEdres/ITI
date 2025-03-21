import Leaves from '../models/leaves.js';

const create = async (data) => {
  try {
    const leave = await Leaves.create(data);
    return leave;
  } catch (error) {
    console.error('Error in create:', error);
    throw error;
  }
};

const updateById = async (id, data) => {
  try {
    const leave = await Leaves.findByIdAndUpdate(id, data, {new: true});
    return leave;
  } catch (error) {
    console.error('Error in updateById:', error);
    throw error;
  }
};

const getFiltered = async (query) => {
  try {
    const {limit, skip, status} = query;
    // It's better to set limit and skip using the query builder rather than as a projection.
    const leaves = await Leaves.find({status})
      .skip(Number(skip))
      .limit(Number(limit))
      .exec();
    return leaves;
  } catch (error) {
    console.error('Error in getByQuery:', error);
    throw error;
  }
};

export default {
  create,
  updateById,
  getFiltered
};
