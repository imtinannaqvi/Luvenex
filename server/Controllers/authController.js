import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import User from '../models/User.js';
import Otp from '../models/Otp.js';
import { signAccess, signRefresh, verifyToken } from '../lib/jwt.js';
import { generateReferralCode, generateHandle } from '../lib/referral.js';

const createOtp = async (email, purpose) => {
  const code = String(Math.floor(100000 + Math.random() * 900000)); // 6 digits
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); 

  await Otp.deleteMany({ email, purpose });
  await Otp.create({ email, codeHash, purpose, expiresAt });

  return code;
};
export const signUp = async (req, res) => {
  try {
    const { name, email, password, role, agreedToTerms, referralCode } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: { message: 'All fields are required' } });
    }
    if (!agreedToTerms) {
      return res.status(400).json({ error: { message: 'You must agree to the Terms & Conditions' } });
    }
    if (!['brand', 'influencer'].includes(role)) {
      return res.status(400).json({ error: { message: 'Role must be brand or influencer' } });
    }

    let referredBy;
    if (referralCode) {
      const referrer = await User.findOne({ referralCode: referralCode.toUpperCase() });
      if (referrer) referredBy = referrer._id;
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(409).json({ error: { message: 'Email is already in use' } });
    }

    const passwordHash = await bcrypt.hash(password, 10);

           let myCode;
    let attempts = 0;
    do {
      myCode = generateReferralCode(name);
      attempts++;
    } while ((await User.findOne({ referralCode: myCode })) && attempts < 5);

    let myHandle;
    let handleAttempts = 0;
    do {
      myHandle = generateHandle(name);
      handleAttempts++;
    } while ((await User.findOne({ handle: myHandle })) && handleAttempts < 5);

        const user = await User.create({
      name, email, passwordHash, role,
      agreedToTermsAt: new Date(),
      referralCode: myCode,
      handle: myHandle,
      referredBy,
    });

    const code = await createOtp(user.email, 'verify_email');
    console.log(`[OTP] verify_email for ${user.email}: ${code}`);

    const payload = { id: user._id, role: user.role };
    res.status(201).json({
      message: 'Signup successful. Please verify the OTP sent to your email.',
      user: { id: user._id, name: user.name, email: user.email, role: user.role, status: user.status },
      accessToken: signAccess(payload),
      refreshToken: signRefresh(payload),
    });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: { message: 'Both fields are required' } });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: { message: 'Invalid credentials' } });
    }
    
    if(['suspended','banned','deactivated'].includes(user.status)){
      const actionWord = user.status === 'deactivated' ? 'deactivated' : user.action;
      res.status(403).json({
        error:{
          message:`your account has been ${actionWord} by the platform.Reason ${user.statusReaosn || 'No Reason Provided'}. contact support 
          if you believe this is a mistake`
        }
      })

    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: { message: 'Invalid credentials' } });
    }

    const payload = { id: user._id, role: user.role };
    res.json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role, status: user.status },
      accessToken: signAccess(payload),
      refreshToken: signRefresh(payload),
    });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
};


export const verifyOtp = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: { message: 'Email and code are required' } });
    }

    const otp = await Otp.findOne({ email, purpose: 'verify_email' });
    if (!otp) {
      return res.status(400).json({ error: { message: 'No OTP found. Please request a new one.' } });
    }
    if (otp.expiresAt < new Date()) {
      return res.status(400).json({ error: { message: 'OTP has expired' } });
    }

    const ok = await bcrypt.compare(code, otp.codeHash);
    if (!ok) {
      return res.status(400).json({ error: { message: 'Invalid OTP' } });
    }

    const user = await User.findOneAndUpdate(
      { email },
      { status: 'active', emailVerifiedAt: new Date() },
      { new: true }
    );
    await Otp.deleteMany({ email, purpose: 'verify_email' });

    res.json({
      message: 'Email verified successfully',
      user: { id: user._id, name: user.name, email: user.email, role: user.role, status: user.status },
    });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
};


