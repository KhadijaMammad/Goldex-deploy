/*
  # Add selected_credit_option field to products table

  1. Changes
    - Add `selected_credit_option` field to products table to store the name of the credit option selected by admin
    - This field will be used to determine which credit terms apply to each product
    - Nullable field as not all products may have credit options
  
  2. Notes
    - This replaces the previous `credit_options` array field with a simpler reference to a named credit option
    - The actual credit terms are stored in the settings table under 'credit_options'
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'selected_credit_option'
  ) THEN
    ALTER TABLE products ADD COLUMN selected_credit_option text;
  END IF;
END $$;
