import { termsModel } from "./terms.model.js";


export const createTermsInDB = async (termsData) => {
  const newTerms = new termsModel({ description: termsData.sanitizedContent });
  const savedTerms = await newTerms.save();
  return savedTerms;
};

export const getAllTermsFromDB = async () => {
  const terms = await termsModel.find().sort({ createdAt: -1 });
  return terms;
};

export const updateTermsInDB = async (updateData) => {
  // Assuming you have only one document for terms and you're updating that
  const result = await termsModel.findOneAndUpdate({}, updateData, { new: true, upsert: true });
  return result;
};

  
export const deleteTermsFromDB = async (id) => {
    const deletedTerms = await termsModel.findByIdAndDelete(id);
    return deletedTerms;
  };