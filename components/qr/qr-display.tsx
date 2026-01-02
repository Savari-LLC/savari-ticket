"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface QRDisplayProps {
  value: string;
  size?: number;
  passengerName?: string;
}

export function QRDisplay({ value, size = 200, passengerName }: QRDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dataUrl, setDataUrl] = useState<string>("");

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, value, {
        width: size,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      });

      QRCode.toDataURL(value, {
        width: size * 2,
        margin: 2,
      }).then(setDataUrl);
    }
  }, [value, size]);

  const handleDownload = () => {
    if (!dataUrl) return;

    const link = document.createElement("a");
    link.download = `qr-${passengerName || value}.png`;
    link.href = dataUrl;
    link.click();
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <canvas ref={canvasRef} className="rounded-lg border" />
      <p className="text-sm text-muted-foreground font-mono">{value}</p>
      <Button onClick={handleDownload} variant="outline" size="sm">
        <Download className="w-4 h-4 mr-2" />
        Download QR
      </Button>
    </div>
  );
}