export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: { message: 'Email is required' } });
    }

    const user = await User.findOne({ email });
    if (user) {
      const code = await createOtp(email, 'reset_password');
      console.log(`[OTP] reset_password for ${email}: ${code}`); 
    }

    res.json({ message: 'If an account exists for that email, a reset code has been sent.' });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
};


export const resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: { message: 'Email, code, and new password are required' } });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: { message: 'Password must be at least 6 characters' } });
    }

    const otp = await Otp.findOne({ email, purpose: 'reset_password' });
    if (!otp) {
      return res.status(400).json({ error: { message: 'No reset code found. Please request a new one.' } });
    }
    if (otp.expiresAt < new Date()) {
      return res.status(400).json({ error: { message: 'Reset code has expired' } });
    }

    const ok = await bcrypt.compare(code, otp.codeHash);
    if (!ok) {
      return res.status(400).json({ error: { message: 'Invalid reset code' } });
    }

    // set the new password, consume the OTP
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await User.findOneAndUpdate({ email }, { passwordHash });
    await Otp.deleteMany({ email, purpose: 'reset_password' });

    res.json({ message: 'Password reset successfully. You can now log in.' });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
};

export const getMe = async (req, res) => {   
  res.json({ user: req.user });
};

export const refresh = async (req, res) => {

  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({ error: { message: 'Refresh token required' } });
    }


    const decoded = verifyToken(refreshToken, process.env.JWT_REFRESH_SECRET);
    const newAccessToken = signAccess({ id: decoded.id, role: decoded.role });

    res.json({ accessToken: newAccessToken });
  } catch (err) {
    console.log('VERIFY ERROR:', err.message);
    res.status(401).json({ error: { message: 'Invalid or expired refresh token' } });
  }
};


export const deactivateAccount = async (req, res) => {
  try {
    const { password, reason } = req.body;
    if (!password) {
      return res.status(400).json({ error: { message: "Password Confirmation is required" } });
    }
    const user = await User.findById(req.user._id);
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: { message: "Password is Incorrect" } });
    }

    user.status = "deactivated";
    user.statusReason = reason?.trim() || "Deactivated by user";  // fixed spelling + uses submitted reason
    user.statusChangedAt = new Date();                            // fixed spelling
    await user.save();

    res.json({ message: "Account deactivated Successfully" });
  } catch (error) {
    res.status(500).json({ error: { message: error.message } });
  }
};

export const updatePrivacySettings = async (req,res) => {
  try {
    const { hideFromSearch, hideActivity} = req.body;
    const user = await User.findById(req.user._id);
    if(hideFromSearch !== undefined) user.privacySettings.hideFromSearch = hideFromSearch;
    if(hideActivity !== undefined) user.privacySettings.hideActivity = hideActivity;
    await user.save();
    res.json({ privacySettings: user.privacySettings})
    
  } catch (error) {
    res.status(500).json({error:{message: error.message}})
    
  }
} 

export const getMyReferralInfo = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const referredUsers = await User.find({ referredBy: req.user._id }).select('name email role createdAt');

    res.json({
      referralCode: user.referralCode,
      referralLink: `${process.env.CLIENT_URL}/signup?ref=${user.referralCode}`,
      totalReferred: referredUsers.length,
      rewardsEarnedMinor: user.referralRewardsEarnedMinor || 0,
      referredUsers,
    });
  } catch (err) {
    res.status(500).json({ error: { message: err.message } });
  }
};


export const runInactiveAccountSweep = async () => {
  const settings = await PlatformSettings.getSettings();
  if (!settings.inactiveAccountAutoSuspendDays || settings.inactiveAccountAutoSuspendDays === 0) {
    return 0; 
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - settings.inactiveAccountAutoSuspendDays);

  const result = await User.updateMany(
    { status: 'pending', createdAt: { $lte: cutoff } },
    { status: 'deactivated', statusReason: 'Auto-suspended: never verified email', statusChangedAt: new Date() }
  );

  return result.modifiedCount;
};
