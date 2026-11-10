import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  onSnapshot,
  collectionGroup,
} from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from './lib/firebase';
import {
  UserProfile,
  Audit,
  InteractionMessage,
  StandardDocItem,
  ScorecardReportDoc,
  AdminMeResponse,
} from './types';
import { Header } from './components/Header';
import { BottomNav, NavTab } from './components/BottomNav';
import { ToastContainer, ToastMessage } from './components/Toast';
import { Modal } from './components/Modal';

import { LandingView } from './views/LandingView';
import { HomeView } from './views/HomeView';
import { ProfileView } from './views/ProfileView';
import { InterviewView } from './views/InterviewView';
import { MyRecordsView } from './views/MyRecordsView';
import { StandardsView } from './views/StandardsView';
import { ScorecardView } from './views/ScorecardView';
import { ReportsView } from './views/ReportsView';

// Strict Undefined-Stripping Utility (Directive 6)
function stripUndefined<T>(obj: T): T {
  return JSON.parse(
    JSON.stringify(obj, (_k, v) => (v === undefined ? null : v))
  );
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Admin status from GET /api/me
  const [adminStatus, setAdminStatus] = useState<AdminMeResponse | null>(null);

  // User state
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [myAudits, setMyAudits] = useState<Audit[]>([]);
  const [activeAudit, setActiveAudit] = useState<Audit | null>(null);
  const [activeInteractions, setActiveInteractions] = useState<InteractionMessage[]>([]);

  // Admin state
  const [standards, setStandards] = useState<StandardDocItem[]>([]);
  const [allAudits, setAllAudits] = useState<Audit[]>([]);
  const [allInteractions, setAllInteractions] = useState<InteractionMessage[]>([]);
  const [savedReports, setSavedReports] = useState<ScorecardReportDoc[]>([]);

  // UI Navigation & Modals
  const [currentTab, setCurrentTab] = useState<NavTab>('home');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isStartingAudit, setIsStartingAudit] = useState(false);
  const [isBuildingCard, setIsBuildingCard] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);

  // Active unsubscription holders (Rule 8.E)
  const unsubscribersRef = useRef<(() => void)[]>([]);

  const addToast = (
    message: string,
    type: 'info' | 'success' | 'error' = 'info',
    actionLabel?: string,
    onAction?: () => void
  ) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, type, actionLabel, onAction }]);
    if (!actionLabel) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 5000);
    }
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Helper to fetch GET /api/me
  const checkAdminMe = async (user: User) => {
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/me', {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (res.ok) {
        const data: AdminMeResponse = await res.json();
        setAdminStatus(data);
      }
    } catch (e) {
      console.warn('Failed to verify admin status via /api/me:', e);
    }
  };

  // Auth State Listener
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      // Unsubscribe all active Firestore listeners before switching users (Rule 8.E)
      unsubscribersRef.current.forEach((unsub) => {
        try {
          unsub();
        } catch (_) {}
      });
      unsubscribersRef.current = [];

      setCurrentUser(user);
      setActiveAudit(null);
      setActiveInteractions([]);
      setAdminStatus(null);

      if (user) {
        await checkAdminMe(user);

        // 1. Listen to User Profile
        const profileRef = doc(db, 'users', user.uid);
        const unsubProfile = onSnapshot(
          profileRef,
          (snap) => {
            if (snap.exists()) {
              setUserProfile(snap.data() as UserProfile);
            } else {
              setUserProfile(null);
            }
          },
          (err) => {
            console.error('Profile snapshot error:', err);
            addToast('Could not sync user profile with server.', 'error');
          }
        );
        unsubscribersRef.current.push(unsubProfile);

        // 2. Listen to User's Audits
        const auditsCol = collection(db, 'users', user.uid, 'audits');
        const unsubAudits = onSnapshot(
          auditsCol,
          (snap) => {
            const list: Audit[] = [];
            snap.forEach((d) => list.push(d.data() as Audit));
            // Sort by createdAt descending in code (Rule 8.B)
            list.sort(
              (a, b) =>
                new Date(b.createdAt || 0).getTime() -
                new Date(a.createdAt || 0).getTime()
            );
            setMyAudits(list);
          },
          (err) => {
            console.error('Audits snapshot error:', err);
            addToast('Could not load past audits.', 'error');
          }
        );
        unsubscribersRef.current.push(unsubAudits);

        // 3. Listen to Service Standards (Readable by all authenticated users)
        const standardsDoc = doc(db, 'settings', 'serviceStandards');
        const unsubStandards = onSnapshot(
          standardsDoc,
          (snap) => {
            if (snap.exists()) {
              const data = snap.data();
              setStandards(Array.isArray(data?.documents) ? data.documents : []);
            } else {
              setStandards([]);
            }
          },
          (err) => {
            console.warn('Standards snapshot read notice:', err);
          }
        );
        unsubscribersRef.current.push(unsubStandards);
      } else {
        setUserProfile(null);
        setMyAudits([]);
        setStandards([]);
        setAllAudits([]);
        setAllInteractions([]);
        setSavedReports([]);
      }
      setAuthLoading(false);
    });

    return () => {
      unsubscribeAuth();
      unsubscribersRef.current.forEach((unsub) => {
        try {
          unsub();
        } catch (_) {}
      });
      unsubscribersRef.current = [];
    };
  }, []);

  // Admin Data Listeners (active when adminStatus.isAdmin === true)
  useEffect(() => {
    if (!currentUser || !adminStatus?.isAdmin) return;

    // Listen to collectionGroup('audits')
    const auditsGroupQuery = query(collectionGroup(db, 'audits'));
    const unsubAllAudits = onSnapshot(
      auditsGroupQuery,
      (snap) => {
        const list: Audit[] = [];
        snap.forEach((d) => list.push(d.data() as Audit));
        list.sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime()
        );
        setAllAudits(list);
      },
      (err) => {
        console.warn('Admin audits group error:', err);
      }
    );

    // Listen to collectionGroup('interactions')
    const interactionsGroupQuery = query(collectionGroup(db, 'interactions'));
    const unsubAllInteractions = onSnapshot(
      interactionsGroupQuery,
      (snap) => {
        const list: InteractionMessage[] = [];
        snap.forEach((d) => list.push(d.data() as InteractionMessage));
        setAllInteractions(list);
      },
      (err) => {
        console.warn('Admin interactions group error:', err);
      }
    );

    // Listen to /scorecardReports
    const reportsCol = collection(db, 'scorecardReports');
    const unsubReports = onSnapshot(
      reportsCol,
      (snap) => {
        const list: ScorecardReportDoc[] = [];
        snap.forEach((d) => list.push(d.data() as ScorecardReportDoc));
        list.sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime()
        );
        setSavedReports(list);
      },
      (err) => {
        console.warn('Reports collection error:', err);
      }
    );

    return () => {
      unsubAllAudits();
      unsubAllInteractions();
      unsubReports();
    };
  }, [currentUser, adminStatus?.isAdmin]);

  // Active Audit Interactions Listener
  useEffect(() => {
    if (!currentUser || !activeAudit) {
      setActiveInteractions([]);
      return;
    }

    const interactionsCol = collection(db, 'users', currentUser.uid, 'interactions');
    const q = query(interactionsCol, where('auditId', '==', activeAudit.id));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: InteractionMessage[] = [];
        snap.forEach((d) => list.push(d.data() as InteractionMessage));
        // Sort in code by timestamp (Rule 8.B)
        list.sort(
          (a, b) =>
            new Date(a.timestamp || 0).getTime() -
            new Date(b.timestamp || 0).getTime()
        );
        setActiveInteractions(list);
      },
      (err) => {
        console.error('Active interactions error:', err);
        addToast('Failed to load interview dialogue.', 'error');
      }
    );

    return () => unsub();
  }, [currentUser, activeAudit?.id]);

  // Keep activeAudit in sync with myAudits updates
  useEffect(() => {
    if (activeAudit) {
      const refreshed = myAudits.find((a) => a.id === activeAudit.id);
      if (refreshed) {
        setActiveAudit(refreshed);
      }
    }
  }, [myAudits]);

  // Handlers
  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error('Sign-in error:', err);
      addToast(err.message || 'Failed to sign in with Google.', 'error');
    }
  };

  const handleSignOut = async () => {
    try {
      setShowSignOutModal(false);
      // Unsubscribe all active listeners before sign out (Rule 8.E)
      unsubscribersRef.current.forEach((unsub) => {
        try {
          unsub();
        } catch (_) {}
      });
      unsubscribersRef.current = [];
      await signOut(auth);
      setCurrentTab('home');
      addToast('Signed out successfully.', 'info');
    } catch (err: any) {
      addToast('Failed to sign out.', 'error');
    }
  };

  const handleSaveProfile = async (updated: UserProfile) => {
    if (!currentUser) return;
    const sanitized = stripUndefined(updated);
    const profileRef = doc(db, 'users', currentUser.uid);
    try {
      await setDoc(profileRef, sanitized, { merge: true });
      setUserProfile(updated);
      await checkAdminMe(currentUser);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.uid}`);
    }
  };

  // Rule 8.D: "An audit's document and its welcome message are created once, inside the click handler of the button that starts the audit."
  const handleStartServiceInterview = async () => {
    if (!currentUser) return;

    if (!userProfile?.office || !userProfile?.position) {
      addToast('Please complete your office and position profile first.', 'info');
      setCurrentTab('profile');
      return;
    }

    setIsStartingAudit(true);
    try {
      const auditId = crypto.randomUUID();
      const firstName =
        userProfile.displayName?.split(' ')[0] ||
        currentUser.displayName?.split(' ')[0] ||
        'Colleague';

      const now = new Date().toISOString();

      const newAudit: Audit = {
        id: auditId,
        userId: currentUser.uid,
        status: 'in_progress',
        stage: 1,
        answerCount: 0,
        profileSnapshot: userProfile,
        createdAt: now,
        updatedAt: now,
      };

      // Welcome message (Rule 4: fixed text, greets by first name, 4 stages, 8 questions, asks question 1)
      const welcomeContent = `Hello ${firstName}! Welcome to the DNSC Service Quality Audit. I am your Audit Guide. We will conduct a short Voice of the Customer (VOC) interview across 4 stages and 8 short questions to evaluate service response times, uncover delays, and benchmark against DNSC service standards.\n\n**Stage 1: Service & Customers**\nWhich service that you give to students or colleagues takes most of your time, and who usually asks for it?`;

      const welcomeInteractionId = `${auditId}_welcome`;
      const welcomeInteraction: InteractionMessage = {
        id: welcomeInteractionId,
        auditId,
        clientMessageId: 'welcome-seed',
        role: 'assistant',
        content: welcomeContent,
        stage: 1,
        timestamp: now,
      };

      // Write audit doc and welcome message to Firestore
      const auditRef = doc(db, 'users', currentUser.uid, 'audits', auditId);
      const interactionRef = doc(
        db,
        'users',
        currentUser.uid,
        'interactions',
        welcomeInteractionId
      );

      await setDoc(auditRef, stripUndefined(newAudit));
      await setDoc(interactionRef, stripUndefined(welcomeInteraction));

      setActiveAudit(newAudit);
      setCurrentTab('interview');
    } catch (err: any) {
      console.error('Failed to create audit:', err);
      addToast('Failed to initialize audit session.', 'error');
    } finally {
      setIsStartingAudit(false);
    }
  };

  // Rule 8.D: "Each user message gets one clientMessageId (crypto.randomUUID()); retries reuse it and the Firestore document ID is built from it, so a retry never makes a duplicate."
  // "On Send, clear the input at once, save the message, and call the server only after the save succeeds. If the browser is offline, fail immediately; otherwise stop waiting after 15 seconds."
  const handleSendMessage = async (text: string, existingClientMessageId?: string) => {
    if (!currentUser || !activeAudit) return;

    if (!navigator.onLine) {
      throw new Error('You are currently offline. Check network connection.');
    }

    const clientMessageId = existingClientMessageId || crypto.randomUUID();
    const interactionDocId = `${activeAudit.id}_${clientMessageId}`;
    const interactionRef = doc(
      db,
      'users',
      currentUser.uid,
      'interactions',
      interactionDocId
    );

    const userMessage: InteractionMessage = {
      id: interactionDocId,
      auditId: activeAudit.id,
      clientMessageId,
      role: 'user',
      content: text,
      stage: activeAudit.stage,
      timestamp: new Date().toISOString(),
    };

    // Save with 15-second timeout (Rule 8.D)
    const savePromise = setDoc(interactionRef, stripUndefined(userMessage));
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Save timed out after 15 seconds.')), 15000)
    );

    await Promise.race([savePromise, timeoutPromise]);

    // Now call the server
    const idToken = await currentUser.getIdToken();
    const resp = await fetch('/api/interview/reply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        auditId: activeAudit.id,
        clientMessageId,
        message: text,
      }),
    });

    if (!resp.ok) {
      const errData = await resp.json().catch(() => ({}));
      throw new Error(errData.error || `Server returned error (${resp.status})`);
    }

    const data = await resp.json();

    // Save assistant reply
    const assistantInteractionDocId = `${activeAudit.id}_${crypto.randomUUID()}`;
    const assistantRef = doc(
      db,
      'users',
      currentUser.uid,
      'interactions',
      assistantInteractionDocId
    );

    const assistantMessage: InteractionMessage = {
      id: assistantInteractionDocId,
      auditId: activeAudit.id,
      clientMessageId: crypto.randomUUID(),
      role: 'assistant',
      content: data.reply,
      stage: data.stage,
      timestamp: new Date().toISOString(),
      modelUsed: data.modelUsed,
    };

    await setDoc(assistantRef, stripUndefined(assistantMessage));

    // Update audit stage and answerCount
    const auditRef = doc(db, 'users', currentUser.uid, 'audits', activeAudit.id);
    await updateDoc(auditRef, {
      stage: data.stage,
      answerCount: data.answerCount,
      updatedAt: new Date().toISOString(),
    });
  };

  // Rule 6: "Build Service Card"
  const handleBuildServiceCard = async () => {
    if (!currentUser || !activeAudit) return;
    setIsBuildingCard(true);
    try {
      const idToken = await currentUser.getIdToken();
      const resp = await fetch('/api/interview/card', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ auditId: activeAudit.id }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to build Service Quality Card (${resp.status})`);
      }

      const card = await resp.json();

      const auditRef = doc(db, 'users', currentUser.uid, 'audits', activeAudit.id);
      const now = new Date().toISOString();
      const updatePayload = {
        serviceCard: card,
        status: 'completed',
        completedAt: now,
        updatedAt: now,
      };

      await updateDoc(auditRef, stripUndefined(updatePayload));
      addToast('Service Quality Card generated successfully!', 'success');
      setCurrentTab('records');
    } catch (err: any) {
      console.error('Card build error:', err);
      addToast(err.message || 'Failed to generate Service Quality Card.', 'error');
    } finally {
      setIsBuildingCard(false);
    }
  };

  // Admin standards save
  const handleSaveStandards = async (newDocs: StandardDocItem[]) => {
    if (!currentUser) return;
    const ref = doc(db, 'settings', 'serviceStandards');
    await setDoc(
      ref,
      stripUndefined({
        documents: newDocs,
        updatedAt: new Date().toISOString(),
      })
    );
  };

  // Admin report save
  const handleSaveReport = async (report: ScorecardReportDoc) => {
    if (!currentUser) return;
    const ref = doc(db, 'scorecardReports', report.id);
    await setDoc(ref, stripUndefined(report));
  };

  // Admin generate report
  const handleGenerateReport = async () => {
    if (!currentUser) throw new Error('Not authenticated');
    const idToken = await currentUser.getIdToken();
    const resp = await fetch('/api/admin/report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to generate consolidated report');
    }

    return await resp.json();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F5FC]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[#6D28D9]/30 border-t-[#6D28D9] rounded-full animate-spin" />
          <span className="text-xs font-semibold text-slate-500">
            Initializing DNSC Service Quality Audit...
          </span>
        </div>
      </div>
    );
  }

  // Not signed in: show Landing page
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#F7F5FC]">
        <Header user={null} isAdmin={false} onProfileClick={() => {}} />
        <main className="max-w-[880px] mx-auto px-4 py-6">
          <LandingView onSignIn={handleSignIn} isLoading={false} />
        </main>
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </div>
    );
  }

  const latestAudit = myAudits.length > 0 ? myAudits[0] : null;
  const isAdmin = !!adminStatus?.isAdmin;
  const adminSetupNeeded = !!adminStatus?.adminSetupNeeded;

  return (
    <div className="min-h-screen bg-[#F7F5FC] text-slate-800 flex flex-col font-body">
      {/* App Header */}
      <Header
        user={currentUser}
        isAdmin={isAdmin}
        onProfileClick={() => setCurrentTab('profile')}
      />

      {/* Main Content Area in Centered Column (max 880px, Rule Look & Feel) */}
      <main className="flex-1 max-w-[880px] w-full mx-auto px-4 pt-4 pb-20">
        {currentTab === 'home' && (
          <HomeView
            user={currentUser}
            profile={userProfile}
            latestAudit={latestAudit}
            onStartInterview={handleStartServiceInterview}
            onViewAudit={(audit) => {
              setActiveAudit(audit);
              setCurrentTab('interview');
            }}
            onOpenProfile={() => setCurrentTab('profile')}
            isStartingAudit={isStartingAudit}
          />
        )}

        {currentTab === 'interview' && (
          activeAudit ? (
            <InterviewView
              user={currentUser}
              audit={activeAudit}
              interactions={activeInteractions}
              onSendMessage={handleSendMessage}
              onBuildServiceCard={handleBuildServiceCard}
              isGeneratingCard={isBuildingCard}
              onShowToast={addToast}
            />
          ) : (
            <div className="bg-white rounded-3xl p-10 text-center border border-purple-100 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-800 text-lg">No Active Interview Session</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Start a fresh Voice of the Customer interview or select an existing session from My Records.
              </p>
              <button
                type="button"
                onClick={handleStartServiceInterview}
                disabled={isStartingAudit}
                className="px-6 py-2.5 bg-[#6D28D9] text-white font-semibold text-xs rounded-xl shadow-xs cursor-pointer hover:bg-[#5b21b6] transition-colors"
              >
                Start Service Interview
              </button>
            </div>
          )
        )}

        {currentTab === 'records' && (
          <MyRecordsView
            audits={myAudits}
            onOpenAudit={(audit) => {
              setActiveAudit(audit);
              setCurrentTab('interview');
            }}
          />
        )}

        {currentTab === 'profile' && (
          <ProfileView
            user={currentUser}
            profile={userProfile}
            adminSetupNeeded={adminSetupNeeded}
            isAdmin={isAdmin}
            onSaveProfile={handleSaveProfile}
            onSignOut={() => setShowSignOutModal(true)}
          />
        )}

        {/* Admin Tabs */}
        {isAdmin && currentTab === 'standards' && (
          <StandardsView
            documents={standards}
            onSaveStandards={handleSaveStandards}
            onShowToast={addToast}
          />
        )}

        {isAdmin && currentTab === 'scorecard' && (
          <ScorecardView allAudits={allAudits} />
        )}

        {isAdmin && currentTab === 'reports' && (
          <ReportsView
            savedReports={savedReports}
            allAudits={allAudits}
            allInteractions={allInteractions}
            onGenerateReport={handleGenerateReport}
            onSaveReport={handleSaveReport}
            onShowToast={addToast}
          />
        )}
      </main>

      {/* Fixed Bottom Navigation (Rule Look & Feel) */}
      <BottomNav
        currentTab={currentTab}
        onTabChange={(tab) => setCurrentTab(tab)}
        isAdmin={isAdmin}
      />

      {/* Sign Out In-App Confirmation Modal (Rule 8.E) */}
      <Modal
        isOpen={showSignOutModal}
        title="Confirm Sign Out"
        onClose={() => setShowSignOutModal(false)}
        confirmLabel="Sign Out"
        confirmVariant="danger"
        onConfirm={handleSignOut}
      >
        <p>
          Are you sure you want to sign out of DNSC Service Quality Audit? Unsaved interview drafts in the input field will be reset.
        </p>
      </Modal>

      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
