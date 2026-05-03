"use client";

import Link from 'next/link';
import { fetchApi } from '@/lib/api';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import Logo from '@/components/Logo';
import { AnimatedStepper, Step } from '@/components/AnimatedStepper';
import AnimatedIcon from '@/components/AnimatedIcon';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

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
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customJobRoleText, setCustomJobRoleText] = useState('');
  const [timePerQuestion, setTimePerQuestion] = useState(0); // 0 = unlimited

  // DSA Modal State
  const [showDsaModal, setShowDsaModal] = useState(false);
  const [dsaTopic, setDsaTopic] = useState('RANDOM');
  const [dsaDifficulty, setDsaDifficulty] = useState('MEDIUM');
  const [dsaTimer, setDsaTimer] = useState(30);
  const [isStartingDsa, setIsStartingDsa] = useState(false);

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
  const [showPasswordChange, setShowPasswordChange] = useState(false);
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
    if (isCustomMode && !customJobRoleText.trim()) {
      setSystemToast({title: 'Input Required', message: 'Please describe the role you want to practice.', isError: true});
      return;
    }
    setIsStarting(true);
    try {
      const body: any = {
        difficulty,
        interviewType: type,
        numberOfQuestions: numQuestions
      };
      if (isCustomMode) {
        body.customJobRoleName = customJobRoleText.trim();
      } else {
        body.jobRoleId = selectedRole;
      }
      const response = await fetchApi('/interview/start', { method: 'POST', body: JSON.stringify(body) });
      setShowModal(false);
      setIsCustomMode(false);
      setCustomJobRoleText('');
      // Store time limit so session page can read it
      if (timePerQuestion > 0) localStorage.setItem(`sessionTimer_${response.sessionId}`, String(timePerQuestion));
      else localStorage.removeItem(`sessionTimer_${response.sessionId}`);
      router.push('/dashboard/session/' + response.sessionId);
    } catch (e: any) {
      setSystemToast({title: 'Session Error', message: 'Failed to start session: ' + e.message, isError: true});
    } finally {
      setIsStarting(false);
    }
  };

  const handleStartDsa = async () => {
    setIsStartingDsa(true);
    try {
      const body = {
        topic: dsaTopic,
        difficulty: dsaDifficulty,
        timerMinutes: dsaTimer > 0 ? dsaTimer : null
      };
      const response = await fetchApi('/dsa/start', { method: 'POST', body: JSON.stringify(body) });
      setShowDsaModal(false);
      router.push('/dashboard/dsa/' + response.sessionId);
    } catch (e: any) {
      setSystemToast({title: 'DSA Error', message: 'Failed to start assessment: ' + e.message, isError: true});
    } finally {
      setIsStartingDsa(false);
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
      <Toaster position="top-center" theme="dark" richColors />
      {systemToast && (
        <div className="fixed inset-0 z-[300] bg-black flex items-center justify-center p-4">
          <div className="bg-black border border-white/10 rounded-xl p-8 max-w-sm w-[95%] md:w-full shadow-2xl animate-in zoom-in-95 duration-200 text-center">
            <div className={`w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border ${systemToast.isError ? 'border-red-500/20 text-red-500' : 'border-green-500/20 text-green-500'}`}>
              <AnimatedIcon name={systemToast.isError ? 'error' : 'check_circle'} />
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
              <AnimatedIcon name="block" className="text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Action Blocked</h2>
            <p className="text-zinc-400 text-sm mb-8">{navAlertMessage}</p>
            <button onClick={() => setNavAlertMessage("")} className="w-full bg-white text-black py-4 rounded-lg font-bold tracking-widest uppercase text-xs hover:scale-[1.02] transition-transform">
              Understood
            </button>
          </div>
        </div>
      )}
      {/* Session Configuration Modal — AnimatedStepper */}
      {showModal && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) { setShowModal(false); setIsCustomMode(false); setCustomJobRoleText(''); } }}>
          <div className="relative w-[95%] md:w-full max-w-lg animate-in zoom-in-95 duration-300">
            {/* Close button */}
            <button
              onClick={() => { setShowModal(false); setIsCustomMode(false); setCustomJobRoleText(''); }}
              className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full bg-[#222] border border-[#333] flex items-center justify-center text-zinc-400 hover:text-white hover:bg-[#333] transition-colors"
            >
              <AnimatedIcon name="close" className="text-sm" />
            </button>

            <AnimatedStepper
              initialStep={1}
              disableStepIndicators={false}
              onFinalStepCompleted={handleStartSession}
              nextButtonText="Continue"
              backButtonText="Back"
            >
              {/* Step 1: Role & Type */}
              <Step title="Role & Type">
                <div className="space-y-6">
                  {/* Custom Session Toggle */}
                  <button
                    onClick={() => { setIsCustomMode(!isCustomMode); setCustomJobRoleText(''); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-xs font-bold uppercase tracking-widest ${
                      isCustomMode
                        ? 'bg-white text-black border-white'
                        : 'bg-white/5 text-zinc-400 border-[#222] hover:border-[#444] hover:text-white'
                    }`}
                  >
                    <AnimatedIcon name={isCustomMode ? 'edit_note' : 'tune'} className="text-sm" />
                    {isCustomMode ? 'Custom Active — Use Presets' : 'Custom Session — Type Any Role'}
                  </button>

                  {/* Job Role */}
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] block mb-3">Job Role</label>
                    {isCustomMode ? (
                      <textarea
                        rows={3}
                        placeholder="e.g. Senior iOS Engineer at a fintech startup, Quant Researcher, Startup CTO..."
                        className="w-full bg-[#111] border border-[#222] rounded-lg p-4 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-[#555] transition-colors resize-none"
                        value={customJobRoleText}
                        onChange={e => setCustomJobRoleText(e.target.value)}
                      />
                    ) : (
                      <div className="relative">
                        <select className="w-full bg-[#111] border border-[#222] rounded-lg p-4 text-white appearance-none focus:outline-none focus:border-[#555] transition-colors"
                                value={selectedRole} onChange={e => setSelectedRole(Number(e.target.value))}>
                          {roles.map(r => <option key={r.id} value={r.id} className="bg-[#111]">{r.title}</option>)}
                        </select>
                        <AnimatedIcon name="unfold_more" className="absolute right-4 top-4 text-zinc-500 pointer-events-none text-sm" />
                      </div>
                    )}
                  </div>

                  {/* Interview Type */}
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] block mb-3">Interview Type</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: 'TECHNICAL', label: 'Technical', icon: 'code' },
                        { value: 'BEHAVIORAL', label: 'Behavioral', icon: 'psychology' },
                        { value: 'MIXED', label: 'Mixed', icon: 'shuffle' },
                      ].map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => setType(opt.value)}
                          className={`flex flex-col items-center gap-2 py-4 px-3 rounded-xl border transition-all text-xs font-bold uppercase tracking-widest ${
                            type === opt.value
                              ? 'bg-white text-black border-white'
                              : 'bg-[#111] text-zinc-400 border-[#222] hover:border-[#444] hover:text-white'
                          }`}
                        >
                          <AnimatedIcon name={opt.icon} className="text-lg" />
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </Step>

              {/* Step 2: Difficulty & Scope */}
              <Step title="Difficulty & Scope">
                <div className="space-y-6">
                  {/* Difficulty */}
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] block mb-3">Difficulty</label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { value: 'INTERN', label: 'Intern', color: 'text-blue-400 border-blue-500/30 bg-blue-500/10' },
                        { value: 'EASY', label: 'Easy', color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' },
                        { value: 'MEDIUM', label: 'Medium', color: 'text-amber-400 border-amber-500/30 bg-amber-500/10' },
                        { value: 'HARD', label: 'Hard', color: 'text-red-400 border-red-500/30 bg-red-500/10' },
                      ].map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => setDifficulty(opt.value)}
                          className={`py-3 px-2 rounded-xl border transition-all text-xs font-bold uppercase tracking-widest ${
                            difficulty === opt.value
                              ? opt.color
                              : 'bg-[#111] text-zinc-500 border-[#222] hover:border-[#444] hover:text-zinc-300'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Number of Questions */}
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] block mb-3">Number of Questions</label>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setNumQuestions(Math.max(1, numQuestions - 1))}
                        className="w-12 h-12 rounded-xl bg-[#111] border border-[#222] text-white flex items-center justify-center hover:bg-[#1a1a1a] transition-colors"
                      >
                        <AnimatedIcon name="remove" className="text-sm" />
                      </button>
                      <div className="flex-1 text-center">
                        <span className="text-4xl font-black text-white tabular-nums">{numQuestions}</span>
                        <span className="text-zinc-500 text-[10px] uppercase tracking-widest block mt-1">Questions</span>
                      </div>
                      <button
                        onClick={() => setNumQuestions(Math.min(20, numQuestions + 1))}
                        className="w-12 h-12 rounded-xl bg-[#111] border border-[#222] text-white flex items-center justify-center hover:bg-[#1a1a1a] transition-colors"
                      >
                        <AnimatedIcon name="add" className="text-sm" />
                      </button>
                    </div>
                  </div>

                  {/* Time Per Question */}
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] block mb-3">Time per Question</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: 0, label: '∞ Unlimited' },
                        { value: 60, label: '1 min' },
                        { value: 120, label: '2 min' },
                        { value: 180, label: '3 min' },
                        { value: 300, label: '5 min' },
                      ].map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => setTimePerQuestion(opt.value)}
                          className={`py-3 px-2 rounded-xl border transition-all text-xs font-bold tracking-widest ${
                            timePerQuestion === opt.value
                              ? 'bg-white text-black border-white'
                              : 'bg-[#111] text-zinc-400 border-[#222] hover:border-[#444] hover:text-white'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </Step>

              {/* Step 3: Review & Launch */}
              <Step title="Review & Launch">
                <div className="space-y-4">
                  <p className="text-zinc-500 text-sm mb-2">Confirm your session configuration before starting.</p>

                  <div className="rounded-2xl bg-[#111] border border-[#222] p-5 space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-[#222]">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Role</span>
                      <span className="text-sm font-bold text-white text-right max-w-[60%] truncate">
                        {isCustomMode ? (customJobRoleText.trim() || 'Not specified') : roles.find(r => r.id === selectedRole)?.title || 'Unknown'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-[#222]">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Type</span>
                      <span className="text-sm font-bold text-white">{type}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-[#222]">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Difficulty</span>
                      <span className={`text-sm font-bold ${
                        difficulty === 'HARD' ? 'text-red-400' : difficulty === 'MEDIUM' ? 'text-amber-400' : difficulty === 'EASY' ? 'text-emerald-400' : 'text-blue-400'
                      }`}>{difficulty}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-[#222]">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Questions</span>
                      <span className="text-sm font-bold text-white">{numQuestions}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Timer</span>
                      <span className="text-sm font-bold text-white">{timePerQuestion === 0 ? 'Unlimited' : `${timePerQuestion / 60} min / question`}</span>
                    </div>
                  </div>

                  {isStarting && (
                    <div className="flex items-center justify-center gap-3 py-4">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-zinc-400 text-xs uppercase tracking-widest font-bold">Initializing Session...</span>
                    </div>
                  )}
                </div>
              </Step>
            </AnimatedStepper>
          </div>
        </div>
      )}

      {/* DSA Config Modal — AnimatedStepper */}
      {showDsaModal && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) setShowDsaModal(false); }}>
          <div className="relative w-[95%] md:w-full max-w-lg animate-in zoom-in-95 duration-300">
            {/* Close button */}
            <button
              onClick={() => setShowDsaModal(false)}
              className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full bg-[#222] border border-[#333] flex items-center justify-center text-zinc-400 hover:text-white hover:bg-[#333] transition-colors"
            >
              <AnimatedIcon name="close" className="text-sm" />
            </button>

            <AnimatedStepper
              initialStep={1}
              disableStepIndicators={false}
              onFinalStepCompleted={handleStartDsa}
              nextButtonText="Continue"
              backButtonText="Back"
            >
              {/* Step 1: Topic */}
              <Step title="Choose Topic">
                <div className="space-y-4">
                  <p className="text-zinc-500 text-sm mb-2">Select an algorithm topic to practice.</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'RANDOM', label: 'Random', icon: 'casino' },
                      { value: 'ARRAYS', label: 'Arrays & Hash', icon: 'data_array' },
                      { value: 'STRINGS', label: 'Strings', icon: 'text_fields' },
                      { value: 'LINKED_LIST', label: 'Linked Lists', icon: 'link' },
                      { value: 'TREES', label: 'Trees & BST', icon: 'account_tree' },
                      { value: 'GRAPHS', label: 'Graphs', icon: 'hub' },
                      { value: 'DYNAMIC_PROGRAMMING', label: 'DP', icon: 'grid_on' },
                      { value: 'BINARY_SEARCH', label: 'Binary Search', icon: 'search' },
                      { value: 'STACK_QUEUE', label: 'Stacks & Queues', icon: 'stacks' },
                      { value: 'BIT_MANIPULATION', label: 'Bit Ops', icon: 'memory' },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setDsaTopic(opt.value)}
                        className={`flex items-center gap-3 py-3.5 px-4 rounded-xl border transition-all text-xs font-bold uppercase tracking-widest text-left ${
                          dsaTopic === opt.value
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                            : 'bg-[#111] text-zinc-400 border-[#222] hover:border-[#444] hover:text-white'
                        }`}
                      >
                        <AnimatedIcon name={opt.icon} className="text-base" />
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </Step>

              {/* Step 2: Difficulty & Timer */}
              <Step title="Difficulty & Timer">
                <div className="space-y-6">
                  {/* Difficulty */}
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] block mb-3">Difficulty</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: 'EASY', label: 'Easy', desc: 'Warm up', color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' },
                        { value: 'MEDIUM', label: 'Medium', desc: 'Standard', color: 'text-amber-400 border-amber-500/30 bg-amber-500/10' },
                        { value: 'HARD', label: 'Hard', desc: 'Advanced', color: 'text-red-400 border-red-500/30 bg-red-500/10' },
                      ].map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => setDsaDifficulty(opt.value)}
                          className={`flex flex-col items-center gap-1 py-4 px-3 rounded-xl border transition-all ${
                            dsaDifficulty === opt.value
                              ? opt.color
                              : 'bg-[#111] text-zinc-500 border-[#222] hover:border-[#444] hover:text-zinc-300'
                          }`}
                        >
                          <span className="text-xs font-bold uppercase tracking-widest">{opt.label}</span>
                          <span className="text-[10px] opacity-60">{opt.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Timer */}
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] block mb-3">Time Limit</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: 0, label: '∞ Unlimited' },
                        { value: 15, label: '15 min' },
                        { value: 30, label: '30 min' },
                        { value: 45, label: '45 min' },
                        { value: 60, label: '60 min' },
                      ].map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => setDsaTimer(opt.value)}
                          className={`py-3 px-2 rounded-xl border transition-all text-xs font-bold tracking-widest ${
                            dsaTimer === opt.value
                              ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                              : 'bg-[#111] text-zinc-400 border-[#222] hover:border-[#444] hover:text-white'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </Step>

              {/* Step 3: Review & Launch */}
              <Step title="Review & Launch">
                <div className="space-y-4">
                  <p className="text-zinc-500 text-sm mb-2">Confirm your assessment configuration.</p>

                  <div className="rounded-2xl bg-[#111] border border-[#222] p-5 space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-[#222]">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Topic</span>
                      <span className="text-sm font-bold text-blue-400">{dsaTopic === 'RANDOM' ? 'Random' : dsaTopic.replace(/_/g, ' ')}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-[#222]">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Difficulty</span>
                      <span className={`text-sm font-bold ${
                        dsaDifficulty === 'HARD' ? 'text-red-400' : dsaDifficulty === 'MEDIUM' ? 'text-amber-400' : 'text-emerald-400'
                      }`}>{dsaDifficulty}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Timer</span>
                      <span className="text-sm font-bold text-white">{dsaTimer === 0 ? 'Unlimited' : `${dsaTimer} minutes`}</span>
                    </div>
                  </div>

                  {isStartingDsa && (
                    <div className="flex items-center justify-center gap-3 py-4">
                      <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-zinc-400 text-xs uppercase tracking-widest font-bold">Generating Problem...</span>
                    </div>
                  )}
                </div>
              </Step>
            </AnimatedStepper>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      <Dialog open={showSettingsModal} onOpenChange={setShowSettingsModal}>
        <DialogContent showCloseButton className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription>Update your profile information and password.</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="border border-white/5 bg-white/[0.02] p-4 rounded-xl">
              <div className="flex justify-between items-center mb-3">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Email Access</label>
                <button onClick={() => setShowEmailUpdateForm(!showEmailUpdateForm)} className="text-[10px] font-bold text-blue-400 hover:text-blue-300 uppercase tracking-widest transition-colors flex items-center gap-1 bg-blue-500/10 px-2 flex py-1 rounded">
                  <AnimatedIcon name="edit" className="text-[14px]" /> {showEmailUpdateForm ? "Cancel" : "Change Email"}
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
                    <input type="password" autoComplete="new-password" id="current_password_no_autofill" name="current_password_no_autofill" className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-white/30 transition-colors placeholder:text-zinc-600" placeholder="Confirm your current password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} />
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

            {!showPasswordChange ? (
              <button
                onClick={() => setShowPasswordChange(true)}
                className="w-full flex items-center justify-between bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 rounded-lg p-4 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <AnimatedIcon name="lock" className="text-lg text-zinc-400 group-hover:text-white" />
                  <span className="text-sm font-bold text-zinc-400 group-hover:text-white uppercase tracking-widest">Change Password</span>
                </div>
                <AnimatedIcon name="arrow_forward" className="text-sm text-zinc-600 group-hover:text-white" />
              </button>
            ) : (
              <div className="space-y-4 p-4 rounded-lg border border-white/10 bg-white/[0.02]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">Change Password</span>
                  <button onClick={() => { setShowPasswordChange(false); setOldPassword(''); setSettingsPassword(''); }} className="text-[10px] text-zinc-500 hover:text-white uppercase tracking-widest font-bold transition-colors">Cancel</button>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] block mb-3">Current Password</label>
                  <input type="password" className="w-full bg-black border border-white/5 rounded-lg p-4 text-white focus:outline-none focus:border-white/20 transition-colors"
                         placeholder="Enter current password"
                         value={oldPassword} onChange={e => setOldPassword(e.target.value)} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] block mb-3">New Password</label>
                  <input type="password" className="w-full bg-black border border-white/5 rounded-lg p-4 text-white focus:outline-none focus:border-white/20 transition-colors"
                         placeholder="Enter new password"
                         value={settingsPassword} onChange={e => setSettingsPassword(e.target.value)} />
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex-col gap-3 pt-2">
            <div className="flex gap-3 w-full">
              <button onClick={() => setShowSettingsModal(false)} className="flex-1 bg-white/5 text-white py-3 rounded-lg font-bold tracking-widest uppercase text-xs hover:bg-white/10 transition-colors border border-white/5">Cancel</button>
              <button onClick={handleSaveSettings} disabled={isUpdatingSettings} className="flex-1 bg-white text-black py-3 rounded-lg font-bold tracking-widest uppercase text-xs hover:scale-[1.02] transition-transform disabled:opacity-50">
                {isUpdatingSettings ? "Saving..." : "Save Changes"}
              </button>
            </div>
            <div className="border-t border-red-500/10 pt-4 w-full">
              <p className="text-zinc-500 text-xs mb-3">Permanently delete your account and all associated data.</p>
              <button onClick={() => { setShowSettingsModal(false); setShowDeleteModal1(true); }} className="w-full bg-red-500/10 text-red-500 py-3 rounded-lg font-bold tracking-widest uppercase text-xs hover:bg-red-500/20 transition-colors border border-red-500/20">
                Delete Account
              </button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
               <AnimatedIcon name="warning" className="text-3xl" />
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
          <AnimatedIcon name="menu" className="text-2xl" />
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
               <AnimatedIcon name="close" className="text-sm" />
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
                <AnimatedIcon name="grid_view" className="text-xl" />
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
                <AnimatedIcon name="video_call" className="text-xl" />
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
                <AnimatedIcon name="leaderboard" className="text-xl" />
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
                <AnimatedIcon name="notifications" className="text-xl" />
                <span>Alerts</span>
            </div>
            {notifications.some(n => !n.read) && (
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse shadow-[0_0_10px_rgba(255,255,255,1)]"></span>
            )}
          </button>
           <button 
             onClick={() => { setIsMobileSidebarOpen(false); handleOpenSettings(); }}
             className={`md:hidden w-full flex items-center gap-3 py-3 px-4 rounded-md text-left transition-colors bg-white/5 text-zinc-300 hover:text-white`}>
            <AnimatedIcon name="settings" className="text-xl" />
            <span>Settings</span>
          </button>
           <button 
             onClick={() => { setIsMobileSidebarOpen(false); setShowProfileModal(true); }}
             className={`md:hidden w-full flex items-center gap-3 py-3 px-4 rounded-md text-left transition-colors bg-white/5 text-zinc-300 hover:text-white`}>
            <AnimatedIcon name="account_circle" className="text-xl" />
            <span>Profile</span>
          </button>

           <button 
             disabled={isSessionActive}
             onClick={() => { if(isSessionActive) { setNavAlertMessage("Please complete or end your current session before logging out."); return; } setShowLogoutConfirm(true); }} 
             className={`w-full flex items-center gap-3 py-3 px-4 rounded-md text-left transition-colors mt-4 ${isSessionActive ? 'opacity-30 cursor-not-allowed' : 'bg-red-500/10 text-red-500 hover:bg-red-500/20'}`}>
            <AnimatedIcon name="logout" className="text-xl" />
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
              Dashboard
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
                  setSystemToast({title: 'Verification Required', message: 'Your email is not verified.', isError: true});
                  return;
                }
                setShowDsaModal(true); 
              }} 
              className={`flex items-center gap-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 py-2.5 px-6 rounded-full font-bold uppercase tracking-[0.2em] text-[10px] shadow-[0_0_20px_rgba(59,130,246,0.1)] transition-transform ${isSessionActive ? 'opacity-30 cursor-not-allowed' : 'hover:scale-105 hover:bg-blue-600/30'}`}
            >
              <AnimatedIcon name="code" className="text-[14px]" />
              Code Assessment
            </button>

            <button 
              disabled={isSessionActive}
              onClick={() => { 
                if(isSessionActive) { setNavAlertMessage("Please complete or end your current session before starting a new one."); return; } 
                if(userProfile && !userProfile.emailVerified) {
                  setSystemToast({title: 'Verification Required', message: 'Your email is not verified. Please open your Profile and verify your email before starting a session.', isError: true});
                  return;
                }
                handleOpenModal(); 
              }} 
              className={`flex items-center gap-2 bg-white text-black py-2.5 px-6 rounded-full font-bold uppercase tracking-[0.2em] text-[10px] shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-transform ${isSessionActive ? 'opacity-30 cursor-not-allowed' : 'hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]'}`}
            >
              <AnimatedIcon name="add" className="text-[14px]" />
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
                <AnimatedIcon name="notifications" className="text-xl" />
                {notifications.some(n => !n.read) && (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-white rounded-full animate-pulse shadow-[0_0_10px_rgba(255,255,255,1)]"></span>
                )}
              </button>
              
              {showNotifications && (
                <div className="hidden md:block absolute right-0 top-12 mt-2 w-96 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="max-h-[400px] overflow-y-auto pb-12 [mask-image:linear-gradient(to_bottom,black_80%,transparent)] scrollbar-hide pr-1">
                    {notifications.length === 0 ? (
                      <Alert className="bg-[#0a0a0a] border border-white/10 shadow-2xl backdrop-blur-md rounded-xl text-center text-zinc-500 text-xs">
                        No active alerts at this time.
                      </Alert>
                    ) : (
                      <div className="space-y-3">
                        {notifications.map(n => (
                          <Alert key={n.id} className="bg-[#0a0a0a] border border-white/10 shadow-2xl backdrop-blur-md rounded-xl p-4">
                            <AlertTitle className="text-sm font-medium text-white mb-1.5">{n.message}</AlertTitle>
                            <AlertDescription className="text-sm text-zinc-400">
                              {n.time}
                            </AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="relative" ref={profileMenuRef}>
              <button onClick={() => { if (isSessionActive) return; setShowProfileDropdown(!showProfileDropdown); }} disabled={isSessionActive} className={`flex items-center justify-center p-1 rounded-full border border-white/10 relative overflow-hidden h-8 w-8 transition-colors ${isSessionActive ? 'opacity-30 cursor-not-allowed bg-transparent' : 'text-zinc-400 hover:text-white bg-white/5'}`}>
                {userProfile?.profilePictureUrl ? (
                  <img src={`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api').replace(/\/api$/, '')}${userProfile.profilePictureUrl}`} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <AnimatedIcon name="person" className="text-white text-sm" />
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
                      <AnimatedIcon name="person" className="text-lg" /> Profile
                    </button>
                    <button onClick={() => { setShowProfileDropdown(false); handleOpenSettings(); }} className="w-full text-left px-4 py-3 text-sm text-zinc-300 hover:text-white hover:bg-white/[0.02] transition-colors flex items-center gap-3">
                      <AnimatedIcon name="settings" className="text-lg" /> Settings
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
                      <AnimatedIcon name="logout" className="text-lg" /> Logout
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* Logout Confirm Modal */}
        <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
          <AlertDialogContent className="bg-[#050505] border-white/10 shadow-[0_0_50px_rgba(255,255,255,0.05)] sm:max-w-md gap-6">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-2xl font-black text-white text-center">Confirm Logout</AlertDialogTitle>
              <AlertDialogDescription className="text-zinc-500 text-sm text-center">
                Are you sure you want to end your session and log out securely?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-4 flex-col sm:flex-col gap-3">
              <Button onClick={() => { localStorage.removeItem('token'); router.push('/'); }} className="w-full bg-red-500/20 text-red-500 border border-red-500/20 py-4 rounded-lg font-bold tracking-widest uppercase text-xs hover:bg-red-500 hover:text-white transition-all">
                Logout
              </Button>
              <AlertDialogCancel onClick={() => setShowLogoutConfirm(false)} className="w-full mt-0 sm:mt-0 bg-white/5 text-white py-4 rounded-lg font-bold tracking-widest uppercase text-xs hover:bg-white/10 transition-colors border-white/5">
                Stay Signed In
              </AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Mobile Notifications Modal */}
        {showNotifications && (
          <div className="md:hidden fixed inset-0 z-[150] bg-black/80 backdrop-blur-sm flex flex-col items-center justify-start pt-20 p-4" onClick={() => setShowNotifications(false)}>
            <div className="w-full max-h-[70vh] animate-in slide-in-from-top-10 duration-300" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6 px-2">
                 <h3 className="text-white font-black text-xl tracking-tight">System Alerts</h3>
                 <button onClick={() => setShowNotifications(false)} className="bg-white/10 p-2 rounded-full text-white hover:bg-white/20 transition-colors">
                    <AnimatedIcon name="close" className="w-5 h-5" />
                 </button>
              </div>
              <div className="overflow-y-auto max-h-[calc(70vh-60px)] pb-12 [mask-image:linear-gradient(to_bottom,black_85%,transparent)] scrollbar-hide px-2">
                {notifications.length === 0 ? (
                  <Alert className="bg-[#0a0a0a] border border-white/10 shadow-2xl backdrop-blur-md rounded-xl text-center text-zinc-500 text-sm py-8">
                    No active alerts at this time.
                  </Alert>
                ) : (
                  <div className="space-y-3">
                    {notifications.map(n => (
                      <Alert key={n.id} className="bg-[#0a0a0a] border border-white/10 shadow-2xl backdrop-blur-md rounded-xl p-4">
                        <AlertTitle className="text-sm font-medium text-white mb-1.5">{n.message}</AlertTitle>
                        <AlertDescription className="text-sm text-zinc-400">
                          {n.time}
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Profile Modal */}
        <Dialog open={showProfileModal && !!userProfile} onOpenChange={setShowProfileModal}>
          <DialogContent showCloseButton className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                Your Profile
                {userProfile?.emailVerified && (
                  <AnimatedIcon name="verified" className="text-blue-500 text-[24px]" title="Verified Account" />
                )}
              </DialogTitle>
              <DialogDescription>Manage your demographic and avatar details.</DialogDescription>
            </DialogHeader>

            <div className="flex flex-col items-center">
              <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                {userProfile?.profilePictureUrl ? (
                  <img src={`${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api').replace(/\/api$/, '')}${userProfile.profilePictureUrl}`} alt="Profile Avatar" className="w-24 h-24 rounded-full object-cover border-2 border-white/20 group-hover:opacity-50 transition-opacity" />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-white/10 border-2 border-dashed border-white/20 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                    <AnimatedIcon name="add_a_photo" className="text-3xl text-zinc-400" />
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <AnimatedIcon name="upload" className="text-white font-bold text-2xl" />
                </div>
              </div>
              {isUpdatingProfileImage && <p className="text-xs text-blue-400 mt-3 animate-pulse">Uploading...</p>}
              <input type="file" ref={fileInputRef} className="hidden" accept="image/png, image/jpeg" onChange={handleProfileImageUpload} />
              {userProfile?.profilePictureUrl && (
                <button onClick={handleDeleteProfileImage} className="mt-4 text-xs font-bold text-red-500 hover:text-red-400 transition-colors uppercase tracking-widest border border-red-500/20 px-4 py-2 rounded-lg bg-red-500/5 hover:bg-red-500/10">
                  Remove Photo
                </button>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] block mb-2">Full Name</label>
                <input type="text" readOnly value={userProfile?.name || ''} className="w-full bg-black border border-white/5 rounded-lg p-3 text-zinc-400 cursor-not-allowed" />
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Email Address</label>
                  {!userProfile?.emailVerified && (
                    <button onClick={handleSendVerification} disabled={isProcessingOTP} className="text-[10px] font-bold text-red-500 px-2 py-1 bg-red-500/10 hover:bg-red-500/20 rounded border border-red-500/20 uppercase tracking-widest transition-colors flex items-center gap-1 disabled:opacity-50">
                      <AnimatedIcon name="warning" className="text-[12px]" /> Verify Now
                    </button>
                  )}
                </div>
                <input type="text" readOnly value={userProfile?.email || ''} className="w-full bg-black border border-white/5 rounded-lg p-3 text-zinc-400 cursor-not-allowed" />
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
                    <AnimatedIcon name="unfold_more" className="absolute right-3 top-3.5 text-zinc-500 pointer-events-none text-sm" />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <button onClick={() => setShowProfileModal(false)} className="flex-1 bg-white/5 text-white py-3 rounded-lg font-bold tracking-widest uppercase text-xs hover:bg-white/10 transition-colors border border-white/5">Cancel</button>
              <button onClick={handleSaveProfile} className="flex-1 bg-white text-black py-3 rounded-lg font-bold tracking-widest uppercase text-xs hover:scale-[1.02] transition-transform shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                Save Changes
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Validate OTP Modal */}
        <AlertDialog open={showVerifyOtpModal} onOpenChange={setShowVerifyOtpModal}>
          <AlertDialogContent className="bg-[#050505] border-white/10 shadow-[0_0_50px_rgba(59,130,246,0.1)] sm:max-w-sm gap-6">
            <AlertDialogHeader className="items-center">
              <AnimatedIcon name="mark_email_read" className="text-4xl text-blue-500 mb-2 animate-pulse" />
              <AlertDialogTitle className="text-2xl font-black text-white">Verify Email</AlertDialogTitle>
              <AlertDialogDescription className="text-zinc-500 text-xs text-center">
                Enter the 6-digit OTP code sent to your mock email console.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-2 flex flex-col items-center gap-4">
              <InputOTP maxLength={6} value={verifyOtpCode} onChange={(val) => setVerifyOtpCode(val)}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
              <div className="text-zinc-400 text-xs text-center">
                {resendCountdown > 0 ? (
                  <span>Resend code in <strong className="text-white">{resendCountdown}s</strong></span>
                ) : (
                  <button onClick={handleSendVerification} className="text-blue-500 hover:text-blue-400 underline font-bold" disabled={isProcessingOTP}>
                    Resend Secure Code
                  </button>
                )}
              </div>
            </div>
            <AlertDialogFooter className="flex-col sm:flex-col gap-3">
              <Button onClick={(e) => { e.preventDefault(); handleVerifyOTP(); }} disabled={verifyOtpCode.length !== 6 || isProcessingOTP} className="w-full bg-blue-600 text-white py-4 rounded-lg font-bold tracking-widest uppercase text-xs hover:bg-blue-500 transition-colors shadow-[0_0_20px_rgba(59,130,246,0.3)] disabled:opacity-50">
                Verify
              </Button>
              <AlertDialogCancel onClick={() => { setShowVerifyOtpModal(false); setShowProfileModal(true); setVerifyOtpCode(""); }} className="w-full mt-0 sm:mt-0 bg-white/5 text-white py-4 rounded-lg font-bold tracking-widest uppercase text-xs hover:bg-white/10 transition-colors border-white/5">
                Cancel
              </AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Update Email OTP Modal */}
        <AlertDialog open={showUpdateEmailOtpModal} onOpenChange={setShowUpdateEmailOtpModal}>
          <AlertDialogContent className="bg-[#050505] border-white/10 shadow-[0_0_50px_rgba(59,130,246,0.1)] sm:max-w-sm gap-6">
            <AlertDialogHeader className="items-center">
              <AnimatedIcon name="lock_person" className="text-4xl text-blue-500 mb-2 animate-pulse" />
              <AlertDialogTitle className="text-2xl font-black text-white">Confirm Identity</AlertDialogTitle>
              <AlertDialogDescription className="text-zinc-500 text-xs text-center">
                Enter the 6-digit verification code sent to your <strong className="text-white">{newEmailInput}</strong> email mock console to finalize the update.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-2 flex flex-col items-center gap-4">
              <InputOTP maxLength={6} value={updateEmailOtpCode} onChange={(val) => setUpdateEmailOtpCode(val)}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
              <div className="text-zinc-400 text-xs text-center">
                {resendCountdown > 0 ? (
                  <span>Resend code in <strong className="text-white">{resendCountdown}s</strong></span>
                ) : (
                  <button onClick={handleUpdateEmailRequest} className="text-blue-500 hover:text-blue-400 underline font-bold" disabled={isProcessingOTP}>
                    Resend Secure Code
                  </button>
                )}
              </div>
            </div>
            <AlertDialogFooter className="flex-col sm:flex-col gap-3">
              <Button onClick={(e) => { e.preventDefault(); handleVerifyEmailUpdate(); }} disabled={updateEmailOtpCode.length !== 6 || isProcessingOTP} className="w-full bg-blue-600 text-white py-4 rounded-lg font-bold tracking-widest uppercase text-xs hover:bg-blue-500 transition-colors shadow-[0_0_20px_rgba(59,130,246,0.3)] disabled:opacity-50">
                Verify & Update
              </Button>
              <AlertDialogCancel onClick={() => { setShowUpdateEmailOtpModal(false); setShowSettingsModal(true); setUpdateEmailOtpCode(""); }} className="w-full mt-0 sm:mt-0 bg-white/5 text-white py-4 rounded-lg font-bold tracking-widest uppercase text-xs hover:bg-white/10 transition-colors border-white/5">
                Cancel
              </AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Main Content Canvas */}
        <main className="mt-20 md:mt-20 p-6 md:p-12 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
