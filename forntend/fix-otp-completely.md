# 🔧 Fix OTP Issue - Complete Guide

## 🎯 **Problem**: Users get confirmed immediately instead of needing OTP verification

## 🛠️ **Solution**: Change Supabase Authentication Settings

### **Step 1: Go to Supabase Auth Settings**
**Open**: https://supabase.com/dashboard/project/rhlvrgfpxvtkpwjyfvzt/auth/settings

### **Step 2: Critical Settings to Change**

#### **📧 A. Email Confirmation (MOST IMPORTANT)**
Look for **"Enable email confirmations"** setting:
- ✅ **TURN ON**: "Enable email confirmations" 
- ✅ **TURN ON**: "Confirm email change"

#### **🔐 B. Email Verification Settings**
Find the **"Email"** section:
- ✅ **Enable**: Email verification
- ❌ **Disable**: Auto-confirm users (if this option exists)

#### **🌐 C. Site URL Settings**
```
Site URL: http://localhost:5173
Additional Redirect URLs: (LEAVE EMPTY or remove all URLs)
```

#### **⚙️ D. Advanced Settings**
Look for **"Security"** or **"Advanced"** section:
- ❌ **Disable**: "Disable signup" (should be OFF)
- ✅ **Enable**: "Email confirmations" (should be ON)
- ❌ **Disable**: "Auto-confirm users" (should be OFF)

### **Step 3: Save Changes**
**Click "Save"** and **wait 2-3 minutes** for changes to take effect.

### **Step 4: Test Settings**
After saving, the signup flow should be:
1. User enters email/password → **Account created**
2. User gets **OTP email** (not confirmation link)
3. User enters OTP → **Account verified**
4. User redirected to business setup

## 🚨 **If Settings Don't Work - Code Override**

If Supabase settings still don't work, we can force OTP in the code by disabling auto-confirmation:

```javascript
// In AuthContext.jsx - modify the signup call
const { data, error } = await supabase.auth.signUp({
  email: email.toLowerCase().trim(),
  password,
  options: {
    data: metadata,
    emailRedirectTo: undefined  // Forces OTP
  }
})
```

## 🧪 **How to Test**
1. Change Supabase settings
2. Wait 2-3 minutes
3. Try signup with **NEW email** (not existing ones)
4. Should get OTP email instead of immediate confirmation

## ✅ **Expected Result**
- ❌ **Before**: "Account created successfully!" (immediate)
- ✅ **After**: "Check your email for verification code" (OTP required) 