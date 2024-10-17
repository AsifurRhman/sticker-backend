import { PromoCodeModel } from "./promoCode.model.js";




export const findPromoCodeByCode = async (code) => {
    return await PromoCodeModel.findOne({ code });
  };
export const promoCodeCreate = async (promoCodeData) => {
    const promoCode = await PromoCodeModel.create(promoCodeData);
    return promoCode;
};
  


export const promoCodes = async () => {
    const promoCode  = await PromoCodeModel.aggregate([
      {
        $setWindowFields: {
          sortBy: { createdAt: -1 },
          output: {
            serial: {
              $documentNumber: {}
            }
          }
        }
      },
      {
        $project: {
          serial: 1,         // Include the serial field
          code: 1,           // Include coupon code
          status: 1,    // Include expiry date
          createdAt: 1,      // Include createdAt field
        
        }
      }
    ]);
  
    return promoCode;
};
  

export const findPromoCodeById = async (id) => {

    return PromoCodeModel.findById(id);
};
  
export const promoCodeUpdate = async (id, updateData) => {
    return PromoCodeModel.findByIdAndUpdate(id, updateData, { new: true });
};
  
export const promoCodeDelete = async (promoId) => {
    await PromoCodeModel.findByIdAndDelete(promoId);
  };