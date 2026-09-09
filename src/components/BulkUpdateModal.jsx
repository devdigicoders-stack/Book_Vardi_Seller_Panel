import React, { useState, useRef } from 'react';
import { UploadCloud, FileSpreadsheet, Download, CheckCircle2, AlertTriangle, X, RefreshCw } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useSellerData } from '../context/SellerDataContext';

export default function BulkUpdateModal({ isOpen, onClose }) {
  const { bulkAddOrUpdateProducts } = useSellerData();
  const [parsedData, setParsedData] = useState([]);
  const [fileName, setFileName] = useState('');
  const [errors, setErrors] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleDownloadTemplate = (format = 'csv') => {
    const headers = [
      {
        id: '201',
        name: 'Classic White School Shirt',
        category: 'uniforms',
        price: 399,
        originalPrice: 499,
        stockQuantity: 100,
        sizes: 'S, M, L, XL',
        colors: 'White',
        gender: 'Unisex',
        sku: 'SHIRT-WHT-01',
        image: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=500&auto=format&fit=crop&q=80'
      },
      {
        id: '202',
        name: 'NCERT English Honeydew Class 8',
        category: 'ncert',
        price: 130,
        originalPrice: 130,
        stockQuantity: 80,
        sizes: 'Standard',
        colors: 'Multi',
        gender: 'All',
        sku: 'BOOK-NCERT-ENG8',
        image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=80'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(headers);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Product_Template');

    if (format === 'csv') {
      XLSX.writeFile(workbook, 'SchoolCart_Product_Bulk_Template.csv', { bookType: 'csv' });
    } else {
      XLSX.writeFile(workbook, 'SchoolCart_Product_Bulk_Template.xlsx');
    }
  };

  const processFile = (file) => {
    if (!file) return;
    setFileName(file.name);
    setErrors([]);
    setSuccessMessage('');

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);

        if (!json || json.length === 0) {
          setErrors(['The uploaded file is empty or formatted incorrectly.']);
          return;
        }

        // Validate rows
        const validationErrors = [];
        const validatedRows = json.map((row, idx) => {
          const rowNum = idx + 2; // +1 for 0-index, +1 for header
          const hasName = Boolean(row.name && String(row.name).trim());
          const price = Number(row.price);
          const hasValidPrice = !isNaN(price) && price > 0;

          if (!hasName) {
            validationErrors.push(`Row ${rowNum}: 'name' is required.`);
          }
          if (!hasValidPrice) {
            validationErrors.push(`Row ${rowNum}: 'price' must be a positive number.`);
          }

          return {
            ...row,
            __valid: hasName && hasValidPrice
          };
        });

        setParsedData(validatedRows);
        setErrors(validationErrors);
      } catch (err) {
        setErrors([`Error parsing file: ${err.message}`]);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleApply = () => {
    try {
      setIsProcessing(true);
      const validRows = parsedData.filter((r) => r.__valid);
      if (validRows.length === 0) {
        setErrors(['No valid rows to import. Please check your data.']);
        setIsProcessing(false);
        return;
      }

      bulkAddOrUpdateProducts(validRows);
      setSuccessMessage(`Successfully updated/imported ${validRows.length} products!`);
      setTimeout(() => {
        setIsProcessing(false);
        onClose();
      }, 1200);
    } catch (err) {
      setErrors([err.message]);
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Bulk Product & Inventory Update</h2>
              <p className="text-xs text-gray-500">Upload Excel or CSV to add or update multiple products at once</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Template download bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-teal-50/60 border border-teal-100">
            <div>
              <div className="text-sm font-semibold text-teal-900">Need the formatted upload template?</div>
              <div className="text-xs text-teal-700">Pre-configured with all required columns: Name, Price, Category, Sizes, Stock, etc.</div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleDownloadTemplate('xlsx')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-teal-700 hover:bg-teal-800 text-white shadow-xs transition-colors"
              >
                <Download size={14} /> Download Excel (.xlsx)
              </button>
              <button
                onClick={() => handleDownloadTemplate('csv')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-teal-300 text-teal-800 hover:bg-teal-50 shadow-xs transition-colors"
              >
                <Download size={14} /> Download CSV
              </button>
            </div>
          </div>

          {/* Drag and Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 hover:border-teal-500 rounded-2xl p-8 text-center cursor-pointer bg-gray-50/50 hover:bg-teal-50/20 transition-all group"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => processFile(e.target.files?.[0])}
            />
            <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <UploadCloud size={28} />
            </div>
            <div className="font-semibold text-gray-800 text-base">
              {fileName ? fileName : 'Click to browse or drag & drop spreadsheet here'}
            </div>
            <p className="text-xs text-gray-500 mt-1">Supports .xlsx, .xls and .csv files up to 10MB</p>
          </div>

          {/* Error and Success alerts */}
          {errors.length > 0 && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs space-y-1">
              <div className="flex items-center gap-2 font-bold text-sm text-red-800">
                <AlertTriangle size={16} /> Validation Alerts ({errors.length})
              </div>
              <ul className="list-disc pl-5 max-h-24 overflow-y-auto space-y-0.5">
                {errors.slice(0, 5).map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
                {errors.length > 5 && <li>...and {errors.length - 5} more issues</li>}
              </ul>
            </div>
          )}

          {successMessage && (
            <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-green-800 text-sm flex items-center gap-2 font-medium">
              <CheckCircle2 size={18} className="text-green-600" />
              {successMessage}
            </div>
          )}

          {/* Preview Table */}
          {parsedData.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-gray-600">
                <span>Spreadsheet Preview ({parsedData.length} records found)</span>
                <span className="text-emerald-600">
                  {parsedData.filter((r) => r.__valid).length} valid rows ready to import
                </span>
              </div>
              <div className="border border-gray-200 rounded-xl overflow-hidden max-h-60 overflow-x-auto shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-100 text-gray-700 uppercase tracking-wider font-semibold border-b border-gray-200">
                    <tr>
                      <th className="p-2.5">Status</th>
                      <th className="p-2.5">Name</th>
                      <th className="p-2.5">Category</th>
                      <th className="p-2.5">Price (₹)</th>
                      <th className="p-2.5">Stock</th>
                      <th className="p-2.5">Sizes</th>
                      <th className="p-2.5">Gender</th>
                      <th className="p-2.5">SKU</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {parsedData.map((row, i) => (
                      <tr key={i} className={row.__valid ? 'hover:bg-gray-50' : 'bg-red-50/50'}>
                        <td className="p-2.5 font-medium">
                          {row.__valid ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                              Valid
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-800">
                              Invalid
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 font-semibold text-gray-800 max-w-[180px] truncate">{row.name || '—'}</td>
                        <td className="p-2.5 text-gray-600 capitalize">{row.category || 'uniforms'}</td>
                        <td className="p-2.5 font-bold text-gray-900">₹{row.price || '0'}</td>
                        <td className="p-2.5 text-gray-600">{row.stockQuantity ?? 50}</td>
                        <td className="p-2.5 text-gray-600">{row.sizes || 'All'}</td>
                        <td className="p-2.5 text-gray-600">{row.gender || 'Unisex'}</td>
                        <td className="p-2.5 text-gray-500 font-mono text-[11px]">{row.sku || 'AUTO'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <button
            onClick={() => {
              setParsedData([]);
              setFileName('');
              setErrors([]);
            }}
            disabled={parsedData.length === 0}
            className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900 disabled:opacity-40"
          >
            <RefreshCw size={13} /> Reset
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={parsedData.length === 0 || isProcessing || parsedData.filter((r) => r.__valid).length === 0}
              className="px-5 py-2 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-xs transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isProcessing ? 'Importing Products...' : `Apply Bulk Update (${parsedData.filter((r) => r.__valid).length})`}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
