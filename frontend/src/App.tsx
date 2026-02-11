/**
 * MAIN APP COMPONENT
 *
 * Root component of the application
 *
 * Layout:
 * - Two column layout on desktop (sidebar + chat)
 * - Single column on mobile (stacked)
 * - Left: Document upload
 * - Right: Chat interface
 *
 * This uses Tailwind's responsive classes:
 * - Base classes apply to all screen sizes
 * - md: prefix applies to medium screens and up (768px+)
 * - lg: prefix applies to large screens and up (1024px+)
 */

import { useState, useEffect } from 'react';
import { Chat } from './components/Chat';
import { DocumentUpload } from './components/DocumentUpload';
import { getDocuments, deleteDocument } from './services/api';
import type { DocumentInfo } from './types';

function App() {
  const [view, setView] = useState<'chat' | 'upload'>('chat');
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const fetchDocs = async () => {
    try {
      const data = await getDocuments();
      // Group by source to avoid duplicates in the list
      const uniqueDocs: DocumentInfo[] = [];
      const seenSources = new Set();
      for (const doc of data.documents) {
        if (!seenSources.has(doc.source)) {
          seenSources.add(doc.source);
          uniqueDocs.push(doc);
        }
      }
      setDocuments(uniqueDocs);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    }
  };

  const handleDelete = async (source: string) => {
    if (!confirm(`Are you sure you want to delete "${source}"?`)) return;
    
    setIsDeleting(source);
    try {
      await deleteDocument(source);
      await fetchDocs();
    } catch (error) {
      alert('Failed to delete document');
      console.error(error);
    } finally {
      setIsDeleting(null);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Top Header / Navigation */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Gemini RAG</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-1 text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-100 px-2 py-1 rounded">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            System Ready
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Knowledge Base */}
        <aside className="hidden lg:flex flex-col w-96 bg-white border-r border-gray-200 overflow-hidden">
          {/* Top Section: Upload (Scrollable if needed) */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 border-b border-gray-100 scrollbar-thin scrollbar-thumb-gray-100">
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1 mb-4">Ingest Knowledge</h3>
              <DocumentUpload onUploadSuccess={fetchDocs} />
            </div>
          </div>

          {/* Bottom Section: File List (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/30 scrollbar-thin scrollbar-thumb-gray-200">
            {documents.length > 0 ? (
              <>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1 flex items-center justify-between">
                  Current Knowledge
                  <span className="bg-white border border-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full text-[10px]">{documents.length}</span>
                </h3>
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex items-center gap-3 px-3 py-2.5 bg-white rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-sm transition-all group">
                      <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        {doc.source.toLowerCase().endsWith('.pdf') ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-700 truncate">{doc.source}</p>
                        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-tight">Active Source</p>
                      </div>
                      <button
                        onClick={() => handleDelete(doc.source)}
                        disabled={isDeleting === doc.source}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="Delete Source"
                      >
                        {isDeleting === doc.source ? (
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center px-4">
                <div className="w-12 h-12 bg-white border border-gray-100 rounded-full flex items-center justify-center mb-3 shadow-sm">
                  <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H4a2 2 0 00-2 2v14a2 2 0 002 2h8m4-6h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">No Knowledge Ingested</p>
              </div>
            )}
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0 bg-gray-50">
          <Chat />
        </main>
      </div>

      {/* Mobile Toggle (only on smaller screens) */}
      <div className="lg:hidden fixed bottom-6 right-6 z-50">
        <button 
          onClick={() => setView(view === 'chat' ? 'upload' : 'chat')}
          className="w-14 h-14 bg-blue-600 rounded-full shadow-lg flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all"
        >
          {view === 'chat' ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          )}
        </button>
      </div>
      
      {/* Mobile Sidebar Overlay */}
      {view === 'upload' && (
        <div className="lg:hidden fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm flex justify-end">
          <div className="w-80 h-full bg-white p-6 overflow-y-auto animate-slide-in-right">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold">Knowledge Base</h2>
              <button onClick={() => setView('chat')} className="p-2 hover:bg-gray-100 rounded-full">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-8">
              <DocumentUpload onUploadSuccess={fetchDocs} />
              
              {documents.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center justify-between px-1">
                    Current Knowledge
                    <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full text-[10px]">{documents.length}</span>
                  </h3>
                  <div className="space-y-2">
                    {documents.map((doc) => (
                      <div key={doc.id} className="flex items-center gap-3 px-3 py-2.5 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-700 truncate">{doc.source}</p>
                        </div>
                        <button
                          onClick={() => handleDelete(doc.source)}
                          className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
