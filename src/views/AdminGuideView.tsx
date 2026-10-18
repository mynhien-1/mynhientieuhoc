import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { INITIAL_ADMIN_EMAIL } from '../constants';
import {
  ShieldCheck,
  UserCheck,
  HardDrive,
  Lock,
  Layers,
  FileCheck2,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  BookOpen,
} from 'lucide-react';

export const AdminGuideView: React.FC = () => {
  const { currentUser, userProfile, isAdmin } = useAuth();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Hướng Dẫn Khởi Tạo Quản Trị Viên & Kiến Trúc Bảo Mật
            </h2>
            <p className="text-xs text-slate-500">
              Tài liệu hướng dẫn an toàn dành cho Ban Giám Hiệu và Quản trị viên hệ thống hồ sơ số.
            </p>
          </div>
        </div>
      </div>

      {/* Section 1: Initial Admin Account */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-emerald-600" />
          1. Cách tạo và kích hoạt tài khoản Quản trị viên đầu tiên
        </h3>

        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-2">
          <p className="font-bold text-sm">Tài khoản Quản trị viên gốc được định danh an toàn:</p>
          <div className="flex items-center gap-2 font-mono bg-white px-3 py-2 rounded-lg border border-emerald-300 text-slate-800 text-xs">
            <span>Email Admin:</span>
            <strong className="text-indigo-700">{INITIAL_ADMIN_EMAIL}</strong>
          </div>
          <p className="leading-relaxed text-slate-700 mt-1">
            Khi đăng nhập bằng Google với tài khoản email trên, hệ thống sẽ:
          </p>
          <ul className="list-disc list-inside space-y-1 text-slate-700 pl-1">
            <li>Tự động cấp quyền <strong>Quản trị viên (admin)</strong> và trạng thái <strong>Đã kích hoạt (active)</strong>.</li>
            <li>Ghi bản ghi bảo vệ vào collection <code className="bg-emerald-100 px-1 py-0.5 rounded font-mono">/admins/{`{uid}`}</code> trong Cloud Firestore.</li>
            <li>Tự động nạp cấu hình 5 Tổ Khối (Khối 1 đến Khối 5) và 8 danh mục hồ sơ chuẩn.</li>
            <li>Được bảo vệ bằng <strong>Firebase Security Rules</strong> phía máy chủ; người dùng thường không thể tự sửa vai trò trên trình duyệt.</li>
          </ul>
        </div>
      </div>

      {/* Section 2: 4 Roles & Security Boundary */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <Lock className="w-4 h-4 text-indigo-600" />
          2. Cơ chế phân quyền đa tầng và kiểm soát truy cập (RBAC)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/50">
            <span className="font-bold text-purple-900 block mb-1">1. Quản trị viên (Admin)</span>
            <p className="text-slate-600 leading-relaxed">
              Quản trị người dùng, duyệt tài khoản giáo viên mới, thiết lập 5 tổ khối, cấu hình danh mục hồ sơ và toàn quyền sao lưu dữ liệu.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50">
            <span className="font-bold text-blue-900 block mb-1">2. Phó Hiệu trưởng (Vice Principal)</span>
            <p className="text-slate-600 leading-relaxed">
              Xem toàn bộ hồ sơ của cả 5 tổ khối, theo dõi tiến độ nộp giáo án, kiểm tra tệp, ghi nhận xét, yêu cầu bổ sung hoặc phê duyệt chính thức.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50">
            <span className="font-bold text-emerald-900 block mb-1">3. Tổ trưởng chuyên môn (Department Lead)</span>
            <p className="text-slate-600 leading-relaxed">
              <strong>Bảo mật phân vùng:</strong> Chỉ được xem và kiểm tra hồ sơ thuộc Tổ khối mình phụ trách. Nghiêm cấm truy cập dữ liệu của tổ khối khác.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
            <span className="font-bold text-slate-900 block mb-1">4. Giáo viên (Teacher)</span>
            <p className="text-slate-600 leading-relaxed">
              Tự nộp kế hoạch bài dạy, giáo án; theo dõi trạng thái; đọc nhận xét và nộp lại phiên bản sửa đổi (v2, v3). Không thể tự duyệt hoặc xóa lịch sử.
            </p>
          </div>
        </div>
      </div>

      {/* Section 3: Local Storage & Disconnected Firebase Announcement */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-emerald-600" />
          3. Chế độ Lưu trữ Cục bộ Tốc độ cao (Đã hủy kết nối Firebase)
        </h3>

        <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-950 space-y-3">
          <p className="leading-relaxed">
            Hệ thống hiện tại hoạt động theo mô hình <strong>Cơ sở dữ liệu Cục bộ (Offline-First Local Database)</strong> độc lập 100%. Theo yêu cầu của Chủ sở hữu, <strong>kết nối dữ liệu bằng Firebase đã được hủy hoàn toàn</strong>.
          </p>

          <p className="font-semibold text-emerald-900">Ưu điểm của chế độ lưu trữ này:</p>
          <ul className="list-disc list-inside space-y-1.5 pl-1 text-slate-700">
            <li>
              <strong>Tốc độ phản hồi tức thì:</strong> Thao tác nộp hồ sơ, duyệt kế hoạch bài dạy, thêm phiên bản, nhận xét diễn ra ngay trong mili-giây, không bị giật lag mạng.
            </li>
            <li>
              <strong>Không phụ thuộc kết nối đám mây:</strong> Không còn gặp lỗi mất mạng, giới hạn hạn ngạch (quota) hay lỗi bảo mật phân quyền Firestore.
            </li>
            <li>
              <strong>Hỗ trợ tải tệp & đính kèm tài liệu:</strong> Giáo viên có thể tải tệp trực tiếp từ máy tính hoặc dán liên kết Google Drive, OneDrive để Ban Giám Hiệu và Tổ trưởng xem trực tuyến.
            </li>
            <li>
              <strong>Bảo toàn dữ liệu riêng từng trường:</strong> Khi tặng app cho trường khác, mỗi trường vẫn sở hữu một kho dữ liệu cục bộ hoàn toàn tách biệt.
            </li>
          </ul>
        </div>
      </div>

      {/* Section 4: Versioning and Audit Log */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3 text-xs text-slate-600">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-600" />
          4. Quy tắc quản lý phiên bản và lưu vết lịch sử (Audit Trail)
        </h3>
        <p className="leading-relaxed">
          - Khi giáo viên nộp lại sau khi được Phó Hiệu trưởng hoặc Tổ trưởng yêu cầu bổ sung, hệ thống tự động sinh phiên bản mới (<code className="font-mono font-bold text-indigo-600">v2, v3...</code>) và lưu trữ riêng biệt trong subcollection <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">/versions</code>.
        </p>
        <p className="leading-relaxed">
          - Toàn bộ nhận xét, lý do từ chối, mốc thời gian và người xử lý được lưu bất biến trong <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">/comments</code>. Không ai (kể cả giáo viên nộp) được phép chỉnh sửa hoặc xóa lịch sử này.
        </p>
      </div>
    </div>
  );
};
