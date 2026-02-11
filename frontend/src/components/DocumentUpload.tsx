/**
 * DOCUMENT UPLOAD COMPONENT
 *
 * Allows users to upload documents to the RAG system
 *
 * Features:
 * - Textarea for pasting document text
 * - Input for source name
 * - Upload button
 * - Success/error feedback
 *
 * Props: none (standalone component)
 */

import { useState, useRef } from 'react';
import { ingestDocument, ingestFile } from '../services/api';

interface DocumentUploadProps {
  onUploadSuccess?: () => void;
}

export function DocumentUpload({ onUploadSuccess }: DocumentUploadProps) {
  const [activeTab, setActiveTab] = useState<'text' | 'file'>('file');
  const [text, setText] = useState('');
  const [source, setSource] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async () => {
    if (activeTab === 'text') {
      if (!text.trim() || !source.trim()) {
        setMessage({ type: 'error', text: 'Please provide both text and source name' });
        return;
      }
    } else {
      if (files.length === 0) {
        setMessage({ type: 'error', text: 'Please select at least one file to upload' });
        return;
      }
    }

    setIsUploading(true);
    setMessage(null);

    try {
      if (activeTab === 'text') {
        const response = await ingestDocument({ text, source });
        setMessage({
          type: 'success',
          text: `Successfully processed ${response.chunks_processed} chunks from ${response.source}`,
        });
        setText('');
        setSource('');
      } else {
        let totalChunks = 0;
        for (const file of files) {
          const response = await ingestFile(file, source || file.name);
          totalChunks += response.chunks_processed;
        }
        setMessage({
          type: 'success',
          text: `Successfully processed ${totalChunks} chunks from ${files.length} file(s)`,
        });
        setFiles([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
      
      // Refresh document list in sidebar
      if (onUploadSuccess) onUploadSuccess();
      
    } catch (error) {
      console.error('Upload error:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to upload document',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Knowledge Base</h2>
        
        {/* Tabs */}
        <div className="flex p-1 bg-gray-100 rounded-lg mb-6">
          <button
            onClick={() => setActiveTab('file')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === 'file' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Upload Files
          </button>
          <button
            onClick={() => setActiveTab('text')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === 'text' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Paste Text
          </button>
        </div>

        {activeTab === 'file' ? (
          <div className="space-y-4">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-all"
            >
              <input
                type="file"
                multiple
                ref={fileInputRef}
                onChange={(e) => setFiles(Array.from(e.target.files || []))}
                className="hidden"
                accept=".pdf,.txt"
              />
              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-900">
                {files.length > 0 
                  ? `${files.length} file(s) selected` 
                  : 'Click to upload or drag and drop'}
              </p>
              <div className="mt-2 flex flex-wrap gap-1 justify-center">
                {files.slice(0, 3).map((f, i) => (
                  <span key={i} className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 truncate max-w-[100px]">
                    {f.name}
                  </span>
                ))}
                {files.length > 3 && <span className="text-[10px] text-gray-400">+{files.length - 3} more</span>}
              </div>
              <p className="text-xs text-gray-500 mt-2">PDF or TXT up to 10MB</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Document Content</label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste your content here..."
                rows={5}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
            </div>
          </div>
        )}

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Source Name {activeTab === 'file' && '(Optional)'}
          </label>
          <input
            type="text"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder={activeTab === 'file' ? 'Leave empty to use filename' : 'e.g., Manual, Chapter 1'}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
          />
        </div>

        <button
          onClick={handleUpload}
          disabled={isUploading || (activeTab === 'text' && !text.trim()) || (activeTab === 'file' && files.length === 0)}
          className="w-full mt-6 bg-blue-600 text-white rounded-lg py-2.5 font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-sm"
        >
          {isUploading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Processing...
            </span>
          ) : (
            'Ingest Knowledge'
          )}
        </button>

        {message && (
          <div className={`mt-4 p-3 rounded-lg text-sm flex items-start gap-2 ${
            message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            <div className="mt-0.5">
              {message.type === 'success' ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
              ) : (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              )}
            </div>
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
}
