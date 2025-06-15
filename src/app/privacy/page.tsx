'use client';

import { useSettings } from '@/hooks/useSettings';

export default function PrivacyPolicy() {
  const { settings, loading } = useSettings();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Политика конфиденциальности</h1>
          <style jsx global>{`
            .privacy-content h1 { font-size: 2em; margin-bottom: 0.5em; }
            .privacy-content h2 { font-size: 1.5em; margin-bottom: 0.5em; }
            .privacy-content h3 { font-size: 1.25em; margin-bottom: 0.5em; }
            .privacy-content h4 { font-size: 1.1em; margin-bottom: 0.5em; }
            .privacy-content p { margin-bottom: 1em; }
            .privacy-content ul { 
              list-style-type: disc !important;
              margin: 1em 0;
              padding-left: 2em;
            }
            .privacy-content ol { 
              list-style-type: decimal !important;
              margin: 1em 0;
              padding-left: 2em;
            }
            .privacy-content li { 
              margin-bottom: 0.5em;
              display: list-item !important;
            }
            .privacy-content li::marker {
              color: #4B5563;
            }
          `}</style>
          <div 
            className="privacy-content prose prose-lg prose-blue max-w-none text-gray-700 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: settings?.privacyPolicy || '' }}
          />
        </div>
      </div>
    </div>
  );
} 