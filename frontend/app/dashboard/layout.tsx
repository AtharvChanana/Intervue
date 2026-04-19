"use client";

import Link from 'next/link';
import { fetchApi } from '@/lib/api';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import Logo from '@/components/Logo';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const isSessionActive = pathname.includes('/session/');
  const [systemToast, setSystemToast] = useState<{title: string, message: string, isError: boolean} | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [navAlertMessage, setNavAlertMessage] = useState("");
  const [roles, setRoles] = useState<any[]>([]);
  const [selectedRole, setSelectedRole] = useState(1);
  const [difficulty, setDifficulty] = useState('MEDIUM');
  const [type, setType] = useState('TECHNICAL');
  const [numQuestions, setNumQuestions] = useState(5);
  const [isStarting, setIsStarting] = useState(false);

  // Profile Modal State
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileAge, setProfileAge] = useState<number | ''>('');
  const [profileJobRole, setProfileJobRole] = useState('');
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [isUpdatingProfileImage, setIsUpdatingProfileImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Settings Modal (General)
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsName, setSettingsName] = useState("");

  const [showDeleteModal1, setShowDeleteModal1] = useState(false);
  const [showDeleteModal2, setShowDeleteModal2] = useState(false);
  const [deleteAccountPassword, setDeleteAccountPassword] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const [showNotifications, setShowNotifications] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Email Verification & Update State
  const [showVerifyOtpModal, setShowVerifyOtpModal] = useState(false);
  const [verifyOtpCode, setVerifyOtpCode] = useState("");
  const [showUpdateEmailOtpModal, setShowUpdateEmailOtpModal] = useState(false);
  const [updateEmailOtpCode, setUpdateEmailOtpCode] = useState("");
  const [newEmailInput, setNewEmailInput] = useState("");
  const [showEmailUpdateForm, setShowEmailUpdateForm] = useState(false);
  const [isProcessingOTP, setIsProcessingOTP] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState<{id: string, message: string, time: string, read: boolean}[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCountdown > 0) {
      timer = setTimeout(() => setResendCountdown(c => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  useEffect(() => {
    let storageKey = 'notifications_default';

    fetchApi('/user/profile')
      .then(user => {
        if (user.role === 'ADMIN') {
           router.replace('/admin');
           return;
        }
        setUserProfile(user);
        if (user.age) setProfileAge(user.age);
        if (user.currentJobRole) setProfileJobRole(user.currentJobRole);
        storageKey = 'notifications_' + user.email;
        const defaultNotif = { id: 'welcome', message: `System Online: Welcome back, ${user.name || 'User'}`, time: 'Just now', read: false };
        const stored = localStorage.getItem(storageKey);
        
        if (stored) {
          setNotifications(JSON.parse(stored));
        } else {
          setNotifications([defaultNotif]);
          localStorage.setItem(storageKey, JSON.stringify([defaultNotif]));
        }
      })
      .catch(e => {
        console.error("Failed to load profile for notifications array", e);
      });

    const handleNewNotif = (e: any) => {
        const payload = e.detail;
        setNotifications(prev => [payload, ...prev]);
        if (userProfile && userProfile.email) {
            localStorage.setItem('notifications_' + userProfile.email, JSON.stringify([payload, ...notifications]));
        }
    };
    window.addEventListener('new_notification', handleNewNotif);
    
    const clickOutside = (e: MouseEvent) => {
        if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
            setShowNotifications(false);
        }
        if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
            setShowProfileDropdown(false);
        }
    };
    document.addEventListener('mousedown', clickOutside);

    return () => {
        window.removeEventListener('new_notification', handleNewNotif);
        document.removeEventListener('mousedown', clickOutside);
    };
  }, []);

  const markAsRead = () => {
      const next = notifications.map(n => ({...n, read: true}));
      setNotifications(next);
      if (userProfile && userProfile.email) {
          localStorage.setItem('notifications_' + userProfile.email, JSON.stringify(next));
      }
  };
  const [settingsEmail, setSettingsEmail] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [settingsPassword, setSettingsPassword] = useState("");
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);
  const handleOpenModal = async () => {
    try {
      const fetchedRoles = await fetchApi('/roles');
      setRoles(fetchedRoles);
      if (fetchedRoles.length > 0) {
        setSelectedRole(fetchedRoles[0].id);
      }
      setShowModal(true);
    } catch (e: any) {
      setSystemToast({title: 'Initialization Failed', message: 'Failed to load roles: ' + e.message, isError: true});
    }
  };

  const handleStartSession = async () => {
    setIsStarting(true);
    try {
      const response = await fetchApi('/interview/start', {
        method: 'POST',
        body: JSON.stringify({
          jobRoleId: selectedRole,
          difficulty: difficulty,
          interviewType: type,
          numberOfQuestions: numQuestions
        })
      });
      setShowModal(false);
      router.push('/dashboard/session/' + response.sessionId);
    } catch (e: any) {
      setSystemToast({title: 'Session Error', message: 'Failed to start session: ' + e.message, isError: true});
    } finally {
      setIsStarting(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const payload: any = {};
      
      if (profileAge !== '') {
        if (typeof profileAge === 'number' && profileAge < 0) {
          setSystemToast({title: 'Validation Error', message: 'Age cannot be a negative number.', isError: true});
          return;
        }
        payload.age = profileAge;
      }
      if (profileJobRole) payload.currentJobRole = profileJobRole;
      
      const newProfile = await fetchApi('/user/profile', { method: 'PUT', body: JSON.stringify(payload) });
      setUserProfile(newProfile);
      setSystemToast({title: 'Profile Updated', message: 'Your demographic info was saved successfully.', isError: false});
    } catch(e: any) {
      setSystemToast({title: 'Update Failed', message: e.message, isError: true});
    }
  };

  const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUpdatingProfileImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await fetchApi('/user/profile/picture', {
        method: 'POST',
        body: formData,
        // Let fetchApi/browser automatically handle multipart boundaries
      });
      setUserProfile(res);
      setSystemToast({title: 'Avatar Updated', message: 'Profile picture uploaded.', isError: false});
    } catch(err: any) {
      setSystemToast({title: 'Upload Failed', message: err.message, isError: true});
    } finally {
      setIsUpdatingProfileImage(false);
      setProfileImageFile(null);
    }
  };

  const handleDeleteProfileImage = async () => {
    setIsUpdatingProfileImage(true);
    try {
      const payload = { profilePictureUrl: "" };
      const newProfile = await fetchApi('/user/profile', { method: 'PUT', body: JSON.stringify(payload) });
      setUserProfile(newProfile);
      setSystemToast({title: 'Avatar Removed', message: 'Profile picture removed successfully.', isError: false});
    } catch(err: any) {
      setSystemToast({title: 'Remove Failed', message: err.message, isError: true});
    } finally {
      setIsUpdatingProfileImage(false);
    }
  };

  const handleOpenSettings = async () => {
    try {
      const profile = await fetchApi('/user/profile');
      setSettingsName(profile.name);
      setSettingsEmail(profile.email);
      setOldPassword("");
      setSettingsPassword("");
      setShowSettingsModal(true);
    } catch(e) {}
  };

  const handleSaveSettings = async () => {
    setIsUpdatingSettings(true);
    try {
      const payload: any = { name: settingsName };
      if (settingsPassword) {
        if (!oldPassword) {
          setSystemToast({title: 'Validation Error', message: 'You must enter your current password to authorize a new one.', isError: true});
          setIsUpdatingSettings(false);
          return;
        }
        payload.oldPassword = oldPassword;
        payload.password = settingsPassword;
      }
      await fetchApi('/user/profile', { method: 'PUT', body: JSON.stringify(payload) });
      setShowSettingsModal(false);
      setSystemToast({title: 'Settings Saved', message: 'Settings updated successfully!', isError: false});
      if (settingsPassword) {
        const timeStr = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }).format(new Date());
        const rawObj = localStorage.getItem('notifications_' + settingsEmail);
        const arr = rawObj ? JSON.parse(rawObj) : [];
        const newEvent = { id: 'pwd_' + Date.now(), message: 'Security Alert: Your password was recently changed.', time: timeStr, read: false };
        arr.unshift(newEvent);
        localStorage.setItem('notifications_' + settingsEmail, JSON.stringify(arr));
        setNotifications(arr);
      }
    } catch(err: any) {
      setSystemToast({title: 'Settings Failed', message: err.message, isError: true});
    } finally {
      setIsUpdatingSettings(false);
    }
  };

  const handleSendVerification = async () => {
    setIsProcessingOTP(true);
    try {
      await fetchApi('/user/email/send-verification', { method: 'POST' });
      setResendCountdown(30);
      setSystemToast({title: 'OTP Sent', message: 'Check your Mock Email Console for the 6-digit OTP.', isError: false});
      setShowVerifyOtpModal(true);
      setShowProfileModal(false);
    } catch(err: any) {
      setSystemToast({title: 'Failed to Send', message: err.message, isError: true});
    } finally {
      setIsProcessingOTP(false);
    }
  };

  const handleVerifyOTP = async () => {
    setIsProcessingOTP(true);
    try {
      const response = await fetchApi('/user/email/verify', { method: 'POST', body: JSON.stringify({ otp: verifyOtpCode }) });
      setUserProfile(response);
      setSystemToast({title: 'Verified', message: 'Your email has been successfully verified! You have received the blue tick.', isError: false});
      setShowVerifyOtpModal(false);
      setVerifyOtpCode("");
      setShowProfileModal(true);
    } catch(err: any) {
      setSystemToast({title: 'Verification Failed', message: err.message, isError: true});
    } finally {
      setIsProcessingOTP(false);
    }
  };

  const handleUpdateEmailRequest = async () => {
    if (!oldPassword || !newEmailInput) {
      setSystemToast({title: 'Validation Error', message: 'Password and New Email are required.', isError: true});
      return;
    }
    setIsProcessingOTP(true);
    try {
      await fetchApi('/user/email/request-update', { method: 'POST', body: JSON.stringify({ password: oldPassword, newEmail: newEmailInput }) });
      setResendCountdown(30);
      setSystemToast({title: 'OTP Sent', message: 'Check your Mock Email Console for the update OTP sent to your new email.', isError: false});
      setShowSettingsModal(false);
      setShowUpdateEmailOtpModal(true);
    } catch(err: any) {
      setSystemToast({title: 'Update Request Failed', message: err.message, isError: true});
    } finally {
      setIsProcessingOTP(false);
    }
  };

  const handleVerifyEmailUpdate = async () => {
    setIsProcessingOTP(true);
    try {
      const response = await fetchApi('/user/email/verify-update', { method: 'POST', body: JSON.stringify({ otp: updateEmailOtpCode }) });
      setUserProfile(response);
      setSettingsEmail(response.email);
      setSystemToast({title: 'Email Updated', message: 'Your email was successfully updated.', isError: false});
      setShowUpdateEmailOtpModal(false);
      setUpdateEmailOtpCode("");
      setNewEmailInput("");
      setOldPassword("");
      setShowEmailUpdateForm(false);
      setShowSettingsModal(true);
    } catch(err: any) {
      setSystemToast({title: 'Update Verification Failed', message: err.message, isError: true});
    } finally {
      setIsProcessingOTP(false);
    }
  };

  const handleDeleteAccountFinal = async () => {
    setIsDeletingAccount(true);
    try {
      await fetchApi('/user/profile/delete', { method: 'POST', body: JSON.stringify({ password: deleteAccountPassword }) });
      localStorage.removeItem('token');
      router.push('/');
    } catch(err: any) {
      setSystemToast({title: 'Deletion Failed', message: err.message, isError: true});
      setIsDeletingAccount(false);
      setShowDeleteModal2(false);
    }
  };

  return (
    <div className="flex bg-transparent min-h-screen w-full relative">
      {systemToast && (
        <div className="fixed inset-0 z-[300] bg-black flex items-center justify-center p-4">
          <div className="bg-black border border-white/10 rounded-xl p-8 max-w-sm w-[95%] md:w-full shadow-2xl animate-in zoom-in-95 duration-200 text-center">
            <div className={`w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border ${systemToast.isError ? 'border-red-500/20 text-red-500' : 'border-green-500/20 text-green-500'}`}>
              <span className="material-symbols-outlined">{systemToast.isError ? 'error' : 'check_circle'}</span>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">{systemToast.title}</h2>
            <p className="text-zinc-400 text-sm mb-8">{systemToast.message}</p>
            <button onClick={() => setSystemToast(null)} className="w-full bg-white text-black py-4 rounded-lg font-bold tracking-widest uppercase text-xs hover:scale-[1.02] transition-transform">
              Understood
            </button>
          </div>
        </div>
      )}
      {navAlertMessage && (
        <div className="fixed inset-0 z-[200] bg-black flex items-center justify-center p-4">
          <div className="bg-black border border-white/10 rounded-xl p-8 max-w-sm w-[95%] md:w-full shadow-2xl animate-in zoom-in-95 duration-200 text-center">
            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20 text-red-500">
              <span className="material-symbols-outlined text-red-500">block</span>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Action Blocked</h2>
            <p className="text-zinc-400 text-sm mb-8">{navAlertMessage}</p>
            <button onClick={() => setNavAlertMessage("")} className="w-full bg-white text-black py-4 rounded-lg font-bold tracking-widest uppercase text-xs hover:scale-[1.02] transition-transform">
              Understood
            </button>
          </div>
        </div>
      )}
      {/* Session Configuration Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4">
          <div className="bg-black border border-white/10 rounded-2xl p-10 max-w-md w-[95%] md:w-full shadow-2xl animate-in zoom-in-95 duration-300">
            <h2 className="text-3xl font-black text-white mb-2">Setup Mock Interview</h2>
            <p className="text-zinc-500 text-sm mb-8 block">Choose your settings to begin the interview.</p>
            
            <div className="space-y-6 mb-10">
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] block mb-3">Job Role</label>
                <div className="relative">
                  <select className="w-full bg-[#1A1A1A] border border-white/5 rounded-lg p-4 text-white appearance-none focus:outline-none focus:border-white/20 transition-colors"
                          value={selectedRole} onChange={e => setSelectedRole(Number(e.target.value))}>
                    {roles.map(r => <option key={r.id} value={r.id} className="bg-[#111]">{r.title}</option>)}
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-4 text-zinc-500 pointer-events-none text-sm">unfold_more</span>
                </div>
              </div>
              
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] block mb-3">Difficulty</label>
                <div className="relative">
                  <select className="w-full bg-[#1A1A1A] border border-white/5 rounded-lg p-4 text-white appearance-none focus:outline-none focus:border-white/20 transition-colors"
                          value={difficulty} onChange={e => setDifficulty(e.target.value)}>
                    <option value="INTERN" className="bg-[#111]">Intern</option>
                    <option value="EASY" className="bg-[#111]">Beginner (Easy)</option>
                    <option value="MEDIUM" className="bg-[#111]">Intermediate (Medium)</option>
                    <option value="HARD" className="bg-[#111]">Advanced (Hard)</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-4 text-zinc-500 pointer-events-none text-sm">unfold_more</span>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] block mb-3">Interview Type</label>
                <div className="relative">
                  <select className="w-full bg-[#1A1A1A] border border-white/5 rounded-lg p-4 text-white appearance-none focus:outline-none focus:border-white/20 transition-colors"
                          value={type} onChange={e => setType(e.target.value)}>
                    <option value="TECHNICAL" className="bg-[#111]">Technical</option>
                    <option value="BEHAVIORAL" className="bg-[#111]">Behavioral</option>
                    <option value="MIXED" className="bg-[#111]">Mixed</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-4 text-zinc-500 pointer-events-none text-sm">unfold_more</span>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] block mb-3">Number of Questions</label>
                <div className="relative">
                  <input 
                    type="number" min="1" max="20"
                    className="w-full bg-black border border-white/5 rounded-lg p-4 text-white focus:outline-none focus:border-white/20 transition-colors"
                    value={numQuestions} onChange={e => setNumQuestions(parseInt(e.target.value))} />
                </div>
              </div>
            </div>

            <div className="flex gap-4">
               <button onClick={() => setShowModal(false)} className="flex-1 bg-white/5 text-white py-4 rounded-lg font-bold tracking-widest uppercase text-xs hover:bg-white/10 transition-colors border border-white/5">Cancel</button>
               <button onClick={handleStartSession} disabled={isStarting} className="flex-1 bg-white text-black py-4 rounded-lg font-bold tracking-widest uppercase text-xs hover:scale-[1.02] transition-transform disabled:opacity-50">
                {isStarting ? "Initializing..." : "Start Session"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4">
          <div className="bg-black border border-white/10 rounded-2xl p-10 max-w-md w-[95%] md:w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-300">
            <h2 className="text-3xl font-black text-white mb-2">Settings</h2>
            <p className="text-zinc-500 text-sm mb-8 block">Update your profile information and password.</p>
            
            <div className="space-y-6 mb-10">
              <div className="border border-white/5 bg-white/[0.02] p-4 rounded-xl">
                <div className="flex justify-between items-center mb-3">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Email Access</label>
                  <button onClick={() => setShowEmailUpdateForm(!showEmailUpdateForm)} className="text-[10px] font-bold text-blue-400 hover:text-blue-300 uppercase tracking-widest transition-colors flex items-center gap-1 bg-blue-500/10 px-2 flex py-1 rounded">
                    <span className="material-symbols-outlined text-[14px]">edit</span> {showEmailUpdateForm ? "Cancel" : "Change Email"}
                  </button>
                </div>
                {!showEmailUpdateForm ? (
                  <input type="email" readOnly className="w-full bg-black border border-white/5 rounded-lg p-3 text-zinc-500 cursor-not-allowed" value={settingsEmail} />
                ) : (
                  <div className="space-y-4 mt-2 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div>
                      <input type="email" autoComplete="new-password" id="new_email_no_autofill" name="new_email_no_autofill" className="w-full bg-[#1A1A1A] border border-blue-500/50 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500 transition-colors placeholder:text-zinc-600" placeholder="Enter new email address" value={newEmailInput} onChange={e => setNewEmailInput(e.target.value)} />
                    </div>
                    <div>
                      <input type="password" autoComplete="new-password" id="current_password_no_autofill" name="current_password_no_autofill" className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-white/30 transition-colors placeholder:text-zinc-600" placeholder="Confirm your cur password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} />
                    </div>
                    <button onClick={handleUpdateEmailRequest} disabled={isProcessingOTP || !newEmailInput || !oldPassword} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold tracking-widest uppercase text-xs hover:bg-blue-500 transition-colors shadow-[0_0_20px_rgba(59,130,246,0.2)] disabled:opacity-50">
                      {isProcessingOTP ? "Processing..." : "Send Secure Code"}
                    </button>
                    <p className="text-[10px] text-zinc-500 leading-relaxed"><strong className="text-red-400">Warning:</strong> For security reasons, you can only change your registered email address exactly one time per account.</p>
                  </div>
                )}
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] block mb-3">Name</label>
                <input type="text" className="w-full bg-black border border-white/5 rounded-lg p-4 text-white focus:outline-none focus:border-white/20 transition-colors"
                       placeholder="Applicant Name"
                       value={settingsName} onChange={e => setSettingsName(e.target.value)} />
              </div>

              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] block mb-3">Current Password</label>
                <input type="password" className="w-full bg-black border border-white/5 rounded-lg p-4 text-white focus:outline-none focus:border-white/20 transition-colors"
                       placeholder="Required if changing password"
                       value={oldPassword} onChange={e => setOldPassword(e.target.value)} />
              </div>
              
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] block mb-3">New Password</label>
                <input type="password" className="w-full bg-black border border-white/5 rounded-lg p-4 text-white focus:outline-none focus:border-white/20 transition-colors"
                       placeholder="Leave blank to keep unchanged"
                       value={settingsPassword} onChange={e => setSettingsPassword(e.target.value)} />
              </div>
            </div>

            <div className="flex gap-4">
               <button onClick={() => setShowSettingsModal(false)} className="flex-1 bg-white/5 text-white py-4 rounded-lg font-bold tracking-widest uppercase text-xs hover:bg-white/10 transition-colors border border-white/5">Cancel</button>
               <button onClick={handleSaveSettings} disabled={isUpdatingSettings} className="flex-1 bg-white text-black py-4 rounded-lg font-bold tracking-widest uppercase text-xs hover:scale-[1.02] transition-transform disabled:opacity-50">
                {isUpdatingSettings ? "Saving..." : "Save Changes"}
              </button>
            </div>

            <div className="mt-8 pt-8 border-t border-red-500/10">
              <h3 className="text-red-500 font-bold mb-2">Danger Zone</h3>
              <p className="text-zinc-500 text-xs mb-4">Permanently delete your account and all associated data.</p>
              <button onClick={() => { setShowSettingsModal(false); setShowDeleteModal1(true); }} className="w-full bg-red-500/10 text-red-500 py-4 rounded-lg font-bold tracking-widest uppercase text-xs hover:bg-red-500/20 transition-colors border border-red-500/20">
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal 1 (Password) */}
      {showDeleteModal1 && (
        <div className="fixed inset-0 z-[160] bg-black/95 flex items-center justify-center p-4">
          <div className="bg-black border border-red-500/20 rounded-2xl p-10 max-w-md w-[95%] md:w-full shadow-[0_0_50px_rgba(239,68,68,0.1)] animate-in zoom-in-95 duration-300">
            <h2 className="text-3xl font-black text-white mb-2">Authentication Subroutine</h2>
            <p className="text-zinc-500 text-sm mb-8 block">Please enter your password to authorize this highly destructive action.</p>
            
            <div className="space-y-6 mb-10">
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] block mb-3">Current Password</label>
                <input type="password" autoFocus className="w-full bg-[#1A1A1A] border border-white/5 rounded-lg p-4 text-white focus:outline-none focus:border-red-500/50 transition-colors"
                       placeholder="Enter password"
                       value={deleteAccountPassword} onChange={e => setDeleteAccountPassword(e.target.value)} />
              </div>
            </div>

            <div className="flex gap-4">
               <button onClick={() => { setShowDeleteModal1(false); setDeleteAccountPassword(""); }} className="flex-1 bg-white/5 text-white py-4 rounded-lg font-bold tracking-widest uppercase text-xs hover:bg-white/10 transition-colors border border-white/5">Cancel</button>
               <button onClick={() => { setShowDeleteModal1(false); setShowDeleteModal2(true); }} disabled={!deleteAccountPassword} className="flex-1 bg-red-500 text-white py-4 rounded-lg font-bold tracking-widest uppercase text-xs hover:scale-[1.02] transition-transform disabled:opacity-50">
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal 2 (Final Confirmation) */}
      {showDeleteModal2 && (
        <div className="fixed inset-0 z-[170] bg-black/90 backdrop-blur-[30px] flex items-center justify-center p-4">
          <div className="bg-red-950/20 border border-red-500/40 rounded-2xl p-10 max-w-md w-[95%] md:w-full shadow-[0_0_100px_rgba(239,68,68,0.2)] animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex flex-col items-center justify-center mb-6 border border-red-500/30 text-red-500 mx-auto">
               <span className="material-symbols-outlined text-3xl">warning</span>
            </div>
            <h2 className="text-3xl font-black text-center text-white mb-4">Are you absolute sure?</h2>
            <p className="text-zinc-400 text-sm mb-10 text-center leading-relaxed">
              This will permanently delete your account, erase all your mock interview sessions, sever all notification links, and physically wipe your resumes from the server. 
              <br/><br/><strong className="text-red-400">This action cannot be undone.</strong>
            </p>

            <div className="flex flex-col gap-3">
               <button onClick={handleDeleteAccountFinal} disabled={isDeletingAccount} className="w-full bg-red-600 text-white py-4 rounded-lg font-bold tracking-widest uppercase text-xs hover:bg-red-500 transition-colors shadow-[0_0_20px_rgba(239,68,68,0.3)] disabled:opacity-50">
                {isDeletingAccount ? "Purging Files..." : "Permanently Delete Account"}
              </button>
               <button onClick={() => { setShowDeleteModal2(false); setDeleteAccountPassword(""); }} className="w-full bg-transparent text-zinc-400 py-4 rounded-lg font-bold tracking-widest uppercase text-xs hover:text-white transition-colors">
                 Take me back
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Top Navbar (Hidden on Desktop) */}
      <div className="md:hidden fixed top-0 w-full z-40 bg-black border-b border-white/5 flex justify-between items-center px-6 h-16">
        <div className="flex items-center gap-3">
          <Logo className="w-6 h-6" />
          <h1 className="font-bold text-md text-white mt-1">Intervue</h1>
        </div>
        <button onClick={() => setIsMobileSidebarOpen(true)} className="text-white bg-white/5 hover:bg-white/10 transition-colors p-2 rounded-md border border-white/5 flex items-center justify-center">
          <span className="material-symbols-outlined text-2xl">menu</span>
        </button>
      </div>

      {/* Mobile Overlay */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden transition-opacity" 
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation (Mobile Only) */}
      <aside className={`fixed left-0 top-0 h-screen w-72 bg-black border-r border-white/[0.03] shadow-[40px_0_80px_rgba(0,0,0,0.9)] z-50 flex flex-col py-8 font-manrope text-sm tracking-wide transform transition-transform duration-300 overflow-y-auto md:hidden ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="px-8 mb-12">
          <div className="flex items-center gap-3 pt-4 pb-8 mb-6 border-b border-white/5 w-full relative">
            <Logo className="w-8 h-8" />
            <div>
              <h1 className="font-bold text-lg text-white mt-1">Intervue</h1>
              <p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] leading-tight">Precision Training</p>
            </div>
            <button onClick={() => setIsMobileSidebarOpen(false)} className="md:hidden absolute right-0 top-5 text-white bg-white/5 p-1.5 rounded-md border border-white/5">
               <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        </div>
        
        <nav className="flex-grow">
          <ul className="space-y-1">
            <li>
              <Link 
                onClick={(e) => { 
                    if(isSessionActive) { 
                        e.preventDefault(); 
                        setNavAlertMessage("Please complete or end your current session before navigating away."); 
                    } else {
                        setIsMobileSidebarOpen(false);
                    }
                }}
                className={`flex items-center gap-3 py-3 px-8 transition-colors ${isSessionActive ? 'opacity-30 cursor-not-allowed' : ''} ${pathname === '/dashboard' ? 'bg-white/5 text-white border-l-2 border-white' : 'text-zinc-500 hover:text-white hover:bg-white/[0.02]'}`} 
                href="/dashboard">
                <span className="material-symbols-outlined text-xl">grid_view</span>
                <span>Dashboard</span>
              </Link>
            </li>
            <li>
              <Link 
                onClick={(e) => { 
                    if(isSessionActive) { 
                        e.preventDefault(); 
                        setNavAlertMessage("Please complete or end your current session before navigating away."); 
                    } else {
                        setIsMobileSidebarOpen(false);
                    }
                }}
                className={`flex items-center gap-3 py-3 px-8 transition-colors ${isSessionActive ? 'opacity-30 cursor-not-allowed' : ''} ${pathname?.includes('/sessions') ? 'bg-white/5 text-white border-l-2 border-white' : 'text-zinc-500 hover:text-white hover:bg-white/[0.02]'}`} 
                href="/dashboard/sessions">
                <span className="material-symbols-outlined text-xl">video_call</span>
                <span>Mock Sessions</span>
              </Link>
            </li>
            <li>
              <Link 
                onClick={(e) => { 
                    if(isSessionActive) { 
                        e.preventDefault(); 
                        setNavAlertMessage("Please complete or end your current session before navigating away."); 
                    } else {
                        setIsMobileSidebarOpen(false);
                    }
                }}
                className={`flex items-center gap-3 py-3 px-8 transition-colors ${isSessionActive ? 'opacity-30 cursor-not-allowed' : ''} ${pathname?.includes('/leaderboard') ? 'bg-white/5 text-white border-l-2 border-white' : 'text-zinc-500 hover:text-white hover:bg-white/[0.02]'}`} 
                href="/dashboard/leaderboard">
                <span className="material-symbols-outlined text-xl">leaderboard</span>
                <span>Leaderboard</span>
              </Link>
            </li>
          </ul>
          <div className="mt-10 px-8">
            <button 
              disabled={isSessionActive}
              onClick={() => { if(isSessionActive) { setNavAlertMessage("Please complete or end your current session before starting a new one."); return; } handleOpenModal(); }} 
              className={`w-full bg-primary text-on-primary py-3 px-4 rounded-md font-bold tracking-tight text-sm transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] ${isSessionActive ? 'opacity-30 cursor-not-allowed' : 'hover:opacity-90'}`}>
              New Session
            </button>
          </div>
        </nav>
        
        <div className="px-8 space-y-2 border-t border-white/5 pt-6 mt-6">
           <button 
             onClick={() => { setIsMobileSidebarOpen(false); setShowNotifications(!showNotifications); }}
             className={`md:hidden w-full flex items-center justify-between py-3 px-4 rounded-md text-left transition-colors bg-white/5 text-zinc-300 hover:text-white`}>
            <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-xl">notifications</span>
                <span>Alerts</span>
            </div>
            {notifications.some(n => !n.read) && (
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse shadow-[0_0_10px_rgba(255,255,255,1)]"></span>
            )}
          </button>
           <button 
             onClick={() => { setIsMobileSidebarOpen(false); handleOpenSettings(); }}
             className={`md:hidden w-full flex items-center gap-3 py-3 px-4 rounded-md text-left transition-colors bg-white/5 text-zinc-300 hover:text-white`}>
            <span className="material-symbols-outlined text-xl">settings</span>
            <span>Settings</span>
          </button>
           <button 
             onClick={() => { setIsMobileSidebarOpen(false); setShowProfileModal(true); }}
             className={`md:hidden w-full flex items-center gap-3 py-3 px-4 rounded-md text-left transition-colors bg-white/5 text-zinc-300 hover:text-white`}>
            <span className="material-symbols-outlined text-xl">account_circle</span>
            <span>Profile</span>
          </button>

           <button 
             disabled={isSessionActive}
             onClick={() => { if(isSessionActive) { setNavAlertMessage("Please complete or end your current session before logging out."); return; } setShowLogoutConfirm(true); }} 
             className={`w-full flex items-center gap-3 py-3 px-4 rounded-md text-left transition-colors mt-4 ${isSessionActive ? 'opacity-30 cursor-not-allowed' : 'bg-red-500/10 text-red-500 hover:bg-red-500/20'}`}>
            <span className="material-symbols-outlined text-xl">logout</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col ml-0 min-h-screen">
        {/* Top Navigation Bar (Desktop) */}
        <header className="fixed top-0 left-0 right-0 h-20 z-30 bg-black/50 backdrop-blur-lg border-b border-white/5 hidden md:flex justify-between items-center px-12 w-full">
          
          <div className="flex-1 flex justify-start items-center">
            <h1 className="font-black text-xl text-white tracking-widest uppercase">Intervue</h1>
          </div>

          <nav className="flex-none flex items-center justify-center gap-10 h-full">
            <Link 
              onClick={(e) => { 
                  if(isSessionActive) { 
                      e.preventDefault(); 
                      setNavAlertMessage("Please complete or end your current session before navigating away."); 
                  }
              }}
              className={`text-[11px] font-bold uppercase tracking-[0.2em] transition-all ${isSessionActive ? 'opacity-30 cursor-not-allowed' : ''} ${pathname === '/dashboard' ? 'text-white' : 'text-zinc-500 hover:text-white'}`} 
              href="/dashboard">
              Overview
            </Link>

            <Link 
              onClick={(e) => { 
                  if(isSessionActive) { 
                      e.preventDefault(); 
                      setNavAlertMessage("Please complete or end your current session before navigating away."); 
                  }
              }}
              className={`text-[11px] font-bold uppercase tracking-[0.2em] transition-all ${isSessionActive ? 'opacity-30 cursor-not-allowed' : ''} ${pathname?.includes('/sessions') ? 'text-white' : 'text-zinc-500 hover:text-white'}`} 
              href="/dashboard/sessions">
              Sessions
            </Link>

            <Link 
              onClick={(e) => { 
                  if(isSessionActive) { 
                      e.preventDefault(); 
                      setNavAlertMessage("Please complete or end your current session before navigating away."); 
                  }
              }}
              className={`text-[11px] font-bold uppercase tracking-[0.2em] transition-all ${isSessionActive ? 'opacity-30 cursor-not-allowed' : ''} ${pathname?.includes('/leaderboard') ? 'text-white' : 'text-zinc-500 hover:text-white'}`} 
              href="/dashboard/leaderboard">
              Leaderboard
            </Link>
            
            <button 
              disabled={isSessionActive}
              onClick={() => { 
                if(isSessionActive) { setNavAlertMessage("Please complete or end your current session before starting a new one."); return; } 
                if(userProfile && !userProfile.emailVerified) {
                  setSystemToast({title: 'Verification Required', message: 'You must verify your email to start a session. Sending OTP...', isError: true});
                  handleSendVerification();
                  return;
                }
                handleOpenModal(); 
              }} 
              className={`flex items-center gap-2 bg-white text-black py-2.5 px-6 rounded-full font-bold uppercase tracking-[0.2em] text-[10px] shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-transform ${isSessionActive ? 'opacity-30 cursor-not-allowed' : 'hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]'}`}
            >
              <span className="material-symbols-outlined text-[14px]">add</span>
              Start Session
            </button>
          </nav>

          <div className="flex-1 flex justify-end items-center gap-6">

            <div className="relative" ref={notifRef}>
              <button 
                onClick={() => { if (isSessionActive) return; setShowNotifications(!showNotifications); if (!showNotifications) markAsRead(); }}
                disabled={isSessionActive}
                className={`transition-colors relative flex items-center justify-center p-1 ${isSessionActive ? 'opacity-30 cursor-not-allowed text-zinc-600' : 'text-zinc-400 hover:text-white'}`}
              >
                <span className="material-symbols-outlined text-xl">notifications</span>
                {notifications.some(n => !n.read) && (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-white rounded-full animate-pulse shadow-[0_0_10px_rgba(255,255,255,1)]"></span>
                )}
              </button>
              
              {showNotifications && (
                <div className="hidden md:block absolute right-0 top-12 mt-2 w-80 bg-black border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-4 border-b border-white/5 bg-black/50 flex justify-between items-center">
                     <h3 className="text-white font-bold text-xs uppercase tracking-widest">System Alerts</h3>
                     {notifications.length > 0 && <span className="text-[10px] text-zinc-500">{notifications.length} Total</span>}
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-zinc-500 text-xs">No active alerts.</div>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className="p-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer group">
                           <p className="text-zinc-300 text-sm group-hover:text-white transition-colors leading-relaxed">{n.message}</p>
                           <p className="text-zinc-600 text-[10px] mt-2 font-bold tracking-widest uppercase">{n.time}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="relative" ref={profileMenuRef}>
              <button onClick={() => { if (isSessionActive) return; setShowProfileDropdown(!showProfileDropdown); }} disabled={isSessionActive} className={`flex items-center justify-center p-1 rounded-full border border-white/10 relative overflow-hidden h-8 w-8 transition-colors ${isSessionActive ? 'opacity-30 cursor-not-allowed bg-transparent' : 'text-zinc-400 hover:text-white bg-white/5'}`}>
                {userProfile?.profilePictureUrl ? (
                  <img src={`http://localhost:8080${userProfile.profilePictureUrl}`} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-white text-sm">person</span>
                )}
              </button>

              {showProfileDropdown && (
                <div className="absolute right-0 top-12 mt-2 w-64 bg-black border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-4 border-b border-white/5 bg-black/50">
                    <p className="text-xs font-bold text-white uppercase tracking-wider">{userProfile ? userProfile.name : "Applicant"}</p>
                    <p className="text-[10px] text-zinc-500 mt-1 truncate">{userProfile ? userProfile.email : ""}</p>
                  </div>
                  <div className="py-2">
                    <button onClick={() => { setShowProfileDropdown(false); setShowProfileModal(true); }} className="w-full text-left px-4 py-3 text-sm text-zinc-300 hover:text-white hover:bg-white/[0.02] transition-colors flex items-center gap-3">
                      <span className="material-symbols-outlined text-lg">person</span> Profile
                    </button>
                    <button onClick={() => { setShowProfileDropdown(false); handleOpenSettings(); }} className="w-full text-left px-4 py-3 text-sm text-zinc-300 hover:text-white hover:bg-white/[0.02] transition-colors flex items-center gap-3">
                      <span className="material-symbols-outlined text-lg">settings</span> Settings
                    </button>
                  </div>
                  <div className="py-2 border-t border-white/5">
                    <button 
                      disabled={isSessionActive}
                      onClick={() => { 
                         setShowProfileDropdown(false);
                         if(isSessionActive) { setNavAlertMessage("Please complete or end your current session before logging out."); return; } 
                         setShowLogoutConfirm(true); 
                      }} 
                      className={`w-full text-left px-4 py-3 text-sm flex items-center gap-3 transition-colors ${isSessionActive ? 'opacity-30 cursor-not-allowed text-zinc-500' : 'text-red-500/80 hover:text-red-500 hover:bg-red-500/[0.02]'}`}
                    >
                      <span className="material-symbols-outlined text-lg">logout</span> Logout
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* Logout Confirm Modal */}
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-4" onClick={() => setShowLogoutConfirm(false)}>
            <div className="bg-black border border-white/10 rounded-2xl p-10 max-w-sm w-[95%] md:w-full shadow-2xl animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-2xl font-black text-white mb-2 text-center">Confirm Logout</h2>
              <p className="text-zinc-400 text-sm mb-8 text-center">Are you sure you want to end your session and log out securely?</p>
              <div className="flex flex-col gap-3">
                <button onClick={() => { localStorage.removeItem('token'); router.push('/'); }} className="w-full bg-red-500/20 text-red-500 border border-red-500/20 py-4 rounded-lg font-bold tracking-widest uppercase text-xs hover:bg-red-500 hover:text-white transition-all">
                  Logout
                </button>
                <button onClick={() => setShowLogoutConfirm(false)} className="w-full bg-white/5 text-white py-4 rounded-lg font-bold tracking-widest uppercase text-xs hover:bg-white/10 transition-colors border border-white/5">
                  Stay Signed In
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Notifications Modal */}
        {showNotifications && (
          <div className="md:hidden fixed inset-0 z-[150] bg-black/95 flex items-end sm:items-center justify-center p-4 pb-12" onClick={() => setShowNotifications(false)}>
            <div className="bg-black border border-white/10 rounded-2xl w-full max-h-[70vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom-10 duration-300" onClick={(e) => e.stopPropagation()}>
              <div className="p-6 border-b border-white/5 bg-black flex justify-between items-center rounded-t-2xl">
                 <h3 className="text-white font-bold text-sm uppercase tracking-widest">System Alerts</h3>
                 <button onClick={() => setShowNotifications(false)} className="text-zinc-500 hover:text-white">
                    <span className="material-symbols-outlined">close</span>
                 </button>
              </div>
              <div className="overflow-y-auto flex-1 p-2">
                {notifications.length === 0 ? (
                  <div className="p-10 text-center text-zinc-500 text-sm">No active alerts at this time.</div>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} className="p-5 border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                       <p className="text-zinc-300 text-sm leading-relaxed">{n.message}</p>
                       <p className="text-zinc-600 text-[10px] mt-2 font-bold tracking-widest uppercase">{n.time}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Profile Modal */}
        {showProfileModal && userProfile && (
          <div className="fixed inset-0 z-[150] bg-black/95 flex items-center justify-center p-4">
            <div className="bg-black border border-white/10 rounded-2xl p-10 max-w-md w-[95%] md:w-full shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-3xl font-black text-white mb-1 flex items-center gap-2">
                    Your Profile
                    {userProfile.emailVerified && (
                      <span className="material-symbols-outlined text-blue-500 fill-current text-[28px]" title="Verified Account">verified</span>
                    )}
                  </h2>
                  <p className="text-zinc-500 text-sm">Manage your demographic and avatar details.</p>
                </div>
                <button onClick={() => setShowProfileModal(false)} className="text-zinc-500 hover:text-white transition-colors">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="flex flex-col items-center mb-8">
                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  {userProfile.profilePictureUrl ? (
                    <img src={`http://localhost:8080${userProfile.profilePictureUrl}`} alt="Profile Avatar" className="w-24 h-24 rounded-full object-cover border-2 border-white/20 group-hover:opacity-50 transition-opacity" />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-white/10 border-2 border-dashed border-white/20 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                      <span className="material-symbols-outlined text-3xl text-zinc-400">add_a_photo</span>
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <span className="material-symbols-outlined text-white font-bold text-2xl">upload</span>
                  </div>
                </div>
                {isUpdatingProfileImage && <p className="text-xs text-blue-400 mt-3 animate-pulse">Uploading...</p>}
                <input type="file" ref={fileInputRef} className="hidden" accept="image/png, image/jpeg" onChange={handleProfileImageUpload} />
                {userProfile.profilePictureUrl && (
                  <button onClick={handleDeleteProfileImage} className="mt-4 text-xs font-bold text-red-500 hover:text-red-400 transition-colors uppercase tracking-widest border border-red-500/20 px-4 py-2 rounded-lg bg-red-500/5 hover:bg-red-500/10">
                    Remove Photo
                  </button>
                )}
              </div>

              <div className="space-y-6 mb-8">
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] block mb-2">Full Name</label>
                  <input type="text" readOnly value={userProfile.name} className="w-full bg-black border border-white/5 rounded-lg p-3 text-zinc-400 cursor-not-allowed" />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Email Address</label>
                    {!userProfile.emailVerified && (
                      <button onClick={handleSendVerification} disabled={isProcessingOTP} className="text-[10px] font-bold text-red-500 px-2 py-1 bg-red-500/10 hover:bg-red-500/20 rounded border border-red-500/20 uppercase tracking-widest transition-colors flex items-center gap-1 disabled:opacity-50">
                        <span className="material-symbols-outlined text-[12px]">warning</span> Verify Now
                      </button>
                    )}
                  </div>
                  <input type="text" readOnly value={userProfile.email} className="w-full bg-black border border-white/5 rounded-lg p-3 text-zinc-400 cursor-not-allowed" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] block mb-2">Age</label>
                    <input type="number" min="0"
                      className="w-full bg-[#1A1A1A] border border-white/5 rounded-lg p-3 text-white focus:outline-none focus:border-white/20 transition-colors"
                      value={profileAge} onChange={e => setProfileAge(e.target.value ? parseInt(e.target.value) : '')} placeholder="e.g. 25" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] block mb-2">Current Role</label>
                    <div className="relative">
                      <select className="w-full bg-[#1A1A1A] border border-white/5 rounded-lg p-3 text-white appearance-none focus:outline-none focus:border-white/20 transition-colors"
                              value={profileJobRole} onChange={e => setProfileJobRole(e.target.value)}>
                        <option value="" disabled className="bg-[#111]">Select Status</option>
                        <option value="Student" className="bg-[#111]">Student</option>
                        <option value="Employed" className="bg-[#111]">Employed</option>
                        <option value="Job Seeker" className="bg-[#111]">Job Seeker</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-3 top-3.5 text-zinc-500 pointer-events-none text-sm pointer-events-none">unfold_more</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                 <button onClick={() => setShowProfileModal(false)} className="flex-1 bg-white/5 text-white py-4 rounded-lg font-bold tracking-widest uppercase text-xs hover:bg-white/10 transition-colors border border-white/5">Cancel</button>
                 <button onClick={handleSaveProfile} className="flex-1 bg-white text-black py-4 rounded-lg font-bold tracking-widest uppercase text-xs hover:scale-[1.02] transition-transform shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Validate OTP Modal */}
        {showVerifyOtpModal && (
          <div className="fixed inset-0 z-[180] bg-black/95 flex items-center justify-center p-4">
            <div className="bg-black border border-white/10 rounded-2xl p-10 max-w-sm w-[95%] md:w-full shadow-[0_0_50px_rgba(59,130,246,0.1)] animate-in zoom-in-95 duration-300">
              <div className="flex flex-col items-center text-center">
                 <span className="material-symbols-outlined text-4xl text-blue-500 mb-4 animate-pulse">mark_email_read</span>
                 <h2 className="text-2xl font-black text-white mb-2">Verify Email</h2>
                 <p className="text-zinc-500 text-xs mb-8">Enter the 6-digit OTP code sent to your mock email console.</p>
                 
                 <input type="text" maxLength={6} className="w-full text-center tracking-[0.5em] text-3xl font-black bg-[#1A1A1A] border border-white/5 rounded-xl p-4 text-white focus:outline-none focus:border-blue-500/50 transition-colors mb-8"
                        placeholder="000000"
                        value={verifyOtpCode} onChange={e => setVerifyOtpCode(e.target.value.replace(/\D/g, ''))} />
                 
                 <div className="text-zinc-400 text-xs text-center mt-[-1rem] mb-6">
                   {resendCountdown > 0 ? (
                     <span>Resend code in <strong className="text-white">{resendCountdown}s</strong></span>
                   ) : (
                     <button onClick={handleSendVerification} className="text-blue-500 hover:text-blue-400 underline font-bold" disabled={isProcessingOTP}>
                       Resend Secure Code
                     </button>
                   )}
                 </div>

                 <div className="flex gap-4 w-full">
                   <button onClick={() => { setShowVerifyOtpModal(false); setShowProfileModal(true); setVerifyOtpCode(""); }} className="flex-1 bg-white/5 text-white py-4 rounded-lg font-bold tracking-widest uppercase text-xs hover:bg-white/10 transition-colors border border-white/5">Cancel</button>
                   <button onClick={handleVerifyOTP} disabled={verifyOtpCode.length !== 6 || isProcessingOTP} className="flex-1 bg-blue-600 text-white py-4 rounded-lg font-bold tracking-widest uppercase text-xs hover:bg-blue-500 transition-colors shadow-[0_0_20px_rgba(59,130,246,0.3)] disabled:opacity-50">
                    Verify
                  </button>
                 </div>
              </div>
            </div>
          </div>
        )}

        {/* Update Email OTP Modal */}
        {showUpdateEmailOtpModal && (
          <div className="fixed inset-0 z-[190] bg-black/95 flex items-center justify-center p-4">
            <div className="bg-black border border-white/10 rounded-2xl p-10 max-w-sm w-[95%] md:w-full shadow-[0_0_50px_rgba(59,130,246,0.1)] animate-in zoom-in-95 duration-300">
              <div className="flex flex-col items-center text-center">
                 <span className="material-symbols-outlined text-4xl text-blue-500 mb-4 animate-pulse">lock_person</span>
                 <h2 className="text-2xl font-black text-white mb-2">Confirm Identity</h2>
                 <p className="text-zinc-500 text-xs mb-8">Enter the 6-digit verification code sent to your <strong className="text-white">{newEmailInput}</strong> email mock console to finalize the update.</p>
                 
                 <input type="text" maxLength={6} className="w-full text-center tracking-[0.5em] text-3xl font-black bg-[#1A1A1A] border border-white/5 rounded-xl p-4 text-white focus:outline-none focus:border-blue-500/50 transition-colors mb-8"
                        placeholder="000000"
                        value={updateEmailOtpCode} onChange={e => setUpdateEmailOtpCode(e.target.value.replace(/\D/g, ''))} />
                 
                 <div className="text-zinc-400 text-xs text-center mt-[-1rem] mb-6">
                   {resendCountdown > 0 ? (
                     <span>Resend code in <strong className="text-white">{resendCountdown}s</strong></span>
                   ) : (
                     <button onClick={handleUpdateEmailRequest} className="text-blue-500 hover:text-blue-400 underline font-bold" disabled={isProcessingOTP}>
                       Resend Secure Code
                     </button>
                   )}
                 </div>

                 <div className="flex gap-4 w-full">
                   <button onClick={() => { setShowUpdateEmailOtpModal(false); setShowSettingsModal(true); setUpdateEmailOtpCode(""); }} className="flex-1 bg-white/5 text-white py-4 rounded-lg font-bold tracking-widest uppercase text-xs hover:bg-white/10 transition-colors border border-white/5">Cancel</button>
                   <button onClick={handleVerifyEmailUpdate} disabled={updateEmailOtpCode.length !== 6 || isProcessingOTP} className="flex-1 bg-blue-600 text-white py-4 rounded-lg font-bold tracking-widest uppercase text-xs hover:bg-blue-500 transition-colors shadow-[0_0_20px_rgba(59,130,246,0.3)] disabled:opacity-50">
                    Verify & Update
                  </button>
                 </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Canvas */}
        <main className="mt-20 md:mt-20 p-6 md:p-12 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
