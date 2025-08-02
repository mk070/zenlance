-- ============================================
-- 🚀 FREELANCEHUB - FRESH SUPABASE SETUP
-- ============================================
-- This script creates a clean database setup from scratch
-- Run this ENTIRE script in Supabase SQL Editor

-- ============================================
-- 🧹 STEP 1: COMPLETE CLEANUP
-- ============================================

-- Drop ALL existing policies (no conflicts)
DO $$ 
BEGIN
    -- Drop all policies on user_profiles
    DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
    DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;  
    DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
    DROP POLICY IF EXISTS "Users can delete own profile" ON user_profiles;
    DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON user_profiles;
    DROP POLICY IF EXISTS "Enable select for users based on user_id" ON user_profiles;
    DROP POLICY IF EXISTS "Enable update for users based on user_id" ON user_profiles;
    
    -- Drop all storage policies
    DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
    DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
    DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
    DROP POLICY IF EXISTS "Users can view own documents" ON storage.objects;
    DROP POLICY IF EXISTS "Users can upload own documents" ON storage.objects;
    DROP POLICY IF EXISTS "Users can view own project files" ON storage.objects;
    DROP POLICY IF EXISTS "Users can upload own project files" ON storage.objects;
    
EXCEPTION WHEN OTHERS THEN
    NULL; -- Ignore errors if policies don't exist
END $$;

-- Drop all triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;

-- Drop all tables
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Drop all functions
DROP FUNCTION IF EXISTS handle_new_user CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;

-- ============================================
-- 📊 STEP 2: CREATE SIMPLE TABLE
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create simple user_profiles table
CREATE TABLE public.user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    
    -- Basic Info
    email TEXT,
    first_name TEXT,
    last_name TEXT,
    full_name TEXT,
    avatar_url TEXT,
    
    -- Business Info (optional)
    business_name TEXT,
    business_type TEXT,
    industry TEXT,
    location TEXT,
    
    -- Platform Settings
    subscription_tier TEXT DEFAULT 'free',
    onboarding_completed BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ⚡ STEP 3: CREATE SIMPLE TRIGGER
-- ============================================

-- Simple trigger function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert basic profile data
    INSERT INTO public.user_profiles (
        id,
        email,
        first_name,
        last_name,
        full_name,
        subscription_tier,
        onboarding_completed
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'full_name', 
                 NEW.raw_user_meta_data->>'first_name' || ' ' || NEW.raw_user_meta_data->>'last_name',
                 ''),
        'free',
        false
    );
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- If profile creation fails, still allow user creation
    RAISE WARNING 'Profile creation failed for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- 🔒 STEP 4: ENABLE SECURITY
-- ============================================

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create simple policies
CREATE POLICY "allow_select_own_profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "allow_insert_own_profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "allow_update_own_profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- ============================================
-- 📁 STEP 5: CREATE STORAGE
-- ============================================

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Simple storage policy
CREATE POLICY "allow_avatar_select" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "allow_avatar_insert" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'avatars' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- ============================================
-- 🎯 STEP 6: GRANT PERMISSIONS
-- ============================================

GRANT ALL ON user_profiles TO authenticated;
GRANT ALL ON user_profiles TO service_role;

-- ============================================
-- ✅ STEP 7: TEST THE SETUP
-- ============================================

-- Verify everything is working
SELECT 
    'Setup Complete!' as status,
    count(*) as profiles_count,
    bool_and(rls_enabled) as rls_enabled
FROM (
    SELECT 
        *,
        (SELECT rowsecurity FROM pg_tables WHERE tablename = 'user_profiles') as rls_enabled
    FROM user_profiles
) t;

-- Show final message
SELECT '🎉 FreelanceHub database is ready! Test your signup now!' as message; 