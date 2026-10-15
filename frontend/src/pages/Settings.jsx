import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  Sliders,
  Palette,
  Globe,
  Trash2,
  Upload,
  Lock,
  Sun,
  Moon,
  Monitor,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  Save,
  RotateCcw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings, PROFILE_KEY } from '../context/SettingsContext';
import { getTranslation } from '../utils/translations';
import './Settings.css';

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hindi (हिन्दी)' },
  { value: 'bn', label: 'Bengali (বাংলা)' },
  { value: 'te', label: 'Telugu (తెలుగు)' },
  { value: 'ta', label: 'Tamil (தமிழ்)' },
  { value: 'mr', label: 'Marathi (मराठी)' },
];

const Settings = () => {
  const navigate = useNavigate();
  const { currentUser, updateUserProfile, deleteUserAccount, logout } = useAuth();
  const { settings, saveSettings, resetSettings, t } = useSettings();

  // Active section tab: 'profile' | 'preferences' | 'appearance' | 'language'
  const [activeTab, setActiveTab] = useState('profile');

  // File input ref for avatar upload
  const fileInputRef = useRef(null);

  // Profile Form State
  const [profileData, setProfileData] = useState(() => {
    // 1. Try local storage profile cache
    try {
      const cached = localStorage.getItem(PROFILE_KEY);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      console.warn('Failed to load profile from localStorage:', e);
    }

    // 2. Default to authenticated user data or clean placeholders
    const nameParts = (currentUser?.displayName || 'Team Lead').trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    return {
      firstName,
      lastName,
      email: currentUser?.email || 'lead@simulator.ai',
      avatarUrl: currentUser?.photoURL || '',
    };
  });

  // Track original profile data to support Cancel
  const [initialProfileData, setInitialProfileData] = useState(profileData);
  const [firstNameError, setFirstNameError] = useState('');

  // Preferences Form State (Draft)
  const [preferencesDraft, setPreferencesDraft] = useState(settings.preferences);
  const [initialPreferences, setInitialPreferences] = useState(settings.preferences);

  // Appearance Form State (Draft)
  const [appearanceDraft, setAppearanceDraft] = useState(settings.appearance);
  const [initialAppearance, setInitialAppearance] = useState(settings.appearance);

  // Language Form State (Draft)
  const [languageDraft, setLanguageDraft] = useState(settings.language || 'en');
  const [initialLanguage, setInitialLanguage] = useState(settings.language || 'en');

  // Modals & Feedback
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toast, setToast] = useState(null); // { message: string, type: 'success' | 'error' }

  // Sync with auth user on mount or user change
  useEffect(() => {
    if (currentUser) {
      setProfileData((prev) => {
        // If local storage has customizations, keep them; otherwise populate from auth
        const nameParts = (currentUser.displayName || '').trim().split(' ');
        const fn = prev.firstName || nameParts[0] || 'Team';
        const ln = prev.lastName || nameParts.slice(1).join(' ') || 'Lead';
        const updated = {
          ...prev,
          firstName: fn,
          lastName: ln,
          email: currentUser.email || prev.email,
          avatarUrl: prev.avatarUrl || currentUser.photoURL || '',
        };
        setInitialProfileData(updated);
        return updated;
      });
    }
  }, [currentUser]);

  // Sync settings when external changes occur
  useEffect(() => {
    setPreferencesDraft(settings.preferences);
    setInitialPreferences(settings.preferences);
    setAppearanceDraft(settings.appearance);
    setInitialAppearance(settings.appearance);
    setLanguageDraft(settings.language || 'en');
    setInitialLanguage(settings.language || 'en');
  }, [settings]);

  // Close delete modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showDeleteModal && !deleteLoading) {
        setShowDeleteModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showDeleteModal, deleteLoading]);

  // Toast Helper
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Avatar Initials Helper
  const getInitials = () => {
    const fn = (profileData.firstName || '').trim();
    const ln = (profileData.lastName || '').trim();
    if (fn && ln) return (fn[0] + ln[0]).toUpperCase();
    if (fn) return fn.slice(0, 2).toUpperCase();
    return 'TL';
  };

  // ==========================================================================
  // Profile Picture Upload & Validation
  // ==========================================================================
  const handleAvatarFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate File Type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      showToast('Invalid file format. Please upload a JPG, PNG, or WEBP image.', 'error');
      return;
    }

    // Validate File Size (Max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      showToast('File size exceeds 5MB limit. Please select a smaller image.', 'error');
      return;
    }

    // Read and convert to Data URL
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result;
      if (typeof dataUrl === 'string') {
        setProfileData((prev) => ({ ...prev, avatarUrl: dataUrl }));
        showToast('Profile picture loaded. Click Save Changes to apply.');
      }
    };
    reader.onerror = () => {
      showToast('Failed to read image file.', 'error');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setProfileData((prev) => ({ ...prev, avatarUrl: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    showToast('Profile picture removed. Click Save Changes to apply.');
  };

  // ==========================================================================
  // Profile Actions: Save & Cancel
  // ==========================================================================
  const handleSaveProfile = async () => {
    const trimmedFirst = profileData.firstName.trim();
    if (!trimmedFirst) {
      setFirstNameError('First name is required.');
      showToast('Please provide your first name.', 'error');
      return;
    }
    setFirstNameError('');

    const fullName = `${trimmedFirst} ${profileData.lastName.trim()}`.trim();

    // 1. Save to LocalStorage
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profileData));
    } catch (err) {
      console.warn('Failed to save profile locally:', err);
    }

    // 2. Update Firebase Auth Profile if available
    try {
      if (updateUserProfile) {
        await updateUserProfile({
          displayName: fullName,
          photoURL: profileData.avatarUrl || null,
        });
      }
    } catch (authErr) {
      console.warn('Firebase profile update warning:', authErr);
    }

    setInitialProfileData(profileData);
    showToast(t('profileUpdated'));
  };

  const handleCancelProfile = () => {
    setProfileData(initialProfileData);
    setFirstNameError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    showToast('Profile edits discarded.', 'info');
  };

  // ==========================================================================
  // Preferences Actions: Save & Cancel
  // ==========================================================================
  const handleSavePreferences = () => {
    saveSettings({
      ...settings,
      preferences: preferencesDraft,
    });
    setInitialPreferences(preferencesDraft);
    showToast(t('preferencesSaved'));
  };

  const handleCancelPreferences = () => {
    setPreferencesDraft(initialPreferences);
    showToast('Preference changes cancelled.', 'info');
  };

  // ==========================================================================
  // Appearance Actions: Save & Cancel
  // ==========================================================================
  const handleThemeSelect = (themeValue) => {
    setAppearanceDraft((prev) => ({ ...prev, theme: themeValue }));
    // Live preview
    let effective = themeValue;
    if (themeValue === 'system') {
      effective = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', effective);
  };

  const handleSaveAppearance = () => {
    saveSettings({
      ...settings,
      appearance: appearanceDraft,
    });
    setInitialAppearance(appearanceDraft);
    showToast(t('appearanceSaved'));
  };

  const handleCancelAppearance = () => {
    setAppearanceDraft(initialAppearance);
    // Restore live DOM theme
    let effective = initialAppearance.theme;
    if (effective === 'system') {
      effective = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', effective);
    showToast('Appearance edits discarded.', 'info');
  };

  // ==========================================================================
  // Language Actions: Save & Cancel
  // ==========================================================================
  const handleSaveLanguage = () => {
    saveSettings({
      ...settings,
      language: languageDraft,
    });
    setInitialLanguage(languageDraft);
    showToast(getTranslation(languageDraft, 'languageSaved'));
  };

  const handleCancelLanguage = () => {
    setLanguageDraft(initialLanguage);
    saveSettings({
      ...settings,
      language: initialLanguage,
    });
    showToast('Language change cancelled.', 'info');
  };

  // ==========================================================================
  // Delete Account Handling
  // ==========================================================================
  const handleConfirmDeleteAccount = async () => {
    setDeleteLoading(true);
    try {
      // 1. If Firebase Auth is connected, attempt remote user deletion
      if (deleteUserAccount && currentUser) {
        await deleteUserAccount();
      }

      // 2. Clear local profile and settings
      localStorage.removeItem(PROFILE_KEY);
      localStorage.removeItem('negotiator_settings');
      localStorage.removeItem('theme');

      setShowDeleteModal(false);
      showToast('Account data removed. Redirecting to login...');
      setTimeout(() => {
        if (logout) logout();
        navigate('/login');
      }, 1200);
    } catch (err) {
      console.error('Account deletion error:', err);
      setShowDeleteModal(false);
      if (err.code === 'auth/requires-recent-login') {
        showToast(
          'Security check: Account deletion requires recent authentication. Please sign out and sign in again before deleting.',
          'error'
        );
      } else {
        showToast(err.message || 'Failed to delete account. Please try again.', 'error');
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  const displayName = `${profileData.firstName} ${profileData.lastName}`.trim() || 'Team Lead';

  return (
    <div className="profile-settings-container">
      {/* Toast Notification */}
      {toast && (
        <div className={`profile-toast ${toast.type === 'error' ? 'toast-error' : ''}`}>
          {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* ===================================================================
          Left Navigation Panel (Inspired by Reference Image)
          =================================================================== */}
      <aside className="profile-nav-panel">
        <div className="profile-user-summary">
          <div className="profile-avatar-large-wrapper">
            {profileData.avatarUrl ? (
              <img
                src={profileData.avatarUrl}
                alt={displayName}
                className="profile-avatar-large"
              />
            ) : (
              <div className="profile-avatar-large">{getInitials()}</div>
            )}
            <span className="profile-online-badge" title="Online" />
          </div>

          <h3 className="profile-user-fullname">{displayName}</h3>
          <span className="profile-user-email" title={profileData.email}>
            {profileData.email}
          </span>
        </div>

        {/* Section Navigation Links */}
        <nav className="profile-nav-menu" aria-label="Profile and Settings Sections">
          <button
            type="button"
            className={`profile-nav-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <User size={18} className="profile-nav-icon" />
            <span>{t('profile')}</span>
          </button>

          <button
            type="button"
            className={`profile-nav-btn ${activeTab === 'preferences' ? 'active' : ''}`}
            onClick={() => setActiveTab('preferences')}
          >
            <Sliders size={18} className="profile-nav-icon" />
            <span>{t('preferences')}</span>
          </button>

          <button
            type="button"
            className={`profile-nav-btn ${activeTab === 'appearance' ? 'active' : ''}`}
            onClick={() => setActiveTab('appearance')}
          >
            <Palette size={18} className="profile-nav-icon" />
            <span>{t('appearance')}</span>
          </button>

          <button
            type="button"
            className={`profile-nav-btn ${activeTab === 'language' ? 'active' : ''}`}
            onClick={() => setActiveTab('language')}
          >
            <Globe size={18} className="profile-nav-icon" />
            <span>{t('language')}</span>
          </button>
        </nav>

        {/* Clearly Styled Delete Account Option at Bottom of Sidebar */}
        <div className="profile-nav-footer">
          <button
            type="button"
            className="profile-delete-btn"
            onClick={() => setShowDeleteModal(true)}
            title="Permanently remove your account"
          >
            <Trash2 size={16} />
            <span>{t('deleteAccount')}</span>
          </button>
        </div>
      </aside>

      {/* ===================================================================
          Right Content Panel (Displays Active Section)
          =================================================================== */}
      <main className="profile-content-panel">
        {/* =================================================================
            TAB 1: Profile Information
            ================================================================= */}
        {activeTab === 'profile' && (
          <>
            <div className="profile-section-header">
              <h2 className="profile-section-title">{t('profileInfo')}</h2>
              <p className="profile-section-desc">
                {t('profileDesc')}
              </p>
            </div>

            {/* Profile Picture Upload & Preview */}
            <div className="profile-picture-section">
              {profileData.avatarUrl ? (
                <img
                  src={profileData.avatarUrl}
                  alt={displayName}
                  className="picture-preview-avatar"
                />
              ) : (
                <div className="picture-preview-avatar">{getInitials()}</div>
              )}

              <div className="picture-upload-actions">
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleAvatarFileSelect}
                />

                <div className="picture-buttons-row">
                  <button
                    type="button"
                    className="btn-upload-avatar"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload size={14} />
                    <span>{t('uploadPic')}</span>
                  </button>

                  {profileData.avatarUrl && (
                    <button
                      type="button"
                      className="btn-remove-avatar"
                      onClick={handleRemoveAvatar}
                    >
                      <Trash2 size={13} />
                      <span>{t('removePic')}</span>
                    </button>
                  )}
                </div>

                <span className="picture-upload-hint">
                  {t('uploadHint')}
                </span>
              </div>
            </div>

            {/* Form Fields: First Name, Last Name, Email (Bio Removed) */}
            <div className="profile-form-grid">
              <div className="profile-input-row">
                {/* First Name */}
                <div className="profile-field-group">
                  <label htmlFor="profile-first-name" className="profile-field-label">
                    {t('firstName')} <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    id="profile-first-name"
                    type="text"
                    className="profile-input"
                    value={profileData.firstName}
                    placeholder="e.g. Shubhay"
                    onChange={(e) => {
                      setProfileData((prev) => ({ ...prev, firstName: e.target.value }));
                      if (e.target.value.trim()) setFirstNameError('');
                    }}
                  />
                  {firstNameError && <span className="profile-error-msg">{firstNameError}</span>}
                </div>

                {/* Last Name */}
                <div className="profile-field-group">
                  <label htmlFor="profile-last-name" className="profile-field-label">
                    {t('lastName')}
                  </label>
                  <input
                    id="profile-last-name"
                    type="text"
                    className="profile-input"
                    value={profileData.lastName}
                    placeholder="e.g. Yadav"
                    onChange={(e) =>
                      setProfileData((prev) => ({ ...prev, lastName: e.target.value }))
                    }
                  />
                </div>
              </div>

              {/* Email Address (Read-Only) */}
              <div className="profile-field-group">
                <label htmlFor="profile-email" className="profile-field-label">
                  <span>{t('emailAddress')}</span>
                  <span className="profile-field-badge">
                    <Lock size={11} /> {t('readOnlyBadge')}
                  </span>
                </label>
                <input
                  id="profile-email"
                  type="email"
                  className="profile-input"
                  value={profileData.email}
                  disabled
                />
              </div>
            </div>

            {/* Profile Action Buttons */}
            <div className="profile-actions-bar">
              <button
                type="button"
                className="btn-profile-cancel"
                onClick={handleCancelProfile}
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                className="btn-profile-save"
                onClick={handleSaveProfile}
              >
                <Save size={15} />
                <span>{t('saveChanges')}</span>
              </button>
            </div>
          </>
        )}

        {/* =================================================================
            TAB 2: Preferences (Only Two Settings: Workspace State & Drafts)
            ================================================================= */}
        {activeTab === 'preferences' && (
          <>
            <div className="profile-section-header">
              <h2 className="profile-section-title">{t('appPreferences')}</h2>
              <p className="profile-section-desc">
                {t('appPreferencesDesc')}
              </p>
            </div>

            <div className="pref-toggle-list">
              {/* 1. Remember Workspace State */}
              <div className="pref-toggle-card">
                <div className="pref-toggle-details">
                  <span className="pref-toggle-title">{t('rememberWorkspaceTitle')}</span>
                  <span className="pref-toggle-desc">
                    {t('rememberWorkspaceDesc')}
                  </span>
                </div>
                <label className="pref-switch">
                  <input
                    type="checkbox"
                    checked={!!preferencesDraft.rememberWorkspace}
                    onChange={(e) =>
                      setPreferencesDraft((prev) => ({
                        ...prev,
                        rememberWorkspace: e.target.checked,
                      }))
                    }
                  />
                  <span className="pref-slider" />
                </label>
              </div>

              {/* 2. Auto-Save Simulation Drafts */}
              <div className="pref-toggle-card">
                <div className="pref-toggle-details">
                  <span className="pref-toggle-title">{t('autoSaveDraftsTitle')}</span>
                  <span className="pref-toggle-desc">
                    {t('autoSaveDraftsDesc')}
                  </span>
                </div>
                <label className="pref-switch">
                  <input
                    type="checkbox"
                    checked={!!preferencesDraft.autoSaveDrafts}
                    onChange={(e) =>
                      setPreferencesDraft((prev) => ({
                        ...prev,
                        autoSaveDrafts: e.target.checked,
                      }))
                    }
                  />
                  <span className="pref-slider" />
                </label>
              </div>
            </div>

            {/* Preferences Action Buttons */}
            <div className="profile-actions-bar">
              <button
                type="button"
                className="btn-profile-cancel"
                onClick={handleCancelPreferences}
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                className="btn-profile-save"
                onClick={handleSavePreferences}
              >
                <Save size={15} />
                <span>{t('saveChanges')}</span>
              </button>
            </div>
          </>
        )}

        {/* =================================================================
            TAB 3: Appearance (Vivid Light, Dark, and System Default)
            ================================================================= */}
        {activeTab === 'appearance' && (
          <>
            <div className="profile-section-header">
              <h2 className="profile-section-title">{t('appearanceTitle')}</h2>
              <p className="profile-section-desc">
                {t('appearanceDesc')}
              </p>
            </div>

            {/* Theme Selector */}
            <div className="profile-field-group">
              <label className="profile-field-label">{t('interfaceTheme')}</label>
              <div className="theme-selector-grid">
                {/* Light */}
                <div
                  className={`theme-card-option ${
                    appearanceDraft.theme === 'light' ? 'active' : ''
                  }`}
                  onClick={() => handleThemeSelect('light')}
                >
                  <div className="theme-card-preview theme-preview-light">
                    <div className="preview-side" />
                    <div className="preview-body">
                      <div className="preview-line" style={{ width: '60%' }} />
                      <div className="preview-line" style={{ width: '80%' }} />
                    </div>
                  </div>
                  <div className="theme-card-label">
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Sun size={15} style={{ color: '#f59e0b' }} />
                      {t('light')}
                    </span>
                    {appearanceDraft.theme === 'light' && <div className="theme-card-dot" />}
                  </div>
                </div>

                {/* Dark */}
                <div
                  className={`theme-card-option ${
                    appearanceDraft.theme === 'dark' ? 'active' : ''
                  }`}
                  onClick={() => handleThemeSelect('dark')}
                >
                  <div className="theme-card-preview theme-preview-dark">
                    <div className="preview-side" />
                    <div className="preview-body">
                      <div className="preview-line" style={{ width: '60%' }} />
                      <div className="preview-line" style={{ width: '80%' }} />
                    </div>
                  </div>
                  <div className="theme-card-label">
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Moon size={15} style={{ color: '#818cf8' }} />
                      {t('dark')}
                    </span>
                    {appearanceDraft.theme === 'dark' && <div className="theme-card-dot" />}
                  </div>
                </div>

                {/* System Default */}
                <div
                  className={`theme-card-option ${
                    appearanceDraft.theme === 'system' ? 'active' : ''
                  }`}
                  onClick={() => handleThemeSelect('system')}
                >
                  <div className="theme-card-preview theme-preview-system">
                    <div className="theme-preview-system-half-light">
                      <div className="preview-side" />
                      <div className="preview-body">
                        <div className="preview-line" style={{ width: '60%' }} />
                        <div className="preview-line" style={{ width: '80%' }} />
                      </div>
                    </div>
                    <div className="theme-preview-system-half-dark">
                      <div className="preview-side" />
                      <div className="preview-body">
                        <div className="preview-line" style={{ width: '60%' }} />
                        <div className="preview-line" style={{ width: '80%' }} />
                      </div>
                    </div>
                  </div>
                  <div className="theme-card-label">
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Monitor size={15} style={{ color: 'var(--text-muted)' }} />
                      {t('systemDefault')}
                    </span>
                    {appearanceDraft.theme === 'system' && <div className="theme-card-dot" />}
                  </div>
                </div>
              </div>
            </div>

            {/* Appearance Action Buttons */}
            <div className="profile-actions-bar">
              <button
                type="button"
                className="btn-profile-cancel"
                onClick={handleCancelAppearance}
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                className="btn-profile-save"
                onClick={handleSaveAppearance}
              >
                <Save size={15} />
                <span>{t('saveChanges')}</span>
              </button>
            </div>
          </>
        )}

        {/* =================================================================
            TAB 4: Language (Exact 6 Options, Immediate Working Translations)
            ================================================================= */}
        {activeTab === 'language' && (
          <>
            <div className="profile-section-header">
              <h2 className="profile-section-title">{t('languageTitle')}</h2>
              <p className="profile-section-desc">
                {t('languageDesc')}
              </p>
            </div>

            <div className="language-form-box">
              <div className="profile-field-group">
                <label htmlFor="settings-language-select" className="profile-field-label">
                  {t('interfaceLanguage')}
                </label>
                <select
                  id="settings-language-select"
                  className="profile-select"
                  value={languageDraft}
                  onChange={(e) => {
                    const newLang = e.target.value;
                    setLanguageDraft(newLang);
                    saveSettings({
                      ...settings,
                      language: newLang,
                    });
                    setInitialLanguage(newLang);
                    showToast(getTranslation(newLang, 'languageSaved'));
                  }}
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang.value} value={lang.value}>
                      {lang.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </>
        )}
      </main>

      {/* ===================================================================
          Delete Account Confirmation Pop-up Modal
          =================================================================== */}
      {showDeleteModal && (
        <div
          className="profile-modal-backdrop"
          onClick={() => !deleteLoading && setShowDeleteModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
        >
          <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="profile-modal-icon-badge">
              <AlertTriangle size={30} />
            </div>

            <h3 id="delete-dialog-title">{t('deleteModalTitle')}</h3>
            <p className="profile-modal-subtitle">
              {t('deleteModalSubtitle')} (<strong>{profileData.email}</strong>)?
            </p>

            <div className="profile-modal-warning-box">
              <p>
                {t('deleteModalWarning')}
              </p>
            </div>

            <div className="profile-modal-actions">
              <button
                type="button"
                className="btn-modal-back"
                disabled={deleteLoading}
                onClick={() => setShowDeleteModal(false)}
              >
                {t('cancel')}
              </button>

              <button
                type="button"
                className="btn-modal-danger"
                disabled={deleteLoading}
                onClick={handleConfirmDeleteAccount}
              >
                {deleteLoading ? (
                  <span>{t('deletingAccount')}</span>
                ) : (
                  <>
                    <Trash2 size={15} />
                    <span>{t('yesDelete')}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
