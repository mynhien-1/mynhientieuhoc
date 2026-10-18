import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserProfile, UserRole, UserStatus, Department } from '../types';
import { ROLE_LABELS, INITIAL_ADMIN_EMAIL } from '../constants';
import {
  UserCog,
  CheckCircle,
  XCircle,
  Shield,
  Search,
  UserCheck,
  UserX,
  Mail,
  Edit2,
  Clock,
  AlertTriangle,
  Plus,
  Share2,
  School,
  Gift,
  Copy,
  Check,
  ExternalLink,
  Trash2,
  LogIn,
  FileSpreadsheet,
  Phone,
  Sparkles,
  HelpCircle,
  X,
  Layers,
  Crown,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Send,
  BellRing,
  Info,
} from 'lucide-react';

interface Props {
  users: UserProfile[];
  departments: Department[];
  onRefresh: () => void;
}

export const UserManagementView: React.FC<Props> = ({ users, departments, onRefresh }) => {
  const {
    activeSchool,
    schoolList,
    createSchoolWorkspace,
    updateSchoolWorkspace,
    getSchoolShareLink,
    switchSchool,
    staffList,
    updateStaffMember,
    addNewStaffMember,
    deleteStaffMember,
    batchImportStaff,
    switchUser,
    currentUser,
    isSystemOwner,
    systemOwnerEmail,
    giftRequests,
    submitGiftSchoolRequest,
    approveGiftSchoolRequest,
    rejectGiftSchoolRequest,
  } = useAuth();

  // Active tab filter
  const [activeTab, setActiveTab] = useState<'all' | 'bgh' | 'khoi_1' | 'khoi_2' | 'khoi_3' | 'khoi_4' | 'khoi_5' | 'pending'>('all');
  const [search, setSearch] = useState('');
  const [copiedSchoolLink, setCopiedSchoolLink] = useState(false);

  // Modals
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showGiftSchoolModal, setShowGiftSchoolModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editPosition, setEditPosition] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('teacher');
  const [editDeptId, setEditDeptId] = useState<string>('khoi_1');
  const [editStatus, setEditStatus] = useState<UserStatus>('active');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New staff form state
  const [newName, setNewName] = useState('');
  const [newPosition, setNewPosition] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('teacher');
  const [newDeptId, setNewDeptId] = useState<string>('khoi_1');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');

  // Gift school modal state & Owner Approval states
  const [giftTab, setGiftTab] = useState<'requests' | 'create' | 'history'>('requests');
  const [giftSchoolName, setGiftSchoolName] = useState('');
  const [giftSchoolCode, setGiftSchoolCode] = useState('');
  const [giftPrincipal, setGiftPrincipal] = useState('');
  const [giftYear, setGiftYear] = useState('2026-2027');
  const [giftRequesterName, setGiftRequesterName] = useState('');
  const [giftRequesterEmail, setGiftRequesterEmail] = useState('');
  const [giftRequesterPhone, setGiftRequesterPhone] = useState('');
  const [giftReason, setGiftReason] = useState('');
  const [createdGiftLink, setCreatedGiftLink] = useState<string | null>(null);
  const [copiedGiftLink, setCopiedGiftLink] = useState(false);
  const [copiedReqId, setCopiedReqId] = useState<string | null>(null);
  const [isCreatingSchool, setIsCreatingSchool] = useState(false);
  const [requestSentMessage, setRequestSentMessage] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  // Batch paste state
  const [batchText, setBatchText] = useState('');
  const [batchLoading, setBatchLoading] = useState(false);

  // Department name lookup
  const deptMap = new Map<string, string>();
  departments.forEach((d) => deptMap.set(d.id, d.name));

  // Determine current active list (prefer staffList from context for reactive updates)
  const displayList = staffList && staffList.length > 0 ? staffList : users;

  const filteredUsers = displayList.filter((u) => {
    if (activeTab === 'pending' && u.status !== 'pending') return false;
    if (activeTab === 'bgh') {
      if (u.role !== 'admin' && u.role !== 'vice_principal') return false;
    } else if (activeTab !== 'all') {
      if (u.departmentId !== activeTab) return false;
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        u.displayName?.toLowerCase().includes(q) ||
        u.positionTitle?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.phone?.toLowerCase().includes(q) ||
        (u.departmentName && u.departmentName.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const startEdit = (u: UserProfile) => {
    setEditingUser(u);
    setEditName(u.displayName || '');
    setEditPosition(u.positionTitle || (u.role === 'admin' ? 'Hiệu trưởng' : u.role === 'vice_principal' ? 'Phó Hiệu trưởng' : u.role === 'lead' ? 'Tổ trưởng chuyên môn' : 'Giáo viên'));
    setEditRole(u.role);
    setEditDeptId(u.departmentId || departments[0]?.id || 'khoi_1');
    setEditStatus(u.status || 'active');
    setEditEmail(u.email || '');
    setEditPhone(u.phone || '');
    setError(null);
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;
    if (!editName.trim()) {
      setError('Họ và tên không được để trống.');
      return;
    }

    setSaving(true);
    setError(null);

    const isTargetInitialAdmin = editingUser.email.toLowerCase() === INITIAL_ADMIN_EMAIL.toLowerCase();

    // Prevent demoting initial admin
    if (isTargetInitialAdmin && (editRole !== 'admin' || editStatus !== 'active')) {
      setError('Không thể hạ quyền hoặc vô hiệu hóa tài khoản Quản trị viên gốc.');
      setSaving(false);
      return;
    }

    try {
      const selectedDept = departments.find((d) => d.id === editDeptId);
      const deptName =
        editRole === 'admin' || editRole === 'vice_principal'
          ? 'Ban Giám Hiệu'
          : (selectedDept?.name || deptMap.get(editDeptId) || 'Tổ Khối');

      await updateStaffMember(editingUser.uid, {
        displayName: editName.trim(),
        positionTitle: editPosition.trim(),
        role: editRole,
        departmentId: editRole === 'admin' || editRole === 'vice_principal' ? '' : editDeptId,
        departmentName: deptName,
        status: editStatus,
        email: editEmail.trim() || editingUser.email,
        phone: editPhone.trim(),
      });

      setEditingUser(null);
      onRefresh();
    } catch (e: any) {
      setError(e.message || 'Lỗi khi cập nhật thông tin nhân sự.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setSaving(true);
    try {
      const selectedDept = departments.find((d) => d.id === newDeptId);
      const deptName =
        newRole === 'admin' || newRole === 'vice_principal'
          ? 'Ban Giám Hiệu'
          : (selectedDept?.name || deptMap.get(newDeptId) || 'Tổ Khối');

      await addNewStaffMember({
        displayName: newName.trim(),
        positionTitle: newPosition.trim() || (newRole === 'admin' ? 'Hiệu trưởng' : newRole === 'vice_principal' ? 'Phó Hiệu trưởng' : newRole === 'lead' ? 'Tổ trưởng chuyên môn' : 'Giáo viên'),
        role: newRole,
        departmentId: newRole === 'admin' || newRole === 'vice_principal' ? '' : newDeptId,
        departmentName: deptName,
        email: newEmail.trim() || undefined,
        phone: newPhone.trim(),
        status: 'active',
      });

      setNewName('');
      setNewPosition('');
      setNewEmail('');
      setNewPhone('');
      setShowAddModal(false);
      onRefresh();
    } catch (err: any) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteStaff = async (u: UserProfile) => {
    if (u.email.toLowerCase() === INITIAL_ADMIN_EMAIL.toLowerCase()) {
      alert('Không thể xóa Quản trị viên gốc.');
      return;
    }
    if (window.confirm(`Bạn có chắc muốn xóa nhân sự "${u.displayName}" (${u.positionTitle || u.role}) khỏi trường ${activeSchool.name}?`)) {
      await deleteStaffMember(u.uid);
      onRefresh();
    }
  };

  const handleSwitchToUser = async (u: UserProfile) => {
    await switchUser(u.uid);
    alert(`Đã chuyển sang tài khoản của: ${u.displayName} (${u.positionTitle || u.role}). Bạn có thể trải nghiệm ngay các chức năng theo đúng phân quyền của người này!`);
  };

  const handleCopyCurrentSchoolLink = () => {
    const link = getSchoolShareLink(activeSchool.id);
    navigator.clipboard.writeText(link);
    setCopiedSchoolLink(true);
    setTimeout(() => setCopiedSchoolLink(false), 2500);
  };

  const handleCreateOrRequestGiftSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!giftSchoolName.trim()) return;

    setIsCreatingSchool(true);
    try {
      if (isSystemOwner) {
        // Owner directly creates and activates immediately
        const created = await createSchoolWorkspace({
          name: giftSchoolName.trim(),
          code: giftSchoolCode.trim() || undefined,
          principalName: giftPrincipal.trim() || undefined,
          academicYear: giftYear,
        });

        const shareLink = getSchoolShareLink(created.id);
        setCreatedGiftLink(shareLink);
      } else {
        // Non-owner: submit request requiring approval from mynhienbobeo@gmail.com
        const req = await submitGiftSchoolRequest({
          schoolName: giftSchoolName.trim(),
          schoolCode: giftSchoolCode.trim() || undefined,
          principalName: giftPrincipal.trim() || undefined,
          requesterName: giftRequesterName.trim() || currentUser?.displayName || 'Đại diện nhà trường',
          requesterEmail: giftRequesterEmail.trim() || currentUser?.email || '',
          requesterPhone: giftRequesterPhone.trim(),
          academicYear: giftYear,
          reasonOrNote: giftReason.trim() || 'Xin cấp quyền sử dụng app cho trường',
        });

        setRequestSentMessage(
          `Yêu cầu tặng app cho trường "${req.schoolName}" đã được gửi tới Chủ sở hữu Cô Trương Thị Mỹ Nhiên (${INITIAL_ADMIN_EMAIL}). Sau khi cô phê duyệt, liên kết độc lập của trường bạn sẽ được kích hoạt ngay!`
        );
      }
    } finally {
      setIsCreatingSchool(false);
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    setApprovingId(requestId);
    try {
      const { school, shareLink } = await approveGiftSchoolRequest(requestId);
      setCreatedGiftLink(shareLink);
      setGiftSchoolName(school.name);
      alert(`Đã phê duyệt thành công! Trường "${school.name}" đã được kích hoạt trên hệ thống.`);
    } catch (err: any) {
      alert(`Lỗi phê duyệt: ${err.message}`);
    } finally {
      setApprovingId(null);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    const reason = window.prompt(
      'Vui lòng nhập lý do từ chối (tùy chọn):',
      'Chưa đủ điều kiện tiếp nhận phần mềm'
    );
    if (reason === null) return;

    setRejectingId(requestId);
    try {
      await rejectGiftSchoolRequest(requestId, reason || undefined);
      alert('Đã cập nhật trạng thái từ chối cho yêu cầu này.');
    } finally {
      setRejectingId(null);
    }
  };

  const handleCopyRequestLink = (schoolId?: string, reqId?: string) => {
    if (!schoolId) return;
    const link = getSchoolShareLink(schoolId);
    navigator.clipboard.writeText(link);
    setCopiedReqId(reqId || schoolId);
    setTimeout(() => setCopiedReqId(null), 2500);
  };

  const handleCopyGiftLink = () => {
    if (createdGiftLink) {
      navigator.clipboard.writeText(createdGiftLink);
      setCopiedGiftLink(true);
      setTimeout(() => setCopiedGiftLink(false), 2500);
    }
  };

  // Sample batch helper
  const handleLoadSampleBatch = () => {
    setBatchText(
      `Thầy Nguyễn Văn An | Hiệu trưởng | Ban Giám Hiệu\nCô Trần Thị Bình | Phó Hiệu trưởng | Ban Giám Hiệu\nCô Lê Thị Mai | Tổ trưởng Tổ 1 | Khối 1\nThầy Phạm Minh Tuấn | Giáo viên CN lớp 1A | Khối 1\nCô Đỗ Thanh Hương | Tổ trưởng Tổ 2 | Khối 2\nCô Hoàng Ngọc Lan | Giáo viên CN lớp 2B | Khối 2\nThầy Bùi Đức Anh | Tổ trưởng Tổ 3 | Khối 3\nCô Vũ Kim Chi | Giáo viên CN lớp 3A | Khối 3\nThầy Đặng Quốc Việt | Tổ trưởng Tổ 4 | Khối 4\nCô Ngô Mỹ Linh | Giáo viên CN lớp 4C | Khối 4\nThầy Phan Đình Trọng | Tổ trưởng Tổ 5 | Khối 5\nCô Nguyễn Thu Thảo | Giáo viên CN lớp 5A | Khối 5\nThầy Trương Văn Dũng | Giáo viên Tin học & Công nghệ | Khối 4\nCô Lâm Hải Yến | Giáo viên Tiếng Anh | Khối 3\nThầy Võ Minh Trí | Tổng phụ trách Đội | Ban Giám Hiệu`
    );
  };

  const handleProcessBatchImport = async () => {
    if (!batchText.trim()) return;
    setBatchLoading(true);

    try {
      const lines = batchText.split('\n').filter((l) => l.trim().length > 0);
      const parsedStaff: Partial<UserProfile>[] = [];

      for (const line of lines) {
        const parts = line.split('|').map((p) => p.trim());
        const name = parts[0];
        const position = parts[1] || 'Giáo viên';
        const deptRaw = parts[2]?.toLowerCase() || '';

        let role: UserRole = 'teacher';
        let deptId = 'khoi_1';
        let deptName = 'Tổ Khối 1';

        if (position.toLowerCase().includes('hiệu trưởng') && !position.toLowerCase().includes('phó')) {
          role = 'admin';
          deptId = '';
          deptName = 'Ban Giám Hiệu';
        } else if (position.toLowerCase().includes('phó hiệu trưởng') || position.toLowerCase().includes('bgh')) {
          role = 'vice_principal';
          deptId = '';
          deptName = 'Ban Giám Hiệu';
        } else if (position.toLowerCase().includes('tổ trưởng') || position.toLowerCase().includes('trưởng')) {
          role = 'lead';
        }

        if (deptRaw.includes('1')) {
          deptId = 'khoi_1';
          deptName = 'Tổ Khối 1';
        } else if (deptRaw.includes('2')) {
          deptId = 'khoi_2';
          deptName = 'Tổ Khối 2';
        } else if (deptRaw.includes('3')) {
          deptId = 'khoi_3';
          deptName = 'Tổ Khối 3';
        } else if (deptRaw.includes('4')) {
          deptId = 'khoi_4';
          deptName = 'Tổ Khối 4';
        } else if (deptRaw.includes('5')) {
          deptId = 'khoi_5';
          deptName = 'Tổ Khối 5';
        } else if (deptRaw.includes('bgh') || deptRaw.includes('giám hiệu')) {
          deptId = '';
          deptName = 'Ban Giám Hiệu';
        }

        parsedStaff.push({
          displayName: name,
          positionTitle: position,
          role,
          departmentId: deptId,
          departmentName: deptName,
          status: 'active',
        });
      }

      await batchImportStaff(parsedStaff);
      setShowBatchModal(false);
      setBatchText('');
      onRefresh();
      alert(`Đã nạp thành công ${parsedStaff.length} cán bộ, giáo viên vào trường ${activeSchool.name}!`);
    } catch (e: any) {
      alert(`Lỗi nạp danh sách: ${e.message}`);
    } finally {
      setBatchLoading(false);
    }
  };

  const pendingCount = displayList.filter((u) => u.status === 'pending').length;
  const pendingGifts = giftRequests.filter((r) => r.status === 'pending');
  const pendingGiftCount = pendingGifts.length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* School Header & Gift Action Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-3xl p-5 sm:p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs text-amber-300 font-semibold">
              <School className="w-3.5 h-3.5" />
              <span>Đang quản lý: {activeSchool.name}</span>
              <span className="text-white/60">({activeSchool.code})</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <UserCog className="w-6 h-6 text-purple-300" />
              <span>Quản Lý Nhân Sự, Phân Quyền & Tặng App Cho Trường Khác</span>
            </h2>

            <p className="text-xs sm:text-sm text-purple-200/90 max-w-2xl leading-relaxed">
              Tùy chỉnh tên, chức vụ, vai trò từng cán bộ giáo viên cho phù hợp với từng trường. 
              <strong className="text-amber-300 ml-1">
                Khi tặng app cho trường khác, mỗi trường hoạt động trên không gian độc lập 100%, không làm ảnh hưởng đến số liệu của trường bạn!
              </strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Gift Button with Owner Approval Indicator */}
            <button
              type="button"
              onClick={() => {
                setCreatedGiftLink(null);
                setRequestSentMessage(null);
                setGiftTab(isSystemOwner && pendingGiftCount > 0 ? 'requests' : isSystemOwner ? 'create' : 'create');
                setShowGiftSchoolModal(true);
              }}
              className="relative px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 hover:from-amber-500 hover:to-orange-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/25 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
              title="Tặng App cho trường khác (Cần sự phê duyệt của mynhienbobeo@gmail.com)"
            >
              <Gift className="w-4 h-4 text-slate-950 shrink-0" />
              <span>🎁 Tặng App Cho Trường Khác</span>
              {isSystemOwner && pendingGiftCount > 0 ? (
                <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black animate-pulse shadow-xs">
                  {pendingGiftCount} chờ duyệt
                </span>
              ) : (
                <span className="px-1.5 py-0.5 rounded-md bg-amber-950/15 text-slate-950 text-[10px] font-extrabold border border-amber-950/20">
                  Duyệt bởi Cô Nhiên
                </span>
              )}
            </button>

            {/* Copy Current School Link */}
            <button
              type="button"
              onClick={handleCopyCurrentSchoolLink}
              className="px-3.5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 backdrop-blur-md transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
              title="Sao chép link đăng nhập trực tiếp của trường này"
            >
              {copiedSchoolLink ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-300 font-bold">Đã chép link trường!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-purple-200" />
                  <span>Sao chép link trường này</span>
                </>
              )}
            </button>

            {/* Add Staff Button */}
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="px-3.5 py-2.5 rounded-2xl bg-purple-500 hover:bg-purple-600 text-white font-bold text-xs shadow-md shadow-purple-500/30 transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm cán bộ mới</span>
            </button>

            {/* Quick Batch Import */}
            <button
              type="button"
              onClick={() => setShowBatchModal(true)}
              className="px-3.5 py-2.5 rounded-2xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-200 border border-sky-400/30 font-semibold text-xs transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
              title="Nhập danh sách nhanh từ văn bản hoặc nạp mẫu giáo viên"
            >
              <FileSpreadsheet className="w-4 h-4 text-sky-300" />
              <span>Nhập hàng loạt</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5 border-b sm:border-b-0 border-purple-100 pb-2 sm:pb-0">
          {[
            { id: 'all', label: 'Tất cả nhân sự', count: displayList.length },
            { id: 'bgh', label: 'Ban Giám Hiệu', count: displayList.filter((u) => u.role === 'admin' || u.role === 'vice_principal').length },
            { id: 'khoi_1', label: 'Khối 1', count: displayList.filter((u) => u.departmentId === 'khoi_1').length },
            { id: 'khoi_2', label: 'Khối 2', count: displayList.filter((u) => u.departmentId === 'khoi_2').length },
            { id: 'khoi_3', label: 'Khối 3', count: displayList.filter((u) => u.departmentId === 'khoi_3').length },
            { id: 'khoi_4', label: 'Khối 4', count: displayList.filter((u) => u.departmentId === 'khoi_4').length },
            { id: 'khoi_5', label: 'Khối 5', count: displayList.filter((u) => u.departmentId === 'khoi_5').length },
            { id: 'pending', label: 'Chờ duyệt', count: pendingCount, highlight: pendingCount > 0 },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-sky-500 text-white font-bold shadow-xs shadow-purple-200'
                  : 'text-slate-600 hover:bg-purple-50 hover:text-purple-900 bg-white/70 border border-purple-100/60'
              } ${tab.highlight ? 'ring-2 ring-amber-400' : ''}`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-800'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="w-3.5 h-3.5 text-purple-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Tìm theo tên, chức vụ, email, số ĐT..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs font-medium rounded-xl border border-purple-200 bg-white pl-8 pr-3 py-2 text-slate-700 focus:outline-hidden focus:border-purple-400 shadow-2xs"
          />
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white/95 rounded-2xl border border-purple-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gradient-to-r from-purple-50/80 to-sky-50/80 text-purple-950 font-bold border-b border-purple-100">
              <tr>
                <th className="py-3.5 px-4">Họ và tên</th>
                <th className="py-3.5 px-4">Chức vụ cụ thể tại trường</th>
                <th className="py-3.5 px-4">Vai trò hệ thống</th>
                <th className="py-3.5 px-4">Tổ / Khối chuyên môn</th>
                <th className="py-3.5 px-4">Email / Số điện thoại</th>
                <th className="py-3.5 px-4">Trạng thái</th>
                <th className="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-50">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 text-xs">
                    Không tìm thấy nhân sự nào trong danh sách. Bấm <strong>"Thêm cán bộ mới"</strong> hoặc <strong>"Nhập hàng loạt"</strong> để bổ sung.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const roleMeta = ROLE_LABELS[u.role] || ROLE_LABELS.teacher;
                  const isCurrentActive = currentUser?.uid === u.uid;
                  const isSuper = u.email.toLowerCase() === INITIAL_ADMIN_EMAIL.toLowerCase();

                  return (
                    <tr
                      key={u.uid}
                      className={`hover:bg-purple-50/40 transition ${
                        isCurrentActive ? 'bg-purple-50/60 font-medium' : ''
                      }`}
                    >
                      {/* Name & Avatar */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          {u.photoURL ? (
                            <img src={u.photoURL} alt="" className="w-8 h-8 rounded-full border border-purple-200 object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-200 to-sky-200 text-purple-900 flex items-center justify-center font-bold text-xs border border-purple-200 shrink-0">
                              {u.displayName?.charAt(0) || 'G'}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 block truncate">{u.displayName}</span>
                              {isCurrentActive && (
                                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded-full border border-emerald-200 shrink-0">
                                  Bạn đang đăng nhập
                                </span>
                              )}
                              {isSuper && (
                                <span className="text-[9px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full font-black border border-amber-300 shrink-0 flex items-center gap-1 shadow-2xs">
                                  <Crown className="w-2.5 h-2.5 text-amber-600" />
                                  Chủ sở hữu App
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Position Title */}
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-bold text-[11px] border border-slate-200">
                          {u.positionTitle || (u.role === 'admin' ? 'Hiệu trưởng' : u.role === 'vice_principal' ? 'Phó Hiệu trưởng' : u.role === 'lead' ? 'Tổ trưởng chuyên môn' : 'Giáo viên')}
                        </span>
                      </td>

                      {/* System Role */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[11px] font-semibold ${roleMeta.badgeClass}`}>
                          {roleMeta.label}
                        </span>
                      </td>

                      {/* Department */}
                      <td className="py-3 px-4 text-slate-700 whitespace-nowrap font-medium">
                        {u.role === 'admin' || u.role === 'vice_principal'
                          ? 'Toàn trường (BGH)'
                          : u.departmentName || 'Chưa phân tổ'}
                      </td>

                      {/* Contact Info */}
                      <td className="py-3 px-4 text-slate-600 text-[11px] min-w-[160px]">
                        <div className="truncate flex items-center gap-1" title={u.email}>
                          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{u.email}</span>
                        </div>
                        {u.phone && (
                          <div className="text-slate-500 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{u.phone}</span>
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {u.status === 'active' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-teal-700 font-semibold bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                            <CheckCircle className="w-3.5 h-3.5 text-teal-600" />
                            Đã duyệt
                          </span>
                        ) : u.status === 'pending' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-amber-800 font-semibold px-2 py-0.5 bg-amber-50 rounded-full border border-amber-200">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            Chờ duyệt
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-rose-700 font-semibold bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                            Vô hiệu hóa
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Switch to this user button */}
                          <button
                            type="button"
                            onClick={() => handleSwitchToUser(u)}
                            className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-[11px] border border-indigo-200 transition active:scale-95 flex items-center gap-1 cursor-pointer"
                            title="Đăng nhập ngay với tư cách giáo viên này để kiểm tra quyền và nộp bài"
                          >
                            <LogIn className="w-3 h-3" />
                            <span className="hidden md:inline">Đăng nhập</span>
                          </button>

                          {/* Edit button */}
                          <button
                            type="button"
                            onClick={() => startEdit(u)}
                            className="p-1.5 text-purple-700 hover:text-purple-900 hover:bg-purple-100 rounded-lg transition cursor-pointer"
                            title="Chỉnh sửa họ tên, chức vụ, vai trò, tổ khối"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete button (cannot delete initial admin) */}
                          {!isSuper && (
                            <button
                              type="button"
                              onClick={() => handleDeleteStaff(u)}
                              className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              title="Xóa giáo viên này khỏi trường"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-purple-100 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-purple-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-purple-950 text-base">
                    Chỉnh Sửa Thông Tin Cán Bộ / Giáo Viên
                  </h3>
                  <p className="text-xs text-purple-700/80">Trường: {activeSchool.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Display Name */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Họ và tên cán bộ / giáo viên <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="VD: Thầy Nguyễn Văn Nam"
                className="w-full text-xs font-semibold rounded-xl border border-purple-200 p-2.5 text-slate-800 bg-white focus:outline-hidden focus:border-purple-500 focus:ring-1 focus:ring-purple-400"
              />
            </div>

            {/* Position Title */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Chức vụ / Vị trí cụ thể tại trường <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={editPosition}
                onChange={(e) => setEditPosition(e.target.value)}
                placeholder="VD: Hiệu trưởng, Tổ trưởng Tổ 1, Giáo viên CN lớp 2A..."
                className="w-full text-xs font-medium rounded-xl border border-purple-200 p-2.5 text-slate-800 bg-white focus:outline-hidden focus:border-purple-500 focus:ring-1 focus:ring-purple-400 mb-1.5"
              />
              <div className="flex flex-wrap gap-1 text-[10px]">
                <span className="text-slate-500 self-center">Gợi ý nhanh:</span>
                {[
                  'Hiệu trưởng',
                  'Phó Hiệu trưởng',
                  'Tổ trưởng Tổ 1',
                  'Tổ phó chuyên môn',
                  'Giáo viên chủ nhiệm',
                  'Giáo viên Tiếng Anh',
                  'Giáo viên Tin học',
                  'Tổng phụ trách Đội',
                ].map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => setEditPosition(sug)}
                    className="px-2 py-0.5 rounded-md bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 cursor-pointer"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>

            {/* Role */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Vai trò hệ thống <span className="text-rose-500">*</span>
              </label>
              <select
                value={editRole}
                onChange={(e) => setEditRole(e.target.value as UserRole)}
                className="w-full text-xs font-medium rounded-xl border border-purple-200 p-2.5 text-slate-800 bg-white focus:outline-hidden focus:border-purple-500"
              >
                <option value="teacher">Giáo viên (Nộp giáo án, theo dõi kiểm tra và nhận xét)</option>
                <option value="lead">Tổ trưởng chuyên môn (Kiểm tra hồ sơ của giáo viên trong tổ khối)</option>
                <option value="vice_principal">Phó Hiệu trưởng (Kiểm tra và phê duyệt cả 5 tổ khối)</option>
                <option value="admin">Quản trị viên (Toàn quyền quản trị nhân sự và hệ thống)</option>
              </select>
            </div>

            {/* Department (if teacher or lead) */}
            {editRole !== 'admin' && editRole !== 'vice_principal' && (
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Tổ / Khối chuyên môn phân công <span className="text-rose-500">*</span>
                </label>
                <select
                  value={editDeptId}
                  onChange={(e) => setEditDeptId(e.target.value)}
                  className="w-full text-xs font-medium rounded-xl border border-purple-200 p-2.5 text-slate-800 bg-white focus:outline-hidden focus:border-purple-500"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Contact Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email / Tên đăng nhập
                </label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full text-xs font-medium rounded-xl border border-purple-200 p-2.5 text-slate-800 bg-white focus:outline-hidden focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Số điện thoại liên hệ
                </label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="0912..."
                  className="w-full text-xs font-medium rounded-xl border border-purple-200 p-2.5 text-slate-800 bg-white focus:outline-hidden focus:border-purple-500"
                />
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Trạng thái hoạt động
              </label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as UserStatus)}
                className="w-full text-xs font-medium rounded-xl border border-purple-200 p-2.5 text-slate-800 bg-white focus:outline-hidden focus:border-purple-500"
              >
                <option value="active">Đã phê duyệt (Đang hoạt động)</option>
                <option value="pending">Chờ phê duyệt</option>
                <option value="disabled">Vô hiệu hóa (Khóa tài khoản)</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-purple-100">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 text-xs text-slate-600 hover:bg-purple-50 rounded-xl cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleSaveUser}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-sky-500 hover:from-purple-700 hover:to-sky-600 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-sm shadow-purple-200"
              >
                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-purple-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-purple-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-purple-950 text-base">Thêm Cán Bộ / Giáo Viên Mới</h3>
                  <p className="text-xs text-purple-700/80">Thêm vào: {activeSchool.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Họ và tên giáo viên <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="VD: Cô Huỳnh Thanh Trúc"
                  className="w-full text-xs font-semibold rounded-xl border border-purple-200 p-2.5 text-slate-800 bg-white focus:outline-hidden focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Chức vụ / Vị trí tại trường <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newPosition}
                  onChange={(e) => setNewPosition(e.target.value)}
                  placeholder="VD: Giáo viên CN lớp 3B, Tổ phó..."
                  className="w-full text-xs font-medium rounded-xl border border-purple-200 p-2.5 text-slate-800 bg-white focus:outline-hidden focus:border-purple-500 mb-1"
                />
                <div className="flex flex-wrap gap-1 text-[10px]">
                  {['Giáo viên chủ nhiệm', 'Tổ trưởng chuyên môn', 'Phó Hiệu trưởng', 'Giáo viên Tiếng Anh', 'Giáo viên Tin học'].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setNewPosition(s)}
                      className="px-2 py-0.5 rounded bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Vai trò hệ thống <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="w-full text-xs font-medium rounded-xl border border-purple-200 p-2.5 text-slate-800 bg-white focus:outline-hidden focus:border-purple-500"
                  >
                    <option value="teacher">Giáo viên</option>
                    <option value="lead">Tổ trưởng chuyên môn</option>
                    <option value="vice_principal">Phó Hiệu trưởng</option>
                    <option value="admin">Quản trị viên</option>
                  </select>
                </div>

                {newRole !== 'admin' && newRole !== 'vice_principal' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tổ / Khối phân công <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={newDeptId}
                      onChange={(e) => setNewDeptId(e.target.value)}
                      className="w-full text-xs font-medium rounded-xl border border-purple-200 p-2.5 text-slate-800 bg-white focus:outline-hidden focus:border-purple-500"
                    >
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email đăng nhập (Tùy chọn)
                  </label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="email@school.edu.vn"
                    className="w-full text-xs font-medium rounded-xl border border-purple-200 p-2.5 text-slate-800 bg-white focus:outline-hidden focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Số điện thoại (Tùy chọn)
                  </label>
                  <input
                    type="tel"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="0912..."
                    className="w-full text-xs font-medium rounded-xl border border-purple-200 p-2.5 text-slate-800 bg-white focus:outline-hidden focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-purple-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-purple-50 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-sky-500 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
                >
                  {saving ? 'Đang thêm...' : 'Thêm vào trường'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Gift School & Owner Approval Modal */}
      {showGiftSchoolModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-purple-100 space-y-4 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-purple-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 via-orange-400 to-purple-600 text-white flex items-center justify-center shadow-md shadow-amber-300">
                  <Gift className="w-5 h-5 text-slate-950" />
                </div>
                <div>
                  <h3 className="font-bold text-purple-950 text-base sm:text-lg flex items-center gap-2">
                    <span>Tặng App Cho Các Trường Khác</span>
                    <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 text-[11px] font-bold border border-purple-200">
                      Duyệt bởi Chủ sở hữu
                    </span>
                  </h3>
                  <p className="text-xs text-purple-700/80">
                    Phê duyệt độc quyền bởi: <strong className="font-mono text-purple-950 font-bold">{INITIAL_ADMIN_EMAIL}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGiftSchoolModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Owner vs Non-Owner Identity Banner */}
            {isSystemOwner ? (
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-900 via-indigo-950 to-purple-900 text-white flex flex-wrap items-center justify-between gap-3 shadow-md border border-purple-500/30">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-sm shrink-0">
                    <Crown className="w-4 h-4 text-slate-950" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <span>Bạn là Chủ sở hữu hệ thống: Cô Trương Thị Mỹ Nhiên</span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-200 text-[10px] font-black border border-amber-400/30">
                        Toàn quyền phê duyệt
                      </span>
                    </div>
                    <div className="text-[11px] text-purple-200 font-mono">
                      Email phê duyệt: {INITIAL_ADMIN_EMAIL}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-purple-200">
                  Có <strong className="text-amber-300 font-bold">{pendingGiftCount}</strong> yêu cầu chờ bạn phê duyệt
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-start gap-2.5">
                  <Shield className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-amber-900">
                      Quy định phê duyệt từ Chủ sở hữu hệ thống:
                    </div>
                    <div className="text-[11px] text-slate-700 leading-relaxed">
                      Chức năng tặng app cho trường khác bắt buộc phải được sự phê duyệt của Chủ sở hữu:{' '}
                      <strong className="text-purple-950 font-bold">{INITIAL_ADMIN_EMAIL}</strong> (Cô Trương Thị Mỹ Nhiên). Khi được phê duyệt, trường bạn sẽ nhận được đường link độc lập 100%.
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => switchUser('admin_mynhien')}
                  className="px-3 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shrink-0 flex items-center gap-1.5 shadow-xs transition active:scale-95 cursor-pointer"
                  title="Chuyển ngay sang tài khoản cô Trương Thị Mỹ Nhiên"
                >
                  <Crown className="w-3.5 h-3.5 text-amber-300" />
                  <span>Tôi là cô Mỹ Nhiên (Duyệt ngay)</span>
                </button>
              </div>
            )}

            {/* Information Notice on Data Isolation */}
            <div className="p-3 rounded-2xl bg-sky-50 border border-sky-200 text-xs text-sky-950 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-sky-900">
                <Shield className="w-4 h-4 text-sky-600 shrink-0" />
                <span>Cam kết bảo mật & Tách biệt dữ liệu tuyệt đối:</span>
              </div>
              <p className="text-[11px] text-slate-700 leading-relaxed">
                Mỗi trường được tặng sẽ hoạt động trên một không gian hoàn toàn riêng biệt. Cán bộ giáo viên trường khác có thể tự do chỉnh sửa tên, chức vụ, nộp hồ sơ mà <strong>không làm ảnh hưởng tới số liệu hay bất kỳ nội dung nào của trường bạn</strong>.
              </p>
            </div>

            {/* Modal Tabs */}
            <div className="flex items-center gap-2 border-b border-purple-100 pb-2">
              <button
                type="button"
                onClick={() => {
                  setGiftTab('requests');
                  setCreatedGiftLink(null);
                  setRequestSentMessage(null);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  giftTab === 'requests'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-purple-50 text-purple-800 hover:bg-purple-100'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>
                  {isSystemOwner ? 'Yêu cầu chờ phê duyệt' : 'Tiến độ yêu cầu tặng'}
                </span>
                {pendingGiftCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-black">
                    {pendingGiftCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setGiftTab('create');
                  setCreatedGiftLink(null);
                  setRequestSentMessage(null);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  giftTab === 'create'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-purple-50 text-purple-800 hover:bg-purple-100'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>
                  {isSystemOwner ? 'Khởi tạo & Tặng trường ngay' : 'Đăng ký nhận tặng App'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setGiftTab('history');
                  setCreatedGiftLink(null);
                  setRequestSentMessage(null);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  giftTab === 'history'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-purple-50 text-purple-800 hover:bg-purple-100'
                }`}
              >
                <School className="w-3.5 h-3.5" />
                <span>Các trường đã kích hoạt ({schoolList.length})</span>
              </button>
            </div>

            {/* TAB 1: Requests & Approvals */}
            {giftTab === 'requests' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-600 font-semibold">
                  <span>
                    Danh sách yêu cầu tặng app ({giftRequests.length} yêu cầu):
                  </span>
                  {isSystemOwner && (
                    <span className="text-purple-700">
                      👑 Bấm "Phê duyệt" để kích hoạt trường và cấp liên kết
                    </span>
                  )}
                </div>

                {giftRequests.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs bg-slate-50 rounded-2xl border border-slate-200">
                    Chưa có yêu cầu tặng app nào trong hệ thống.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                    {giftRequests.map((req) => (
                      <div
                        key={req.id}
                        className={`p-4 rounded-2xl border transition ${
                          req.status === 'pending'
                            ? 'bg-amber-50/60 border-amber-200'
                            : req.status === 'approved'
                            ? 'bg-emerald-50/60 border-emerald-200'
                            : 'bg-rose-50/60 border-rose-200'
                        }`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <School className="w-4 h-4 text-purple-800 shrink-0" />
                              <strong className="text-sm font-bold text-slate-900">
                                {req.schoolName}
                              </strong>
                              <span className="px-2 py-0.5 rounded-md bg-white text-[11px] font-mono font-bold text-purple-900 border border-purple-200">
                                {req.schoolCode}
                              </span>
                            </div>
                            <div className="text-xs text-slate-600 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                              <span>Hiệu trưởng: <strong>{req.principalName || 'Chưa cập nhật'}</strong></span>
                              <span>Năm học: <strong>{req.academicYear || '2026-2027'}</strong></span>
                            </div>
                          </div>

                          {/* Status Badge */}
                          <div>
                            {req.status === 'pending' && (
                              <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 font-bold text-xs flex items-center gap-1 border border-amber-300 shadow-2xs">
                                <Clock className="w-3.5 h-3.5 text-amber-600" />
                                <span>Chờ cô Mỹ Nhiên phê duyệt</span>
                              </span>
                            )}
                            {req.status === 'approved' && (
                              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 font-bold text-xs flex items-center gap-1 border border-emerald-300 shadow-2xs">
                                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Đã duyệt bởi {req.approvedBy || INITIAL_ADMIN_EMAIL}</span>
                              </span>
                            )}
                            {req.status === 'rejected' && (
                              <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-900 font-bold text-xs flex items-center gap-1 border border-rose-300">
                                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                <span>Đã từ chối</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Requester Contact & Note */}
                        <div className="p-2.5 rounded-xl bg-white/80 border border-slate-200/80 text-xs space-y-1 mb-2">
                          <div className="text-slate-700 flex flex-wrap items-center gap-x-4 gap-y-1">
                            <span>Người gửi: <strong>{req.requesterName}</strong></span>
                            {req.requesterEmail && (
                              <span>Email: <strong className="text-purple-700">{req.requesterEmail}</strong></span>
                            )}
                            {req.requesterPhone && (
                              <span>SĐT: <strong>{req.requesterPhone}</strong></span>
                            )}
                            <span className="text-slate-400">
                              {new Date(req.createdAt).toLocaleDateString('vi-VN')}
                            </span>
                          </div>
                          {req.reasonOrNote && (
                            <p className="text-[11px] text-slate-600 italic">
                              "{req.reasonOrNote}"
                            </p>
                          )}
                          {req.rejectionReason && (
                            <p className="text-[11px] text-rose-600 font-semibold">
                              Lý do từ chối: {req.rejectionReason}
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                          {req.status === 'pending' ? (
                            isSystemOwner ? (
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  disabled={approvingId === req.id || rejectingId === req.id}
                                  onClick={() => handleApproveRequest(req.id)}
                                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition active:scale-95 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                >
                                  <ThumbsUp className="w-3.5 h-3.5" />
                                  <span>{approvingId === req.id ? 'Đang kích hoạt...' : 'Phê Duyệt & Kích Hoạt Trường'}</span>
                                </button>
                                <button
                                  type="button"
                                  disabled={approvingId === req.id || rejectingId === req.id}
                                  onClick={() => handleRejectRequest(req.id)}
                                  className="px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 font-semibold text-xs rounded-xl transition active:scale-95 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                >
                                  <ThumbsDown className="w-3.5 h-3.5" />
                                  <span>Từ chối</span>
                                </button>
                              </div>
                            ) : (
                              <div className="text-[11px] text-amber-800 font-medium">
                                ⏳ Yêu cầu đã được gửi đến cô Trương Thị Mỹ Nhiên ({INITIAL_ADMIN_EMAIL}) và đang trong quá trình xét duyệt.
                              </div>
                            )
                          ) : req.status === 'approved' ? (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleCopyRequestLink(req.createdSchoolId, req.id)}
                                className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl shadow-xs transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
                              >
                                {copiedReqId === req.id || copiedReqId === req.createdSchoolId ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-amber-300" />
                                    <span>Đã sao chép link trường!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5" />
                                    <span>Sao chép link tặng app cho trường</span>
                                  </>
                                )}
                              </button>
                              {req.createdSchoolId && (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    await switchSchool(req.createdSchoolId!);
                                    setShowGiftSchoolModal(false);
                                  }}
                                  className="px-2.5 py-1.5 bg-white text-purple-800 border border-purple-200 hover:bg-purple-50 text-xs font-semibold rounded-xl flex items-center gap-1 cursor-pointer"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                  <span>Vào trường</span>
                                </button>
                              )}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: Create / Register Form */}
            {giftTab === 'create' && (
              <div className="space-y-3.5">
                {createdGiftLink ? (
                  /* Success Screen for Owner */
                  <div className="space-y-4 animate-in fade-in">
                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-2">
                      <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                        <span>Kích hoạt trường "{giftSchoolName}" thành công!</span>
                      </div>
                      <p className="text-xs text-emerald-700">
                        Chủ sở hữu Cô Trương Thị Mỹ Nhiên đã phê duyệt và khởi tạo không gian làm việc độc lập. Hãy sao chép liên kết bên dưới và gửi cho Ban Giám hiệu, giáo viên trường bạn để họ bắt đầu sử dụng ngay:
                      </p>
                    </div>

                    <div className="p-3.5 bg-purple-50 rounded-2xl border border-purple-200 space-y-2">
                      <label className="text-xs font-bold text-purple-950 block">
                        Đường link tặng trường (Bấm vào link là đăng nhập ngay, không qua trung gian):
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={createdGiftLink}
                          className="w-full text-xs font-mono bg-white border border-purple-300 rounded-xl p-2.5 text-purple-950 select-all"
                        />
                        <button
                          type="button"
                          onClick={handleCopyGiftLink}
                          className="px-4 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shrink-0 flex items-center gap-1.5 shadow-sm cursor-pointer"
                        >
                          {copiedGiftLink ? (
                            <>
                              <Check className="w-4 h-4 text-amber-200" />
                              <span>Đã chép!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              <span>Sao chép</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setCreatedGiftLink(null);
                          setGiftSchoolName('');
                          setGiftSchoolCode('');
                          setGiftPrincipal('');
                        }}
                        className="text-xs text-purple-700 hover:underline font-semibold cursor-pointer"
                      >
                        + Khởi tạo thêm trường khác
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowGiftSchoolModal(false)}
                        className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl cursor-pointer"
                      >
                        Hoàn tất & Đóng
                      </button>
                    </div>
                  </div>
                ) : requestSentMessage ? (
                  /* Success Screen for Requester */
                  <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-3 animate-in fade-in">
                    <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                      <span>Đã gửi yêu cầu tới cô Trương Thị Mỹ Nhiên!</span>
                    </div>
                    <p className="text-xs text-emerald-800 leading-relaxed">
                      {requestSentMessage}
                    </p>
                    <div className="pt-2 flex justify-between items-center">
                      <button
                        type="button"
                        onClick={() => setGiftTab('requests')}
                        className="px-3 py-1.5 rounded-xl bg-purple-700 text-white text-xs font-bold hover:bg-purple-800"
                      >
                        Xem tiến độ yêu cầu
                      </button>
                      <button
                        type="button"
                        onClick={() => setRequestSentMessage(null)}
                        className="text-xs text-slate-600 hover:underline"
                      >
                        Gửi thêm yêu cầu cho trường khác
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Create / Request Form */
                  <form onSubmit={handleCreateOrRequestGiftSchool} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        Tên trường được tặng app <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={giftSchoolName}
                        onChange={(e) => {
                          setGiftSchoolName(e.target.value);
                          if (!giftSchoolCode) {
                            const code = e.target.value
                              .split(' ')
                              .map((w) => w.charAt(0))
                              .join('')
                              .toUpperCase();
                            setGiftSchoolCode(code);
                          }
                        }}
                        placeholder="VD: Trường Tiểu học Nguyễn Huệ, Tiểu học Võ Thị Sáu..."
                        className="w-full text-xs font-semibold rounded-xl border border-purple-200 p-2.5 text-slate-800 bg-white focus:outline-hidden focus:border-purple-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Mã trường viết tắt
                        </label>
                        <input
                          type="text"
                          value={giftSchoolCode}
                          onChange={(e) => setGiftSchoolCode(e.target.value.toUpperCase())}
                          placeholder="TH-NGUYENHUE"
                          className="w-full text-xs font-medium rounded-xl border border-purple-200 p-2.5 text-slate-800 bg-white focus:outline-hidden focus:border-purple-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Họ tên Thầy/Cô Hiệu Trưởng
                        </label>
                        <input
                          type="text"
                          value={giftPrincipal}
                          onChange={(e) => setGiftPrincipal(e.target.value)}
                          placeholder="VD: Thầy Trần Quang Khải"
                          className="w-full text-xs font-medium rounded-xl border border-purple-200 p-2.5 text-slate-800 bg-white focus:outline-hidden focus:border-purple-500"
                        />
                      </div>
                    </div>

                    {/* Non-owner extra fields */}
                    {!isSystemOwner && (
                      <div className="space-y-3 pt-2 border-t border-purple-100">
                        <div className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                          <Send className="w-3.5 h-3.5 text-purple-600" />
                          <span>Thông tin người đại diện gửi yêu cầu phê duyệt:</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                              Họ tên người gửi <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={giftRequesterName}
                              onChange={(e) => setGiftRequesterName(e.target.value)}
                              placeholder="Thầy/Cô..."
                              className="w-full text-xs rounded-xl border border-purple-200 p-2 text-slate-800 bg-white"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                              Email liên hệ <span className="text-rose-500">*</span>
                            </label>
                            <input
                              type="email"
                              required
                              value={giftRequesterEmail}
                              onChange={(e) => setGiftRequesterEmail(e.target.value)}
                              placeholder="email@truong.edu.vn"
                              className="w-full text-xs rounded-xl border border-purple-200 p-2 text-slate-800 bg-white"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                              Số điện thoại
                            </label>
                            <input
                              type="tel"
                              value={giftRequesterPhone}
                              onChange={(e) => setGiftRequesterPhone(e.target.value)}
                              placeholder="0912..."
                              className="w-full text-xs rounded-xl border border-purple-200 p-2 text-slate-800 bg-white"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                            Lời nhắn / Lý do gửi cô Trương Thị Mỹ Nhiên ({INITIAL_ADMIN_EMAIL})
                          </label>
                          <textarea
                            rows={2}
                            value={giftReason}
                            onChange={(e) => setGiftReason(e.target.value)}
                            placeholder="Kính gửi cô Trương Thị Mỹ Nhiên: Trường chúng tôi muốn áp dụng phần mềm này cho năm học 2026-2027..."
                            className="w-full text-xs rounded-xl border border-purple-200 p-2 text-slate-800 bg-white resize-none"
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end gap-2 pt-3 border-t border-purple-100">
                      <button
                        type="button"
                        onClick={() => setShowGiftSchoolModal(false)}
                        className="px-4 py-2 text-xs text-slate-600 hover:bg-purple-50 rounded-xl cursor-pointer"
                      >
                        Đóng
                      </button>
                      <button
                        type="submit"
                        disabled={isCreatingSchool}
                        className="px-5 py-2.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-1.5 active:scale-95 transition"
                      >
                        {isSystemOwner ? (
                          <>
                            <Crown className="w-4 h-4 text-slate-950" />
                            <span>
                              {isCreatingSchool ? 'Đang kích hoạt...' : 'Tạo Không Gian & Lấy Link Tặng Ngay'}
                            </span>
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 text-slate-950" />
                            <span>
                              {isCreatingSchool ? 'Đang gửi...' : 'Gửi Yêu Cầu Tới Cô Trương Thị Mỹ Nhiên Phê Duyệt'}
                            </span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* TAB 3: History of Active Schools */}
            {giftTab === 'history' && (
              <div className="space-y-3">
                <div className="text-xs text-slate-600 font-semibold">
                  Danh sách {schoolList.length} trường học đang hoạt động độc lập:
                </div>
                <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                  {schoolList.map((sch) => {
                    const isCurrent = sch.id === activeSchool.id;
                    const link = getSchoolShareLink(sch.id);
                    return (
                      <div
                        key={sch.id}
                        className={`p-3 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isCurrent ? 'bg-purple-50/80 border-purple-300 ring-1 ring-purple-400' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <School className="w-4 h-4 text-purple-700 shrink-0" />
                            <strong className="text-xs font-bold text-slate-900">{sch.name}</strong>
                            <span className="px-1.5 py-0.5 rounded-md bg-white text-[10px] font-mono font-bold text-purple-800 border border-slate-200">
                              {sch.code}
                            </span>
                            {isCurrent && (
                              <span className="px-2 py-0.5 rounded-full bg-purple-700 text-white text-[10px] font-bold">
                                Trường đang chọn
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-1">
                            Hiệu trưởng: {sch.principalName || 'Chưa cập nhật'} • Năm học: {sch.currentAcademicYear || '2026-2027'}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(link);
                              setCopiedReqId(sch.id);
                              setTimeout(() => setCopiedReqId(null), 2500);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                          >
                            {copiedReqId === sch.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-amber-300" />
                                <span>Đã chép!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Sao chép link</span>
                              </>
                            )}
                          </button>
                          {!isCurrent && (
                            <button
                              type="button"
                              onClick={async () => {
                                await switchSchool(sch.id);
                                setShowGiftSchoolModal(false);
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-white text-slate-700 hover:bg-slate-100 border border-slate-300 text-xs font-medium cursor-pointer"
                            >
                              Chuyển vào
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Batch Import Modal */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl border border-purple-100 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-purple-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-500 text-white flex items-center justify-center shadow-md">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-purple-950 text-base">Nhập Nhanh Danh Sách Giáo Viên</h3>
                  <p className="text-xs text-purple-700/80">Cho trường: {activeSchool.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBatchModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800">
                  Dán danh sách giáo viên (Mỗi dòng một người):
                </label>
                <button
                  type="button"
                  onClick={handleLoadSampleBatch}
                  className="text-[11px] text-purple-700 hover:text-purple-900 font-bold underline cursor-pointer"
                >
                  ⚡ Nạp danh sách mẫu (15 giáo viên 5 khối)
                </button>
              </div>

              <p className="text-[11px] text-slate-500">
                Định dạng: <code>Họ và tên | Chức vụ | Tổ Khối</code> (hoặc chỉ cần nhập Họ và tên trên mỗi dòng)
              </p>

              <textarea
                rows={9}
                value={batchText}
                onChange={(e) => setBatchText(e.target.value)}
                placeholder="Thầy Nguyễn Văn An | Hiệu trưởng | Ban Giám Hiệu&#10;Cô Trần Thị Bình | Tổ trưởng Khối 1 | Khối 1&#10;Thầy Lê Văn Cường | Giáo viên CN lớp 1A | Khối 1&#10;Cô Phạm Thị Dung | Tổ trưởng Khối 2 | Khối 2..."
                className="w-full text-xs font-mono border border-purple-200 rounded-2xl p-3 focus:outline-hidden focus:border-purple-500 bg-slate-50/50"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-purple-100">
              <button
                type="button"
                onClick={() => setShowBatchModal(false)}
                className="px-4 py-2 text-xs text-slate-600 hover:bg-purple-50 rounded-xl"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={batchLoading || !batchText.trim()}
                onClick={handleProcessBatchImport}
                className="px-5 py-2.5 bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-amber-200" />
                <span>{batchLoading ? 'Đang nạp...' : 'Nạp toàn bộ vào trường'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
