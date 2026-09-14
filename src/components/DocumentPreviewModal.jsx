import React, { useState, useEffect } from 'react';
import { X, Download, ExternalLink, FileText, Image as ImageIcon, AlertCircle, RefreshCw } from 'lucide-react';
import { getMediaUrl, getFileNameOnly } from '../utils/mediaUrl';

// Convert base64 data URL to Blob for Chrome/Edge native PDF rendering
function dataURLtoBlob(dataurl) {
  if (!dataurl || typeof dataurl !== 'string' || !dataurl.startsWith('data:')) return null;
  try {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'application/pdf';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  } catch {
    return null;
  }
}

export default function DocumentPreviewModal({ isOpen, onClose, doc }) {
  if (!isOpen || !doc) return null;

  const url = typeof doc === 'string' ? doc : doc?.url || '';
  const title = (typeof doc === 'object' && doc?.title) ? doc.title : 'Document Preview';
  const rawFileName = (typeof doc === 'object' && doc?.fileName) ? doc.fileName : url;
  const fileName = getFileNameOnly(rawFileName) || 'address_proof_document.pdf';
  const fullUrl = getMediaUrl(url);

  const [blobUrl, setBlobUrl] = useState(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    setLoadError(false);
    if (url && url.startsWith('data:application/pdf')) {
      const blob = dataURLtoBlob(url);
      if (blob) {
        const bUrl = URL.createObjectURL(blob);
        setBlobUrl(bUrl);
        return () => URL.revokeObjectURL(bUrl);
      }
    }
    setBlobUrl(null);
  }, [url]);

  const activePdfUrl = blobUrl || fullUrl;

  const isPdf = Boolean(
    url && (
      url.toLowerCase().includes('.pdf') || 
      url.startsWith('data:application/pdf') || 
      (fileName && fileName.toLowerCase().endsWith('.pdf'))
    )
  );

  const isImage = Boolean(
    url && !isPdf && (
      url.startsWith('data:image') || 
      /\.(jpg|jpeg|png|webp|gif|svg|bmp|tiff)($|\?)/i.test(url) ||
      (fileName && /\.(jpg|jpeg|png|webp|gif|svg|bmp|tiff)$/i.test(fileName)) ||
      url.includes('unsplash.com') ||
      url.includes('images') ||
      url.includes('avatar') ||
      title.toLowerCase().includes('photo') ||
      title.toLowerCase().includes('image') ||
      title.toLowerCase().includes('avatar') ||
      title.toLowerCase().includes('logo')
    )
  );

  const handleDownload = () => {
    if (!activePdfUrl) return;
    const a = document.createElement('a');
    a.href = activePdfUrl;
    a.download = fileName || title.toLowerCase().replace(/\s+/g, '_');
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-gray-100">
        
        {/* Header */}
        <div className="px-6 py-4 bg-teal-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            {isPdf ? (
              <div className="p-2 rounded-xl bg-white/10 text-brand-yellow">
                <FileText size={20} />
              </div>
            ) : (
              <div className="p-2 rounded-xl bg-white/10 text-teal-200">
                <ImageIcon size={20} />
              </div>
            )}
            <div>
              <h3 className="font-bold text-base text-white">{title}</h3>
              {fileName && (
                <p className="text-xs text-teal-200 font-mono mt-0.5 truncate max-w-md">
                  {fileName}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/10 text-gray-300 hover:text-white transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Preview Body */}
        <div className="p-4 sm:p-6 overflow-y-auto bg-gray-50/50 flex-1 flex items-center justify-center min-h-[380px]">
          {!activePdfUrl ? (
            <div className="text-center py-12 px-4 space-y-3 max-w-md">
              <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto border border-amber-200">
                <AlertCircle size={28} />
              </div>
              <h4 className="font-bold text-gray-800 text-sm">No Document File Uploaded</h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                This KYC/compliance field has not attached a binary image or PDF document stream yet.
              </p>
            </div>
          ) : isPdf ? (
            <div className="w-full h-[540px] rounded-xl overflow-hidden border border-gray-200 bg-white shadow-xs flex flex-col relative">
              {loadError ? (
                <div className="p-8 text-center bg-gray-50 flex flex-col items-center justify-center h-full space-y-3">
                  <FileText size={48} className="mx-auto text-teal-800 mb-2" />
                  <h4 className="font-bold text-gray-900 text-sm">{fileName}</h4>
                  <p className="text-xs text-gray-500 max-w-md leading-relaxed">
                    Local backend server on port 5000 is offline or document stream is restricted by browser security policies.
                  </p>
                  <div className="flex items-center gap-2 pt-2">
                    <a
                      href={activePdfUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-brand-teal hover:bg-brand-teal-light text-white font-bold text-xs rounded-xl shadow-xs"
                    >
                      <ExternalLink size={14} /> Open PDF in New Window
                    </a>
                    <button
                      type="button"
                      onClick={handleDownload}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-gray-800 hover:bg-black text-white font-bold text-xs rounded-xl shadow-xs"
                    >
                      <Download size={14} /> Download PDF
                    </button>
                  </div>
                </div>
              ) : (
                <iframe
                  src={activePdfUrl}
                  title={title}
                  className="w-full h-full border-none"
                />
              )}
            </div>
          ) : isImage ? (
            <div className="relative group max-h-[520px] flex items-center justify-center bg-gray-900/5 p-4 rounded-xl border border-gray-200 w-full">
              <img
                src={activePdfUrl}
                alt={title}
                className="max-h-[500px] max-w-full object-contain rounded-lg shadow-md"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.style.display = 'none';
                  setLoadError(true);
                }}
              />
            </div>
          ) : (
            <div className="text-center py-10 bg-white p-6 rounded-2xl border border-gray-200 max-w-md w-full shadow-xs space-y-3">
              <FileText size={48} className="mx-auto text-teal-700" />
              <div>
                <p className="font-bold text-gray-900 text-sm">{fileName}</p>
                <p className="text-xs text-gray-500 mt-1">PDF / Document File Stream Available</p>
              </div>
              <a
                href={activePdfUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-brand-teal text-white font-bold rounded-xl text-xs shadow-xs"
              >
                <ExternalLink size={14} /> Open Document File
              </a>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-white border-t border-gray-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            {activePdfUrl && (
              <a
                href={activePdfUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors"
              >
                <ExternalLink size={13} /> Open Original
              </a>
            )}
          </div>

          <div className="flex items-center gap-2">
            {activePdfUrl && (
              <button
                type="button"
                onClick={handleDownload}
                className="px-4 py-2 bg-brand-teal hover:bg-brand-teal-light text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Download size={14} /> Download Document
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-200 text-gray-600 hover:bg-gray-50 font-bold rounded-xl text-xs cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
