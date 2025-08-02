# 📧 Fix OTP Email Settings

## 🎯 **Issue:** Getting confirmation emails instead of OTP codes

## 🛠️ **Solution:** Change Supabase Email Settings

### **Step 1: Go to Authentication Settings**
1. **Open**: https://supabase.com/dashboard/project/rhlvrgfpxvtkpwjyfvzt/auth/settings
2. **Navigate to**: Authentication → Settings

### **Step 2: Configure Email Settings**

#### **A. Email Confirmation Settings:**
- ✅ **Enable email confirmations**: `ON` 
- ✅ **Confirm email change**: `ON`
- ❌ **Secure email change**: `OFF` (for development)

#### **B. OTP Settings (THIS IS KEY!):**
- ✅ **Enable phone confirmations**: Can be `OFF`
- ✅ **Enable custom SMTP**: Can be `OFF` for now

#### **C. Site URL Settings:**
```
Site URL: http://localhost:5173
Additional Redirect URLs: 
http://localhost:5173/auth/callback
http://localhost:5173/verify-otp
http://localhost:5173/dashboard
```

### **Step 3: Template Settings (IMPORTANT!)**
1. **Go to**: Authentication → Email Templates
2. **Find**: "Confirm signup" template
3. **Make sure**: The template is set for **email verification** (not just welcome)

### **Step 4: Test Settings**
After changing settings:
1. **Wait 2-3 minutes** for changes to propagate
2. **Try signing up** with a new email
3. **Should receive**: OTP verification email (not just confirmation)

## 🔍 **Alternative: Force OTP in Code**

If the settings don't work, we can force OTP in the signup code:

```javascript
// In SignUp.jsx - modify the signup call
const { data, error } = await supabase.auth.signUp({
  email: formData.email,
  password: formData.password,
  options: {
    data: metadata,
    emailRedirectTo: undefined, // This forces OTP instead of redirect
  }
})
```

## ✅ **Expected Behavior:**
1. **User signs up** → Email sent with **6-digit OTP code**
2. **User enters OTP** → Account confirmed
3. **Redirect to** → Business setup page

## 🧪 **Test It:**
After making changes, try signing up with a NEW email address (not `madhanp722@gmail.com` since that one already exists). 