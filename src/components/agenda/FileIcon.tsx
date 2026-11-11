import React from 'react';
import { File, FileImage, FileSpreadsheet, FileText, Presentation } from 'lucide-react';

interface FileIconProps {
  /** MIME type or a short kind ('pdf', 'word', 'excel', 'powerpoint', 'image'). */
  fileType?: string | null;
  /** Used to infer the kind from the extension when the type is missing. */
  fileName?: string | null;
  className?: string;
}

function kindOf(type = '', name = '') {
  const t = `${type} ${name}`.toLowerCase();
  if (/pdf/.test(t)) return { Icon: FileText, color: 'text-error-500' };
  if (/word|msword|\.docx?\b|document/.test(t)) return { Icon: FileText, color: 'text-brand-500' };
  if (/excel|sheet|\.xlsx?\b|\.csv\b/.test(t)) return { Icon: FileSpreadsheet, color: 'text-success-600' };
  if (/powerpoint|presentation|\.pptx?\b/.test(t)) return { Icon: Presentation, color: 'text-warning-500' };
  if (/image|\.(png|jpe?g|gif|webp|svg)\b/.test(t)) return { Icon: FileImage, color: 'text-purple-500' };
  return { Icon: File, color: 'text-gray-400' };
}

/** Line icon for a document, coloured by file kind. */
export default function FileIcon({ fileType, fileName, className = 'h-5 w-5' }: FileIconProps) {
  const { Icon, color } = kindOf(fileType ?? '', fileName ?? '');
  return <Icon className={`shrink-0 ${color} ${className}`} aria-hidden="true" />;
}
