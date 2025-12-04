/*
  # Create storage policies for product-images bucket

  1. New Policies
    - Allow public INSERT (upload) access to product-images bucket
    - Allow public SELECT (read) access to product-images bucket
    - Allow public UPDATE access to product-images bucket
    - Allow public DELETE access to product-images bucket
  
  2. Security
    - Since this is an admin panel without authentication,
      we allow public access for all storage operations
    - The bucket is already set to public for file access
    - In production, these should be restricted to authenticated admin users
*/

-- Allow public to upload images to product-images bucket
CREATE POLICY "Public can upload product images"
  ON storage.objects
  FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'product-images');

-- Allow public to read images from product-images bucket
CREATE POLICY "Public can read product images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'product-images');

-- Allow public to update images in product-images bucket
CREATE POLICY "Public can update product images"
  ON storage.objects
  FOR UPDATE
  TO public
  USING (bucket_id = 'product-images')
  WITH CHECK (bucket_id = 'product-images');

-- Allow public to delete images from product-images bucket
CREATE POLICY "Public can delete product images"
  ON storage.objects
  FOR DELETE
  TO public
  USING (bucket_id = 'product-images');
