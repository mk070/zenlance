# 🔧 Fix OTP Template & Flow - Production Ready

## 🎯 **Problem**: Getting confirmation LINKS instead of OTP CODES

The default Supabase template sends:
```html
<h2>Confirm your signup</h2>
<p>Follow this link to confirm your user:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm your mail</a></p>
```

## 🛠️ **SOLUTION: Change to OTP Template & Flow**

### **Step 1: Change Supabase Email Template**
**Go to**: https://supabase.com/dashboard/project/rhlvrgfpxvtkpwjyfvzt/auth/templates

1. **Find**: "Confirm signup" template
2. **Replace content** with OTP template:

```html
<h2>Verify Your Account</h2>
<p>Your verification code is:</p>
<h1 style="font-size: 32px; font-weight: bold; text-align: center; background: #f0f0f0; padding: 20px; margin: 20px 0; border-radius: 8px;">{{ .Token }}</h1>
<p>Enter this code in the app to verify your account.</p>
<p>This code expires in 60 minutes.</p>
<p>If you didn't request this, please ignore this email.</p>
```

3. **Save template**

### **Step 2: Change Auth Settings**
**Go to**: https://supabase.com/dashboard/project/rhlvrgfpxvtkpwjyfvzt/auth/settings

**Critical Settings:**
- ✅ **Enable email confirmations**: ON
- ✅ **Secure email change**: OFF (for development)
- ✅ **Email verification**: OTP (not link-based)

### **Step 3: Update Code to Use OTP Flow**
The signup code needs to specifically request OTP verification.

### **Step 4: Test Template**
After changing template:
1. **Wait 2-3 minutes**
2. **Try signup with NEW email**
3. **Should receive**: 6-digit OTP code (not link) 