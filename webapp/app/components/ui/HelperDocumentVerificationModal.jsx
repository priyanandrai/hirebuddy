"use client";

import { useState, useRef, useEffect } from "react";
import {
  Camera,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  FileText,
  User,
  MapPin,
  Sparkles,
  Loader2,
  RotateCcw,
  SwitchCamera,
  Check,
} from "lucide-react";
import { uploadDocumentFile } from "../services/upload.service";
import { submitIdDocument } from "../services/user.service";

/**
 * Mobile-friendly 3-Step Document Verification Modal for Helpers
 * Step 1: Upload / Take Photo (Selfie / Profile Picture)
 * Step 2: ID Proof (Aadhaar / PAN / Driving License / Voter ID)
 * Step 3: Address Proof (Aadhaar Back / Utility Bill / Rent Agreement)
 *
 * Includes integrated Live Camera Viewfinder with front/back camera support,
 * guide overlays, live snapshot review, and fallback to device gallery/files.
 */
export default function HelperDocumentVerificationModal({
  isOpen,
  onClose,
  onComplete,
  user,
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Step 1: Photo (Selfie)
  const [photoUrl, setPhotoUrl] = useState(user?.image || "");
  const [photoPreview, setPhotoPreview] = useState(user?.image || "");

  // Step 2: ID Proof
  const [idType, setIdType] = useState("Aadhaar Card (Front)");
  const [idDocUrl, setIdDocUrl] = useState(user?.idDocumentUrl || "");
  const [idDocName, setIdDocName] = useState("");

  // Step 3: Address Proof
  const [addressType, setAddressType] = useState("Aadhaar Card (Back Side)");
  const [addressDocUrl, setAddressDocUrl] = useState(user?.addressProofUrl || "");
  const [addressDocName, setAddressDocName] = useState("");

  // =========================================
  // LIVE CAMERA VIEWFINDER STATE
  // =========================================
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraTarget, setCameraTarget] = useState("photo"); // "photo" | "id" | "address"
  const [cameraFacingMode, setCameraFacingMode] = useState("user"); // "user" | "environment"
  const [capturedSnapshot, setCapturedSnapshot] = useState(null);
  const [isInitializingCamera, setIsInitializingCamera] = useState(false);
  const [cameraError, setCameraError] = useState("");

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Hidden file inputs for Device / Gallery selection
  const selfieGalleryInputRef = useRef(null);
  const idFileInputRef = useRef(null);
  const addressFileInputRef = useRef(null);

  useEffect(() => {
    if (user?.image && !photoUrl) {
      setPhotoUrl(user.image);
      setPhotoPreview(user.image);
    }
    if (user?.idDocumentUrl && !idDocUrl) {
      setIdDocUrl(user.idDocumentUrl);
    }
    if (user?.addressProofUrl && !addressDocUrl) {
      setAddressDocUrl(user.addressProofUrl);
    }
    if (user?.idDocumentType) {
      setIdType(user.idDocumentType);
    }
    if (user?.addressProofType) {
      setAddressType(user.addressProofType);
    }
  }, [user]);

  // Clean up camera stream tracks when unmounting
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  // Handle active camera streaming
  useEffect(() => {
    let isCancelled = false;

    async function initStream() {
      if (!isCameraOpen || capturedSnapshot) return;
      setIsInitializingCamera(true);
      setCameraError("");

      try {
        // Stop any previously running stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }

        if (!navigator?.mediaDevices?.getUserMedia) {
          throw new Error(
            "Camera is not supported on this browser or requires HTTPS / localhost. Please choose from your gallery."
          );
        }

        let stream = null;
        try {
          // Attempt with desired facing mode constraint
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode:
                cameraFacingMode === "user" ? "user" : { ideal: "environment" },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
            audio: false,
          });
        } catch (constraintErr) {
          console.warn(
            "FacingMode constraint failed, falling back to basic video:",
            constraintErr
          );
          // Fallback for laptops/desktops where environment camera constraint may throw
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        }

        if (isCancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          try {
            await videoRef.current.play();
          } catch (e) {
            console.warn("Video play interrupted:", e);
          }
        }
      } catch (err) {
        if (isCancelled) return;
        console.error("Camera access error:", err);
        let msg = "Unable to access camera.";
        if (
          err.name === "NotAllowedError" ||
          err.name === "PermissionDeniedError"
        ) {
          msg =
            "Camera permission was denied. Please allow camera access in your browser or choose from your gallery.";
        } else if (
          err.name === "NotFoundError" ||
          err.name === "DevicesNotFoundError"
        ) {
          msg =
            "No camera found on your device. Please choose from your gallery.";
        } else if (err.message) {
          msg = err.message;
        }
        setCameraError(msg);
      } finally {
        if (!isCancelled) {
          setIsInitializingCamera(false);
        }
      }
    }

    initStream();

    return () => {
      isCancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [isCameraOpen, cameraFacingMode, capturedSnapshot]);

  if (!isOpen) return null;

  // Open in-app live camera viewfinder
  function startCamera(target, initialFacing = null) {
    setError("");
    setCameraError("");
    setCapturedSnapshot(null);
    const facing = initialFacing || (target === "photo" ? "user" : "environment");
    setCameraTarget(target);
    setCameraFacingMode(facing);
    setIsCameraOpen(true);
  }

  // Stop camera tracks and exit viewfinder
  function closeCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
    setCapturedSnapshot(null);
    setCameraError("");
    setIsInitializingCamera(false);
  }

  // Toggle front vs rear camera
  function toggleCameraFacing() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  }

  // Snap photo from the live video feed
  function captureSnapshot() {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Mirror user/selfie camera so photo matches the natural mirror viewfinder
    if (cameraFacingMode === "user") {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, width, height);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setCapturedSnapshot(dataUrl);

    // Stop live stream while reviewing captured snapshot
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }

  // Discard snapshot and restart live stream
  function retakeSnapshot() {
    setCapturedSnapshot(null);
  }

  // Confirm snapshot and trigger upload
  async function confirmSnapshot() {
    if (!capturedSnapshot) return;
    const snapshotData = capturedSnapshot;
    const target = cameraTarget;
    closeCamera();

    try {
      const res = await fetch(snapshotData);
      const blob = await res.blob();
      const fileName = `${target}_camera_${Date.now()}.jpg`;
      const file = new File([blob], fileName, { type: "image/jpeg" });
      await handleFileUpload(file, target);
    } catch (err) {
      console.error("Failed to process captured photo:", err);
      setError("Failed to process captured image. Please try again.");
    }
  }

  // Quick fallback from camera viewfinder to device gallery picker
  function openGalleryFallback() {
    closeCamera();
    selfieGalleryInputRef.current?.click();
  }

  function handleModalClose() {
    closeCamera();
    onClose();
  }

  // Generic file upload handler
  async function handleFileUpload(file, target) {
    if (!file) return;
    setError("");
    setUploading(true);

    try {
      const res = await uploadDocumentFile(file);
      const url = res.data?.url || res.url;
      if (!url) throw new Error("Upload failed: No URL returned");

      if (target === "photo") {
        setPhotoUrl(url);
        setPhotoPreview(url);
      } else if (target === "id") {
        setIdDocUrl(url);
        setIdDocName(file.name || "ID Proof Document");
      } else if (target === "address") {
        setAddressDocUrl(url);
        setAddressDocName(file.name || "Address Proof Document");
      }
    } catch (err) {
      console.error("Upload error:", err);
      setError(err.message || "Failed to upload file. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  // Handle final submission of all 3 documents
  async function handleSubmitAll() {
    setError("");
    if (!photoUrl && !idDocUrl && !addressDocUrl) {
      setError("Please complete at least one verification step before submitting.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await submitIdDocument({
        image: photoUrl || undefined,
        idDocumentUrl: idDocUrl || undefined,
        addressProofUrl: addressDocUrl || undefined,
        idDocumentType: idType,
        addressProofType: addressType,
      });

      // Update stored user in localStorage
      const updatedUser = res.user || {
        ...user,
        image: photoUrl || user?.image,
        idDocumentUrl: idDocUrl || user?.idDocumentUrl,
        addressProofUrl: addressDocUrl || user?.addressProofUrl,
        idVerificationStatus: "PENDING",
      };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      sessionStorage.removeItem("just_registered_helper");
      localStorage.removeItem("helper_doc_modal_skipped");
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("userProfileUpdated"));
      }

      setSuccess(true);
      if (onComplete) {
        onComplete(updatedUser);
      }
    } catch (err) {
      console.error("Submit error:", err);
      setError(err.message || "Failed to submit verification. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const idTypes = [
    "Aadhaar Card (Front)",
    "PAN Card",
    "Driving License",
    "Voter ID Card",
  ];

  const addressTypes = [
    "Aadhaar Card (Back Side)",
    "Electricity / Utility Bill",
    "Rent Agreement",
    "Ration Card / Bank Passbook",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      {/* Hidden file inputs for Gallery / Device Storage */}
      <input
        type="file"
        accept="image/*"
        ref={selfieGalleryInputRef}
        className="hidden"
        onChange={(e) => {
          handleFileUpload(e.target.files?.[0], "photo");
          e.target.value = "";
        }}
      />
      <input
        type="file"
        accept="image/*,application/pdf"
        ref={idFileInputRef}
        className="hidden"
        onChange={(e) => {
          handleFileUpload(e.target.files?.[0], "id");
          e.target.value = "";
        }}
      />
      <input
        type="file"
        accept="image/*,application/pdf"
        ref={addressFileInputRef}
        className="hidden"
        onChange={(e) => {
          handleFileUpload(e.target.files?.[0], "address");
          e.target.value = "";
        }}
      />

      {/* Mobile Bottom Sheet & Desktop Centered Card */}
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-t-[2.5rem] sm:rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[94vh] sm:max-h-[90vh]">
        {/* =========================================================================
            MODE A: LIVE CAMERA VIEWFINDER OVERLAY
           ========================================================================= */}
        {isCameraOpen ? (
          <div className="relative flex flex-col h-[560px] sm:h-[600px] bg-slate-950 overflow-hidden select-none">
            {/* Top Bar */}
            <div className="p-4 bg-gradient-to-b from-slate-950/95 via-slate-950/70 to-transparent absolute top-0 inset-x-0 z-20 flex items-center justify-between">
              <button
                type="button"
                onClick={closeCamera}
                className="p-2 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 transition shadow-lg"
                title="Cancel and close camera"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div className="text-center">
                <h3 className="text-sm font-bold text-white tracking-wide">
                  Take Profile Selfie
                </h3>
                <p className="text-[11px] text-emerald-400 font-medium">
                  {capturedSnapshot
                    ? "Review your captured photo"
                    : "Look directly into camera"}
                </p>
              </div>

              {!capturedSnapshot ? (
                <button
                  type="button"
                  onClick={toggleCameraFacing}
                  className="p-2 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 transition shadow-lg"
                  title="Switch front / rear camera"
                >
                  <SwitchCamera className="w-5 h-5" />
                </button>
              ) : (
                <div className="w-9" />
              )}
            </div>

            {/* Viewfinder Main Center Feed */}
            <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
              {cameraError ? (
                <div className="p-6 text-center max-w-sm space-y-4">
                  <div className="w-14 h-14 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto">
                    <AlertCircle className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      Camera Not Accessible
                    </h4>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      {cameraError}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 pt-2">
                    <button
                      type="button"
                      onClick={openGalleryFallback}
                      className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg"
                    >
                      <UploadCloud className="w-4 h-4" />
                      <span>Choose from Gallery / Files instead</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCameraError("");
                        setCameraFacingMode((p) => p);
                      }}
                      className="w-full py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition"
                    >
                      Try Camera Again
                    </button>
                  </div>
                </div>
              ) : capturedSnapshot ? (
                /* Frozen Snapshot Preview */
                <div className="relative w-full h-full flex items-center justify-center bg-black">
                  <img
                    src={capturedSnapshot}
                    alt="Captured Snapshot"
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute top-16 left-4 right-4 text-center pointer-events-none">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/90 border border-emerald-500/40 text-emerald-400 text-xs font-semibold shadow-lg">
                      <Check className="w-3.5 h-3.5" />
                      <span>Photo Snapped</span>
                    </span>
                  </div>
                </div>
              ) : (
                /* Live Camera Feed */
                <div className="relative w-full h-full flex items-center justify-center">
                  <video
                    ref={videoRef}
                    playsInline
                    autoPlay
                    muted
                    className={`w-full h-full object-cover ${
                      cameraFacingMode === "user" ? "scale-x-[-1]" : ""
                    }`}
                  />

                  {isInitializingCamera && (
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                      <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                      <p className="text-xs text-slate-300 font-medium">
                        Opening camera stream...
                      </p>
                    </div>
                  )}

                  {/* Guide Overlays (Face Alignment Circle) */}
                  {!isInitializingCamera && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <div className="w-52 h-64 sm:w-60 sm:h-72 rounded-full border-2 border-dashed border-emerald-400/80 shadow-[0_0_0_9999px_rgba(2,6,23,0.55)] flex items-end justify-center pb-3">
                        <span className="text-[11px] font-semibold text-emerald-300 bg-slate-950/90 px-3 py-0.5 rounded-full border border-emerald-500/40 shadow">
                          Align face inside circle
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Controls */}
            <div className="p-4 bg-gradient-to-t from-slate-950/95 via-slate-950/80 to-transparent absolute bottom-0 inset-x-0 z-20">
              {capturedSnapshot ? (
                /* Snapshot Review Controls */
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={retakeSnapshot}
                    className="flex-1 py-3.5 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg"
                  >
                    <RotateCcw className="w-4 h-4 text-slate-300" />
                    <span>Retake Photo</span>
                  </button>

                  <button
                    type="button"
                    onClick={confirmSnapshot}
                    disabled={uploading}
                    className="flex-1 py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50"
                  >
                    {uploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Use This Photo</span>
                      </>
                    )}
                  </button>
                </div>
              ) : !cameraError ? (
                /* Live Shutter Controls */
                <div className="flex items-center justify-between px-4">
                  {/* Gallery Shortcut */}
                  <button
                    type="button"
                    onClick={openGalleryFallback}
                    className="p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 transition flex flex-col items-center gap-1 shadow-md"
                    title="Upload from gallery"
                  >
                    <UploadCloud className="w-5 h-5 text-emerald-400" />
                    <span className="text-[10px] font-semibold">Gallery</span>
                  </button>

                  {/* Shutter Button */}
                  <button
                    type="button"
                    onClick={captureSnapshot}
                    disabled={isInitializingCamera}
                    className="group relative flex items-center justify-center w-20 h-20 rounded-full bg-transparent border-4 border-white/90 p-1.5 transition active:scale-95 disabled:opacity-40"
                    title="Take Photo"
                  >
                    <div className="w-full h-full rounded-full bg-white group-hover:bg-emerald-400 transition-colors shadow-2xl flex items-center justify-center">
                      <Camera className="w-7 h-7 text-slate-950" />
                    </div>
                  </button>

                  {/* Flip Camera Shortcut */}
                  <button
                    type="button"
                    onClick={toggleCameraFacing}
                    className="p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 transition flex flex-col items-center gap-1 shadow-md"
                    title="Flip camera"
                  >
                    <SwitchCamera className="w-5 h-5 text-emerald-400" />
                    <span className="text-[10px] font-semibold">Flip</span>
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          /* =========================================================================
              MODE B: STANDARD 3-STEP VERIFICATION MODAL
             ========================================================================= */
          <>
            {/* Mobile drag handle indicator */}
            <div className="pt-3 pb-1 sm:hidden flex justify-center">
              <div className="w-12 h-1.5 rounded-full bg-slate-700"></div>
            </div>

            {/* Modal Header */}
            <div className="px-6 pt-4 pb-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white">
                    Helper Verification
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Complete 3 steps to earn your Verified Partner Badge
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleModalClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
                title="Skip for now"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stepper Progress Bar */}
            {!success && (
              <div className="px-6 pt-4 pb-2 bg-slate-950/50">
                {/* Steps pills */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  {/* Step 1 Pill */}
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className={`py-2 px-1 rounded-xl font-medium transition flex items-center justify-center gap-1.5 ${
                      currentStep === 1
                        ? "bg-emerald-600 text-white font-semibold shadow-md shadow-emerald-950"
                        : photoUrl
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {photoUrl ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <User className="w-3.5 h-3.5" />
                    )}
                    <span className="truncate">1. Photo</span>
                  </button>

                  {/* Step 2 Pill */}
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className={`py-2 px-1 rounded-xl font-medium transition flex items-center justify-center gap-1.5 ${
                      currentStep === 2
                        ? "bg-emerald-600 text-white font-semibold shadow-md shadow-emerald-950"
                        : idDocUrl
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {idDocUrl ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <FileText className="w-3.5 h-3.5" />
                    )}
                    <span className="truncate">2. ID Proof</span>
                  </button>

                  {/* Step 3 Pill */}
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className={`py-2 px-1 rounded-xl font-medium transition flex items-center justify-center gap-1.5 ${
                      currentStep === 3
                        ? "bg-emerald-600 text-white font-semibold shadow-md shadow-emerald-950"
                        : addressDocUrl
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {addressDocUrl ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <MapPin className="w-3.5 h-3.5" />
                    )}
                    <span className="truncate">3. Address</span>
                  </button>
                </div>

                {/* Micro progress line */}
                <div className="w-full h-1 bg-slate-800 rounded-full mt-3 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${(currentStep / 3) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Modal Body / Scrollable Content */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* =========================================
                  SUCCESS STATE
                 ========================================= */}
              {success ? (
                <div className="text-center py-6 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto text-3xl font-bold">
                    ✓
                  </div>
                  <h3 className="text-xl font-bold text-white">
                    Documents Submitted!
                  </h3>
                  <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                    Thank you,{" "}
                    <strong className="text-white">
                      {user?.name || "Partner"}
                    </strong>
                    . Your photo, government ID, and address proof have been
                    received. Our admin team will inspect them shortly to award
                    your{" "}
                    <strong className="text-emerald-400">
                      Verified Partner Badge
                    </strong>
                    .
                  </p>

                  <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 text-left space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-300">
                      <span>Photo / Selfie:</span>
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Uploaded
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span>ID Proof ({idType}):</span>
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Uploaded
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-300">
                      <span>Address Proof ({addressType}):</span>
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Uploaded
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleModalClose}
                    className="w-full py-3.5 rounded-2xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-500 transition shadow-lg shadow-emerald-950/40"
                  >
                    Go to Dashboard
                  </button>
                </div>
              ) : (
                <>
                  {/* =========================================
                      STEP 1: Upload / Take Photo (Selfie)
                     ========================================= */}
                  {currentStep === 1 && (
                    <div className="space-y-4">
                      <div>
                        <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                          Step 1 of 3
                        </span>
                        <h3 className="text-lg font-bold text-white mt-0.5">
                          Take a Selfie or Profile Photo
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">
                          Customers want to see who they are welcoming into their
                          home. Upload a clear, friendly photo of your face.
                        </p>
                      </div>

                      {/* Photo Preview / Upload Area */}
                      {photoPreview ? (
                        <div className="relative rounded-2xl border border-emerald-500/30 bg-slate-950/80 p-5 text-center space-y-3">
                          <div className="w-28 h-28 mx-auto rounded-full overflow-hidden border-2 border-emerald-500/50 shadow-lg relative bg-slate-900">
                            <img
                              src={photoPreview}
                              alt="Selfie preview"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Selfie Ready</span>
                          </div>

                          <div className="flex justify-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => startCamera("photo", "user")}
                              disabled={uploading}
                              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition flex items-center gap-1.5"
                            >
                              <Camera className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Retake with Camera</span>
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                selfieGalleryInputRef.current?.click()
                              }
                              disabled={uploading}
                              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition flex items-center gap-1.5"
                            >
                              <UploadCloud className="w-3.5 h-3.5 text-slate-400" />
                              <span>Choose from Gallery</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-2xl border-2 border-dashed border-slate-800 bg-slate-950/60 p-6 text-center space-y-4">
                          <div className="w-16 h-16 rounded-full bg-slate-800/80 border border-slate-700 text-slate-400 flex items-center justify-center mx-auto">
                            <User className="w-8 h-8" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-200">
                              No photo uploaded yet
                            </p>
                            <p className="text-xs text-slate-400 mt-1">
                              Take a live photo using your camera or choose from
                              device gallery
                            </p>
                          </div>

                          {/* 2 Big Action Buttons for Mobile */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                            <button
                              type="button"
                              onClick={() => startCamera("photo", "user")}
                              disabled={uploading}
                              className="py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40"
                            >
                              {uploading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <Camera className="w-4 h-4" />
                                  <span>Take Photo / Camera</span>
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                selfieGalleryInputRef.current?.click()
                              }
                              disabled={uploading}
                              className="py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition flex items-center justify-center gap-2"
                            >
                              <UploadCloud className="w-4 h-4 text-emerald-400" />
                              <span>Choose from Gallery</span>
                            </button>
                          </div>
                        </div>
                      )}

                      <p className="text-[11px] text-slate-500 italic">
                        💡 Tip: Look directly at the camera in a well-lit room
                        without sunglasses or hats.
                      </p>
                    </div>
                  )}

                  {/* =========================================
                      STEP 2: Government ID Proof
                     ========================================= */}
                  {currentStep === 2 && (
                    <div className="space-y-4">
                      <div>
                        <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                          Step 2 of 3
                        </span>
                        <h3 className="text-lg font-bold text-white mt-0.5">
                          Government ID Proof
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">
                          Upload an official government ID card to verify your
                          identity.
                        </p>
                      </div>

                      {/* ID Type Selector */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                          Select ID Type
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {idTypes.map((t) => (
                            <button
                              type="button"
                              key={t}
                              onClick={() => setIdType(t)}
                              className={`p-2.5 rounded-xl text-xs font-medium border text-left transition ${
                                idType === t
                                  ? "bg-emerald-600/20 border-emerald-500 text-emerald-300 font-semibold"
                                  : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                              }`}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* ID Document Preview / Upload Area */}
                      {idDocUrl ? (
                        <div className="rounded-2xl border border-emerald-500/30 bg-slate-950/80 p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                                <FileText className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-white">
                                  {idType}
                                </p>
                                <p className="text-[10px] text-slate-400 truncate max-w-[200px]">
                                  {idDocName || "Document Uploaded ✓"}
                                </p>
                              </div>
                            </div>

                            <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                              Uploaded
                            </span>
                          </div>

                          {/* Small visual preview if image */}
                          {idDocUrl.match(/\.(jpg|jpeg|png|webp)/i) && (
                            <div className="h-28 w-full rounded-xl overflow-hidden bg-slate-900 border border-slate-800">
                              <img
                                src={idDocUrl}
                                alt="ID Document"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}

                          <div className="flex justify-end gap-2 pt-1 border-t border-slate-800">
                            <button
                              type="button"
                              onClick={() => idFileInputRef.current?.click()}
                              disabled={uploading}
                              className="px-3 py-1.5 rounded-xl bg-slate-800 text-xs font-medium text-slate-200 hover:bg-slate-700 transition flex items-center gap-1.5"
                            >
                              <UploadCloud className="w-3.5 h-3.5 text-slate-400" />
                              <span>Replace File</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-2xl border-2 border-dashed border-slate-800 bg-slate-950/60 p-5 text-center space-y-3">
                          <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                            <FileText className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-200">
                              Upload your {idType}
                            </p>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              Make sure name and details are clearly legible (PDF, JPG, PNG)
                            </p>
                          </div>

                          <div className="pt-1">
                            <button
                              type="button"
                              onClick={() => idFileInputRef.current?.click()}
                              disabled={uploading}
                              className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40"
                            >
                              {uploading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <UploadCloud className="w-4 h-4" />
                                  <span>Choose File / PDF</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* =========================================
                      STEP 3: Address Proof
                     ========================================= */}
                  {currentStep === 3 && (
                    <div className="space-y-4">
                      <div>
                        <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                          Step 3 of 3 · Final Step
                        </span>
                        <h3 className="text-lg font-bold text-white mt-0.5">
                          Local Address Proof
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">
                          Upload a document showing your residence in Meerut /
                          surrounding area.
                        </p>
                      </div>

                      {/* Address Type Selector */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                          Select Address Proof Document
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {addressTypes.map((t) => (
                            <button
                              type="button"
                              key={t}
                              onClick={() => setAddressType(t)}
                              className={`p-2.5 rounded-xl text-xs font-medium border text-left transition ${
                                addressType === t
                                  ? "bg-emerald-600/20 border-emerald-500 text-emerald-300 font-semibold"
                                  : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                              }`}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Address Document Preview / Upload Area */}
                      {addressDocUrl ? (
                        <div className="rounded-2xl border border-emerald-500/30 bg-slate-950/80 p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                                <MapPin className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-white">
                                  {addressType}
                                </p>
                                <p className="text-[10px] text-slate-400 truncate max-w-[200px]">
                                  {addressDocName || "Document Uploaded ✓"}
                                </p>
                              </div>
                            </div>

                            <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                              Uploaded
                            </span>
                          </div>

                          {/* Small visual preview if image */}
                          {addressDocUrl.match(/\.(jpg|jpeg|png|webp)/i) && (
                            <div className="h-28 w-full rounded-xl overflow-hidden bg-slate-900 border border-slate-800">
                              <img
                                src={addressDocUrl}
                                alt="Address Document"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}

                          <div className="flex justify-end gap-2 pt-1 border-t border-slate-800">
                            <button
                              type="button"
                              onClick={() => addressFileInputRef.current?.click()}
                              disabled={uploading}
                              className="px-3 py-1.5 rounded-xl bg-slate-800 text-xs font-medium text-slate-200 hover:bg-slate-700 transition flex items-center gap-1.5"
                            >
                              <UploadCloud className="w-3.5 h-3.5 text-slate-400" />
                              <span>Replace File</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-2xl border-2 border-dashed border-slate-800 bg-slate-950/60 p-5 text-center space-y-3">
                          <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                            <MapPin className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-200">
                              Upload your {addressType}
                            </p>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              Document must show your name and address (PDF, JPG, PNG)
                            </p>
                          </div>

                          <div className="pt-1">
                            <button
                              type="button"
                              onClick={() =>
                                addressFileInputRef.current?.click()
                              }
                              disabled={uploading}
                              className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40"
                            >
                              {uploading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <UploadCloud className="w-4 h-4" />
                                  <span>Choose File / PDF</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Summary Checklist */}
                      <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 text-xs space-y-2">
                        <span className="font-semibold text-slate-300 block mb-1">
                          Verification Summary:
                        </span>
                        <div className="flex items-center justify-between text-slate-400">
                          <span>1. Photo / Selfie</span>
                          {photoUrl ? (
                            <span className="text-emerald-400 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                            </span>
                          ) : (
                            <span className="text-slate-500 italic">Not added</span>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-slate-400">
                          <span>2. ID Proof ({idType})</span>
                          {idDocUrl ? (
                            <span className="text-emerald-400 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                            </span>
                          ) : (
                            <span className="text-slate-500 italic">Not added</span>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-slate-400">
                          <span>3. Address Proof ({addressType})</span>
                          {addressDocUrl ? (
                            <span className="text-emerald-400 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                            </span>
                          ) : (
                            <span className="text-slate-500 italic">Not added</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal Footer / Navigation Controls */}
            {!success && (
              <div className="px-6 py-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between gap-3">
                {currentStep > 1 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentStep((prev) => prev - 1)}
                    className="py-3 px-4 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleModalClose}
                    className="py-3 px-3 text-slate-400 hover:text-slate-200 text-xs font-medium transition"
                  >
                    Skip for now
                  </button>
                )}

                <div className="flex items-center gap-2">
                  {currentStep < 3 ? (
                    <button
                      type="button"
                      onClick={() => setCurrentStep((prev) => prev + 1)}
                      className="py-3 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-emerald-950/30"
                    >
                      <span>Next Step</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSubmitAll}
                      disabled={
                        submitting || (!photoUrl && !idDocUrl && !addressDocUrl)
                      }
                      className="py-3 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-emerald-950/50"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Submitting Proofs...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>Submit for Verification</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
