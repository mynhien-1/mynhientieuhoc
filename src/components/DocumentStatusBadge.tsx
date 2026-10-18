import React from 'react';
import { DocumentStatus } from '../types';
import { STATUS_MAP } from '../constants';
import {
  FileText,
  Clock,
  UserCheck,
  Award,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

interface Props {
  status: DocumentStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const DocumentStatusBadge: React.FC<Props> = ({ status, size = 'sm', showIcon = true }) => {
  const meta = STATUS_MAP[status] || STATUS_MAP.draft;

  const getIcon = () => {
    switch (status) {
      case 'draft':
        return <FileText className="w-3.5 h-3.5" />;
      case 'submitted':
        return <Clock className="w-3.5 h-3.5" />;
      case 'pending_lead':
        return <UserCheck className="w-3.5 h-3.5 text-amber-600" />;
      case 'pending_principal':
        return <Award className="w-3.5 h-3.5 text-indigo-600" />;
      case 'need_revision':
        return <AlertCircle className="w-3.5 h-3.5 text-orange-600" />;
      case 'resubmitted':
        return <RefreshCw className="w-3.5 h-3.5 text-purple-600" />;
      case 'approved':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />;
      case 'rejected':
        return <XCircle className="w-3.5 h-3.5 text-rose-600" />;
      default:
        return null;
    }
  };

  const sizeClass = {
    sm: 'text-xs px-2.5 py-0.5 font-medium',
    md: 'text-sm px-3 py-1 font-medium',
    lg: 'text-base px-3.5 py-1.5 font-semibold',
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${meta.bg} ${meta.text} ${meta.border} ${sizeClass}`}
      title={meta.description}
    >
      {showIcon && getIcon()}
      <span>{meta.label}</span>
    </span>
  );
};
