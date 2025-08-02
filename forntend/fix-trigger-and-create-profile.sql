-- ============================================
-- 🔧 FIX TRIGGER & CREATE MISSING PROFILE
-- ============================================
-- This will fix the trigger function and create profile for existing user

-- ============================================
-- 🗑️ STEP 1: Clean up broken trigger
-- ============================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user CASCADE;

-- ============================================
-- ⚡ STEP 2: Create working trigger function
-- ============================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Debug log
    RAISE LOG 'Creating profile for user: % with email: %', NEW.id, NEW.email;
    
    -- Insert profile with proper error handling
    INSERT INTO public.user_profiles (
        id,
        email,
        first_name,
        last_name,
        full_name,
        subscription_tier,
        onboarding_completed,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            TRIM(CONCAT(
                COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
                ' ',
                COALESCE(NEW.raw_user_meta_data->>'last_name', '')
            ))
        ),
        'free',
        false,
        NOW(),
        NOW()
    );
    
    RAISE LOG 'Profile created successfully for user: %', NEW.id;
    RETURN NEW;
    
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    -- Still return NEW so user creation doesn't fail
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 🔗 STEP 3: Create the trigger
-- ============================================

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- 👤 STEP 4: Create profile for existing user
-- ============================================

-- First, check if user exists in auth.users
DO $$ 
DECLARE
    existing_user_id UUID;
    existing_email TEXT;
BEGIN
    -- Find the existing user
    SELECT id, email INTO existing_user_id, existing_email
    FROM auth.users 
    WHERE email = 'madhanp722@gmail.com'
    LIMIT 1;
    
    IF existing_user_id IS NOT NULL THEN
        RAISE NOTICE 'Found existing user: % with ID: %', existing_email, existing_user_id;
        
        -- Create profile for existing user
        INSERT INTO public.user_profiles (
            id,
            email,
            first_name,
            last_name,
            full_name,
            subscription_tier,
            onboarding_completed,
            created_at,
            updated_at
        ) VALUES (
            existing_user_id,
            existing_email,
            '',  -- We don't have first_name from existing user
            '',  -- We don't have last_name from existing user
            '',  -- We don't have full_name from existing user
            'free',
            false,
            NOW(),
            NOW()
        )
        ON CONFLICT (id) DO NOTHING; -- Don't duplicate if profile already exists
        
        RAISE NOTICE 'Profile created for existing user: %', existing_email;
    ELSE
        RAISE NOTICE 'No existing user found with email: madhanp722@gmail.com';
    END IF;
END $$;

-- ============================================
-- ✅ STEP 5: Verify everything works
-- ============================================

-- Show existing profiles
SELECT 
    'Existing Profiles:' as status,
    id,
    email,
    first_name,
    last_name,
    created_at
FROM user_profiles
ORDER BY created_at DESC;

-- Show trigger exists
SELECT 
    'Trigger Status:' as info,
    trigger_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Final success message
SELECT '🎉 Trigger fixed and existing user profile created!' as message; 