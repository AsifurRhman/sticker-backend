import { privacyModel } from "./privacy.model.js";



export const createPrivacyInDB = async (PrivacyData) => {
    console.log(PrivacyData, "privacy data")
    
    
    const newPrivacy = new privacyModel({ description: PrivacyData.sanitizedContent });

  const savedPrivacy = await newPrivacy.save();
  return savedPrivacy;
};

export const getAllPrivacyFromDB = async () => {
  const privacy = await privacyModel.find().sort({ createdAt: -1 });
  return privacy;
};

export const updatePrivacyInDB = async (updateData) => {
  // Assuming you have only one document for privacy and you're updating that
  const result = await privacyModel.findOneAndUpdate({}, updateData, { new: true, upsert: true });
  return result;
};

  
export const deletePrivacyFromDB = async (id) => {
    const deletedPrivacy = await privacyModel.findByIdAndDelete(id);
    return deletedPrivacy ;
  };