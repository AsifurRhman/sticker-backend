import { z } from 'zod';

export const createStickerValidationSchema = z.object({
  body: z.object({
    name: z.string({
      required_error: 'name is required!',
      invalid_type_error: 'name must be a string',
    }),
  
    price: z.number({
      required_error: 'Price is required!',
      invalid_type_error: 'Price must be a number.',
    }).min(0, { message: 'Price must be greater than or equal to 0.' }),
    
  }),
});


