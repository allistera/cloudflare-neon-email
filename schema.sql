CREATE TABLE IF NOT EXISTS emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_address VARCHAR(255) NOT NULL,
  to_address VARCHAR(255) NOT NULL,
  subject TEXT,
  text_body TEXT,
  html_body TEXT,
  received_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add the read column to existing table
ALTER TABLE emails ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT FALSE;

-- Add the spam column to existing table
ALTER TABLE emails ADD COLUMN IF NOT EXISTS spam BOOLEAN DEFAULT FALSE;

-- Add the tags column to existing table
ALTER TABLE emails ADD COLUMN IF NOT EXISTS tags TEXT[];

CREATE INDEX idx_emails_received_at ON emails(received_at DESC);
CREATE INDEX idx_emails_from_address ON emails(from_address);
CREATE INDEX idx_emails_to_address ON emails(to_address);
