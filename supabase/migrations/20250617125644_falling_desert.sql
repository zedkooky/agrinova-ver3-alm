/*
  # Add API Credentials Table

  1. New Tables
    - `api_credentials`
      - `id` (text, primary key) - identifier for credential set
      - `credentials` (jsonb) - encrypted credential storage
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `api_credentials` table
    - Add policy for authenticated users to manage credentials
*/

CREATE TABLE IF NOT EXISTS api_credentials (
  id text PRIMARY KEY DEFAULT 'main',
  credentials jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE api_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to manage API credentials"
  ON api_credentials
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_api_credentials_updated_at ON api_credentials(updated_at);