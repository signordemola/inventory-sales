"use client";

import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Loader2, X, UploadCloud } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Button } from "./button";

interface ImageUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  onRemove: (url: string) => void;
  onUpload: (file: File) => Promise<{ url: string }>;
  maxFiles?: number;
  disabled?: boolean;
}

export function ImageUpload({
  value,
  onChange,
  onRemove,
  onUpload,
  maxFiles = 4,
  disabled,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (disabled || isUploading) return;

      const remainingSlots = maxFiles - value.length;
      const filesToUpload = acceptedFiles.slice(0, remainingSlots);

      if (filesToUpload.length === 0) return;

      setIsUploading(true);

      try {
        const uploadPromises = filesToUpload.map((file) => onUpload(file));
        const results = await Promise.all(uploadPromises);
        const newUrls = results.map((res) => res.url);

        onChange([...value, ...newUrls]);
      } catch (error) {
        console.error("Upload failed", error);
      } finally {
        setIsUploading(false);
      }
    },
    [disabled, isUploading, maxFiles, value, onChange, onUpload],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
    },
    disabled: disabled || isUploading || value.length >= maxFiles,
    maxSize: 5 * 1024 * 1024, // 5MB
  });

  return (
    <div className="flex flex-wrap items-center justify-center gap-4">
      {/* Image Previews */}
      {value.map((url, index) => (
        <div
          key={url}
          className="relative aspect-square w-32 sm:w-40 rounded-xl overflow-hidden group bg-slate-100 border border-slate-200 shrink-0"
        >
          <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              type="button"
              onClick={(e) => {
                e.stopPropagation(); // prevent triggering dropzone if overlapping
                onRemove(url);
              }}
              variant="destructive"
              size="icon"
              className="w-7 h-7 rounded-lg bg-red-500/90 hover:bg-red-600 backdrop-blur-sm shadow-sm text-background"
              disabled={disabled || isUploading}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <Image
            src={url}
            alt={`Image preview ${index + 1}`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        </div>
      ))}

      {/* Upload Dropzone */}
      {value.length < maxFiles && (
        <div
          {...getRootProps()}
          className={cn(
            "aspect-square w-32 sm:w-40 shrink-0 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-4 transition-colors text-center",
            isDragActive
              ? "border-emerald-500 bg-emerald-50"
              : "border-slate-200 bg-slate-50/50 hover:bg-slate-50",
            (disabled || isUploading) && "opacity-60 cursor-not-allowed",
            !disabled && !isUploading && "cursor-pointer",
          )}
        >
          <input {...getInputProps()} />

          {isUploading ? (
            <div className="flex flex-col items-center justify-center text-emerald-600">
              <Loader2 className="w-6 h-6 animate-spin mb-2" />
              <p className="text-xs font-bold">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-500">
              <UploadCloud className="w-6 h-6 mb-2 text-slate-400" />
              <p className="text-xs font-bold text-slate-600">
                <span className="text-emerald-600 hover:text-emerald-700 block">
                  Click to upload
                </span>{" "}
                or drag
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
