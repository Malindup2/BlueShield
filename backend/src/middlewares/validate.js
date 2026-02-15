module.exports = (validatorFn) => (req, res, next) => {
  const result = validatorFn(req);
  if (result && result.error) {
    return res.status(400).json({ message: "Validation error", errors: result.error });
  }
  next();
};
