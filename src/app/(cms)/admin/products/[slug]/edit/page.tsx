import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { Types } from 'mongoose';
import { connectDB } from '@/lib/db';
import { Product } from '@/models/Product';
import { EditProductFormClient, EditableProductData } from '@/components/cms/EditProductFormClient';

export const instant = false;

interface EditProductPageProps {
  params: Promise<{ slug: string }>;
}

export default async function AdminEditProductPage({ params }: EditProductPageProps) {
  await connection();
  const { slug } = await params;
  const decoded = decodeURIComponent(slug);

  await connectDB();

  const query = Types.ObjectId.isValid(decoded)
    ? { $or: [{ _id: new Types.ObjectId(decoded) }, { slug: decoded }] }
    : { slug: decoded };

  const product = await Product.findOne(query).lean<{
    _id: Types.ObjectId;
    title: string;
    slug: string;
    basePrice: number;
    discountPrice?: number;
    totalStock: number;
    status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
    isFeatured: boolean;
    description: string;
  }>();

  if (!product) {
    notFound();
  }

  const serialized: EditableProductData = {
    _id: product._id.toString(),
    title: product.title,
    slug: product.slug,
    basePrice: product.basePrice,
    discountPrice: product.discountPrice,
    totalStock: product.totalStock,
    status: product.status,
    isFeatured: Boolean(product.isFeatured),
    description: product.description || '',
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">ویرایش محصول</h1>
        <p className="text-sm text-slate-400 mt-1">
          در حال ویرایش اطلاعات و موجودی: <strong className="text-slate-200">{serialized.title}</strong>
        </p>
      </div>

      <EditProductFormClient product={serialized} />
    </div>
  );
}