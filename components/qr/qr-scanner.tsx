"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Camera, CameraOff, AlertTriangle } from "lucide-react";

interface QRScannerProps {
  onScan: (result: string) => void;
  onError?: (error: string) => void;
}

export function QRScanner({ onScan, onError }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHttps, setIsHttps] = useState(true);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if we're on HTTPS (required for camera on iOS)
    if (typeof window !== "undefined") {
      const isSecure = window.location.protocol === "https:" || 
                       window.location.hostname === "localhost" ||
                       window.location.hostname === "127.0.0.1";
      setIsHttps(isSecure);
    }
  }, []);

  const startScanning = async () => {
    if (!containerRef.current) return;

    setError(null);

    // Check for camera support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const msg = "Camera not supported on this device/browser";
      setError(msg);
      onError?.(msg);
      return;
    }

    try {
      // First request camera permission explicitly
      await navigator.mediaDevices.getUserMedia({ video: true });
    } catch {
      const msg = "Camera permission denied. Please allow camera access in your browser settings.";
      setError(msg);
      onError?.(msg);
      return;
    }

    try {
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;

      // Try back camera first, fall back to any camera
      try {
        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1,
          },
          (decodedText) => {
            onScan(decodedText);
          },
          () => {}
        );
      } catch {
        // Fallback: try any available camera
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          await scanner.start(
            devices[0].id,
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
              aspectRatio: 1,
            },
            (decodedText) => {
              onScan(decodedText);
            },
            () => {}
          );
        } else {
          throw new Error("No cameras found");
        }
      }

      setIsScanning(true);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to start camera";
      setError(message);
      onError?.(message);
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
      } catch {
        // Ignore stop errors
      }
    }
    setIsScanning(false);
  };

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-4">
      {!isHttps && (
        <div className="flex items-center gap-2 p-3 bg-yellow-500/10 text-yellow-600 rounded-lg text-sm">
          <AlertTriangle className="w-4 h-4" />
          <span>Camera requires HTTPS. Please use a secure connection.</span>
        </div>
      )}

      <div
        id="qr-reader"
        ref={containerRef}
        className="w-full max-w-sm rounded-lg overflow-hidden bg-black"
        style={{ minHeight: isScanning ? 300 : 0 }}
      />

      {error && (
        <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm max-w-sm text-center">
          {error}
        </div>
      )}

      <Button
        onClick={isScanning ? stopScanning : startScanning}
        variant={isScanning ? "destructive" : "default"}
        disabled={!isHttps}
      >
        {isScanning ? (
          <>
            <CameraOff className="w-4 h-4 mr-2" />
            Stop Scanner
          </>
        ) : (
          <>
            <Camera className="w-4 h-4 mr-2" />
            Start Scanner
          </>
        )}
      </Button>

      {!isScanning && (
        <p className="text-xs text-muted-foreground text-center max-w-sm">
          Point your camera at a passenger QR code to scan
        </p>
      )}
    </div>
  );
}
