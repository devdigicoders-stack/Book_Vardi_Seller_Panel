import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  School,
  Search,
  Plus,
  Check,
  ChevronDown,
  Clock,
  CheckCircle2,
  Building2,
  MapPin,
  X,
  AlertCircle
} from 'lucide-react';
import { fetchSchoolsApi } from '../utils/api';

export const ALL_SCHOOLS_OPTION = {
  schoolId: 'SCH-ALL',
  name: 'All Schools (Open for All Schools)',
  shortName: 'All Schools',
  code: 'ALL',
  schoolCode: 'ALL',
  city: 'Pan-India',
  board: 'All Boards',
  status: 'Partner Active'
};

export const DEFAULT_FALLBACK_SCHOOLS = [
  ALL_SCHOOLS_OPTION,
  { schoolId: 'SCH-001', name: 'Kendriya Vidyalaya No. 1', shortName: 'KV No. 1', city: 'Delhi Cantt', board: 'CBSE', status: 'Partner Active' },
  { schoolId: 'SCH-002', name: 'Delhi Public School, R.K. Puram', shortName: 'DPS RK Puram', city: 'New Delhi', board: 'CBSE', status: 'Partner Active' },
  { schoolId: 'SCH-003', name: 'DPS Kanpur Kalyanpur', shortName: 'DPS Kanpur', city: 'Kanpur', board: 'CBSE', status: 'Partner Active' },
  { schoolId: 'SCH-004', name: "Children's College Azamgarh", shortName: "Children's College", city: 'Azamgarh', board: 'CBSE', status: 'Partner Active' },
  { schoolId: 'SCH-005', name: 'The Mother’s International School', shortName: 'Mother’s International', city: 'New Delhi', board: 'CBSE', status: 'Partner Active' },
  { schoolId: 'SCH-006', name: 'St. Xavier Senior Secondary School', shortName: 'St. Xavier', city: 'Jaipur', board: 'ICSE', status: 'Partner Active' },
  { schoolId: 'SCH-007', name: 'Army Public School', shortName: 'Army Public School', city: 'Dhaula Kuan', board: 'CBSE', status: 'Partner Active' },
  { schoolId: 'SCH-008', name: 'Modern School, Barakhamba Road', shortName: 'Modern School', city: 'New Delhi', board: 'CBSE', status: 'Partner Active' },
  { schoolId: 'SCH-009', name: 'City Montessori School', shortName: 'CMS Lucknow', city: 'Lucknow', board: 'ICSE', status: 'Partner Active' },
  { schoolId: 'SCH-010', name: 'Ryan International School', shortName: 'Ryan International', city: 'Noida', board: 'CBSE', status: 'Partner Active' }
];

