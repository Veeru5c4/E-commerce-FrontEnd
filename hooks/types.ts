export interface Product {
  _id: string;
  name: string;
  price: number;
  category: string;
  description: string;
  imageUrl?: string; // Optional since it might not always be provided
}
  