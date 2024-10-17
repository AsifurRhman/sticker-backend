import catchAsync from "../utils/catchAsync.js";

const validateRequest = (validationSchema) => {
  return catchAsync(async (req, res, next) => {
    await validationSchema.parseAsync({
      body: req.body,
    });
    next();
  });
};

export default validateRequest;
