/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { localDb } from './services/localDb';
import { SchoolDocument, Department, DocumentCategory, UserProfile } from './types';
import { DEFAULT_DEPARTMENTS, DEFAULT_CATEGORIES, ROLE_LABELS } from './constants';

import { Navbar } from './components/Navbar';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { LoginView } from './views/LoginView';
import { PendingApprovalView } from './components/PendingApprovalView';
import { DashboardView } from './views/DashboardView';
import { SubmissionPortalView } from './views/SubmissionPortalView';
import { DocumentListView } from './views/DocumentListView';
import { RemindersView } from './views/RemindersView';
import { ReportsView } from './views/ReportsView';
import { DepartmentsView } from './views/DepartmentsView';
import { CategoriesView } from './views/CategoriesView';
import { UserManagementView } from './views/UserManagementView';
import { AdminGuideView } from './views/AdminGuideView';
import { DocumentDetailModal } from './views/DocumentDetailModal';
import { UserSwitcherModal } from './components/UserSwitcherModal';
import { School, Users2, Sparkles, CheckCircle2 } from 'lucide-react';

function MainApp() {
  const {
    activeSchool,
    currentUser,
    userProfile,
    loading,
    isApproved,
    isAdmin,
    isVicePrincipal,
    isLead,
    staffList,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isSidebarMobileOpen, setIsSidebarMobileOpen] = useState(false);
  const [isGlobalSwitcherOpen, setIsGlobalSwitcherOpen] = useState(false);

  // Core data states
  const [documents, setDocuments] = useState<SchoolDocument[]>([]);
  const [departments, setDepartments] = useState<Department[]>(DEFAULT_DEPARTMENTS);
  const [categories, setCategories] = useState<DocumentCategory[]>(DEFAULT_CATEGORIES);
  const [users, setUsers] = useState<UserProfile[]>(staffList);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Directly opened document modal from notification or quick view
  const [selectedDocForModal, setSelectedDocForModal] = useState<SchoolDocument | null>(null);

  const triggerRefresh = () => setRefreshTrigger((prev) => prev + 1);

  // Sync users when staffList in AuthContext updates
  useEffect(() => {
    if (staffList.length > 0) {
      setUsers(staffList);
    }
  }, [staffList]);

  // 1. Documents sync from localDb strictly partitioned by school
  useEffect(() => {
    if (!currentUser || !isApproved) return;

    const syncDocs = () => {
      const items = localDb.getDocuments(activeSchool.id);
      setDocuments(items);
    };

    syncDocs();
    const unsubscribe = localDb.subscribe(syncDocs);
    return () => unsubscribe();
  }, [currentUser, isApproved, refreshTrigger, activeSchool.id]);

  // 2. Departments sync from localDb
  useEffect(() => {
    if (!currentUser || !isApproved) return;

    const syncDepts = () => {
      const items = localDb.getDepartments(activeSchool.id);
      setDepartments(items);
    };

    syncDepts();
    const unsubscribe = localDb.subscribe(syncDepts);
    return () => unsubscribe();
  }, [currentUser, isApproved, refreshTrigger, activeSchool.id]);

  // 3. Categories sync from localDb
  useEffect(() => {
    if (!currentUser || !isApproved) return;

    const syncCats = () => {
      const items = localDb.getCategories(activeSchool.id);
      setCategories(items);
    };

    syncCats();
    const unsubscribe = localDb.subscribe(syncCats);
    return () => unsubscribe();
  }, [currentUser, isApproved, refreshTrigger, activeSchool.id]);

  // 4. Users sync from localDb and staffList
  useEffect(() => {
    if (!currentUser || !isApproved) return;

    const syncUsers = () => {
      const localUsers = localDb.getStaff(activeSchool.id);
      const merged = new Map<string, UserProfile>();
      staffList.forEach((s) => merged.set(s.uid, s));
      localUsers.forEach((u) => merged.set(u.uid, u));
      setUsers(Array.from(merged.values()));
    };

    syncUsers();
    const unsubscribe = localDb.subscribe(syncUsers);
    return () => unsubscribe();
  }, [currentUser, isApproved, refreshTrigger, activeSchool.id, staffList]);

  // Handle open document by ID (e.g. from notification)
  const handleOpenDocById = (docId: string) => {
    const target = documents.find((d) => d.id === docId);
    if (target) {
      setSelectedDocForModal(target);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100/80 via-sky-100/70 to-indigo-100/80 flex flex-col items-center justify-center text-slate-800">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-400 via-indigo-400 to-sky-400 flex items-center justify-center shadow-lg shadow-purple-200/50 animate-pulse mb-3.5">
          <School className="w-8 h-8 text-amber-200" />
        </div>
        <p className="text-sm font-bold text-purple-950">Đang khởi tạo hệ thống hồ sơ số...</p>
        <p className="text-xs text-purple-600/80 mt-1">Trường Tiểu Học Ba Chúc • 5 Tổ Khối Chuyên Môn</p>
      </div>
    );
  }

  // Not logged in -> Show Login
  if (!currentUser) {
    return <LoginView />;
  }

  // Pending approval -> Show Pending screen
  if (!isApproved) {
    return <PendingApprovalView />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50/60 via-sky-50/40 to-purple-50/40 flex flex-col font-sans text-slate-800 antialiased selection:bg-purple-200 selection:text-purple-900">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        isOpenMobile={isSidebarMobileOpen}
        onCloseMobile={() => setIsSidebarMobileOpen(false)}
      />

      {/* Main Container */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Top Navbar */}
        <Navbar
          onToggleSidebar={() => setIsSidebarMobileOpen(!isSidebarMobileOpen)}
          onSelectDocument={handleOpenDocById}
          onNavigateToTab={(tab) => setActiveTab(tab)}
        />

        {/* Dynamic Main Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {/* Quick Staff Identity Info Strip */}
          <div className="mb-4 sm:mb-6 p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-purple-100/90 via-indigo-50/90 to-sky-100/90 border border-purple-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                <Sparkles className="w-4 h-4 text-amber-200" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-purple-950 truncate">
                  👋 Bạn đang làm việc với tư cách:{' '}
                  <span className="text-purple-800 font-extrabold">{userProfile?.displayName || currentUser?.displayName}</span>
                </p>
                <p className="text-[11px] text-slate-600 truncate">
                  Nhiệm vụ: <strong className="text-purple-900 font-semibold">{userProfile?.role ? ROLE_LABELS[userProfile.role]?.label : 'Giáo viên'}</strong> • {userProfile?.departmentName || 'Ban Giám Hiệu'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsGlobalSwitcherOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-purple-50 text-purple-900 border border-purple-200 font-bold text-xs shadow-2xs transition active:scale-95 cursor-pointer flex items-center gap-1.5 shrink-0"
              title="Bấm để chuyển đổi sang giáo viên hoặc khối lớp khác"
            >
              <Users2 className="w-3.5 h-3.5 text-purple-600" />
              <span>Đổi tài khoản giáo viên</span>
            </button>
          </div>

          {activeTab === 'dashboard' && (
            <DashboardView
              documents={documents}
              departments={departments}
              categories={categories}
              onOpenSubmit={() => setActiveTab('submit')}
              onSelectDocument={(doc) => setSelectedDocForModal(doc)}
              onNavigateToTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'submit' && (
            <SubmissionPortalView
              departments={departments}
              categories={categories}
              onSuccess={(newDocId) => {
                triggerRefresh();
                setActiveTab('documents');
              }}
              onCancel={() => setActiveTab('dashboard')}
            />
          )}

          {activeTab === 'documents' && (
            <DocumentListView
              documents={documents}
              departments={departments}
              categories={categories}
              onOpenSubmit={() => setActiveTab('submit')}
              onRefresh={triggerRefresh}
              initialSelectedDoc={selectedDocForModal}
            />
          )}

          {activeTab === 'reminders' && (
            <RemindersView
              documents={documents}
              departments={departments}
              users={users}
              onSelectDocument={(doc) => setSelectedDocForModal(doc)}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView
              documents={documents}
              departments={departments}
              users={users}
              categories={categories}
            />
          )}

          {activeTab === 'departments' && (
            <DepartmentsView
              departments={departments}
              users={users}
              onRefresh={triggerRefresh}
            />
          )}

          {activeTab === 'categories' && (
            <CategoriesView
              categories={categories}
              onRefresh={triggerRefresh}
            />
          )}

          {activeTab === 'users' && (
            <UserManagementView
              users={users}
              departments={departments}
              onRefresh={triggerRefresh}
            />
          )}

          {activeTab === 'guide' && <AdminGuideView />}
        </main>
      </div>

      {/* Floating Modal if a document was selected */}
      {selectedDocForModal && (
        <DocumentDetailModal
          document={selectedDocForModal}
          onClose={() => setSelectedDocForModal(null)}
          onRefresh={triggerRefresh}
        />
      )}

      {/* User Switcher Modal */}
      <UserSwitcherModal
        isOpen={isGlobalSwitcherOpen}
        onClose={() => setIsGlobalSwitcherOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
