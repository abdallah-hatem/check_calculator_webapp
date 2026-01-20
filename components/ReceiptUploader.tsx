import React, { useState, useRef } from "react";
import { useReceipts } from "@/lib/hooks";
import { Loader2, Scan, Upload } from "lucide-react";

interface ReceiptUploaderProps {
  onScanComplete: (data: any) => void;
  onTestData?: () => void;
}

export function ReceiptUploader({
  onScanComplete,
  onTestData,
}: ReceiptUploaderProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { scanReceipt } = useReceipts();

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) return;

    setIsScanning(true);

    try {
      // Helper to convert file to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => {
          const base64String = (reader.result as string).split(",")[1];
          resolve(base64String);
        };
      });
      reader.readAsDataURL(file);
      const base64 = await base64Promise;

      const result = await scanReceipt(base64, file.type);
      if (result) {
        onScanComplete(result);
      }
    } catch (error: any) {
      console.error("Scan failed", error);
      alert(`Failed to scan receipt: ${error.message}`);
    } finally {
      setIsScanning(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files?.[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div
      className={`relative group border-2 border-dashed rounded-2xl p-8 transition-all duration-300 ${
        isDragOver
          ? "border-purple-500 bg-purple-500/10"
          : "border-white/10 hover:border-purple-500/50 hover:bg-white/5"
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={onDrop}
    >
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />

      <input
        type="file"
        ref={cameraInputRef}
        className="hidden"
        accept="image/*"
        capture="environment"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />

      <div className="flex flex-col items-center justify-center gap-4 text-center">
        <div
          className={`p-4 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 ring-1 ring-white/10 ${isScanning ? "animate-pulse" : ""}`}
        >
          {isScanning ? (
            <Loader2 className="h-8 w-8 text-purple-400 animate-spin" />
          ) : (
            <Scan className="h-8 w-8 text-purple-400" />
          )}
        </div>

        <div>
          <h3 className="text-lg font-bold text-white mb-1">
            {isScanning ? "Analyzing Receipt..." : "Scan Receipt with AI"}
          </h3>
          <p className="text-sm text-gray-400 max-w-xs mx-auto">
            {isScanning
              ? "Extracting items and fees via Gemini..."
              : "Drag & drop an image or click to upload"}
          </p>
        </div>

        {!isScanning && (
          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm px-4">
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-xl font-bold shadow-lg shadow-purple-900/20 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Scan className="h-5 w-5" />
              Take Photo
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold border border-white/10 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Upload Image
            </button>
          </div>
        )}

        {process.env.NODE_ENV === "development" &&
          onTestData &&
          !isScanning && (
            <button
              onClick={onTestData}
              className="text-xs font-bold text-green-400/50 hover:text-green-400 transition-colors uppercase tracking-widest mt-4"
            >
              Load Test Data (Dev Only)
            </button>
          )}
      </div>
    </div>
  );
}
