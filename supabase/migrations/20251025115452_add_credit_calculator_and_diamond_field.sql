/*
  # Add credit calculator settings and diamond field

  1. Changes to Products Table
    - Add `has_diamond` (boolean) - Indicates if product has diamonds/brilliants
    - Default to false for existing products

  2. New Settings for Credit Calculator
    - Add credit calculator settings (interest_rate, min_months, max_months, min_price, max_price)
    - These will be stored in the settings table

  3. Security
    - Maintain existing RLS policies
    - Settings table already has proper RLS policies

  4. Initial Data
    - Add default credit calculator settings
    - Update existing products to set has_diamond field
*/

-- Add has_diamond field to products table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'has_diamond'
  ) THEN
    ALTER TABLE products ADD COLUMN has_diamond boolean DEFAULT false;
  END IF;
END $$;

-- Insert default credit calculator settings
INSERT INTO settings (key, value)
VALUES 
  ('credit_interest_rate', '15'),
  ('credit_min_months', '3'),
  ('credit_max_months', '12'),
  ('credit_min_price', '100'),
  ('credit_max_price', '10000')
ON CONFLICT (key) DO NOTHING;