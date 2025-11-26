/*
  # Add RLS policies for products table

  1. Changes
    - Add INSERT policy to allow creating new products
    - Add UPDATE policy to allow editing products
    - Add DELETE policy to allow deleting products
  
  2. Security
    - Since this is an admin panel without authentication system,
      we allow public access for all operations
    - All policies use simple true condition to allow operations
    - In production, these should be restricted to authenticated admin users
*/

-- Allow public insert access for products
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'products' 
    AND policyname = 'Public insert access for products'
  ) THEN
    CREATE POLICY "Public insert access for products"
      ON products
      FOR INSERT
      TO public
      WITH CHECK (true);
  END IF;
END $$;

-- Allow public update access for products
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'products' 
    AND policyname = 'Public update access for products'
  ) THEN
    CREATE POLICY "Public update access for products"
      ON products
      FOR UPDATE
      TO public
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Allow public delete access for products
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'products' 
    AND policyname = 'Public delete access for products'
  ) THEN
    CREATE POLICY "Public delete access for products"
      ON products
      FOR DELETE
      TO public
      USING (true);
  END IF;
END $$;
