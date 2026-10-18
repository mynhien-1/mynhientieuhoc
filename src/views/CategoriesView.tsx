import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { DocumentCategory, WorkflowType } from '../types';
import { localDb } from '../services/localDb';
import { FolderTree, Plus, Edit2, CheckCircle2, XCircle, Info, Shield, Layers } from 'lucide-react';

interface Props {
  categories: DocumentCategory[];
  onRefresh: () => void;
}

export const CategoriesView: React.FC<Props> = ({ categories, onRefresh }) => {
  const { isAdmin, isVicePrincipal, activeSchool } = useAuth();

  const [editingCategory, setEditingCategory] = useState<DocumentCategory | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Form states
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [workflowType, setWorkflowType] = useState<WorkflowType>('via_lead_then_principal');
  const [allowedExtensions, setAllowedExtensions] = useState('doc, docx, pdf');
  const [maxSizeMb, setMaxSizeMb] = useState(25);
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const startEdit = (cat: DocumentCategory) => {
    setEditingCategory(cat);
    setIsAddingNew(false);
    setId(cat.id);
    setName(cat.name);
    setDescription(cat.description || '');
    setWorkflowType(cat.workflowType);
    setAllowedExtensions(cat.allowedExtensions);
    setMaxSizeMb(cat.maxSizeMb);
    setIsActive(cat.isActive);
  };

  const startAdd = () => {
    setEditingCategory(null);
    setIsAddingNew(true);
    setId(`cat-${Date.now()}`);
    setName('');
    setDescription('');
    setWorkflowType('via_lead_then_principal');
    setAllowedExtensions('doc, docx, pdf');
    setMaxSizeMb(25);
    setIsActive(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      const catId = isAddingNew ? id.trim() : (editingCategory?.id || id.trim());

      const payload: DocumentCategory = {
        id: catId,
        name: name.trim(),
        description: description.trim(),
        workflowType,
        allowedExtensions: allowedExtensions.trim(),
        maxSizeMb: Number(maxSizeMb) || 25,
        isActive,
        order: isAddingNew ? categories.length + 1 : (editingCategory?.order || 1),
      };

      const existingIndex = categories.findIndex((c) => c.id === catId);
      let updated: DocumentCategory[];
      if (existingIndex >= 0) {
        updated = [...categories];
        updated[existingIndex] = payload;
      } else {
        updated = [...categories, payload];
      }

      localDb.saveCategories(updated, activeSchool?.id || 'th-ba-chuc');
      setIsAddingNew(false);
      setEditingCategory(null);
      onRefresh();
    } catch (e) {
      console.error('Error saving category:', e);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (cat: DocumentCategory) => {
    try {
      const updated = categories.map((c) => (c.id === cat.id ? { ...c, isActive: !c.isActive } : c));
      localDb.saveCategories(updated, activeSchool?.id || 'th-ba-chuc');
      onRefresh();
    } catch (e) {
      console.error('Error toggling category status:', e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/95 p-5 rounded-2xl border border-purple-100 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-purple-950 tracking-tight flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-purple-600" />
            Danh Mục Hồ Sơ & Cấu Hình Quy Trình
          </h2>
          <p className="text-xs text-purple-600/80 mt-1">
            Quy định các loại hồ sơ chuyên môn, luồng duyệt (qua Tổ trưởng hoặc trực tiếp BGH), định dạng tệp và dung lượng tối đa.
          </p>
        </div>

        {(isAdmin || isVicePrincipal) && (
          <button
            onClick={startAdd}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 via-indigo-500 to-sky-400 hover:from-purple-600 hover:to-sky-500 text-white text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Thêm loại hồ sơ
          </button>
        )}
      </div>

      {/* Categories List */}
      <div className="bg-white/95 rounded-2xl border border-purple-100 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gradient-to-r from-purple-50/70 to-sky-50/70 text-purple-950 font-bold border-b border-purple-100">
              <tr>
                <th className="py-3.5 px-4">Tên loại hồ sơ</th>
                <th className="py-3.5 px-4">Quy trình duyệt</th>
                <th className="py-3.5 px-4">Định dạng cho phép</th>
                <th className="py-3.5 px-4">Giới hạn dung lượng</th>
                <th className="py-3.5 px-4">Trạng thái</th>
                {(isAdmin || isVicePrincipal) && <th className="py-3.5 px-4 text-right">Thao tác</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-50">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-purple-50/30 transition">
                  <td className="py-3.5 px-4 max-w-sm">
                    <p className="font-bold text-slate-900 text-xs">{cat.name}</p>
                    {cat.description && (
                      <p className="text-[11px] text-purple-500/80 mt-0.5 line-clamp-1">{cat.description}</p>
                    )}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {cat.workflowType === 'via_lead_then_principal' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-800 font-semibold border border-purple-200">
                        Qua Tổ trưởng → Phó Hiệu trưởng
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 font-semibold border border-teal-200">
                        Trực tiếp Phó Hiệu trưởng duyệt
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 uppercase font-mono text-[11px] text-purple-700 whitespace-nowrap">
                    {cat.allowedExtensions}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap font-medium">
                    {cat.maxSizeMb} MB
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {cat.isActive ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-teal-700 font-semibold bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                        Đang áp dụng
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                        <XCircle className="w-3.5 h-3.5 text-slate-400" />
                        Tạm ẩn
                      </span>
                    )}
                  </td>
                  {(isAdmin || isVicePrincipal) && (
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleActive(cat)}
                          className="text-[11px] px-2.5 py-1 text-purple-700 hover:text-purple-900 rounded-lg hover:bg-purple-100/60 font-medium transition cursor-pointer border border-purple-200/60"
                        >
                          {cat.isActive ? 'Ẩn' : 'Bật'}
                        </button>
                        <button
                          onClick={() => startEdit(cat)}
                          className="p-1.5 text-purple-500 hover:text-purple-700 rounded-lg hover:bg-purple-100/60 transition cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {(editingCategory || isAddingNew) && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSave}
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-purple-100 space-y-4"
          >
            <h3 className="font-bold text-purple-950 text-base">
              {isAddingNew ? 'Thêm loại hồ sơ chuyên môn mới' : `Chỉnh sửa: ${editingCategory?.name}`}
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tên loại hồ sơ <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ví dụ: Kế hoạch bài dạy (Giáo án) theo tuần"
                className="w-full text-xs font-medium rounded-xl border border-purple-200 p-2.5 text-slate-800 focus:outline-hidden focus:border-purple-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mô tả / Hướng dẫn</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả tóm tắt mục đích hoặc nội dung của loại hồ sơ này..."
                className="w-full text-xs rounded-xl border border-purple-200 p-2.5 text-slate-800 focus:outline-hidden focus:border-purple-400"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Luồng kiểm tra / duyệt</label>
                <select
                  value={workflowType}
                  onChange={(e) => setWorkflowType(e.target.value as WorkflowType)}
                  className="w-full text-xs font-medium rounded-xl border border-purple-200 p-2.5 text-slate-800 bg-white focus:outline-hidden focus:border-purple-400"
                >
                  <option value="via_lead_then_principal">Qua Tổ trưởng rồi đến PHT</option>
                  <option value="direct_to_principal">Trực tiếp Phó Hiệu trưởng</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Dung lượng tối đa (MB)</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={maxSizeMb}
                  onChange={(e) => setMaxSizeMb(Number(e.target.value))}
                  className="w-full text-xs font-medium rounded-xl border border-purple-200 p-2.5 text-slate-800 focus:outline-hidden focus:border-purple-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Định dạng tệp cho phép (cách nhau bởi dấu phẩy)
              </label>
              <input
                type="text"
                value={allowedExtensions}
                onChange={(e) => setAllowedExtensions(e.target.value)}
                placeholder="doc, docx, pdf, xls, xlsx, ppt, pptx"
                className="w-full text-xs font-medium rounded-xl border border-purple-200 p-2.5 text-slate-800 focus:outline-hidden focus:border-purple-400"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="is-active"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded text-purple-600 focus:ring-purple-500 h-4 w-4"
              />
              <label htmlFor="is-active" className="text-xs font-medium text-slate-700">
                Kích hoạt loại hồ sơ này ngay lập tức
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-purple-100">
              <button
                type="button"
                onClick={() => {
                  setEditingCategory(null);
                  setIsAddingNew(false);
                }}
                className="px-4 py-2 text-xs text-slate-600 hover:bg-purple-50 rounded-xl cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 via-indigo-500 to-sky-500 hover:from-purple-600 hover:to-sky-600 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-sm shadow-purple-200"
              >
                {saving ? 'Đang lưu...' : 'Lưu danh mục'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
