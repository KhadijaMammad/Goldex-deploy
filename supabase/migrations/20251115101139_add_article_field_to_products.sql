/*
  # Add article field to products table

  1. Changes
    - Add `article` column to products table
      - Type: varchar(20)
      - Nullable: true (optional field)
      - Description: Article/SKU identifier for products
    
  2. Notes
    - Field limited to 20 characters as requested
    - Can be used for product identification and search
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'article'
  ) THEN
    ALTER TABLE products ADD COLUMN article varchar(20);
  END IF;
END $$;
