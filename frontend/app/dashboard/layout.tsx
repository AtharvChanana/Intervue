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
import UserAvatar, { getProfileImageUrl } from "@/components/UserAvatar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const isSessionActive = pathname.includes('/session/');
  const [showModal, setShowModal] = useState(false);
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
      toast.error('Failed to load roles: ' + e.message, { description: undefined });
    }
  };

  const handleStartSession = async () => {
    if (isCustomMode && !customJobRoleText.trim()) {
      toast.error('Please describe the role you want to practice.', { description: undefined });
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
      toast.error('Failed to start session: ' + e.message, { description: undefined });
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
      toast.error('Failed to start assessment: ' + e.message, { description: undefined });
    } finally {
      setIsStartingDsa(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const payload: any = {};
      
      if (profileAge !== '') {
        if (typeof profileAge === 'number' && profileAge < 0) {
          toast.error('Age cannot be a negative number.', { description: undefined });
          return;
        }
        payload.age = profileAge;
      }
      if (profileJobRole) payload.currentJobRole = profileJobRole;
      
      const newProfile = await fetchApi('/user/profile', { method: 'PUT', body: JSON.stringify(payload) });
      setUserProfile(newProfile);
      toast.success('Your demographic info was saved successfully.');
    } catch(e: any) {
      toast.error(e.message, { description: undefined });
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
      toast.success('Profile picture uploaded.');
    } catch(err: any) {
      toast.error(err.message, { description: undefined });
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
      toast.success('Profile picture removed successfully.');
    } catch(err: any) {
      toast.error(err.message, { description: undefined });
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
          toast.error('You must enter your current password to authorize a new one.', { description: undefined });
          setIsUpdatingSettings(false);
          return;
        }
        payload.oldPassword = oldPassword;
        payload.password = settingsPassword;
      }
      await fetchApi('/user/profile', { method: 'PUT', body: JSON.stringify(payload) });
      setShowSettingsModal(false);
      toast.success('Settings updated successfully!');
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
      toast.error(err.message, { description: undefined });
    } finally {
      setIsUpdatingSettings(false);
    }
  };

  const handleSendVerification = async () => {
    setIsProcessingOTP(true);
    try {
      await fetchApi('/user/email/send-verification', { method: 'POST' });
      setResendCountdown(30);
      toast.success('Check your Mock Email Console for the 6-digit OTP.');
      setShowVerifyOtpModal(true);
      setShowProfileModal(false);
    } catch(err: any) {
      toast.error(err.message, { description: undefined });
    } finally {
      setIsProcessingOTP(false);
    }
  };

  const handleVerifyOTP = async () => {
    setIsProcessingOTP(true);
    try {
      const response = await fetchApi('/user/email/verify', { method: 'POST', body: JSON.stringify({ otp: verifyOtpCode }) });
      setUserProfile(response);
      toast.success('Your email has been successfully verified! You have received the blue tick.');
      setShowVerifyOtpModal(false);
      setVerifyOtpCode("");
      setShowProfileModal(true);
    } catch(err: any) {
      toast.error(err.message, { description: undefined });
    } finally {
      setIsProcessingOTP(false);
    }
  };

  const handleUpdateEmailRequest = async () => {
    if (!oldPassword || !newEmailInput) {
      toast.error('Password and New Email are required.', { description: undefined });
      return;
    }
    setIsProcessingOTP(true);
    try {
      await fetchApi('/user/email/request-update', { method: 'POST', body: JSON.stringify({ password: oldPassword, newEmail: newEmailInput }) });
      setResendCountdown(30);
      toast.success('Check your Mock Email Console for the update OTP sent to your new email.');
      setShowSettingsModal(false);
      setShowUpdateEmailOtpModal(true);
    } catch(err: any) {
      toast.error(err.message, { description: undefined });
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
      toast.success('Your email was successfully updated.');
      setShowUpdateEmailOtpModal(false);
      setUpdateEmailOtpCode("");
      setNewEmailInput("");
      setOldPassword("");
      setShowEmailUpdateForm(false);
      setShowSettingsModal(true);
    } catch(err: any) {
      toast.error(err.message);
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
      toast.error(err.message, { description: undefined });
      setIsDeletingAccount(false);
      setShowDeleteModal2(false);
    }
  };

  return (
    <div className="flex bg-transparent min-h-screen w-full relative">
      <Toaster position="top-center" theme="dark" richColors />


      {/* Session Configuration Modal — AnimatedStepper */}
      {showModal && (
        <div className="fixed inset-0 z-[100] bg-[#181818]/98 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) { setShowModal(false); setIsCustomMode(false); setCustomJobRoleText(''); } }}>
          <div className="relative w-[95%] md:w-full max-w-lg animate-in zoom-in-95 duration-300">
            {/* Close button */}
            <button
              onClick={() => { setShowModal(false); setIsCustomMode(false); setCustomJobRoleText(''); }}
              className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full bg-[#222] border border-[#333] flex items-center justify-center text-[#B6A596] hover:text-[#EBDCC4] hover:bg-[#333] transition-colors"
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
                        ? 'bg-[#DC9F85] text-[#181818] border-white'
                        : 'bg-[#1F1A17] text-[#B6A596] border-[#222] hover:border-[#444] hover:text-[#EBDCC4]'
                    }`}
                  >
                    <AnimatedIcon name={isCustomMode ? 'edit_note' : 'tune'} className="text-sm" />
                    {isCustomMode ? 'Custom Active — Use Presets' : 'Custom Session — Type Any Role'}
                  </button>

                  {/* Job Role */}
                  <div>
                    <label className="text-[10px] font-bold text-[#B6A596] uppercase tracking-[0.2em] block mb-3">Job Role</label>
                    {isCustomMode ? (
                      <textarea
                        rows={3}
                        placeholder="e.g. Senior iOS Engineer at a fintech startup, Quant Researcher, Startup CTO..."
                        className="w-full bg-[#1F1A17] border border-[#222] rounded-lg p-4 text-[#EBDCC4] text-sm placeholder:text-[#66473B] focus:outline-none focus:border-[#555] transition-colors resize-none"
                        value={customJobRoleText}
                        onChange={e => setCustomJobRoleText(e.target.value)}
                      />
                    ) : (
                      <div className="relative">
                        <select className="w-full bg-[#1F1A17] border border-[#222] rounded-lg p-4 text-[#EBDCC4] appearance-none focus:outline-none focus:border-[#555] transition-colors"
                                value={selectedRole} onChange={e => setSelectedRole(Number(e.target.value))}>
                          {roles.map(r => <option key={r.id} value={r.id} className="bg-[#1F1A17]">{r.title}</option>)}
                        </select>
                        <AnimatedIcon name="unfold_more" className="absolute right-4 top-4 text-[#B6A596] pointer-events-none text-sm" />
                      </div>
                    )}
                  </div>

                  {/* Interview Type */}
                  <div>
                    <label className="text-[10px] font-bold text-[#B6A596] uppercase tracking-[0.2em] block mb-3">Interview Type</label>
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
                              ? 'bg-[#DC9F85] text-[#181818] border-white'
                              : 'bg-[#1F1A17] text-[#B6A596] border-[#222] hover:border-[#444] hover:text-[#EBDCC4]'
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
                    <label className="text-[10px] font-bold text-[#B6A596] uppercase tracking-[0.2em] block mb-3">Difficulty</label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { value: 'INTERN', label: 'Intern', color: 'text-[#DC9F85] border-blue-500/30 bg-[#DC9F85]/10' },
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
                              : 'bg-[#1F1A17] text-[#B6A596] border-[#222] hover:border-[#444] hover:text-[#EBDCC4]'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Number of Questions */}
                  <div>
                    <label className="text-[10px] font-bold text-[#B6A596] uppercase tracking-[0.2em] block mb-3">Number of Questions</label>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setNumQuestions(Math.max(1, numQuestions - 1))}
                        className="w-12 h-12 rounded-xl bg-[#1F1A17] border border-[#222] text-[#EBDCC4] flex items-center justify-center hover:bg-[#1a1a1a] transition-colors"
                      >
                        <AnimatedIcon name="remove" className="text-sm" />
                      </button>
                      <div className="flex-1 text-center">
                        <span className="text-4xl font-black text-[#EBDCC4] tabular-nums">{numQuestions}</span>
                        <span className="text-[#B6A596] text-[10px] uppercase tracking-widest block mt-1">Questions</span>
                      </div>
                      <button
                        onClick={() => setNumQuestions(Math.min(20, numQuestions + 1))}
                        className="w-12 h-12 rounded-xl bg-[#1F1A17] border border-[#222] text-[#EBDCC4] flex items-center justify-center hover:bg-[#1a1a1a] transition-colors"
                      >
                        <AnimatedIcon name="add" className="text-sm" />
                      </button>
                    </div>
                  </div>

                  {/* Time Per Question */}
                  <div>
                    <label className="text-[10px] font-bold text-[#B6A596] uppercase tracking-[0.2em] block mb-3">Time per Question</label>
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
                              ? 'bg-[#DC9F85] text-[#181818] border-white'
                              : 'bg-[#1F1A17] text-[#B6A596] border-[#222] hover:border-[#444] hover:text-[#EBDCC4]'
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
                  <p className="text-[#B6A596] text-sm mb-2">Confirm your session configuration before starting.</p>

                  <div className="rounded-2xl bg-[#1F1A17] border border-[#222] p-5 space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-[#222]">
                      <span className="text-[10px] font-bold text-[#B6A596] uppercase tracking-widest">Role</span>
                      <span className="text-sm font-bold text-[#EBDCC4] text-right max-w-[60%] truncate">
                        {isCustomMode ? (customJobRoleText.trim() || 'Not specified') : roles.find(r => r.id === selectedRole)?.title || 'Unknown'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-[#222]">
                      <span className="text-[10px] font-bold text-[#B6A596] uppercase tracking-widest">Type</span>
                      <span className="text-sm font-bold text-[#EBDCC4]">{type}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-[#222]">
                      <span className="text-[10px] font-bold text-[#B6A596] uppercase tracking-widest">Difficulty</span>
                      <span className={`text-sm font-bold ${
                        difficulty === 'HARD' ? 'text-red-400' : difficulty === 'MEDIUM' ? 'text-amber-400' : difficulty === 'EASY' ? 'text-emerald-400' : 'text-[#DC9F85]'
                      }`}>{difficulty}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-[#222]">
                      <span className="text-[10px] font-bold text-[#B6A596] uppercase tracking-widest">Questions</span>
                      <span className="text-sm font-bold text-[#EBDCC4]">{numQuestions}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-[10px] font-bold text-[#B6A596] uppercase tracking-widest">Timer</span>
                      <span className="text-sm font-bold text-[#EBDCC4]">{timePerQuestion === 0 ? 'Unlimited' : `${timePerQuestion / 60} min / question`}</span>
                    </div>
                  </div>

                  {isStarting && (
                    <div className="flex items-center justify-center gap-3 py-4">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-[#B6A596] text-xs uppercase tracking-widest font-bold">Initializing Session...</span>
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
        <div className="fixed inset-0 z-[100] bg-[#181818]/98 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) setShowDsaModal(false); }}>
          <div className="relative w-[95%] md:w-full max-w-lg animate-in zoom-in-95 duration-300">
            {/* Close button */}
            <button
              onClick={() => setShowDsaModal(false)}
              className="absolute -top-3 -right-3 z-10 w-8 h-8 rounded-full bg-[#222] border border-[#333] flex items-center justify-center text-[#B6A596] hover:text-[#EBDCC4] hover:bg-[#333] transition-colors"
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
                  <p className="text-[#B6A596] text-sm mb-2">Select an algorithm topic to practice.</p>
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
                            ? 'bg-[#DC9F85]/10 text-[#DC9F85] border-blue-500/30'
                            : 'bg-[#1F1A17] text-[#B6A596] border-[#222] hover:border-[#444] hover:text-[#EBDCC4]'
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
                    <label className="text-[10px] font-bold text-[#B6A596] uppercase tracking-[0.2em] block mb-3">Difficulty</label>
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
                              : 'bg-[#1F1A17] text-[#B6A596] border-[#222] hover:border-[#444] hover:text-[#EBDCC4]'
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
                    <label className="text-[10px] font-bold text-[#B6A596] uppercase tracking-[0.2em] block mb-3">Time Limit</label>
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
                              ? 'bg-[#DC9F85]/10 text-[#DC9F85] border-blue-500/30'
                              : 'bg-[#1F1A17] text-[#B6A596] border-[#222] hover:border-[#444] hover:text-[#EBDCC4]'
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
                  <p className="text-[#B6A596] text-sm mb-2">Confirm your assessment configuration.</p>

                  <div className="rounded-2xl bg-[#1F1A17] border border-[#222] p-5 space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-[#222]">
                      <span className="text-[10px] font-bold text-[#B6A596] uppercase tracking-widest">Topic</span>
                      <span className="text-sm font-bold text-[#DC9F85]">{dsaTopic === 'RANDOM' ? 'Random' : dsaTopic.replace(/_/g, ' ')}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-[#222]">
                      <span className="text-[10px] font-bold text-[#B6A596] uppercase tracking-widest">Difficulty</span>
                      <span className={`text-sm font-bold ${
                        dsaDifficulty === 'HARD' ? 'text-red-400' : dsaDifficulty === 'MEDIUM' ? 'text-amber-400' : 'text-emerald-400'
                      }`}>{dsaDifficulty}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-[10px] font-bold text-[#B6A596] uppercase tracking-widest">Timer</span>
                      <span className="text-sm font-bold text-[#EBDCC4]">{dsaTimer === 0 ? 'Unlimited' : `${dsaTimer} minutes`}</span>
                    </div>
                  </div>

                  {isStartingDsa && (
                    <div className="flex items-center justify-center gap-3 py-4">
                      <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-[#B6A596] text-xs uppercase tracking-widest font-bold">Generating Problem...</span>
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
            <div className="border border-[#66473B]/40 bg-[#231E1A] p-4 rounded-xl">
              <div className="flex justify-between items-center mb-3">
                <label className="text-[10px] font-bold text-[#B6A596] uppercase tracking-[0.2em]">Email Access</label>
                <button onClick={() => setShowEmailUpdateForm(!showEmailUpdateForm)} className="text-[10px] font-bold text-[#DC9F85] hover:text-[#DC9F85] uppercase tracking-widest transition-colors flex items-center gap-1 bg-[#DC9F85]/10 px-2 flex py-1 rounded">
                  <AnimatedIcon name="edit" className="text-[14px]" /> {showEmailUpdateForm ? "Cancel" : "Change Email"}
                </button>
              </div>
              {!showEmailUpdateForm ? (
                <input type="email" readOnly className="w-full bg-[#181818] border border-[#66473B]/40 rounded-lg p-3 text-[#B6A596] cursor-not-allowed" value={settingsEmail} />
              ) : (
                <div className="space-y-4 mt-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div>
                    <input type="email" autoComplete="new-password" id="new_email_no_autofill" name="new_email_no_autofill" className="w-full bg-[#1A1A1A] border border-blue-500/50 rounded-lg p-3 text-[#EBDCC4] focus:outline-none focus:border-blue-500 transition-colors placeholder:text-[#66473B]" placeholder="Enter new email address" value={newEmailInput} onChange={e => setNewEmailInput(e.target.value)} />
                  </div>
                  <div>
                    <input type="password" autoComplete="new-password" id="current_password_no_autofill" name="current_password_no_autofill" className="w-full bg-[#1A1A1A] border border-[#66473B]/50 rounded-lg p-3 text-[#EBDCC4] focus:outline-none focus:border-[#66473B] transition-colors placeholder:text-[#66473B]" placeholder="Confirm your current password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} />
                  </div>
                  <button onClick={handleUpdateEmailRequest} disabled={isProcessingOTP || !newEmailInput || !oldPassword} className="w-full bg-blue-600 text-[#EBDCC4] py-3 rounded-lg font-bold tracking-widest uppercase text-xs hover:bg-[#DC9F85] transition-colors shadow-[0_0_20px_rgba(59,130,246,0.2)] disabled:opacity-50">
                    {isProcessingOTP ? "Processing..." : "Send Secure Code"}
                  </button>
                  <p className="text-[10px] text-[#B6A596] leading-relaxed"><strong className="text-red-400">Warning:</strong> For security reasons, you can only change your registered email address exactly one time per account.</p>
                </div>
              )}
            </div>

            <div>
              <label className="text-[10px] font-bold text-[#B6A596] uppercase tracking-[0.2em] block mb-3">Name</label>
              <input type="text" className="w-full bg-[#181818] border border-[#66473B]/40 rounded-lg p-4 text-[#EBDCC4] focus:outline-none focus:border-[#66473B]/70 transition-colors"
                     placeholder="Applicant Name"
                     value={settingsName} onChange={e => setSettingsName(e.target.value)} />
            </div>

            {!showPasswordChange ? (
              <button
                onClick={() => setShowPasswordChange(true)}
                className="w-full flex items-center justify-between bg-[#1F1A17] hover:bg-[#231E1A] border border-[#66473B]/40 hover:border-[#66473B]/50 rounded-lg p-4 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <AnimatedIcon name="lock" className="text-lg text-[#B6A596] group-hover:text-[#EBDCC4]" />
                  <span className="text-sm font-bold text-[#B6A596] group-hover:text-[#EBDCC4] uppercase tracking-widest">Change Password</span>
                </div>
                <AnimatedIcon name="arrow_forward" className="text-sm text-zinc-600 group-hover:text-[#EBDCC4]" />
              </button>
            ) : (
              <div className="space-y-4 p-4 rounded-lg border border-[#66473B]/50 bg-[#231E1A]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-[#B6A596] uppercase tracking-[0.2em]">Change Password</span>
                  <button onClick={() => { setShowPasswordChange(false); setOldPassword(''); setSettingsPassword(''); }} className="text-[10px] text-[#B6A596] hover:text-[#EBDCC4] uppercase tracking-widest font-bold transition-colors">Cancel</button>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#B6A596] uppercase tracking-[0.2em] block mb-3">Current Password</label>
                  <input type="password" className="w-full bg-[#181818] border border-[#66473B]/40 rounded-lg p-4 text-[#EBDCC4] focus:outline-none focus:border-[#66473B]/70 transition-colors"
                         placeholder="Enter current password"
                         value={oldPassword} onChange={e => setOldPassword(e.target.value)} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#B6A596] uppercase tracking-[0.2em] block mb-3">New Password</label>
                  <input type="password" className="w-full bg-[#181818] border border-[#66473B]/40 rounded-lg p-4 text-[#EBDCC4] focus:outline-none focus:border-[#66473B]/70 transition-colors"
                         placeholder="Enter new password"
                         value={settingsPassword} onChange={e => setSettingsPassword(e.target.value)} />
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex-col gap-3 pt-2">
            <div className="flex gap-3 w-full">
              <button onClick={() => setShowSettingsModal(false)} className="flex-1 bg-[#1F1A17] text-[#EBDCC4] py-3 rounded-lg font-bold tracking-widest uppercase text-xs hover:bg-[#231E1A] transition-colors border border-[#66473B]/40">Cancel</button>
              <button onClick={handleSaveSettings} disabled={isUpdatingSettings} className="flex-1 bg-[#DC9F85] text-[#181818] py-3 rounded-lg font-bold tracking-widest uppercase text-xs hover:scale-[1.02] transition-transform disabled:opacity-50">
                {isUpdatingSettings ? "Saving..." : "Save Changes"}
              </button>
            </div>
            <div className="border-t border-red-500/10 pt-4 w-full">
              <p className="text-[#B6A596] text-xs mb-3">Permanently delete your account and all associated data.</p>
              <button onClick={() => { setShowSettingsModal(false); setShowDeleteModal1(true); }} className="w-full bg-red-500/10 text-red-500 py-3 rounded-lg font-bold tracking-widest uppercase text-xs hover:bg-red-500/20 transition-colors border border-red-500/20">
                Delete Account
              </button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Account Modal 1 (Password) */}
      {showDeleteModal1 && (
        <div className="fixed inset-0 z-[160] bg-[#181818]/98 flex items-center justify-center p-4">
          <div className="bg-[#181818] border border-red-500/20 rounded-2xl p-10 max-w-md w-[95%] md:w-full shadow-[0_0_50px_rgba(239,68,68,0.1)] animate-in zoom-in-95 duration-300">
            <h2 className="text-3xl font-black text-[#EBDCC4] mb-2">Authentication Subroutine</h2>
            <p className="text-[#B6A596] text-sm mb-8 block">Please enter your password to authorize this highly destructive action.</p>
            
            <div className="space-y-6 mb-10">
              <div>
                <label className="text-[10px] font-bold text-[#B6A596] uppercase tracking-[0.2em] block mb-3">Current Password</label>
                <input type="password" autoFocus className="w-full bg-[#1A1A1A] border border-[#66473B]/40 rounded-lg p-4 text-[#EBDCC4] focus:outline-none focus:border-red-500/50 transition-colors"
                       placeholder="Enter password"
                       value={deleteAccountPassword} onChange={e => setDeleteAccountPassword(e.target.value)} />
              </div>
            </div>

            <div className="flex gap-4">
               <button onClick={() => { setShowDeleteModal1(false); setDeleteAccountPassword(""); }} className="flex-1 bg-[#1F1A17] text-[#EBDCC4] py-4 rounded-lg font-bold tracking-widest uppercase text-xs hover:bg-[#231E1A] transition-colors border border-[#66473B]/40">Cancel</button>
               <button onClick={() => { setShowDeleteModal1(false); setShowDeleteModal2(true); }} disabled={!deleteAccountPassword} className="flex-1 bg-red-500 text-[#EBDCC4] py-4 rounded-lg font-bold tracking-widest uppercase text-xs hover:scale-[1.02] transition-transform disabled:opacity-50">
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal 2 (Final Confirmation) */}
      {showDeleteModal2 && (
        <div className="fixed inset-0 z-[170] bg-[#181818]/95 backdrop-blur-[30px] flex items-center justify-center p-4">
          <div className="bg-red-950/20 border border-red-500/40 rounded-2xl p-10 max-w-md w-[95%] md:w-full shadow-[0_0_100px_rgba(239,68,68,0.2)] animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex flex-col items-center justify-center mb-6 border border-red-500/30 text-red-500 mx-auto">
               <AnimatedIcon name="warning" className="text-3xl" />
            </div>
            <h2 className="text-3xl font-black text-center text-[#EBDCC4] mb-4">Are you absolute sure?</h2>
            <p className="text-[#B6A596] text-sm mb-10 text-center leading-relaxed">
              This will permanently delete your account, erase all your mock interview sessions, sever all notification links, and physically wipe your resumes from the server. 
              <br/><br/><strong className="text-red-400">This action cannot be undone.</strong>
            </p>

            <div className="flex flex-col gap-3">
               <button onClick={handleDeleteAccountFinal} disabled={isDeletingAccount} className="w-full bg-red-600 text-[#EBDCC4] py-4 rounded-lg font-bold tracking-widest uppercase text-xs hover:bg-red-500 transition-colors shadow-[0_0_20px_rgba(239,68,68,0.3)] disabled:opacity-50">
                {isDeletingAccount ? "Purging Files..." : "Permanently Delete Account"}
              </button>
               <button onClick={() => { setShowDeleteModal2(false); setDeleteAccountPassword(""); }} className="w-full bg-transparent text-[#B6A596] py-4 rounded-lg font-bold tracking-widest uppercase text-xs hover:text-[#EBDCC4] transition-colors">
                 Take me back
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Top Navbar (Hidden on Desktop) */}
      <div className="md:hidden fixed top-0 w-full z-40 bg-[#181818] border-b border-[#66473B]/40 flex justify-between items-center px-6 h-16">
        <div className="flex items-center gap-3">
          <Logo className="w-6 h-6" />
          <h1 className="font-bold text-md text-[#EBDCC4] mt-1">Intervue</h1>
        </div>
        <button onClick={() => setIsMobileSidebarOpen(true)} className="text-[#EBDCC4] bg-[#1F1A17] hover:bg-[#231E1A] transition-colors p-2 rounded-md border border-[#66473B]/40 flex items-center justify-center">
          <AnimatedIcon name="menu" className="text-2xl" />
        </button>
      </div>

      {/* Mobile Overlay */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-[#181818]/90 backdrop-blur-sm z-40 md:hidden transition-opacity" 
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation (Mobile Only) */}
      <aside className={`fixed left-0 top-0 h-screen w-72 bg-[#181818] border-r border-white/[0.03] shadow-[40px_0_80px_rgba(0,0,0,0.9)] z-50 flex flex-col py-8 font-manrope text-sm tracking-wide transform transition-transform duration-300 overflow-y-auto md:hidden ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="px-8 mb-12">
          <div className="flex items-center gap-3 pt-4 pb-8 mb-6 border-b border-[#66473B]/40 w-full relative">
            <Logo className="w-8 h-8" />
            <div>
              <h1 className="font-bold text-lg text-[#EBDCC4] mt-1">Intervue</h1>
              <p className="text-[10px] text-[#B6A596] uppercase tracking-[0.2em] leading-tight">Precision Training</p>
            </div>
            <button onClick={() => setIsMobileSidebarOpen(false)} className="md:hidden absolute right-0 top-5 text-[#EBDCC4] bg-[#1F1A17] p-1.5 rounded-md border border-[#66473B]/40">
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
                        toast.error("Please complete or end your current session before navigating away."); 
                    } else {
                        setIsMobileSidebarOpen(false);
                    }
                }}
                className={`flex items-center gap-3 py-3 px-8 transition-colors ${isSessionActive ? 'opacity-30 cursor-not-allowed' : ''} ${pathname === '/dashboard' ? 'bg-[#1F1A17] text-[#EBDCC4] border-l-2 border-white' : 'text-[#B6A596] hover:text-[#EBDCC4] hover:bg-[#231E1A]'}`} 
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
                        toast.error("Please complete or end your current session before navigating away."); 
                    } else {
                        setIsMobileSidebarOpen(false);
                    }
                }}
                className={`flex items-center gap-3 py-3 px-8 transition-colors ${isSessionActive ? 'opacity-30 cursor-not-allowed' : ''} ${pathname?.includes('/sessions') ? 'bg-[#231E1A] text-[#EBDCC4] border-l-2 border-[#DC9F85]' : 'text-[#B6A596] hover:text-[#EBDCC4] hover:bg-[#231E1A]'}`} 
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
                        toast.error("Please complete or end your current session before navigating away."); 
                    } else {
                        setIsMobileSidebarOpen(false);
                    }
                }}
                className={`flex items-center gap-3 py-3 px-8 transition-colors ${isSessionActive ? 'opacity-30 cursor-not-allowed' : ''} ${pathname?.includes('/leaderboard') ? 'bg-[#231E1A] text-[#EBDCC4] border-l-2 border-[#DC9F85]' : 'text-[#B6A596] hover:text-[#EBDCC4] hover:bg-[#231E1A]'}`} 
                href="/dashboard/leaderboard">
                <AnimatedIcon name="leaderboard" className="text-xl" />
                <span>Leaderboard</span>
              </Link>
            </li>
          </ul>
          <div className="mt-10 px-8">
            <button 
              disabled={isSessionActive}
              onClick={() => { if(isSessionActive) { toast.error("Please complete or end your current session before starting a new one."); return; } handleOpenModal(); }} 
              className={`editorial-btn w-full py-3 px-4 text-[10px] ${isSessionActive ? 'opacity-30 cursor-not-allowed' : ''}`}>
              + New Session
            </button>
          </div>
        </nav>
        
        <div className="px-8 space-y-2 border-t border-[#66473B]/40 pt-6 mt-6">
           <button 
             onClick={() => { setIsMobileSidebarOpen(false); setShowNotifications(!showNotifications); }}
             className={`md:hidden w-full flex items-center justify-between py-3 px-4 rounded-md text-left transition-colors bg-[#1F1A17] text-[#EBDCC4] hover:text-[#EBDCC4]`}>
            <div className="flex items-center gap-3">
                <AnimatedIcon name="notifications" className="text-xl" />
                <span>Alerts</span>
            </div>
            {notifications.some(n => !n.read) && (
                <span className="w-1.5 h-1.5 bg-[#DC9F85] rounded-full animate-pulse shadow-[0_0_8px_rgba(220,159,133,0.8)]"></span>
            )}
          </button>
           <button 
             onClick={() => { setIsMobileSidebarOpen(false); handleOpenSettings(); }}
             className={`md:hidden w-full flex items-center gap-3 py-3 px-4 rounded-md text-left transition-colors bg-[#1F1A17] text-[#EBDCC4] hover:text-[#EBDCC4]`}>
            <AnimatedIcon name="settings" className="text-xl" />
            <span>Settings</span>
          </button>
           <button 
             onClick={() => { setIsMobileSidebarOpen(false); setShowProfileModal(true); }}
             className={`md:hidden w-full flex items-center gap-3 py-3 px-4 rounded-md text-left transition-colors bg-[#1F1A17] text-[#EBDCC4] hover:text-[#EBDCC4]`}>
            <AnimatedIcon name="account_circle" className="text-xl" />
            <span>Profile</span>
          </button>

           <button 
             disabled={isSessionActive}
             onClick={() => { if(isSessionActive) { toast.error("Please complete or end your current session before logging out."); return; } setShowLogoutConfirm(true); }} 
             className={`w-full flex items-center gap-3 py-3 px-4 rounded-md text-left transition-colors mt-4 ${isSessionActive ? 'opacity-30 cursor-not-allowed' : 'bg-red-500/10 text-red-500 hover:bg-red-500/20'}`}>
            <AnimatedIcon name="logout" className="text-xl" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col ml-0 min-h-screen">
        {/* Top Navigation Bar (Desktop) — Superdesign Editorial Style */}
        <header className="fixed top-0 left-0 right-0 z-30 bg-[#181818] border-b border-[#35211A] hidden md:flex items-center justify-between px-8 md:px-12 py-8 w-full">

          {/* LEFT — Brand */}
          <div className="flex items-center gap-4">
            <h1 className="display-font font-black text-xl text-[#EBDCC4] tracking-widest uppercase">INTERVUE</h1>
          </div>

          {/* CENTER — Nav links */}
          <nav className="flex items-center gap-8">
            {[
              { href: '/dashboard',             label: 'Dashboard',   active: pathname === '/dashboard' },
              { href: '/dashboard/sessions',    label: 'Sessions',    active: !!pathname?.includes('/sessions') },
              { href: '/dashboard/leaderboard', label: 'Leaderboard', active: !!pathname?.includes('/leaderboard') },
            ].map(({ href, label, active }) => (
              <Link
                key={href}
                href={href}
                onClick={(e) => {
                  if (isSessionActive) { e.preventDefault(); toast.error('Please complete or end your current session before navigating away.'); }
                }}
                className={`relative text-[10px] font-bold uppercase tracking-widest transition-colors ${isSessionActive ? 'opacity-30 cursor-not-allowed' : ''} ${active ? 'text-[#EBDCC4]' : 'text-[#B6A596] hover:text-[#EBDCC4]'}`}
              >
                {label}
                {active && <span className="absolute -bottom-[3px] left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#DC9F85]" />}
              </Link>
            ))}
          </nav>

          {/* RIGHT — Actions + Divider + Avatar */}
          <div className="flex items-center gap-5">
            {/* Code Assessment */}
            <button
              disabled={isSessionActive}
              onClick={() => {
                if (isSessionActive) { toast.error('Please complete or end your current session before starting a new one.'); return; }
                if (userProfile && !userProfile.emailVerified) { toast.error('Your email is not verified.'); return; }
                setShowDsaModal(true);
              }}
              className={`text-[10px] font-bold uppercase tracking-[0.25em] border border-[#66473B] text-[#B6A596] px-5 py-2 transition-colors hover:border-[#B6A596] hover:text-[#EBDCC4] ${isSessionActive ? 'opacity-30 cursor-not-allowed' : ''}`}
            >
              &lt;/&gt; Code
            </button>

            {/* Start Session */}
            <button
              disabled={isSessionActive}
              onClick={() => {
                if (isSessionActive) { toast.error('Please complete or end your current session before starting a new one.'); return; }
                if (userProfile && !userProfile.emailVerified) { toast.error('Your email is not verified. Please verify your email before starting a session.'); return; }
                handleOpenModal();
              }}
              className={`text-[10px] font-bold uppercase tracking-[0.25em] border border-[#DC9F85] text-[#DC9F85] px-5 py-2 transition-colors hover:bg-[#DC9F85] hover:text-[#181818] ${isSessionActive ? 'opacity-30 cursor-not-allowed' : ''}`}
            >
              + Start Session
            </button>

            {/* Divider */}
            <div className="h-8 w-[1px] bg-[#35211A]" />

            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => { if (isSessionActive) return; setShowNotifications(!showNotifications); if (!showNotifications) markAsRead(); }}
                disabled={isSessionActive}
                className={`relative flex items-center justify-center transition-colors ${isSessionActive ? 'opacity-30 cursor-not-allowed text-[#66473B]' : 'text-[#B6A596] hover:text-[#EBDCC4]'}`}
              >
                <AnimatedIcon name="notifications" className="text-xl" />
                {notifications.some(n => !n.read) && (
                  <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-[#DC9F85] rounded-full" />
                )}
              </button>
              {showNotifications && (
                <div className="absolute right-0 top-10 mt-2 w-80 bg-[#181818] border border-[#35211A] z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-5 py-3 border-b border-[#35211A]">
                    <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#B6A596]">Notifications</span>
                  </div>
                  <div className="max-h-[340px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-[#66473B] text-[10px] uppercase tracking-widest text-center py-8">No active alerts</p>
                    ) : notifications.map(n => (
                      <div key={n.id} className="px-5 py-4 border-b border-[#35211A] last:border-0">
                        <p className="text-[11px] text-[#EBDCC4] font-medium leading-relaxed">{n.message}</p>
                        <p className="text-[10px] text-[#66473B] mt-1 uppercase tracking-widest">{n.time}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Avatar + dropdown */}
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => { if (isSessionActive) return; setShowProfileDropdown(!showProfileDropdown); }}
                disabled={isSessionActive}
                className={`flex items-center gap-3 ${isSessionActive ? 'opacity-30 cursor-not-allowed' : ''}`}
              >
                <span className="text-[10px] tracking-widest font-bold text-[#EBDCC4] hidden lg:block uppercase">
                  {userProfile?.name?.split(' ')[0] || 'User'}
                </span>
                <div className="w-8 h-8 rounded-full border border-[#DC9F85] bg-[#1A1512] flex items-center justify-center overflow-hidden">
                  {userProfile?.profilePictureUrl
                    ? <img
                        key={userProfile.profilePictureUrl}
                        src={getProfileImageUrl(userProfile.profilePictureUrl)}
                        alt="avatar"
                        className="w-full h-full object-cover"
                      />
                    : <span className="text-[#DC9F85] text-xs font-bold uppercase">{userProfile?.name?.[0] || 'U'}</span>
                  }
                </div>
              </button>
              {showProfileDropdown && (
                <div className="absolute right-0 top-12 mt-2 w-52 bg-[#181818] border border-[#35211A] z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-5 py-4 border-b border-[#35211A]">
                    <p className="text-[10px] font-bold text-[#EBDCC4] uppercase tracking-widest truncate">{userProfile?.name || 'Applicant'}</p>
                    <p className="text-[10px] text-[#66473B] mt-0.5 truncate">{userProfile?.email || ''}</p>
                  </div>
                  <button onClick={() => { setShowProfileDropdown(false); setShowProfileModal(true); }} className="w-full text-left px-5 py-3 text-[10px] uppercase tracking-widest font-bold text-[#B6A596] hover:text-[#EBDCC4] hover:bg-[#1A1512] transition-colors border-b border-[#35211A] flex items-center gap-3">
                    <AnimatedIcon name="person" className="text-base" /> Profile
                  </button>
                  <button onClick={() => { setShowProfileDropdown(false); handleOpenSettings(); }} className="w-full text-left px-5 py-3 text-[10px] uppercase tracking-widest font-bold text-[#B6A596] hover:text-[#EBDCC4] hover:bg-[#1A1512] transition-colors border-b border-[#35211A] flex items-center gap-3">
                    <AnimatedIcon name="settings" className="text-base" /> Settings
                  </button>
                  <button
                    disabled={isSessionActive}
                    onClick={() => { setShowProfileDropdown(false); if (isSessionActive) { toast.error('Please end your session before logging out.'); return; } setShowLogoutConfirm(true); }}
                    className={`w-full text-left px-5 py-3 text-[10px] uppercase tracking-widest font-bold flex items-center gap-3 transition-colors ${isSessionActive ? 'opacity-30 cursor-not-allowed text-[#B6A596]' : 'text-[#DC9F85] hover:bg-[#1A1512]'}`}
                  >
                    <AnimatedIcon name="logout" className="text-base" /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Logout Confirm Modal */}
        <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
          <AlertDialogContent className="bg-[#181818] border-[#35211A] sm:max-w-md gap-6">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-2xl font-black text-[#EBDCC4] text-center">Confirm Logout</AlertDialogTitle>
              <AlertDialogDescription className="text-[#B6A596] text-sm text-center">
                Are you sure you want to end your session and log out securely?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-4 flex-col sm:flex-col gap-3">
              <Button onClick={() => { localStorage.removeItem('token'); router.push('/'); }} className="w-full bg-transparent text-[#DC9F85] border border-[#DC9F85] py-4 font-bold tracking-widest uppercase text-xs hover:bg-[#DC9F85] hover:text-[#181818] transition-all rounded-none">
                Logout
              </Button>
              <AlertDialogCancel onClick={() => setShowLogoutConfirm(false)} className="w-full mt-0 sm:mt-0 bg-transparent text-[#B6A596] py-4 font-bold tracking-widest uppercase text-xs hover:bg-[#1A1512] hover:text-[#EBDCC4] transition-colors border-[#35211A] rounded-none">
                Stay Signed In
              </AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
                </AlertDialog>

        {/* Mobile Notifications Modal */}
        {showNotifications && (
          <div className="md:hidden fixed inset-0 z-[150] bg-[#181818]/90 backdrop-blur-sm flex flex-col items-center justify-start pt-20 p-4" onClick={() => setShowNotifications(false)}>
            <div className="w-full max-h-[70vh] animate-in slide-in-from-top-10 duration-300" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6 px-2">
                 <h3 className="text-[#EBDCC4] font-black text-xl tracking-tight">System Alerts</h3>
                 <button onClick={() => setShowNotifications(false)} className="bg-[#231E1A] p-2 rounded-full text-[#EBDCC4] hover:bg-[#2A221D] transition-colors">
                    <AnimatedIcon name="close" className="w-5 h-5" />
                 </button>
              </div>
              <div className="overflow-y-auto max-h-[calc(70vh-60px)] pb-12 [mask-image:linear-gradient(to_bottom,black_85%,transparent)] scrollbar-hide px-2">
                {notifications.length === 0 ? (
                  <Alert className="bg-[#0a0a0a] border border-[#66473B]/50 shadow-2xl backdrop-blur-md rounded-xl text-center text-[#B6A596] text-sm py-8">
                    No active alerts at this time.
                  </Alert>
                ) : (
                  <div className="space-y-3">
                    {notifications.map(n => (
                      <Alert key={n.id} className="bg-[#0a0a0a] border border-[#66473B]/50 shadow-2xl backdrop-blur-md rounded-xl p-4">
                        <AlertTitle className="text-sm font-medium text-[#EBDCC4] mb-1.5">{n.message}</AlertTitle>
                        <AlertDescription className="text-sm text-[#B6A596]">
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
                  <AnimatedIcon name="verified" className="text-[#DC9F85] text-[24px]" title="Verified Account" />
                )}
              </DialogTitle>
              <DialogDescription>Manage your demographic and avatar details.</DialogDescription>
            </DialogHeader>

            <div className="flex flex-col items-center">
              <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <UserAvatar
                  name={userProfile?.name}
                  profilePictureUrl={userProfile?.profilePictureUrl}
                  className="w-24 h-24 group-hover:opacity-50 transition-opacity border-2 border-[#66473B]/70"
                  fallbackClassName="text-2xl"
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-full">
                  <AnimatedIcon name="upload" className="text-[#EBDCC4] font-bold text-2xl" />
                </div>
              </div>
              {isUpdatingProfileImage && <p className="text-xs text-[#DC9F85] mt-3 animate-pulse">Uploading...</p>}
              <input type="file" ref={fileInputRef} className="hidden" accept="image/png, image/jpeg" onChange={handleProfileImageUpload} />
              {userProfile?.profilePictureUrl && (
                <button onClick={handleDeleteProfileImage} className="mt-4 text-xs font-bold text-red-500 hover:text-red-400 transition-colors uppercase tracking-widest border border-red-500/20 px-4 py-2 rounded-lg bg-red-500/5 hover:bg-red-500/10">
                  Remove Photo
                </button>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-[#B6A596] uppercase tracking-[0.2em] block mb-2">Full Name</label>
                <input type="text" readOnly value={userProfile?.name || ''} className="w-full bg-[#181818] border border-[#66473B]/40 rounded-lg p-3 text-[#B6A596] cursor-not-allowed" />
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[10px] font-bold text-[#B6A596] uppercase tracking-[0.2em]">Email Address</label>
                  {!userProfile?.emailVerified && (
                    <button onClick={handleSendVerification} disabled={isProcessingOTP} className="text-[10px] font-bold text-red-500 px-2 py-1 bg-red-500/10 hover:bg-red-500/20 rounded border border-red-500/20 uppercase tracking-widest transition-colors flex items-center gap-1 disabled:opacity-50">
                      <AnimatedIcon name="warning" className="text-[12px]" /> Verify Now
                    </button>
                  )}
                </div>
                <input type="text" readOnly value={userProfile?.email || ''} className="w-full bg-[#181818] border border-[#66473B]/40 rounded-lg p-3 text-[#B6A596] cursor-not-allowed" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-[#B6A596] uppercase tracking-[0.2em] block mb-2">Age</label>
                  <input type="number" min="0"
                    className="w-full bg-[#1A1A1A] border border-[#66473B]/40 rounded-lg p-3 text-[#EBDCC4] focus:outline-none focus:border-[#66473B]/70 transition-colors"
                    value={profileAge} onChange={e => setProfileAge(e.target.value ? parseInt(e.target.value) : '')} placeholder="e.g. 25" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#B6A596] uppercase tracking-[0.2em] block mb-2">Current Role</label>
                  <div className="relative">
                    <select className="w-full bg-[#1A1A1A] border border-[#66473B]/40 rounded-lg p-3 text-[#EBDCC4] appearance-none focus:outline-none focus:border-[#66473B]/70 transition-colors"
                            value={profileJobRole} onChange={e => setProfileJobRole(e.target.value)}>
                      <option value="" disabled className="bg-[#1F1A17]">Select Status</option>
                      <option value="Student" className="bg-[#1F1A17]">Student</option>
                      <option value="Employed" className="bg-[#1F1A17]">Employed</option>
                      <option value="Job Seeker" className="bg-[#1F1A17]">Job Seeker</option>
                    </select>
                    <AnimatedIcon name="unfold_more" className="absolute right-3 top-3.5 text-[#B6A596] pointer-events-none text-sm" />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <button onClick={() => setShowProfileModal(false)} className="flex-1 bg-[#1F1A17] text-[#EBDCC4] py-3 rounded-lg font-bold tracking-widest uppercase text-xs hover:bg-[#231E1A] transition-colors border border-[#66473B]/40">Cancel</button>
              <button onClick={handleSaveProfile} className="flex-1 bg-[#DC9F85] text-[#181818] py-3 rounded-lg font-bold tracking-widest uppercase text-xs hover:scale-[1.02] transition-transform shadow-[0_0_20px_rgba(220,159,133,0.08)]">
                Save Changes
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Validate OTP Modal */}
        <AlertDialog open={showVerifyOtpModal} onOpenChange={setShowVerifyOtpModal}>
          <AlertDialogContent className="bg-[#050505] border-[#66473B]/50 shadow-[0_0_50px_rgba(59,130,246,0.1)] sm:max-w-sm gap-6">
            <AlertDialogHeader className="items-center">
              <AnimatedIcon name="mark_email_read" className="text-4xl text-[#DC9F85] mb-2 animate-pulse" />
              <AlertDialogTitle className="text-2xl font-black text-[#EBDCC4]">Verify Email</AlertDialogTitle>
              <AlertDialogDescription className="text-[#B6A596] text-xs text-center">
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
              <div className="text-[#B6A596] text-xs text-center">
                {resendCountdown > 0 ? (
                  <span>Resend code in <strong className="text-[#EBDCC4]">{resendCountdown}s</strong></span>
                ) : (
                  <button onClick={handleSendVerification} className="text-[#DC9F85] hover:text-[#DC9F85] underline font-bold" disabled={isProcessingOTP}>
                    Resend Secure Code
                  </button>
                )}
              </div>
            </div>
            <AlertDialogFooter className="flex-col sm:flex-col gap-3">
              <Button onClick={(e) => { e.preventDefault(); handleVerifyOTP(); }} disabled={verifyOtpCode.length !== 6 || isProcessingOTP} className="w-full bg-blue-600 text-[#EBDCC4] py-4 rounded-lg font-bold tracking-widest uppercase text-xs hover:bg-[#DC9F85] transition-colors shadow-[0_0_20px_rgba(59,130,246,0.3)] disabled:opacity-50">
                Verify
              </Button>
              <AlertDialogCancel onClick={() => { setShowVerifyOtpModal(false); setShowProfileModal(true); setVerifyOtpCode(""); }} className="w-full mt-0 sm:mt-0 bg-[#1F1A17] text-[#EBDCC4] py-4 rounded-lg font-bold tracking-widest uppercase text-xs hover:bg-[#231E1A] transition-colors border-[#66473B]/40">
                Cancel
              </AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Update Email OTP Modal */}
        <AlertDialog open={showUpdateEmailOtpModal} onOpenChange={setShowUpdateEmailOtpModal}>
          <AlertDialogContent className="bg-[#050505] border-[#66473B]/50 shadow-[0_0_50px_rgba(59,130,246,0.1)] sm:max-w-sm gap-6">
            <AlertDialogHeader className="items-center">
              <AnimatedIcon name="lock_person" className="text-4xl text-[#DC9F85] mb-2 animate-pulse" />
              <AlertDialogTitle className="text-2xl font-black text-[#EBDCC4]">Confirm Identity</AlertDialogTitle>
              <AlertDialogDescription className="text-[#B6A596] text-xs text-center">
                Enter the 6-digit verification code sent to your <strong className="text-[#EBDCC4]">{newEmailInput}</strong> email mock console to finalize the update.
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
              <div className="text-[#B6A596] text-xs text-center">
                {resendCountdown > 0 ? (
                  <span>Resend code in <strong className="text-[#EBDCC4]">{resendCountdown}s</strong></span>
                ) : (
                  <button onClick={handleUpdateEmailRequest} className="text-[#DC9F85] hover:text-[#DC9F85] underline font-bold" disabled={isProcessingOTP}>
                    Resend Secure Code
                  </button>
                )}
              </div>
            </div>
            <AlertDialogFooter className="flex-col sm:flex-col gap-3">
              <Button onClick={(e) => { e.preventDefault(); handleVerifyEmailUpdate(); }} disabled={updateEmailOtpCode.length !== 6 || isProcessingOTP} className="w-full bg-blue-600 text-[#EBDCC4] py-4 rounded-lg font-bold tracking-widest uppercase text-xs hover:bg-[#DC9F85] transition-colors shadow-[0_0_20px_rgba(59,130,246,0.3)] disabled:opacity-50">
                Verify & Update
              </Button>
              <AlertDialogCancel onClick={() => { setShowUpdateEmailOtpModal(false); setShowSettingsModal(true); setUpdateEmailOtpCode(""); }} className="w-full mt-0 sm:mt-0 bg-[#1F1A17] text-[#EBDCC4] py-4 rounded-lg font-bold tracking-widest uppercase text-xs hover:bg-[#231E1A] transition-colors border-[#66473B]/40">
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
