import React, { useState } from 'react';
import { StandardDocItem } from '../types';
import { Modal } from '../components/Modal';
import {
  BookOpen,
  Upload,
  FileText,
  Trash2,
  Eye,
  Plus,
  AlertCircle,
  FileCode,
  CheckCircle,
} from 'lucide-react';

interface StandardsViewProps {
  documents: StandardDocItem[];
  onSaveStandards: (docs: StandardDocItem[]) => Promise<void>;
  onShowToast: (msg: string, type: 'info' | 'success' | 'error') => void;
}

export const StandardsView: React.FC<StandardsViewProps> = ({
  documents,
  onSaveStandards,
  onShowToast,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<StandardDocItem | null>(null);
  const [docToDelete, setDocToDelete] = useState<StandardDocItem | null>(null);

  const [pastedTitle, setPastedTitle] = useState('');
  const [pastedText, setPastedText] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const MAX_TOTAL_CHARS = 800000;
  const MAX_FILE_SIZE_BYTES = 200 * 1024; // 200 KB

  const totalCharsUsed = documents.reduce((sum, d) => sum + (d.sizeChars || 0), 0);
  const percentUsed = Math.min(100, Math.round((totalCharsUsed / MAX_TOTAL_CHARS) * 100));

  // Extract document title from first heading line without leading '#' and space (Rule 8.F)
  const extractTitle = (text: string, fallbackName: string): string => {
    const lines = text.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('#')) {
        const withoutHash = trimmed.replace(/^#+\s*/, '').trim();
        if (withoutHash) return withoutHash;
      }
    }
    return fallbackName;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    e.target.value = '';

    // Check extension: .md or .txt only (Rule 8.F)
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'md' && ext !== 'txt') {
      onShowToast('Only .md and .txt files are allowed.', 'error');
      return;
    }

    // Check file size: max 200 KB per file
    if (file.size > MAX_FILE_SIZE_BYTES) {
      onShowToast(`File exceeds the 200 KB limit (${(file.size / 1024).toFixed(1)} KB).`, 'error');
      return;
    }

    try {
      const text = await file.text();
      const sizeChars = text.length;

      if (totalCharsUsed + sizeChars > MAX_TOTAL_CHARS) {
        onShowToast(
          `Uploading this document would exceed the total 800,000 characters limit by ${
            totalCharsUsed + sizeChars - MAX_TOTAL_CHARS
          } characters.`,
          'error'
        );
        return;
      }

      const title = extractTitle(text, file.name);
      const newDoc: StandardDocItem = {
        id: crypto.randomUUID(),
        title,
        text,
        sizeChars,
        uploadedAt: new Date().toISOString(),
      };

      setIsSaving(true);
      await onSaveStandards([...documents, newDoc]);
      onShowToast(`Uploaded "${title}" successfully.`, 'success');
    } catch (err: any) {
      onShowToast(err.message || 'Failed to read and upload standard file.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddPastedText = async () => {
    const text = pastedText.trim();
    if (!text) {
      onShowToast('Please paste document content.', 'error');
      return;
    }

    const sizeChars = text.length;
    if (sizeChars > 200000) {
      onShowToast('Pasted content exceeds the 200,000 character limit for a single standard.', 'error');
      return;
    }

    if (totalCharsUsed + sizeChars > MAX_TOTAL_CHARS) {
      onShowToast('Adding this document exceeds the 800,000 character total storage limit.', 'error');
      return;
    }

    const title = pastedTitle.trim() || extractTitle(text, 'Manual Standard Document');
    const newDoc: StandardDocItem = {
      id: crypto.randomUUID(),
      title,
      text,
      sizeChars,
      uploadedAt: new Date().toISOString(),
    };

    setIsSaving(true);
    try {
      await onSaveStandards([...documents, newDoc]);
      setShowAddModal(false);
      setPastedTitle('');
      setPastedText('');
      onShowToast(`Saved standard "${title}".`, 'success');
    } catch (err: any) {
      onShowToast(err.message || 'Failed to save standard.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteDoc = async () => {
    if (!docToDelete) return;
    setIsSaving(true);
    try {
      const updated = documents.filter((d) => d.id !== docToDelete.id);
      await onSaveStandards(updated);
      setShowDeleteModal(false);
      setDocToDelete(null);
      onShowToast('Document deleted.', 'info');
    } catch (err: any) {
      onShowToast(err.message || 'Failed to delete document.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen size={24} className="text-[#6D28D9]" />
            DNSC Quality Standards Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Uploaded standards (IS, PR, SS codes) referenced by the AI Audit Guide during VOC interviews.
          </p>
        </div>

        {/* Upload & Add Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <label className="px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5">
            <Upload size={14} />
            <span>Upload File (.md / .txt)</span>
            <input
              type="file"
              accept=".md,.txt"
              onChange={handleFileUpload}
              className="hidden"
              disabled={isSaving}
            />
          </label>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            disabled={isSaving}
            className="px-4 py-2.5 bg-[#6D28D9] hover:bg-[#5b21b6] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Plus size={14} />
            <span>Paste Text</span>
          </button>
        </div>
      </div>

      {/* Storage Quota Card */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-purple-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-xs font-semibold text-slate-600 block">
            Storage Usage: {totalCharsUsed.toLocaleString()} of {MAX_TOTAL_CHARS.toLocaleString()} characters ({percentUsed}%)
          </span>
          <div className="w-full sm:w-80 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                percentUsed > 90 ? 'bg-rose-500' : 'bg-[#0F766E]'
              }`}
              style={{ width: `${percentUsed}%` }}
            />
          </div>
        </div>

        <div className="text-xs text-slate-500">
          Max 200 KB per file · Formats: Markdown (.md) or Plain Text (.txt)
        </div>
      </div>

      {/* Documents List */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-purple-100 space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <FileCode size={18} className="text-[#6D28D9]" />
          Registered Quality Documents ({documents.length})
        </h3>

        {documents.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No service standards uploaded yet. Upload DNSC guidelines (e.g., Citizen's Charter, instructional targets) so the Audit Guide can match codes.
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-purple-200 transition-all flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 text-[#6D28D9] flex items-center justify-center shrink-0">
                    <FileText size={16} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-slate-900 truncate lg:truncate-none">{doc.title}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {doc.sizeChars.toLocaleString()} chars · Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setViewingDoc(doc);
                      setShowViewModal(true);
                    }}
                    className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer"
                    title="View Document Content"
                  >
                    <Eye size={16} />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDocToDelete(doc);
                      setShowDeleteModal(true);
                    }}
                    className="p-2 rounded-lg text-rose-600 hover:text-rose-800 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Delete Document"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Paste Standard Text In-App Modal */}
      <Modal
        isOpen={showAddModal}
        title="Add Service Standard"
        onClose={() => setShowAddModal(false)}
        confirmLabel="Save Standard"
        onConfirm={handleAddPastedText}
        isLoading={isSaving}
      >
        <div className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Document Title (Optional if first line contains # Title)
            </label>
            <input
              type="text"
              value={pastedTitle}
              onChange={(e) => setPastedTitle(e.target.value)}
              placeholder="e.g. DNSC Citizen's Charter - Instructional Services"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-purple-600"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Document Content (Markdown / Text) *
            </label>
            <textarea
              rows={10}
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="# Instructional Services Standards&#10;&#10;### IS-5: Syllabi Submission&#10;Target: 1 working day&#10;&#10;### IS-6: Midterm Grades Encoding&#10;Target: 3 working days"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-[11px] focus:outline-none focus:ring-1 focus:ring-purple-600"
            />
          </div>
        </div>
      </Modal>

      {/* View Document Modal */}
      <Modal
        isOpen={showViewModal}
        title={viewingDoc?.title || 'Standard Document'}
        onClose={() => {
          setShowViewModal(false);
          setViewingDoc(null);
        }}
      >
        <pre className="text-[11px] font-mono text-slate-700 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto bg-slate-50 p-3 rounded-xl border border-slate-200">
          {viewingDoc?.text}
        </pre>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        title="Confirm Document Deletion"
        onClose={() => {
          setShowDeleteModal(false);
          setDocToDelete(null);
        }}
        confirmLabel="Delete Standard"
        confirmVariant="danger"
        isLoading={isSaving}
        onConfirm={handleDeleteDoc}
      >
        <p>
          Are you sure you want to delete <strong>"{docToDelete?.title}"</strong>?
        </p>
        <p className="mt-2 text-xs text-slate-500">
          The AI Audit Guide will no longer reference the codes and targets from this standard in subsequent interviews.
        </p>
      </Modal>
    </div>
  );
};
