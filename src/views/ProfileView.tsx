import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { UserProfile, RoleCategory } from '../types';
import { ShieldAlert, Check, LogOut, Copy, CheckCircle2 } from 'lucide-react';

interface ProfileViewProps {
  user: User;
  profile: UserProfile | null;
  adminSetupNeeded: boolean;
  isAdmin: boolean;
  onSaveProfile: (updated: UserProfile) => Promise<void>;
  onSignOut: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  profile,
  adminSetupNeeded,
  isAdmin,
  onSaveProfile,
  onSignOut,
}) => {
  const [office, setOffice] = useState('');
  const [roleCategory, setRoleCategory] = useState<RoleCategory>('Faculty');
  const [position, setPosition] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [yearsInRole, setYearsInRole] = useState(0);

  const [errorMsg, setErrorMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedUid, setCopiedUid] = useState(false);

  // Refill fields from the saved document every time it opens (Build Rule 8.E)
  useEffect(() => {
    if (profile) {
      setOffice(profile.office || '');
      setRoleCategory(profile.roleCategory || 'Faculty');
      setPosition(profile.position || '');
      setJobDescription(profile.jobDescription || '');
      setYearsInRole(typeof profile.yearsInRole === 'number' ? profile.yearsInRole : 0);
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Form validations
    if (!office.trim()) {
      setErrorMsg('Please specify your office or institute.');
      return;
    }
    if (office.length > 150) {
      setErrorMsg('Office or institute name cannot exceed 150 characters.');
      return;
    }
    if (!position.trim()) {
      setErrorMsg('Please specify your position or title.');
      return;
    }
    if (position.length > 150) {
      setErrorMsg('Position cannot exceed 150 characters.');
      return;
    }
    if (!jobDescription.trim()) {
      setErrorMsg('Please enter a brief description of your key responsibilities.');
      return;
    }
    if (jobDescription.length > 1000) {
      setErrorMsg('Job description cannot exceed 1,000 characters.');
      return;
    }
    if (isNaN(yearsInRole) || yearsInRole < 0 || yearsInRole > 50) {
      setErrorMsg('Years in role must be a whole number between 0 and 50.');
      return;
    }

    setIsSaving(true);
    try {
      await onSaveProfile({
        office: office.trim(),
        roleCategory,
        position: position.trim(),
        jobDescription: jobDescription.trim(),
        yearsInRole: Math.round(yearsInRole),
        displayName: user.displayName || 'Employee',
        photoURL: user.photoURL || '',
        updatedAt: new Date().toISOString(),
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save profile. Please check connection and try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const copyUidToClipboard = () => {
    navigator.clipboard.writeText(user.uid);
    setCopiedUid(true);
    setTimeout(() => setCopiedUid(false), 2000);
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-200">
      {/* Super Admin Setup Card (Rule 1 & 8.A) */}
      {adminSetupNeeded && (
        <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 shadow-sm">
          <div className="flex items-start gap-3">
            <ShieldAlert className="text-amber-600 mt-0.5 shrink-0" size={24} />
            <div className="flex-1">
              <h3 className="font-semibold text-base mb-1">
                Super Administrator Setup Required
              </h3>
              <p className="text-sm text-amber-800 leading-relaxed mb-4">
                Your email matches <code className="bg-amber-100 px-1.5 py-0.5 rounded text-amber-900 font-mono text-xs">{user.email}</code>, but your administrator document has not yet been registered in Cloud Firestore.
              </p>

              <div className="p-4 rounded-xl bg-white border border-amber-200 space-y-3 text-xs">
                <div>
                  <span className="font-semibold text-slate-700 block mb-1">
                    Your Firebase Auth UID:
                  </span>
                  <div className="flex items-center gap-2">
                    <code className="bg-slate-100 p-2 rounded-md font-mono text-slate-800 flex-1 truncate select-all">
                      {user.uid}
                    </code>
                    <button
                      type="button"
                      onClick={copyUidToClipboard}
                      className="px-3 py-2 bg-amber-100 hover:bg-amber-200 text-amber-900 font-medium rounded-md flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      {copiedUid ? <Check size={14} /> : <Copy size={14} />}
                      {copiedUid ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>

                <div>
                  <span className="font-semibold text-slate-700 block mb-1">
                    Exact Document to Create in Firebase Console:
                  </span>
                  <div className="bg-slate-900 text-emerald-400 p-3 rounded-lg font-mono text-[11px] leading-relaxed select-all">
                    Collection: <span className="text-white">admins</span><br />
                    Document ID: <span className="text-white">{user.uid}</span><br />
                    Field: <span className="text-white">role</span> (string) = <span className="text-amber-300">"superadmin"</span>
                  </div>
                </div>

                <p className="text-[11px] text-amber-700">
                  After creating this document in your Firebase Console, refresh this page to access administrative standards, scorecards, and reports.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Form Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-purple-100 p-6 sm:p-8">
        <div className="flex items-center gap-4 pb-6 mb-6 border-b border-slate-100">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || 'User'}
              className="w-16 h-16 rounded-full object-cover border-2 border-purple-200"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-[#0F766E] text-white flex items-center justify-center font-bold text-xl">
              {(user.displayName || user.email || 'U').slice(0, 2).toUpperCase()}
            </div>
          )}

          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {user.displayName || 'Employee Profile'}
            </h2>
            <p className="text-xs text-slate-500">{user.email}</p>
            {isAdmin && (
              <span className="inline-block mt-1 text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                Verified Super Administrator
              </span>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
              {errorMsg}
            </div>
          )}

          {savedSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
              <CheckCircle2 size={16} />
              Profile details saved successfully.
            </div>
          )}

          {/* Office / Institute */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Office or Institute *
            </label>
            <input
              type="text"
              value={office}
              onChange={(e) => setOffice(e.target.value)}
              placeholder="e.g. Institute of Computing, Registrar's Office, HRMD"
              maxLength={150}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#6D28D9]/20 focus:border-[#6D28D9] transition-all bg-slate-50/50"
            />
          </div>

          {/* Role Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Role Category *
            </label>
            <select
              value={roleCategory}
              onChange={(e) => setRoleCategory(e.target.value as RoleCategory)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#6D28D9]/20 focus:border-[#6D28D9] transition-all bg-slate-50/50"
            >
              <option value="Faculty">Faculty (Instructional Services - IS)</option>
              <option value="Program Chair">Program Chair (Program Leadership & IS - PR)</option>
              <option value="Administrative Staff">Administrative Staff (Support Services - SS)</option>
            </select>
            <p className="text-[11px] text-slate-500 mt-1">
              Used by the AI Audit Guide to match appropriate quality standards and audit focus.
            </p>
          </div>

          {/* Position */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Position or Designation *
            </label>
            <input
              type="text"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="e.g. Associate Professor II, Records Officer I, Dean"
              maxLength={150}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#6D28D9]/20 focus:border-[#6D28D9] transition-all bg-slate-50/50"
            />
          </div>

          {/* Job Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Primary Job Responsibilities *
            </label>
            <textarea
              rows={3}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Describe the main services, student interactions, or administrative deliverables you manage..."
              maxLength={1000}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#6D28D9]/20 focus:border-[#6D28D9] transition-all bg-slate-50/50"
            />
            <div className="flex justify-end text-[11px] text-slate-400 mt-0.5">
              {jobDescription.length}/1000
            </div>
          </div>

          {/* Years in Role */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Years in Role (0 – 50) *
            </label>
            <input
              type="number"
              min={0}
              max={50}
              value={yearsInRole}
              onChange={(e) => setYearsInRole(parseInt(e.target.value, 10) || 0)}
              required
              className="w-full sm:w-48 px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#6D28D9]/20 focus:border-[#6D28D9] transition-all bg-slate-50/50"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-4 flex items-center justify-between border-t border-slate-100">
            <button
              type="button"
              onClick={onSignOut}
              className="px-4 py-2.5 text-xs font-semibold text-rose-700 hover:text-rose-800 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <LogOut size={16} />
              Sign Out
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-[#6D28D9] hover:bg-[#5b21b6] text-white text-xs font-semibold rounded-xl shadow-sm active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <Check size={16} />
              )}
              Save Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
