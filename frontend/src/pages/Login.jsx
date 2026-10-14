import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Sparkles,
  Bot,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { useAuth, formatAuthError } from '../context/AuthContext';
import { validatePassword, validateEmail } from '../utils/passwordValidation';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
    resetPassword,
    isConfigured,
    missingConfigError
  } = useAuth();

  // Mode: 'login' | 'signup' | 'forgot'
  const [mode, setMode] = useState('login');

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Status & Feedback States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Compute live password validation checks for registration
  const passwordValidation = validatePassword(password);

  const redirectToDestination = () => {
    const destination = location.state?.from?.pathname || '/';
    navigate(destination, { replace: true });
  };

  // Handle Email / Password Login
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const emailCheck = validateEmail(email);
    if (!emailCheck.isValid) {
      setError(emailCheck.error);
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      await loginWithEmail(emailCheck.sanitizedEmail, password);
      redirectToDestination();
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  // Handle Email / Password Registration
  const handleEmailRegister = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const emailCheck = validateEmail(email);
    if (!emailCheck.isValid) {
      setError(emailCheck.error);
      return;
    }

    if (!passwordValidation.isValid) {
      setError('Please satisfy all password complexity requirements before continuing.');
      return;
    }

    setLoading(true);
    try {
      await registerWithEmail(emailCheck.sanitizedEmail, password, name);
      redirectToDestination();
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  // Handle Google OAuth Sign In
  const handleGoogleSignIn = async () => {
    setError(null);
    setSuccessMessage(null);
    setLoading(true);
    try {
      await loginWithGoogle();
      redirectToDestination();
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  // Handle Password Reset
  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const emailCheck = validateEmail(email);
    if (!emailCheck.isValid) {
      setError(emailCheck.error);
      return;
    }

    setLoading(true);
    try {
      await resetPassword(emailCheck.sanitizedEmail);
      setSuccessMessage(`Password reset link sent to ${emailCheck.sanitizedEmail}. Please check your inbox.`);
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      {/* Soft ambient background glow */}
      <div className="auth-ambient-glow" />

      <div className="auth-card">
        {/* Brand Header */}
        <div className="auth-brand">
          <div className="auth-brand-logo">
            <Bot size={22} />
          </div>
          <span className="auth-brand-title">Negotiator AI</span>
        </div>

        {/* Dynamic Headings */}
        {mode === 'login' && (
          <>
            <h1 className="auth-heading">Welcome Back</h1>
            <div className="auth-subbadge">
              <Sparkles size={13} />
              <span>Sign in to continue</span>
            </div>
          </>
        )}

        {mode === 'signup' && (
          <>
            <h1 className="auth-heading">Create Account</h1>
            <div className="auth-subbadge">
              <Sparkles size={13} />
              <span>Join AI Negotiation Arena</span>
            </div>
          </>
        )}

        {mode === 'forgot' && (
          <>
            <h1 className="auth-heading">Reset Password</h1>
            <div className="auth-subbadge">
              <ShieldCheck size={13} />
              <span>Recover your account</span>
            </div>
          </>
        )}

        {/* Tab Switcher (Visible on login & signup) */}
        {mode !== 'forgot' && (
          <div className="auth-tabs">
            <button
              type="button"
              className={`auth-tab-btn ${mode === 'login' ? 'active' : ''}`}
              onClick={() => {
                setMode('login');
                setError(null);
                setSuccessMessage(null);
              }}
            >
              Login
            </button>
            <button
              type="button"
              className={`auth-tab-btn ${mode === 'signup' ? 'active' : ''}`}
              onClick={() => {
                setMode('signup');
                setError(null);
                setSuccessMessage(null);
              }}
            >
              Sign Up
            </button>
          </div>
        )}

        {/* Firebase Configuration Warning Banner (if credentials not yet in .env) */}
        {!isConfigured && (
          <div className="auth-config-warning">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, marginBottom: '4px' }}>
              <AlertTriangle size={15} />
              <span>Firebase Credentials Required</span>
            </div>
            <div>
              Authentication is ready. Add your Firebase keys in <code>frontend/.env</code> to connect to your project.
            </div>
          </div>
        )}

        {/* Feedback Banners */}
        {error && (
          <div className="auth-error-banner" role="alert">
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="auth-success-banner" role="status">
            <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* LOGIN FORM */}
        {mode === 'login' && (
          <form className="auth-form" onSubmit={handleEmailLogin}>
            <div className="auth-field-group">
              <div className="auth-input-wrapper">
                <Mail size={17} className="auth-input-icon-left" />
                <input
                  type="email"
                  className="auth-input"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="auth-field-group">
              <div className="auth-input-wrapper">
                <Lock size={17} className="auth-input-icon-left" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="auth-input"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="auth-input-toggle-right"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="button"
              className="auth-forgot-link"
              onClick={() => {
                setMode('forgot');
                setError(null);
                setSuccessMessage(null);
              }}
            >
              Forgot Password?
            </button>

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="auth-spinner" />
                  <span>Signing In...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>

            {/* Google Authentication */}
            <div className="auth-divider">
              <span>or continue with</span>
            </div>

            <button
              type="button"
              className="auth-google-btn"
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              {/* Google Brand SVG */}
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="auth-switch-text">
              Don't have an account?{' '}
              <button
                type="button"
                className="auth-switch-btn"
                onClick={() => {
                  setMode('signup');
                  setError(null);
                  setSuccessMessage(null);
                }}
              >
                Sign Up
              </button>
            </div>
          </form>
        )}

        {/* SIGN UP FORM */}
        {mode === 'signup' && (
          <form className="auth-form" onSubmit={handleEmailRegister}>
            <div className="auth-field-group">
              <div className="auth-input-wrapper">
                <User size={17} className="auth-input-icon-left" />
                <input
                  type="text"
                  className="auth-input"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                />
              </div>
            </div>

            <div className="auth-field-group">
              <div className="auth-input-wrapper">
                <Mail size={17} className="auth-input-icon-left" />
                <input
                  type="email"
                  className="auth-input"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="auth-field-group">
              <div className="auth-input-wrapper">
                <Lock size={17} className="auth-input-icon-left" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="auth-input"
                  placeholder="Create Password (min 8 chars)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  className="auth-input-toggle-right"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Live Password Complexity Checklist */}
            {password.length > 0 && (
              <div className="password-requirements-card">
                <div className="req-header">Password Requirements</div>
                <div className={`req-item ${passwordValidation.checks.minLength ? 'met' : ''}`}>
                  {passwordValidation.checks.minLength ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                  <span>At least 8 characters long</span>
                </div>
                <div className={`req-item ${passwordValidation.checks.hasUpper ? 'met' : ''}`}>
                  {passwordValidation.checks.hasUpper ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                  <span>At least one uppercase letter (A–Z)</span>
                </div>
                <div className={`req-item ${passwordValidation.checks.hasLower ? 'met' : ''}`}>
                  {passwordValidation.checks.hasLower ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                  <span>At least one lowercase letter (a–z)</span>
                </div>
                <div className={`req-item ${passwordValidation.checks.hasNumber ? 'met' : ''}`}>
                  {passwordValidation.checks.hasNumber ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                  <span>At least one number (0–9)</span>
                </div>
                <div className={`req-item ${passwordValidation.checks.hasSpecial ? 'met' : ''}`}>
                  {passwordValidation.checks.hasSpecial ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                  <span>At least one special character (@, #, $, %, !)</span>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="auth-spinner" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <span>Create Account</span>
              )}
            </button>

            {/* Google Authentication */}
            <div className="auth-divider">
              <span>or sign up with</span>
            </div>

            <button
              type="button"
              className="auth-google-btn"
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="auth-switch-text">
              Already have an account?{' '}
              <button
                type="button"
                className="auth-switch-btn"
                onClick={() => {
                  setMode('login');
                  setError(null);
                  setSuccessMessage(null);
                }}
              >
                Sign In
              </button>
            </div>
          </form>
        )}

        {/* FORGOT PASSWORD FORM */}
        {mode === 'forgot' && (
          <form className="auth-form" onSubmit={handlePasswordReset}>
            <p style={{ fontSize: '0.88rem', color: '#64748b', textAlign: 'center', margin: '-8px 0 16px 0', lineHeight: 1.5 }}>
              Enter your registered email address and we will send you a secure link to reset your password.
            </p>

            <div className="auth-field-group">
              <div className="auth-input-wrapper">
                <Mail size={17} className="auth-input-icon-left" />
                <input
                  type="email"
                  className="auth-input"
                  placeholder="Registered Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="auth-spinner" />
                  <span>Sending Link...</span>
                </>
              ) : (
                <span>Send Reset Link</span>
              )}
            </button>

            <button
              type="button"
              className="auth-google-btn"
              style={{ marginTop: '8px' }}
              onClick={() => {
                setMode('login');
                setError(null);
                setSuccessMessage(null);
              }}
            >
              <ArrowLeft size={16} />
              <span>Back to Sign In</span>
            </button>
          </form>
        )}

        {/* Security badge at bottom */}
        <div className="auth-footer-badge">
          <ShieldCheck size={14} />
          <span>Secured with encrypted authentication</span>
        </div>
      </div>
    </div>
  );
};

export default Login;
