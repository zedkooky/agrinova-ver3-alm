/*
  # Create carbon credits table

  1. New Tables
    - `carbon_credits`
      - `id` (uuid, primary key)
      - `farmer_id` (uuid, foreign key)
      - `opt_in_date` (date)
      - `practices_reported` (text)
      - `verification_status` (text)
      - `estimated_credits` (numeric)
      - `verified_credits` (numeric)
      - `credit_price` (numeric)
      - `total_value` (numeric)
      - `registry_id` (text)

  2. Security
    - Enable RLS on `carbon_credits` table
    - Add policies for authenticated access
*/

CREATE TABLE IF NOT EXISTS carbon_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id uuid REFERENCES farmers(id) ON DELETE CASCADE,
  opt_in_date date NOT NULL,
  practices_reported text,
  verification_status text DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  estimated_credits numeric(10,2) DEFAULT 0,
  verified_credits numeric(10,2) DEFAULT 0,
  credit_price numeric(10,2) DEFAULT 0,
  total_value numeric(12,2) DEFAULT 0,
  registry_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE carbon_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to carbon_credits"
  ON carbon_credits
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow insert access to carbon_credits"
  ON carbon_credits
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow update access to carbon_credits"
  ON carbon_credits
  FOR UPDATE
  TO authenticated
  USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_carbon_credits_farmer_id ON carbon_credits(farmer_id);
CREATE INDEX IF NOT EXISTS idx_carbon_credits_status ON carbon_credits(verification_status);