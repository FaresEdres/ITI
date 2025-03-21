import validator from 'validator';

export const validateEmployee = (method) => (req, res, next) => {
  const {name, email, age} = req.body;
  const isPost = method === 'POST';
  const errors = [];

  if (isPost || name !== undefined) {
    if (!name || typeof name !== 'string' || name.trim().length < 3 || !validator.isAlpha(name.replace(/\s/g, ''))) {
      errors.push({property: 'name', error: 'Name should be at least 3 alphabetic characters'});
    }
  }

  if (isPost || email !== undefined) {
    if (!email || !validator.isEmail(email)) {
      errors.push({property: 'email', error: 'Email should be in this format: name@email.com'});
    }
  }

  if (isPost || age !== undefined) {
    if (age === undefined || !validator.isInt(age.toString(), {min: 18, max: 60})) {
      errors.push({property: 'age', error: 'Age should be an integer between 18 and 60'});
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({errors});
  }

  next();
};
