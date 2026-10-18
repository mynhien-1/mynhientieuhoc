import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  School,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Sparkles,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Smartphone,
  Mail,
  User,
  Database,
  ArrowRight,
} from 'lucide-react';
import { INITIAL_ADMIN_EMAIL } from '../constants';

export const LoginView: React.FC = () => {
  const {
    signInWithGoogle,
    signInWithGoogleRedirect,
    signInWithSupabaseEmail,
    signUpWithSupabaseEmail,
  } = useAuth();

  const [loading, setLoading] = useState(false);
  const [authMethod, setAuthMethod] = useState<'google' | 'supabase'>('google');
  const [isSignUp, setIsSignUp] = useState(false);

  // Email/Pass form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copiedDomain, setCopiedDomain] = useState(false);
  const [showConfigGuide, setShowConfigGuide] = useState(false);

  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : '';

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedDomain(true);
    setTimeout(() => setCopiedDomain(false), 2500);
  };

  const handleGoogleSignIn = async (useRedirect = false) => {
    try {
      setLoading(true);
      setErrorCode(null);
      setErrorMessage(null);
      setSuccessMessage(null);

      if (useRedirect) {
        await signInWithGoogleRedirect();
      } else {
        await signInWithGoogle();
      }
    } catch (err: any) {
      console.error('Google Login error:', err);
      const code = err?.code || '';
      setErrorCode(code);

      if (code === 'auth/unauthorized-domain') {
        setErrorMessage(
          `Tên miền "${currentHostname}" chưa được cấp phép trong danh sách Authorized domains của Firebase.`
        );
        setShowConfigGuide(true);
      } else if (code === 'auth/operation-not-allowed') {
        setErrorMessage(
          'Phương thức đăng nhập bằng Google chưa được BẬT trên Firebase Console. Vui lòng bật Google trong Sign-in method.'
        );
      } else if (code === 'auth/popup-blocked') {
        setErrorMessage(
          'Trình duyệt đã chặn cửa sổ pop-up. Bạn có thể sử dụng nút "Đăng nhập bằng Chuyển hướng" bên dưới hoặc chuyển sang tab "Tài khoản Supabase".'
        );
      } else if (code === 'auth/cancelled-popup-request' || code === 'auth/popup-closed-by-user') {
        setErrorMessage('Cửa sổ đăng nhập đã đóng trước khi hoàn tất.');
      } else {
        setErrorMessage(
          err?.message || 'Đăng nhập bằng Google không thành công. Bạn có thể dùng tab Đăng nhập Supabase bên cạnh.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSupabaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Vui lòng nhập đầy đủ Email và Mật khẩu.');
      return;
    }
    try {
      setLoading(true);
      setErrorCode(null);
      setErrorMessage(null);
      setSuccessMessage(null);

      if (isSignUp) {
        await signUpWithSupabaseEmail(email, password, fullName);
        setSuccessMessage(
          'Tạo tài khoản Supabase thành công! Nếu được yêu cầu xác thực email, vui lòng kiểm tra hộp thư, hoặc bạn có thể thử đăng nhập ngay.'
        );
      } else {
        await signInWithSupabaseEmail(email, password);
      }
    } catch (err: any) {
      console.error('Supabase auth error:', err);
      setErrorMessage(err?.message || 'Không thể đăng nhập bằng tài khoản Supabase. Vui lòng kiểm tra lại mật khẩu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100/70 via-sky-50/70 to-indigo-100/60 flex flex-col justify-between text-slate-800 selection:bg-purple-200 selection:text-purple-900">
      {/* Top Navbar */}
      <header className="border-b border-purple-100/80 bg-white/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-400 via-indigo-400 to-sky-400 flex items-center justify-center text-white shadow-xs">
            <School className="w-6 h-6 text-amber-200" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-bold text-purple-950 tracking-tight">
              HỒ SƠ CHUYÊN MÔN SỐ
            </h1>
            <p className="text-[11px] text-sky-600 font-semibold">Trường Tiểu Học Ba Chúc • 5 Khối Lớp</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-purple-700 bg-purple-50/90 px-3 py-1.5 rounded-full border border-purple-200/80 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Hệ thống quản lý nội bộ
          </span>
        </div>
      </header>

      {/* Hero / Login Section */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 sm:py-12 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Col: Introduction */}
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100/80 border border-purple-200 text-purple-700 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Chuyển đổi số công tác quản lý chuyên môn
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-purple-950 leading-tight">
            Số Hóa Hồ Sơ & Giáo Án
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-indigo-500 to-sky-500">
              Trường Tiểu Học Ba Chúc
            </span>
          </h2>

          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            Hệ thống hỗ trợ Ban Giám Hiệu và Tổ trưởng chuyên môn theo dõi, tiếp nhận, nhận xét và phê duyệt giáo án, kế hoạch bài dạy của 5 khối lớp. Tích hợp kho lưu trữ <strong>Supabase Storage</strong> tải file tốc độ cao và bảo mật nhiều lớp.
          </p>

          {/* 4 Feature Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
            <div className="p-3.5 rounded-2xl bg-sky-50/80 border border-sky-100 space-y-1 shadow-2xs">
              <span className="font-bold text-sky-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" />
                Quản lý 5 Tổ Khối
              </span>
              <p className="text-slate-600">
                Phân vùng hồ sơ theo Khối 1, Khối 2, Khối 3, Khối 4, Khối 5; Tổ trưởng chỉ quản lý tổ mình.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-purple-50/80 border border-purple-100 space-y-1 shadow-2xs">
              <span className="font-bold text-purple-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                Lưu vết phiên bản
              </span>
              <p className="text-slate-600">
                Lưu giữ lịch sử từng lần nộp lại (v1, v2...), ngày nộp và toàn bộ ý kiến nhận xét của người kiểm tra.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-teal-50/80 border border-teal-100 space-y-1 shadow-2xs">
              <span className="font-bold text-teal-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                Quy trình linh hoạt
              </span>
              <p className="text-slate-600">
                Hỗ trợ duyệt trực tiếp bởi Phó Hiệu trưởng hoặc qua Tổ trưởng rà soát trước khi chuyển BGH.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-100 space-y-1 shadow-2xs">
              <span className="font-bold text-amber-900 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-amber-600 shrink-0" />
                Kho lưu trữ Supabase
              </span>
              <p className="text-slate-600">
                Tệp tài liệu nộp được lưu trữ an toàn, dung lượng lớn và truy xuất nhanh chóng.
              </p>
            </div>
          </div>
        </div>

        {/* Right Col: Sign In Card */}
        <div className="lg:col-span-5">
          <div className="bg-white/95 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-purple-100 shadow-xl shadow-purple-100/50 space-y-5">
            <div className="text-center space-y-1.5">
              <div className="w-12 h-12 bg-gradient-to-tr from-purple-100 to-sky-100 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-2 border border-purple-200/80 shadow-2xs">
                <Lock className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-purple-950">Đăng Nhập Hệ Thống</h3>
              <p className="text-xs text-slate-500">
                Dành cho Ban Giám Hiệu, Tổ trưởng chuyên môn và Giáo viên nhà trường
              </p>
            </div>

            {/* Tab switch between Google and Supabase Email */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100/90 rounded-2xl border border-slate-200/80 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setAuthMethod('google');
                  setErrorMessage(null);
                }}
                className={`py-2 px-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  authMethod === 'google'
                    ? 'bg-white text-purple-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Google</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMethod('supabase');
                  setErrorMessage(null);
                }}
                className={`py-2 px-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  authMethod === 'supabase'
                    ? 'bg-white text-purple-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Database className="w-3.5 h-3.5 text-emerald-600" />
                <span>Tài khoản Supabase</span>
              </button>
            </div>

            {/* Success message */}
            {successMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Error Banner with detailed guidance if unauthorized-domain */}
            {errorMessage && (
              <div
                className={`p-3.5 rounded-2xl text-xs space-y-2 border ${
                  errorCode === 'auth/unauthorized-domain'
                    ? 'bg-amber-50 border-amber-300 text-amber-900'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                <div className="flex items-start gap-2 font-semibold">
                  <AlertCircle
                    className={`w-4 h-4 shrink-0 mt-0.5 ${
                      errorCode === 'auth/unauthorized-domain' ? 'text-amber-600' : 'text-rose-500'
                    }`}
                  />
                  <span>{errorMessage}</span>
                </div>

                {errorCode === 'auth/unauthorized-domain' && (
                  <div className="bg-white/80 p-2.5 rounded-xl border border-amber-200 space-y-2 text-[11px]">
                    <div className="text-slate-700">
                      <strong>Mẹo nhanh:</strong> Bạn có thể chuyển sang tab <strong>"Tài khoản Supabase"</strong> ở phía trên để đăng nhập ngay mà không cần cấu hình Google, HOẶC thêm tên miền Vercel vào Firebase:
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono bg-amber-100/80 px-2 py-1 rounded-md text-amber-950 font-bold break-all flex-1">
                        {currentHostname}
                      </span>
                      <button
                        onClick={() => copyToClipboard(currentHostname)}
                        className="px-2.5 py-1 rounded-md bg-amber-700 text-white font-medium hover:bg-amber-800 transition flex items-center gap-1 shrink-0 cursor-pointer text-xs"
                      >
                        {copiedDomain ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedDomain ? 'Đã chép' : 'Sao chép'}
                      </button>
                    </div>

                    <div className="text-[11px] text-slate-600 space-y-1 pt-1 border-t border-amber-200/60">
                      <div>1. Mở Firebase Console → Chọn dự án <strong>mynhien-1985</strong></div>
                      <div>2. Vào <strong>Authentication</strong> → Thẻ <strong>Settings</strong> → <strong>Authorized domains</strong></div>
                      <div>3. Bấm <strong>Add domain</strong> → Dán <strong>vercel.app</strong> → Bấm <strong>Add</strong>.</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 1: Google Login */}
            {authMethod === 'google' && (
              <div className="space-y-3">
                <button
                  onClick={() => handleGoogleSignIn(false)}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-2xl bg-white hover:bg-purple-50/80 text-slate-800 font-bold text-sm border border-purple-200/90 shadow-sm transition transform active:scale-98 cursor-pointer disabled:opacity-60"
                >
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>{loading ? 'Đang kết nối...' : 'Đăng nhập với Google'}</span>
                </button>

                {/* Redirect alternative */}
                <button
                  type="button"
                  onClick={() => handleGoogleSignIn(true)}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs text-purple-700 hover:text-purple-900 hover:bg-purple-50/50 rounded-xl transition cursor-pointer"
                  title="Sử dụng phương thức này nếu trình duyệt của bạn chặn cửa sổ pop-up"
                >
                  <Smartphone className="w-3.5 h-3.5 text-purple-500" />
                  <span>Hoặc đăng nhập bằng Chuyển hướng trang (Redirect)</span>
                </button>
              </div>
            )}

            {/* TAB 2: Supabase Email/Password Login */}
            {authMethod === 'supabase' && (
              <form onSubmit={handleSupabaseSubmit} className="space-y-3">
                {isSignUp && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Họ và tên</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Thầy/Cô Nguyễn Văn A"
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-purple-200 focus:outline-hidden focus:ring-2 focus:ring-purple-400"
                        required={isSignUp}
                      />
                      <User className="w-4 h-4 text-purple-400 absolute left-3 top-2.5" />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Email trường / cá nhân</label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="mynhienbobeo@gmail.com"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-purple-200 focus:outline-hidden focus:ring-2 focus:ring-purple-400"
                      required
                    />
                    <Mail className="w-4 h-4 text-purple-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Mật khẩu</label>
                  <div className="relative">
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-purple-200 focus:outline-hidden focus:ring-2 focus:ring-purple-400"
                      required
                      minLength={6}
                    />
                    <Lock className="w-4 h-4 text-purple-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md transition cursor-pointer disabled:opacity-60"
                >
                  <span>{loading ? 'Đang xử lý...' : isSignUp ? 'Đăng ký tài khoản' : 'Đăng nhập với Supabase'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(!isSignUp);
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    className="text-xs text-purple-700 hover:text-purple-900 underline font-medium cursor-pointer"
                  >
                    {isSignUp ? 'Đã có tài khoản? Bấm để Đăng nhập' : 'Chưa có tài khoản? Bấm để Đăng ký mới'}
                  </button>
                </div>
              </form>
            )}

            {/* Expandable Supabase & Domain Guide Helper */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowConfigGuide(!showConfigGuide)}
                className="w-full flex items-center justify-between text-xs font-semibold text-slate-600 hover:text-purple-800 p-2 rounded-xl hover:bg-purple-50/60 transition cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-purple-600" />
                  Hướng dẫn chi tiết về Supabase & Đăng nhập
                </span>
                {showConfigGuide ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showConfigGuide && (
                <div className="mt-2 p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200 text-xs space-y-3 text-slate-700">
                  <div className="space-y-1">
                    <p className="font-bold text-purple-900">1. Đăng nhập ngay không cần cấu hình:</p>
                    <p className="text-[11px] text-slate-600">
                      Chọn tab <strong>"Tài khoản Supabase"</strong> phía trên, nhập email (ví dụ: <code>mynhienbobeo@gmail.com</code>) và bấm Đăng ký/Đăng nhập là vào được ngay 100%!
                    </p>
                  </div>

                  <div className="space-y-1 pt-1 border-t border-purple-200/60">
                    <p className="font-bold text-purple-900">2. Để nút "Đăng nhập với Google" chạy trên Vercel:</p>
                    <p className="text-[11px] text-slate-600">
                      Mở Firebase Console dự án <strong>mynhien-1985</strong> → <strong>Authentication</strong> → Thẻ <strong>Settings</strong> → <strong>Authorized domains</strong> → Bấm <strong>Add domain</strong> và dán <code>vercel.app</code>.
                    </p>
                  </div>

                  <div className="space-y-1 pt-1 border-t border-purple-200/60">
                    <p className="font-bold text-purple-900">3. Kho lưu trữ tệp Supabase Storage:</p>
                    <p className="text-[11px] text-slate-600">
                      Tất cả file Word, Excel, PDF của giáo viên sẽ được tải lên Supabase của bạn tại:
                      <br />
                      <code className="text-[10px] bg-white px-1.5 py-0.5 rounded border border-purple-200 text-purple-800 break-all">
                        https://imibgagqoavofdnfzgrg.supabase.co
                      </code>
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Note on approval policy */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-50/70 to-sky-50/70 border border-purple-100 text-[11px] text-slate-600 space-y-1.5">
              <div className="flex items-center gap-1.5 text-purple-900 font-semibold">
                <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0" />
                Chính sách an toàn & phân quyền:
              </div>
              <p>
                - Tài khoản <span className="text-purple-900 font-mono font-bold">{INITIAL_ADMIN_EMAIL}</span> tự động nhận toàn quyền <strong>Quản trị viên (Admin / Ban Giám Hiệu)</strong>.
              </p>
              <p>
                - Giáo viên mới đăng nhập sẽ ở trạng thái Chờ duyệt để Quản trị viên xếp vào đúng 5 Tổ Khối.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-purple-100/80 py-4 px-6 text-center text-xs text-purple-600/80">
        Hệ Thống Quản Lý Hồ Sơ Chuyên Môn Số – Trường Tiểu Học Ba Chúc • 5 Tổ Khối Chuyên Môn
      </footer>
    </div>
  );
};
