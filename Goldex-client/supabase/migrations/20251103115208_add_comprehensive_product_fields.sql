/*
  # Add comprehensive product and credit fields

  1. Changes to Products Table
    - Add `description` (text) - Detailed product description
    - Add `material` (text) - əyar/material (e.g., "14K qızıl")
    - Add `gemstone_type` (text) - daş növü (e.g., "Brilyant")
    - Add `gemstone_carat` (text) - brilyantın çəkisi
    - Add `production_status` (text) - "Hazırdır" / "Sifarişlə 3-5 gün"
    - Add `stock_status` (text) - "Stokda" / "Sifarişlə"
    - Add `featured_flags` (text[]) - ["Yeni"], ["Tövsiyə olunur"], etc.
    - Add `active` (boolean) - if false, hidden from public catalog
    - Add `size` (text) - ring size or other dimensions
    - Add `viewed_count` (integer) - tracking views
    - Rename `weight` to `weight_grams` for clarity
    - Rename `price_usd` to `price_azn` and change semantics
    - Add `credit_options` (jsonb) - product-specific credit terms

  2. Settings Updates
    - Add credit calculator configuration options
    - Store as JSON in settings table

  3. Notes
    - weight field will be migrated to weight_grams
    - Existing products will get default values
*/

-- Add new fields to products table
DO $$
BEGIN
  -- Add description
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'description'
  ) THEN
    ALTER TABLE products ADD COLUMN description text DEFAULT '';
  END IF;

  -- Add material (əyar)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'material'
  ) THEN
    ALTER TABLE products ADD COLUMN material text DEFAULT '';
  END IF;

  -- Add gemstone fields
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'gemstone_type'
  ) THEN
    ALTER TABLE products ADD COLUMN gemstone_type text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'gemstone_carat'
  ) THEN
    ALTER TABLE products ADD COLUMN gemstone_carat text DEFAULT '';
  END IF;

  -- Add status fields
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'production_status'
  ) THEN
    ALTER TABLE products ADD COLUMN production_status text DEFAULT 'Hazırdır';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'stock_status'
  ) THEN
    ALTER TABLE products ADD COLUMN stock_status text DEFAULT 'Stokda';
  END IF;

  -- Add featured flags
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'featured_flags'
  ) THEN
    ALTER TABLE products ADD COLUMN featured_flags text[] DEFAULT '{}';
  END IF;

  -- Add active flag
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'active'
  ) THEN
    ALTER TABLE products ADD COLUMN active boolean DEFAULT true;
  END IF;

  -- Add size
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'size'
  ) THEN
    ALTER TABLE products ADD COLUMN size text DEFAULT '';
  END IF;

  -- Add viewed_count
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'viewed_count'
  ) THEN
    ALTER TABLE products ADD COLUMN viewed_count integer DEFAULT 0;
  END IF;

  -- Add weight_grams (will eventually replace weight)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'weight_grams'
  ) THEN
    ALTER TABLE products ADD COLUMN weight_grams numeric DEFAULT 0;
  END IF;

  -- Add price_azn (will eventually replace price_usd)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'price_azn'
  ) THEN
    ALTER TABLE products ADD COLUMN price_azn numeric DEFAULT 0;
  END IF;

  -- Add credit_options as JSONB
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'credit_options'
  ) THEN
    ALTER TABLE products ADD COLUMN credit_options jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Migrate existing data
UPDATE products 
SET weight_grams = CAST(REPLACE(REPLACE(weight, 'q', ''), 'g', '') AS numeric)
WHERE weight_grams = 0 AND weight IS NOT NULL AND weight != '';

UPDATE products
SET price_azn = price_usd * 1.7
WHERE price_azn = 0;

-- Add credit calculator config settings
INSERT INTO settings (key, value)
VALUES 
  ('credit_min_amount', '100'),
  ('credit_max_amount', '10000'),
  ('credit_min_downpayment', '0'),
  ('credit_options', '[{"months_min":3,"months_max":6,"interest_percent":12},{"months_min":7,"months_max":12,"interest_percent":18}]')
ON CONFLICT (key) DO NOTHING;