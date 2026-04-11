-- Fix: Update classes table constraint to allow 'secondary' as a valid level
-- The current constraint only allows: primary, lower_secondary, igcse, ielts
-- We need to add 'secondary' as a valid option for G9-G12 classes

-- Drop the old constraint
ALTER TABLE public.classes
DROP CONSTRAINT IF EXISTS classes_programme_check;

-- Add new constraint with correct level values
ALTER TABLE public.classes
ADD CONSTRAINT classes_programme_check 
CHECK (level = ANY (ARRAY['primary'::text, 'secondary'::text]));

-- Note: The constraint name 'classes_programme_check' is kept for consistency
-- even though it's actually checking the 'level' field, not 'programme'