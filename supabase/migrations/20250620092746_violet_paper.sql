/*
  # Enhance farmer schema for detailed crop and field management

  1. Schema Changes
    - Add `crop_details` (jsonb) - Array of crop objects with type and hectareage
    - Add `field_locations` (jsonb) - Array of field objects with coordinates and boundaries
    - Add `call_type` to ivr_calls table for voice integration tracking

  2. Security
    - Maintain existing RLS policies
    - Add indexes for performance
*/

-- Add new columns to farmers table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'farmers' AND column_name = 'crop_details'
  ) THEN
    ALTER TABLE farmers ADD COLUMN crop_details jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'farmers' AND column_name = 'field_locations'
  ) THEN
    ALTER TABLE farmers ADD COLUMN field_locations jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Add call_type to ivr_calls table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ivr_calls' AND column_name = 'call_type'
  ) THEN
    ALTER TABLE ivr_calls ADD COLUMN call_type text DEFAULT 'traditional_ivr';
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_farmers_crop_details ON farmers USING GIN (crop_details);
CREATE INDEX IF NOT EXISTS idx_farmers_field_locations ON farmers USING GIN (field_locations);
CREATE INDEX IF NOT EXISTS idx_ivr_calls_call_type ON ivr_calls(call_type);

-- Add check constraint for call_type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'ivr_calls_call_type_check'
  ) THEN
    ALTER TABLE ivr_calls ADD CONSTRAINT ivr_calls_call_type_check 
    CHECK (call_type IN ('traditional_ivr', 'elevenlabs_voice', 'whatsapp', 'whatsapp_sent', 'whatsapp_delivered', 'whatsapp_read'));
  END IF;
END $$;