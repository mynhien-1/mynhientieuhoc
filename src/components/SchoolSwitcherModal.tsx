import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { SchoolWorkspace } from '../types';
import { INITIAL_ADMIN_EMAIL } from '../constants';
import {
  X,
  School,
  Plus,
  Share2,
  Check,
  Copy,
  ExternalLink,
  Edit2,
  CheckCircle2,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  Crown,
  Send,
  Shield,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const SchoolSwitcherModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const {
    activeSchool,
    schoolList,
    switchSchool,
    createSchoolWorkspace,
    updateSchoolWorkspace,
    getSchoolShareLink,
    isSystemOwner,
    systemOwnerEmail,
    submitGiftSchoolRequest,
    giftRequests,
  } = useAuth();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditSchool, setShowEditSchool] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New School Form
  const [newName, setNewName] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newPrincipal, setNewPrincipal] = useState('');
  const [newRequesterName, setNewRequesterName] = useState('');
  const [newRequesterEmail, setNewRequesterEmail] = useState('');
  const [newRequesterPhone, setNewRequesterPhone] = useState('');
  const [newReason, setNewReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit School Form
  const [editName, setEditName] = useState(activeSchool.name);
  const [editPrincipal, setEditPrincipal] = useState(activeSchool.principalName || '');

  if (!isOpen) return null;

  const handleCopyLink = (schoolId: string) => {
    const link = getSchoolShareLink(schoolId);
    navigator.clipboard.writeText(link);
    setCopiedId(schoolId);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleCreateSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setIsSubmitting(true);
    try {
      if (isSystemOwner) {
        const created = await createSchoolWorkspace({
          name: newName.trim(),
          code: newCode.trim() || undefined,
          principalName: newPrincipal.trim() || undefined,
        });

        handleCopyLink(created.id);
        alert(`Đã khởi tạo và kích hoạt không gian độc lập cho trường "${created.name}"! Link truy cập đã được sao chép.`);
        setNewName('');
        setNewCode('');
        setNewPrincipal('');
        setShowCreateForm(false);
        onClose();
      } else {
        await submitGiftSchoolRequest({
          schoolName: newName.trim(),
          schoolCode: newCode.trim() || undefined,
          principalName: newPrincipal.trim() || undefined,
          requesterName: newRequesterName.trim() || undefined,
          requesterEmail: newRequesterEmail.trim() || undefined,
          requesterPhone: newRequesterPhone.trim() || undefined,
          reasonOrNote: newReason.trim() || 'Xin cấp quyền sử dụng app cho trường',
        });

        alert(`Yêu cầu tặng app cho trường "${newName.trim()}" đã được gửi tới Chủ sở hữu Cô Trương Thị Mỹ Nhiên (${INITIAL_ADMIN_EMAIL}) để xét duyệt!`);
        setNewName('');
        setNewCode('');
        setNewPrincipal('');
        setNewRequesterName('');
        setNewRequesterEmail('');
        setNewRequesterPhone('');
        setNewReason('');
        setShowCreateForm(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEditSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;

    await updateSchoolWorkspace(activeSchool.id, {
      name: editName.trim(),
      principalName: editPrincipal.trim(),
    });
    setShowEditSchool(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-purple-100 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-purple-100 bg-gradient-to-r from-violet-100/80 via-white to-sky-100/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-purple-200">
              <School className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-purple-950">
                Không Gian Trường Học (Multi-School)
              </h3>
              <p className="text-xs text-purple-700/80">
                Mỗi trường có dữ liệu, giáo án và giáo viên hoàn toàn riêng biệt
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active School Banner */}
        <div className="px-4 py-3 bg-purple-50/80 border-b border-purple-100 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            <span>
              Trường đang hoạt động:{' '}
              <strong className="text-purple-950 font-extrabold text-sm">
                {activeSchool.name}
              </strong>{' '}
              ({activeSchool.code})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setEditName(activeSchool.name);
                setEditPrincipal(activeSchool.principalName || '');
                setShowEditSchool(!showEditSchool);
              }}
              className="px-2.5 py-1 rounded-lg bg-white border border-purple-200 text-purple-800 hover:bg-purple-100 font-semibold transition cursor-pointer text-[11px] flex items-center gap-1"
            >
              <Edit2 className="w-3 h-3" />
              Sửa tên trường
            </button>
            <button
              onClick={() => handleCopyLink(activeSchool.id)}
              className="px-2.5 py-1 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-semibold transition cursor-pointer text-[11px] flex items-center gap-1"
              title="Sao chép link truy cập của trường này để gửi giáo viên"
            >
              {copiedId === activeSchool.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copiedId === activeSchool.id ? 'Đã sao chép link' : 'Sao chép link trường'}
            </button>
          </div>
        </div>

        {/* Edit School Name Inline Form */}
        {showEditSchool && (
          <form
            onSubmit={handleSaveEditSchool}
            className="p-4 bg-sky-50/80 border-b border-sky-200 space-y-3 text-xs"
          >
            <div className="font-bold text-sky-950 flex items-center gap-1.5">
              <Edit2 className="w-4 h-4 text-sky-600" />
              Chỉnh sửa thông tin Trường đang sử dụng
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Tên trường học
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-sky-200 bg-white text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Họ tên Hiệu trưởng
                </label>
                <input
                  type="text"
                  value={editPrincipal}
                  onChange={(e) => setEditPrincipal(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-sky-200 bg-white text-xs"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowEditSchool(false)}
                className="px-3 py-1 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-1 rounded-lg bg-sky-700 hover:bg-sky-800 text-white font-bold cursor-pointer"
              >
                Lưu thay đổi
              </button>
            </div>
          </form>
        )}

        {/* Actions bar */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/50">
          <div className="text-xs text-slate-600">
            Chọn trường để vào làm việc hoặc tạo trường mới để tặng các trường khác:
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-xs transition cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tạo trường mới để tặng</span>
          </button>
        </div>

        {/* Create School Form */}
        {showCreateForm && (
          <form
            onSubmit={handleCreateSchool}
            className="p-4 bg-purple-50/80 border-b border-purple-200 space-y-3 text-xs animate-in slide-in-from-top-2 duration-150"
          >
            <div className="flex items-center justify-between">
              <div className="font-bold text-purple-950 flex items-center gap-1.5">
                {isSystemOwner ? <Crown className="w-4 h-4 text-amber-500" /> : <Plus className="w-4 h-4 text-purple-600" />}
                <span>
                  {isSystemOwner
                    ? 'Khởi tạo không gian trường mới (Chủ sở hữu duyệt ngay)'
                    : 'Đăng ký nhận tặng App (Cần duyệt bởi mynhienbobeo@gmail.com)'}
                </span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white text-purple-900 border border-purple-200 font-semibold">
                Dữ liệu tách biệt 100%
              </span>
            </div>

            {!isSystemOwner && (
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] space-y-1">
                <p className="font-semibold flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-amber-600" />
                  Quy định phê duyệt:
                </p>
                <p>
                  Chức năng tặng app cho trường khác bắt buộc phải được sự phê duyệt của Chủ sở hữu:{' '}
                  <strong>{INITIAL_ADMIN_EMAIL}</strong> (Cô Trương Thị Mỹ Nhiên). Yêu cầu của bạn sẽ được gửi tới cô Mỹ Nhiên để xét duyệt.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Tên trường học được tặng <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Trường Tiểu học Nguyễn Huệ"
                  value={newName}
                  onChange={(e) => {
                    setNewName(e.target.value);
                    if (!newCode) {
                      const auto = e.target.value
                        .toLowerCase()
                        .normalize('NFD')
                        .replace(/[\u0300-\u036f]/g, '')
                        .replace(/[^a-z0-9]/g, '-')
                        .replace(/-+/g, '-');
                      setNewCode(auto);
                    }
                  }}
                  className="w-full px-3 py-1.5 rounded-lg border border-purple-200 bg-white text-xs focus:ring-1 focus:ring-purple-400"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Mã trường (viết liền không dấu)
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: th-nguyen-hue"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-purple-200 bg-white text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Họ tên Hiệu trưởng trường được tặng
              </label>
              <input
                type="text"
                placeholder="Ví dụ: Thầy Trần Minh Quân"
                value={newPrincipal}
                onChange={(e) => setNewPrincipal(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-purple-200 bg-white text-xs"
              />
            </div>

            {/* Non-owner extra fields */}
            {!isSystemOwner && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Họ tên người gửi yêu cầu <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Thầy/Cô..."
                    value={newRequesterName}
                    onChange={(e) => setNewRequesterName(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-purple-200 bg-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Email liên hệ nhận kết quả <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="email@truong.edu.vn"
                    value={newRequesterEmail}
                    onChange={(e) => setNewRequesterEmail(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-purple-200 bg-white text-xs"
                  />
                </div>
              </div>
            )}

            <div className="p-2.5 rounded-xl bg-purple-100/60 border border-purple-200 text-purple-950 text-[11px] space-y-1">
              <p className="font-semibold flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-purple-700" />
                Đảm bảo an toàn số liệu:
              </p>
              <p>
                Trường mới sẽ có không gian lưu trữ và hồ sơ độc lập hoàn toàn. Các thầy cô trường mới khi nộp giáo án hay nhận xét sẽ <strong>không bao giờ nhìn thấy</strong> số liệu hay hồ sơ của trường bạn.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-3 py-1 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-bold cursor-pointer flex items-center gap-1.5"
              >
                {isSystemOwner ? (
                  <>
                    <Crown className="w-3.5 h-3.5 text-amber-300" />
                    <span>{isSubmitting ? 'Đang kích hoạt...' : 'Tạo trường & Lấy link tặng ngay'}</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5 text-white" />
                    <span>{isSubmitting ? 'Đang gửi...' : 'Gửi yêu cầu tới cô Trương Thị Mỹ Nhiên phê duyệt'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* School List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 max-h-[50vh]">
          {schoolList.map((school) => {
            const isActive = activeSchool.id === school.id;
            const isDefaultBaChuc = school.id === 'th-ba-chuc';

            return (
              <div
                key={school.id}
                className={`p-3.5 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isActive
                    ? 'bg-purple-50/90 border-purple-300 ring-2 ring-purple-400 shadow-xs'
                    : 'bg-white hover:bg-slate-50 border-slate-200 shadow-2xs'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs ${
                      isActive
                        ? 'bg-purple-700 text-white'
                        : 'bg-slate-100 text-purple-800 border border-purple-100'
                    }`}
                  >
                    <School className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm truncate">
                        {school.name}
                      </span>
                      {isActive && (
                        <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full border border-purple-200 shrink-0">
                          Đang xem
                        </span>
                      )}
                      {isDefaultBaChuc && (
                        <span className="text-[10px] font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200 shrink-0">
                          Trường của bạn
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <span className="font-medium text-slate-700">
                        HT: {school.principalName || 'Chưa cập nhật'}
                      </span>
                      <span>•</span>
                      <span className="font-mono text-purple-600 text-[11px]">
                        Mã: {school.code || school.id}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => handleCopyLink(school.id)}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-purple-100 text-purple-900 font-semibold transition cursor-pointer text-xs flex items-center gap-1 border border-slate-200"
                    title="Sao chép link tặng trường này để gửi qua Zalo/Email"
                  >
                    {copiedId === school.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Share2 className="w-3.5 h-3.5 text-purple-600" />
                    )}
                    <span>{copiedId === school.id ? 'Đã chép link' : 'Lấy link tặng'}</span>
                  </button>

                  {!isActive && (
                    <button
                      onClick={async () => {
                        await switchSchool(school.id);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1"
                    >
                      <span>Vào trường này</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-center text-[11px] text-slate-500 flex items-center justify-between px-5">
          <span>Dữ liệu từng trường được phân vùng độc lập 100%.</span>
          <span className="font-semibold text-purple-700">Hệ Thống Hồ Sơ Chuyên Môn Số</span>
        </div>
      </div>
    </div>
  );
};
