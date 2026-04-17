-- Add reviewer_category to persons table
ALTER TABLE persons ADD COLUMN IF NOT EXISTS reviewer_category TEXT;

-- Add is_award_winning to content_items table
ALTER TABLE content_items ADD COLUMN IF NOT EXISTS is_award_winning BOOLEAN DEFAULT false;
