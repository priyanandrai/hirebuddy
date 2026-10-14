"use client";

import { useState, useRef } from "react";
import { 
  UploadCloud, 
  Link2, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  ExternalLink,
  Loader2,
  Image as ImageIcon
} from "lucide-react";
import { uploadDocumentFile } from "../services/upload.service";

/**
 * Reusable Document Uploader allowing:
 * 1. Upload from Device (file picker + drag-drop)
 * 2. Paste Link / Text URL
 */
export default function DocumentUploader({
  value = "",
  onChange,
  theme = "dark", // "dark" | "light"
  label = "Government ID Document",
  optionalText = "(Optional)",
  badgeText = "For Verified Badge",
  helperText = "Upload or link your government ID so admins can review and verify you.",
}) {
  const [activeTab, setActiveTab] = useState("file"); // "file" | "url"
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const isDark = theme === "dark";

  // Derive if current value looks like an image or PDF
  const isImage = value && (
    value.match(/\.(jpeg|jpg|png|webp)($|\?)/i) ||
    value.includes("data:image/") ||
    value.includes("unsplash.com") ||
    value.includes("placehold.co")
  );
  const isPdf = value && value.match(/\.pdf($|\?)/i);

  const handleFileSelect = async (file) => {
    if (!file) return;
    setUploadError("");
    setUploading(true);

    try {
      const res = await uploadDocumentFile(file);
      if (res?.data?.url) {
        onChange(res.data.url);
        setUploadedFileName(file.name);
      } else {
        throw new Error("No URL returned from server");
      }
    } catch (err) {
      console.error("Upload error:", err);
      setUploadError(err.message || "Failed to upload file. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const onFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleClear = () => {
    onChange("");
    setUploadedFileName("");
    setUploadError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-2">
      {/* Label and Badge Header */}
      <div className="flex items-center justify-between">
        <label className={`block text-sm font-medium ${isDark ? "text-slate-300" : "text-gray-900"}`}>
          {label} {optionalText && <span className={`text-xs ${isDark ? "text-slate-500" : "text-gray-500"}`}>{optionalText}</span>}
        </label>
        {badgeText && (
          <span className={`text-xs font-semibold ${isDark ? "text-emerald-400" : "text-emerald-600"}`}>
            {badgeText}
          </span>
        )}
      </div>

      {/* Mode Switcher Tabs */}
      <div className={`flex rounded-xl p-1 gap-1 ${isDark ? "bg-slate-950/80 border border-slate-800" : "bg-gray-100 border border-gray-200"}`}>
        <button
          type="button"
          onClick={() => setActiveTab("file")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium transition ${
            activeTab === "file"
              ? isDark
                ? "bg-slate-800 text-white shadow-sm"
                : "bg-white text-gray-900 shadow-sm"
              : isDark
              ? "text-slate-400 hover:text-slate-200"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <UploadCloud className="h-4 w-4" />
          <span>Upload from Device</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("url")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium transition ${
            activeTab === "url"
              ? isDark
                ? "bg-slate-800 text-white shadow-sm"
                : "bg-white text-gray-900 shadow-sm"
              : isDark
              ? "text-slate-400 hover:text-slate-200"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <Link2 className="h-4 w-4" />
          <span>Paste Link / URL</span>
        </button>
      </div>

      {/* TAB 1: Upload from Device */}
      {activeTab === "file" && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/jpg,application/pdf"
            onChange={onFileInputChange}
            className="hidden"
          />

          {value ? (
            /* Uploaded Preview Card */
            <div
              className={`rounded-2xl border p-4 flex items-center justify-between gap-3 ${
                isDark
                  ? "border-emerald-500/30 bg-emerald-950/20 text-slate-200"
                  : "border-green-300 bg-green-50/70 text-gray-800"
              }`}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div
                  className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${
                    isDark ? "bg-emerald-500/20 text-emerald-400" : "bg-green-100 text-green-700"
                  }`}
                >
                  {isPdf ? (
                    <FileText className="h-6 w-6" />
                  ) : (
                    <CheckCircle2 className="h-6 w-6" />
                  )}
                </div>
                <div className="truncate">
                  <div className="flex items-center gap-1.5">
                    <p className={`text-xs font-semibold truncate ${isDark ? "text-white" : "text-gray-900"}`}>
                      {uploadedFileName || (value.split("/").pop() || "Document Attached")}
                    </p>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                        isDark ? "bg-emerald-500/20 text-emerald-300" : "bg-green-200 text-green-800"
                      }`}
                    >
                      Ready
                    </span>
                  </div>
                  <a
                    href={value}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-[11px] text-blue-400 hover:underline mt-0.5"
                  >
                    <span>Inspect uploaded file</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                    isDark
                      ? "bg-slate-800 hover:bg-slate-700 text-slate-200"
                      : "bg-white hover:bg-gray-100 text-gray-700 border border-gray-300"
                  }`}
                >
                  Change
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  aria-label="Remove uploaded file"
                  className={`p-1.5 rounded-xl transition ${
                    isDark
                      ? "hover:bg-slate-800 text-slate-400 hover:text-rose-400"
                      : "hover:bg-gray-200 text-gray-400 hover:text-rose-600"
                  }`}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            /* Dropzone Area */
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition flex flex-col items-center justify-center gap-2 ${
                dragActive
                  ? isDark
                    ? "border-emerald-500 bg-emerald-950/20"
                    : "border-green-500 bg-green-50"
                  : isDark
                  ? "border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-900/60"
                  : "border-gray-300 bg-gray-50/60 hover:border-gray-400 hover:bg-gray-100/60"
              }`}
            >
              {uploading ? (
                <div className="flex flex-col items-center gap-2 py-2">
                  <Loader2 className={`h-8 w-8 animate-spin ${isDark ? "text-emerald-400" : "text-green-600"}`} />
                  <p className={`text-xs font-semibold ${isDark ? "text-slate-300" : "text-gray-700"}`}>
                    Uploading document from your device...
                  </p>
                </div>
              ) : (
                <>
                  <div
                    className={`h-12 w-12 rounded-2xl flex items-center justify-center ${
                      isDark ? "bg-slate-800 text-emerald-400" : "bg-gray-200 text-emerald-600"
                    }`}
                  >
                    <UploadCloud className="h-6 w-6" />
                  </div>
                  <div>
                    <p className={`text-xs font-semibold ${isDark ? "text-white" : "text-gray-800"}`}>
                      Click to choose file <span className="font-normal text-slate-400">or drag & drop</span>
                    </p>
                    <p className={`text-[11px] mt-0.5 ${isDark ? "text-slate-500" : "text-gray-500"}`}>
                      Aadhaar Card, Driving License, Voter ID (JPG, PNG, WEBP, PDF up to 10MB)
                    </p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Paste Link / Text URL */}
      {activeTab === "url" && (
        <div className="space-y-2">
          <div className="relative">
            <input
              type="url"
              value={value}
              onChange={(e) => {
                setUploadError("");
                onChange(e.target.value);
              }}
              placeholder="Paste link to ID image or PDF (Aadhaar, Voter ID, Driving License)"
              className={`w-full rounded-2xl border px-3 py-3 text-sm focus:ring-2 focus:ring-emerald-500 transition ${
                isDark
                  ? "border-slate-700 bg-slate-950 text-slate-100 placeholder-slate-600"
                  : "border-gray-300 bg-white text-gray-900 placeholder-gray-400"
              }`}
            />
            {value && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {value && (
            <div className="flex items-center justify-between text-xs px-1">
              <span className={`flex items-center gap-1 ${isDark ? "text-emerald-400" : "text-green-600"}`}>
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Link connected</span>
              </span>
              <a
                href={value}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-blue-400 hover:underline"
              >
                <span>Inspect URL</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {uploadError && (
        <p className="flex items-center gap-1 text-xs text-rose-400 mt-1">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{uploadError}</span>
        </p>
      )}

      {/* Helper text */}
      {helperText && (
        <p className={`text-xs ${isDark ? "text-slate-400" : "text-gray-500"}`}>
          {helperText}
        </p>
      )}
    </div>
  );
}
