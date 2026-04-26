import { useEffect, useMemo, useRef, useState } from 'react';
import api from '../api/axiosClient';

export default function useDashboardProfile({ user, setUser, navigate }) {
  const [notifications, setNotifications] = useState([]);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileTab, setProfileTab] = useState('profile');
  const [profileDraft, setProfileDraft] = useState({
    name: '',
    email: '',
    studentId: '',
  });
  const [profileAvatarUrl, setProfileAvatarUrl] = useState('');
  const [profileNotice, setProfileNotice] = useState('');
  const [profileNoticeTone, setProfileNoticeTone] = useState('success');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileAvatarUploading, setProfileAvatarUploading] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordNotice, setPasswordNotice] = useState('');
  const [passwordNoticeTone, setPasswordNoticeTone] = useState('success');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorConfigured, setTwoFactorConfigured] = useState(false);
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
  const [twoFactorBusy, setTwoFactorBusy] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorSecret, setTwoFactorSecret] = useState('');
  const [twoFactorOtpAuthUri, setTwoFactorOtpAuthUri] = useState('');
  const [twoFactorNotice, setTwoFactorNotice] = useState('');
  const [twoFactorNoticeTone, setTwoFactorNoticeTone] = useState('success');
  const profileAvatarInputRef = useRef(null);

  useEffect(() => {
    if (!user) return;

    setProfileDraft({
      name: user.name || '',
      email: user.email || '',
      studentId: user.studentId || '',
    });

    api.get('/api/profile/me')
      .then((res) => res.data)
      .then((data) => {
        if (!data) return;

        setUser((prev) => {
          const normalized = {
            ...(prev || user),
            ...data,
            role: (data.role || prev?.role || user.role || '').toLowerCase(),
          };

          const hasChanged =
            (prev?.name || '') !== (normalized.name || '') ||
            (prev?.email || '') !== (normalized.email || '') ||
            (prev?.studentId || '') !== (normalized.studentId || '') ||
            (prev?.role || '') !== (normalized.role || '');

          if (hasChanged) {
            setProfileDraft({
              name: normalized.name || '',
              email: normalized.email || '',
              studentId: normalized.studentId || '',
            });
            localStorage.setItem('smartCampusUser', JSON.stringify(normalized));
            return normalized;
          }

          return prev;
        });
      })
      .catch(() => {});

    api.get('/api/profile/avatar', { responseType: 'blob' })
      .then((res) => res.data)
      .then((blob) => {
        if (blob && blob.size > 0) {
          const url = URL.createObjectURL(blob);
          setProfileAvatarUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return url;
          });
        }
      })
      .catch(() => {});

    api.get('/api/notifications/me')
      .then((res) => res.data || [])
      .then((data) => {
        if (Array.isArray(data)) {
          const sorted = [...data].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
          setNotifications(sorted);
        }
      })
      .catch((err) => console.error('Failed to fetch notifications', err));

    setTwoFactorLoading(true);
    api.get('/api/auth/2fa/status')
      .then((res) => res.data || {})
      .then((data) => {
        setTwoFactorEnabled(Boolean(data.enabled));
        setTwoFactorConfigured(Boolean(data.configured));
      })
      .catch(() => {
        setTwoFactorEnabled(false);
        setTwoFactorConfigured(false);
      })
      .finally(() => setTwoFactorLoading(false));
  }, [user, setUser]);

  useEffect(() => {
    return () => {
      setProfileAvatarUrl((prev) => {
        if (prev) {
          URL.revokeObjectURL(prev);
        }
        return '';
      });
    };
  }, []);

  const openProfile = () => {
    setProfileOpen(true);
    setProfileTab('profile');
    setProfileNotice('');
  };

  const selectProfileTab = (tab) => {
    setProfileTab(tab);
    setProfileNotice('');
  };

  const handleProfileDraft = (field, value) => {
    setProfileDraft((prev) => ({ ...prev, [field]: value }));
  };

  const saveProfileDraft = async () => {
    setProfileNotice('');
    setProfileSaving(true);

    try {
      const res = await api.put('/api/profile/me', {
        name: profileDraft.name,
        email: profileDraft.email,
        studentId: profileDraft.studentId,
      });

      const data = res.data;
      const normalizedUser = {
        ...user,
        ...(data.user || {}),
        role: (data.user?.role || user?.role || '').toLowerCase(),
      };

      setUser(normalizedUser);
      setProfileDraft({
        name: normalizedUser.name || '',
        email: normalizedUser.email || '',
        studentId: normalizedUser.studentId || '',
      });
      localStorage.setItem('smartCampusUser', JSON.stringify(normalizedUser));

      setProfileNoticeTone('success');
      setProfileNotice('Profile saved successfully.');
      setProfileTab('profile');
    } catch (err) {
      setProfileNoticeTone('error');
      setProfileNotice(err.response?.data?.error || 'Network error while saving profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  const resetProfileDraft = () => {
    setProfileDraft({
      name: user?.name || '',
      email: user?.email || '',
      studentId: user?.studentId || '',
    });
  };

  const triggerProfileAvatarPick = () => {
    profileAvatarInputRef.current?.click();
  };

  const handleProfileAvatarChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setProfileAvatarUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return previewUrl;
    });

    const formData = new FormData();
    formData.append('file', file);

    setProfileAvatarUploading(true);
    setProfileNotice('');
    try {
      await api.post('/api/profile/avatar', formData);
      setProfileNoticeTone('success');
      setProfileNotice('Profile photo updated successfully.');
    } catch (err) {
      setProfileNoticeTone('error');
      setProfileNotice(err.response?.data?.error || 'Network error while uploading profile photo.');
    } finally {
      setProfileAvatarUploading(false);
      event.target.value = '';
    }
  };

  const handlePasswordField = (field, value) => {
    setPasswordForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const passwordStrength = useMemo(() => {
    const value = String(passwordForm.newPassword || '');
    if (!value) {
      return { label: 'Weak', tone: '#b91c1c', score: 0 };
    }

    let score = 0;
    if (value.length >= 8) score += 1;
    if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score += 1;
    if (/\d/.test(value)) score += 1;
    if (/[^A-Za-z0-9]/.test(value)) score += 1;

    if (score >= 4) return { label: 'Strong', tone: '#166534', score };
    if (score >= 2) return { label: 'Medium', tone: '#b45309', score };
    return { label: 'Weak', tone: '#b91c1c', score };
  }, [passwordForm.newPassword]);

  const handleChangePassword = async () => {
    setPasswordNotice('');

    const currentPassword = String(passwordForm.currentPassword || '').trim();
    const newPassword = String(passwordForm.newPassword || '').trim();
    const confirmPassword = String(passwordForm.confirmPassword || '').trim();

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordNoticeTone('error');
      setPasswordNotice('Please fill in all password fields.');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordNoticeTone('error');
      setPasswordNotice('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordNoticeTone('error');
      setPasswordNotice('New password and confirm password must match.');
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordNoticeTone('error');
      setPasswordNotice('New password must be different from current password.');
      return;
    }

    setPasswordSaving(true);
    try {
      const res = await api.post('/api/auth/change-password', {
        currentPassword,
        newPassword,
        confirmPassword,
      });

      setPasswordNoticeTone('success');
      setPasswordNotice(res.data?.message || 'Password changed successfully.');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPasswordNoticeTone('error');
      setPasswordNotice(err.response?.data?.error || 'Could not change password. Please try again.');
    } finally {
      setPasswordSaving(false);
    }
  };

  const startTwoFactorSetup = async () => {
    setTwoFactorNotice('');
    setTwoFactorBusy(true);
    try {
      const res = await api.post('/api/auth/2fa/setup');
      const data = res.data || {};
      setTwoFactorEnabled(false);
      setTwoFactorConfigured(true);
      setTwoFactorSecret(data.secret || '');
      setTwoFactorOtpAuthUri(data.otpAuthUri || '');
      setTwoFactorNoticeTone('success');
      setTwoFactorNotice('Setup ready. Scan the QR code and confirm with a 6-digit code.');
    } catch (err) {
      setTwoFactorNoticeTone('error');
      setTwoFactorNotice(err.response?.data?.error || 'Could not start two-factor setup.');
    } finally {
      setTwoFactorBusy(false);
    }
  };

  const enableTwoFactor = async () => {
    const code = String(twoFactorCode || '').replace(/\s/g, '');
    if (!/^\d{6}$/.test(code)) {
      setTwoFactorNoticeTone('error');
      setTwoFactorNotice('Enter a valid 6-digit code from your authenticator app.');
      return;
    }

    setTwoFactorNotice('');
    setTwoFactorBusy(true);
    try {
      await api.post('/api/auth/2fa/enable', { code });
      setTwoFactorEnabled(true);
      setTwoFactorConfigured(true);
      setTwoFactorSecret('');
      setTwoFactorOtpAuthUri('');
      setTwoFactorCode('');

      setUser((prev) => {
        const next = { ...(prev || {}), twoFactorEnabled: true };
        localStorage.setItem('smartCampusUser', JSON.stringify(next));
        return next;
      });

      setTwoFactorNoticeTone('success');
      setTwoFactorNotice('Two-factor authentication is now enabled.');
    } catch (err) {
      setTwoFactorNoticeTone('error');
      setTwoFactorNotice(err.response?.data?.error || 'Could not enable two-factor authentication.');
    } finally {
      setTwoFactorBusy(false);
    }
  };

  const disableTwoFactor = async () => {
    const code = String(twoFactorCode || '').replace(/\s/g, '');
    if (!/^\d{6}$/.test(code)) {
      setTwoFactorNoticeTone('error');
      setTwoFactorNotice('Enter your current 6-digit authenticator code to disable 2FA.');
      return;
    }

    setTwoFactorNotice('');
    setTwoFactorBusy(true);
    try {
      await api.post('/api/auth/2fa/disable', { code });
      setTwoFactorEnabled(false);
      setTwoFactorConfigured(false);
      setTwoFactorSecret('');
      setTwoFactorOtpAuthUri('');
      setTwoFactorCode('');

      setUser((prev) => {
        const next = { ...(prev || {}), twoFactorEnabled: false };
        localStorage.setItem('smartCampusUser', JSON.stringify(next));
        return next;
      });

      setTwoFactorNoticeTone('success');
      setTwoFactorNotice('Two-factor authentication has been disabled.');
    } catch (err) {
      setTwoFactorNoticeTone('error');
      setTwoFactorNotice(err.response?.data?.error || 'Could not disable two-factor authentication.');
    } finally {
      setTwoFactorBusy(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('/api/auth/logout', null, { skipAuthRefresh: true });
    } catch (err) {
      // Continue with client-side logout even if network fails.
    }
    localStorage.removeItem('smartCampusUser');
    navigate('/login');
  };

  return {
    notifications,
    profileOpen,
    setProfileOpen,
    profileTab,
    profileDraft,
    profileAvatarUrl,
    profileNotice,
    profileNoticeTone,
    profileSaving,
    profileAvatarUploading,
    passwordForm,
    passwordSaving,
    passwordNotice,
    passwordNoticeTone,
    twoFactorEnabled,
    twoFactorConfigured,
    twoFactorLoading,
    twoFactorBusy,
    twoFactorCode,
    twoFactorSecret,
    twoFactorOtpAuthUri,
    twoFactorNotice,
    twoFactorNoticeTone,
    profileAvatarInputRef,
    passwordStrength,
    openProfile,
    selectProfileTab,
    handleProfileDraft,
    saveProfileDraft,
    resetProfileDraft,
    triggerProfileAvatarPick,
    handleProfileAvatarChange,
    handlePasswordField,
    handleChangePassword,
    setTwoFactorCode,
    startTwoFactorSetup,
    enableTwoFactor,
    disableTwoFactor,
    handleLogout,
  };
}