export default function SchoolSelectorWithCustom({
  selectedSchoolName = '',
  selectedSchoolCode = '',
  onSelectSchool, // (schoolObj) => void
  userRole = 'seller', // 'seller' | 'admin'
  required = true
}) {
  const [schools, setSchools] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customError, setCustomError] = useState('');

  // Custom School Form State
  const [customForm, setCustomForm] = useState({
    name: '',
    board: 'CBSE',
    city: '',
    schoolCode: '',
    status: userRole === 'admin' ? 'Partner Active' : 'pending'
  });

  const containerRef = useRef(null);

  // Load and merge schools from API, localStorage, and defaults
  const loadSchools = async () => {
    let apiSchools = [];
    try {
      const res = await fetchSchoolsApi();
      if (Array.isArray(res) && res.length > 0) {
        apiSchools = res;
      }
    } catch (e) {
      console.warn('School API load error:', e);
    }

    let localSchools = [];
    try {
      const raw = localStorage.getItem('admin_schools');
      if (raw) localSchools = JSON.parse(raw);
    } catch (e) {}

    // Deduplicate prioritizing ALL_SCHOOLS_OPTION first, then authoritative apiSchools, then local, then fallbacks
    const schoolMap = new Map();
    const seenIds = new Set();
    const combined = [ALL_SCHOOLS_OPTION, ...apiSchools, ...localSchools, ...DEFAULT_FALLBACK_SCHOOLS];

    combined.forEach((sch, idx) => {
      if (sch && sch.name) {
        const nameKey = sch.name.trim().toLowerCase();
        if (!schoolMap.has(nameKey)) {
          let sId = sch.schoolId || sch.code || `SCH-${idx + 1}`;
          if (seenIds.has(sId) && !sch._id) {
            sId = `${sId}-${idx + 1}`;
          }
          seenIds.add(sId);

          schoolMap.set(nameKey, {
            ...sch,
            schoolId: sId,
            status: sch.status || 'Partner Active'
          });
        }
      }
    });

    setSchools(Array.from(schoolMap.values()));
  };

  useEffect(() => {
    loadSchools();
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setIsAddingCustom(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtered schools
  const filteredSchools = useMemo(() => {
    if (!searchQuery.trim()) return schools;
    const q = searchQuery.toLowerCase().trim();
    return schools.filter(s =>
      (s.name || '').toLowerCase().includes(q) ||
      (s.city || '').toLowerCase().includes(q) ||
      (s.board || '').toLowerCase().includes(q) ||
      (s.schoolCode || s.code || '').toLowerCase().includes(q)
    );
  }, [schools, searchQuery]);

  // Selected school object
  const selectedSchoolObj = useMemo(() => {
    if (!selectedSchoolName) return null;
    return schools.find(s => s.name?.toLowerCase() === selectedSchoolName.toLowerCase()) || {
      name: selectedSchoolName,
      code: selectedSchoolCode,
      board: 'CBSE',
      city: 'General',
      status: 'Partner Active'
    };
  }, [selectedSchoolName, selectedSchoolCode, schools]);

  const handleSelect = (sch) => {
    onSelectSchool({
      name: sch.name,
      schoolCode: sch.code || sch.schoolCode || sch.schoolId || '',
      board: sch.board || 'CBSE',
      city: sch.city || '',
      status: sch.status || 'Partner Active'
    });
    setIsOpen(false);
    setIsAddingCustom(false);
    setSearchQuery('');
  };

  // Submit custom school
  const handleSaveCustomSchool = async (e) => {
    e.preventDefault();
    if (!customForm.name.trim()) {
      setCustomError('School name is required');
      return;
    }
    if (!customForm.city.trim()) {
      setCustomError('City is required');
      return;
    }

    const newSchoolStatus = userRole === 'admin' ? 'Partner Active' : 'pending';
    const newSchoolObj = {
      schoolId: `SCH-${Date.now().toString().slice(-4)}`,
      name: customForm.name.trim(),
      shortName: customForm.name.trim().split(' ').slice(0, 3).join(' '),
      code: customForm.schoolCode.trim() || `SCH-${Date.now().toString().slice(-4)}`,
      schoolCode: customForm.schoolCode.trim(),
      board: customForm.board,
      city: customForm.city.trim(),
      status: newSchoolStatus,
      isCustom: true,
      createdAt: new Date().toISOString()
    };

    // Try posting to backend
    try {
      const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000/api';
      fetch(`${SERVER_URL}/schools`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSchoolObj)
      }).catch(() => {});
    } catch (e) {}

    // Save to local storage
    try {
      const existing = JSON.parse(localStorage.getItem('admin_schools') || '[]');
      const updated = [newSchoolObj, ...existing.filter(s => s.name?.toLowerCase() !== newSchoolObj.name.toLowerCase())];
      localStorage.setItem('admin_schools', JSON.stringify(updated));
      window.dispatchEvent(new Event('storage'));
    } catch (e) {}

    setSchools(prev => [newSchoolObj, ...prev.filter(s => s.name?.toLowerCase() !== newSchoolObj.name.toLowerCase())]);
    handleSelect(newSchoolObj);
  };

  return (
    <div className="relative space-y-1.5" ref={containerRef}>
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-gray-700">
          Partner School / Institution {required && <span className="text-red-500">*</span>}
        </label>
        <button
          type="button"
          onClick={() => {
            setIsOpen(true);
            setIsAddingCustom(true);
          }}
          className="text-[11px] font-extrabold text-brand-teal hover:underline flex items-center gap-1 cursor-pointer"
        >
          <Plus size={12} /> Add Custom School
        </button>
      </div>

      {/* Selected Box / Toggle Button */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3.5 py-2.5 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition-all ${
          selectedSchoolName
            ? 'bg-white border-teal-300 ring-1 ring-teal-200'
            : 'bg-gray-50 border-gray-200 hover:border-gray-300'
        }`}
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
            selectedSchoolName ? 'bg-teal-50 text-brand-teal' : 'bg-gray-200 text-gray-500'
          }`}>
            <School size={15} />
          </div>
          {selectedSchoolName ? (
            <div className="truncate">
              <span className="font-extrabold text-gray-900 block truncate">
                {selectedSchoolName}
              </span>
              <div className="text-[10px] text-gray-500 flex items-center gap-1.5 mt-0.5">
                {selectedSchoolObj?.board && <span className="font-semibold text-teal-800 bg-teal-50 px-1.5 py-0.2 rounded">{selectedSchoolObj.board}</span>}
                {selectedSchoolObj?.city && <span>• {selectedSchoolObj.city}</span>}
                {selectedSchoolObj?.status === 'pending' ? (
                  <span className="text-amber-700 font-bold bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                    ⏳ Pending Admin Approval
                  </span>
                ) : (
                  <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                    ✓ Verified Partner
                  </span>
                )}
              </div>
            </div>
          ) : (
            <span className="text-gray-400 font-medium">Click to select an institution or add custom school...</span>
          )}
        </div>
        <ChevronDown size={15} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180 text-brand-teal' : ''}`} />
      </div>

      {/* DROPDOWN POPUP */}
      {isOpen && (
        <div className="absolute left-0 right-0 z-50 mt-1 bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 max-h-96 flex flex-col">
          
          {/* Header & Search */}
          <div className="p-2.5 border-b border-gray-100 bg-gray-50/70 space-y-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by school name, city, board..."
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-brand-teal font-medium"
                autoFocus
              />
            </div>

            {/* Quick Action Buttons */}
            {!isAddingCustom && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleSelect(ALL_SCHOOLS_OPTION)}
                  className="flex-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <CheckCircle2 size={13} className="text-emerald-600" />
                  <span>All Schools (Universal)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingCustom(true)}
                  className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-brand-teal border border-teal-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  <Plus size={14} />
                  <span>+ Custom</span>
                </button>
              </div>
            )}
          </div>

          {/* Form for Custom School (Collapsible) */}
          {isAddingCustom && (
            <div className="p-3 bg-teal-50/60 border-b border-teal-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-teal-950 uppercase tracking-wider flex items-center gap-1">
                  <Building2 size={13} className="text-brand-teal" /> Register New Custom School
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddingCustom(false)}
                  className="text-gray-400 hover:text-gray-700"
                >
                  <X size={14} />
                </button>
              </div>

              {customError && (
                <div className="text-[10px] text-red-600 bg-red-50 p-1.5 rounded-lg font-bold flex items-center gap-1">
                  <AlertCircle size={12} /> {customError}
                </div>
              )}

              <div className="space-y-2 text-xs">
                <div>
                  <input
                    type="text"
                    required
                    value={customForm.name}
                    onChange={e => setCustomForm({ ...customForm, name: e.target.value })}
                    placeholder="Full School Name (e.g. St. Jude High School)"
                    className="w-full px-2.5 py-1.5 bg-white border border-teal-300 rounded-lg text-xs font-semibold outline-none focus:ring-1 focus:ring-brand-teal"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={customForm.board}
                    onChange={e => setCustomForm({ ...customForm, board: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-teal-300 rounded-lg text-xs font-medium outline-none cursor-pointer"
                  >
                    <option value="CBSE">CBSE Board</option>
                    <option value="ICSE">ICSE / ISC</option>
                    <option value="State Board">State Board</option>
                    <option value="IB">IB International</option>
                    <option value="Cambridge">Cambridge IGCSE</option>
                  </select>

                  <input
                    type="text"
                    required
                    value={customForm.city}
                    onChange={e => setCustomForm({ ...customForm, city: e.target.value })}
                    placeholder="City (e.g. Lucknow)"
                    className="w-full px-2.5 py-1.5 bg-white border border-teal-300 rounded-lg text-xs font-medium outline-none focus:ring-1 focus:ring-brand-teal"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-teal-800 font-semibold flex items-center gap-1">
                    <Clock size={11} /> Status: <strong className="text-amber-800">{userRole === 'admin' ? 'Instant Approved' : 'Pending Admin Approval'}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={handleSaveCustomSchool}
                    className="px-3.5 py-1 bg-brand-teal hover:bg-teal-800 text-white font-extrabold text-xs rounded-lg shadow-xs transition-colors cursor-pointer"
                  >
                    Save & Select
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* School Items List */}
          <div className="overflow-y-auto divide-y divide-gray-100 flex-1">
            {filteredSchools.length === 0 ? (
              <div className="p-4 text-center text-xs text-gray-400">
                No matching schools found. Click "+ Add Custom / Unlisted School" to register it.
              </div>
            ) : (
              filteredSchools.map((sch, idx) => {
                const isSelected = sch.name?.toLowerCase() === selectedSchoolName.toLowerCase();
                const isPending = sch.status === 'pending';
                const itemKey = sch._id ? String(sch._id) : `${sch.schoolId || 'sch'}-${sch.name || idx}-${idx}`;
                return (
                  <div
                    key={itemKey}
                    onClick={() => handleSelect(sch)}
                    className={`p-2.5 px-3 flex items-center justify-between text-xs hover:bg-teal-50/50 cursor-pointer transition-colors ${
                      isSelected ? 'bg-teal-50 font-bold' : ''
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="font-bold text-gray-900 flex items-center gap-1.5">
                        <span>{sch.name}</span>
                        {isPending ? (
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-200">
                            Pending
                          </span>
                        ) : (
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Partner
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-gray-500 flex items-center gap-1.5">
                        <span className="text-teal-800 font-semibold">{sch.board}</span>
                        <span>•</span>
                        <span>{sch.city || 'Pan-India'}</span>
                        {sch.code && <span className="font-mono text-gray-400">({sch.code})</span>}
                      </div>
                    </div>

                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-brand-teal text-white flex items-center justify-center shrink-0">
                        <Check size={12} />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
