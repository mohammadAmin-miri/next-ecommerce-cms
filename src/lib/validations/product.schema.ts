import { z } from 'zod';

export const variantFormSchema = z.object({
  sku: z.string().min(2, 'کد SKU الزامی است.'),
  color: z.string().optional(),
  size: z.string().optional(),
  stock: z.coerce.number().min(0, 'موجودی نمی‌تواند منفی باشد.'),
  priceDiff: z.coerce.number().default(0),
});

export const productFormSchema = z.object({
  title: z.string().min(3, 'عنوان محصول باید حداقل ۳ کاراکتر باشد.'),
  sku: z.string().min(2, 'کد محصول (SKU) الزامی است.'),
  description: z.string().min(10, 'توضیحات محصول الزامی است.'),
  basePrice: z.coerce.number().min(0, 'قیمت پایه نامعتبر است.'),
  discountPrice: z.coerce.number().min(0).optional(),
  categories: z.array(z.string()).min(1, 'انتخاب حداقل یک دسته‌بندی الزامی است.'),
  brand: z.string().optional(),
  images: z.array(z.string()).min(1, 'حداقل آپلود یک تصویر الزامی است.'),
  variants: z.array(variantFormSchema).default([]),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('DRAFT'),
  isFeatured: z.boolean().default(false),
  seoMetaTitle: z.string().optional(),
  seoMetaDescription: z.string().optional(),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;