import { AboutModel } from "./aboute.model.js";




export const createAboutInDB = async (AboutData) => {
 
    
    
    const newAbout = new AboutModel({ description: AboutData.sanitizedContent });

  const savedAbout = await newAbout.save();
  return savedAbout;
};

export const getAllAboutFromDB = async () => {
  const About = await AboutModel.find().sort({ createdAt: -1 });
  return About;
};

export const updateAboutInDB = async (updateData) => {
  // Assuming you have only one document for About and you're updating that
  const result = await AboutModel.findOneAndUpdate({}, updateData, { new: true, upsert: true });
  return result;
};

  
export const deleteAboutFromDB = async (id) => {
    const deletedAbout = await AboutModel.findByIdAndDelete(id);
    return deletedAbout ;
  };