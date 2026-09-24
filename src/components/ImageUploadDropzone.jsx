import React, { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, X, Star, Plus, Link, Trash2, CheckCircle2 } from 'lucide-react';
import { resolveImageUrl } from '../utils/mediaUrl';

export default function ImageUploadDropzone({ 
  images = [], 
  onChange, 
  maxImages = 8,
  helperText = "Drag & drop product photos here, or browse files" 
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef(null);

  const handleFiles = (files) => {
    if (!files || files.length === 0) return;
    const fileList = Array.from(files).filter(file => file.type.startsWith('image/'));
    if (fileList.length === 0) return;

    const readPromises = fileList.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readPromises).then(newImages => {
      const combined = [...images, ...newImages].slice(0, maxImages);
      onChange(combined);
    });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
      e.dataTransfer.clearData();
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleAddUrl = (e) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    const combined = [...images, urlInput.trim()].slice(0, maxImages);
    onChange(combined);
    setUrlInput('');
    setShowUrlInput(false);
  };

  const handleRemove = (index, e) => {
    e.stopPropagation();
    const updated = images.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleSetPrimary = (index, e) => {
    e.stopPropagation();
    if (index === 0) return;
    const selected = images[index];
    const filtered = images.filter((_, i) => i !== index);
    onChange([selected, ...filtered]);
  };

  return (
    <div className="space-y-3">
      {/* Hidden File Input supporting multiple file selection */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = '';
        }}
        multiple
        accept="image/*"
        className="hidden"
      />

      {/* Main Drag & Drop Zone when empty */}
      {images.length === 0 ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
            isDragging 
              ? 'border-teal-600 bg-teal-50/60 scale-[1.01]' 
              : 'border-gray-300 hover:border-teal-700 hover:bg-teal-50/20 bg-gray-50/60'
          }`}
        >
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-800 flex items-center justify-center mx-auto mb-3">
            <UploadCloud size={24} />
          </div>
          <div className="text-xs font-extrabold text-gray-900">
            {helperText}
          </div>
          <p className="text-[11px] text-gray-500 mt-1">
            Supports multiple images: PNG, JPG, WEBP, SVG up to {maxImages} photos
          </p>
          <div className="mt-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-800 bg-white px-3.5 py-1.5 rounded-xl border border-gray-200 shadow-2xs">
              <Plus size={14} /> Browse from device
            </span>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 font-bold text-gray-800">
              <ImageIcon size={15} className="text-teal-700" />
              <span>{images.length} / {maxImages} Photos Uploaded</span>
              <span className="text-[11px] font-normal text-gray-500 hidden sm:inline">
                (First photo is the primary cover)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowUrlInput(!showUrlInput)}
                className="text-[11px] text-teal-800 hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                <Link size={12} />
                <span>{showUrlInput ? 'Hide URL' : '+ Add by URL'}</span>
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-[11px] text-rose-600 hover:underline font-medium cursor-pointer"
              >
                Clear All
              </button>
            </div>
          </div>

          {/* Grid of Preview Thumbnails */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {images.map((img, idx) => (
              <div
                key={idx}
                className={`group relative rounded-2xl overflow-hidden border-2 bg-gray-100 aspect-square shadow-2xs transition-all ${
                  idx === 0 ? 'border-teal-700 ring-2 ring-teal-700/20' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <img
                  src={resolveImageUrl(img)}
                  onError={(e) => { e.currentTarget.src = 'https://placehold.co/400x400?text=No+Image'; }}
                  alt={`Product ${idx + 1}`}
                  className="w-full h-full object-cover"
                />

                {/* Cover Badge */}
                {idx === 0 ? (
                  <div className="absolute top-2 left-2 bg-teal-800 text-white text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
                    <Star size={11} className="fill-brand-yellow text-brand-yellow" />
                    <span>COVER</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => handleSetPrimary(idx, e)}
                    className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 bg-black/70 hover:bg-teal-800 text-white text-[10px] font-bold px-2 py-0.5 rounded-md transition-all cursor-pointer"
                  >
                    Set Cover
                  </button>
                )}

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={(e) => handleRemove(idx, e)}
                  className="absolute top-2 right-2 bg-red-600/90 hover:bg-red-700 text-white p-1 rounded-lg transition-colors shadow-xs cursor-pointer opacity-90 group-hover:opacity-100"
                  title="Remove image"
                >
                  <Trash2 size={13} />
                </button>

                {/* Bottom Index */}
                <div className="absolute bottom-1.5 right-2 text-[10px] font-bold text-white bg-black/50 px-1.5 py-0.2 rounded">
                  #{idx + 1}
                </div>
              </div>
            ))}

            {/* Add More Drop Tile if under maxImages */}
            {images.length < maxImages && (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl aspect-square flex flex-col items-center justify-center p-2 text-center transition-all cursor-pointer ${
                  isDragging 
                    ? 'border-teal-600 bg-teal-50 scale-[1.02]' 
                    : 'border-gray-300 hover:border-teal-700 hover:bg-teal-50/30 bg-gray-50/50'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center mb-1">
                  <Plus size={18} />
                </div>
                <span className="text-[11px] font-bold text-gray-700">Add More</span>
                <span className="text-[9px] text-gray-400">or drop here</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Paste URL Option (Collapsible) */}
      {(showUrlInput || images.length === 0) && (
        <div className="flex items-center gap-2 pt-1">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Or paste external image URL (https://...)"
            className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-gray-300 focus:ring-2 focus:ring-brand-yellow outline-hidden bg-white"
          />
          <button
            type="button"
            onClick={handleAddUrl}
            disabled={!urlInput.trim()}
            className="px-3.5 py-2 text-xs font-bold bg-teal-800 hover:bg-teal-900 disabled:opacity-40 text-white rounded-xl cursor-pointer transition-colors shadow-2xs"
          >
            Add Image
          </button>
        </div>
      )}
    </div>
  );
}
