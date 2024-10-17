import { Sticker } from "./stickers.model.js";




export const findStickerById = async (id) => {

    return Sticker.findById(id);
  };


export const createStickerIntoDB = async (payload) => {
    console.log(payload)
    const isExists = await Sticker.findOne({
      $or: [
        { name: payload?.name },
        { image: payload?.image }
      ]
    });
  
    if (isExists) {
      throw new Error('Sticker with this name or image already exists!');
    }
  console.log(isExists)
    const result = await Sticker.create(payload);
    return result;
  };
  
  
  

  export const getAllStickerFromDB = async (name, page, limit) => {
    let filter = {};
  
    // If a name is provided, add it to the filter object
    if (name) {
      filter = { name: { $regex: name, $options: 'i' } }; // Case-insensitive search
    }
  
    // Calculate how many documents to skip
    const skip = (page - 1) * limit;
  
    // Find stickers based on the filter, sort by creation date, and apply pagination
    const stickers = await Sticker.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
  
    // Get the total count of stickers matching the filter
    const totalCount = await Sticker.countDocuments(filter);
  
    return { stickers, totalCount };
  };
  
  
export const updateStickerIntoDB = async (StickerId, payload) => {
    const isExists = await Sticker.findById(StickerId);
    if (!isExists) {
      throw new Error('Sticker not found!');
    }
  
    const result = await Sticker.findByIdAndUpdate(StickerId, payload, {new: true});
    return result;
};
  

export const deleteStickerFromDB = async (Id) => {
    const isExists = await Sticker.findById(Id);
    if (!isExists) {
      throw new Error('Sticker not found or maybe deleted!');
    }
    const result = await Sticker.findByIdAndDelete(Id);
    return result;
};
  

