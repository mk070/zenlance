-- ============================================
-- 🔧 ADD MISSING COLUMNS TO USER_PROFILES
-- ============================================
-- This fixes the "Could not find 'current_tools' column" error

-- Add all missing business detail columns
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS current_tools TEXT[] DEFAULT '{}';

ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS team_size TEXT;

ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS primary_goal TEXT;

ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS experience_level TEXT;

ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS monthly_revenue TEXT;

ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS website TEXT;

-- Verify columns were added
SELECT 
    'Column Check:' as status,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND column_name IN ('current_tools', 'team_size', 'primary_goal', 'experience_level', 'monthly_revenue', 'website')
ORDER BY column_name;

-- Success message
SELECT '✅ Missing columns added to user_profiles table!' as message; 