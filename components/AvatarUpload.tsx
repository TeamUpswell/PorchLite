"use client";

import { useState, useRef, useEffect, useCallback, memo } from "react";
import { Camera, X, Upload, User, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth/AuthProvider";
import { useTheme } from "@/components/ThemeProvider"; // ✅ Add theme support
import { toast } from "react-hot-toast";

interface AvatarUploadProps {
  onAvatarChange: (url: string) => void;
  currentAvatar?: string;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  disabled?: boolean;
  acceptedFormats?: string[];
  maxSizeMB?: number;
  showUploadText?: boolean; // ✅ Optional upload text
  compact?: boolean; // ✅ Compact mode for header usage
}

interface CompressionOptions {
  maxWidth: number;
  maxHeight: number;
  quality: number;
  maxSizeMB: number;
}

// ✅ Enhanced size configurations with compact mode
const SIZE_CONFIGS = {
  sm: {
    container: "w-16 h-16",
    icon: "w-8 h-8",
    button: "p-1",
    overlay: "w-3 h-3",
  },
  md: {
    container: "w-24 h-24",
    icon: "w-12 h-12",
    button: "p-1.5",
    overlay: "w-4 h-4",
  },
  lg: {
    container: "w-32 h-32",
    icon: "w-16 h-16",
    button: "p-2",
    overlay: "w-4 h-4",
  },
  xl: {
    container: "w-40 h-40",
    icon: "w-20 h-20",
    button: "p-2.5",
    overlay: "w-5 h-5",
  },
} as const;

const AvatarUpload = memo(function AvatarUpload({
  onAvatarChange,
  currentAvatar,
  className = "",
  size = "lg",
  disabled = false,
  acceptedFormats = ["image/jpeg", "image/png", "image/webp"],
  maxSizeMB = 2,
  showUploadText = true, // ✅ Default to true
  compact = false, // ✅ Compact mode for header
}: AvatarUploadProps) {
  const { user } = useAuth();
  const { actualTheme } = useTheme(); // ✅ Get theme
  const [avatar, setAvatar] = useState<string>(currentAvatar || "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>("");
  const [imageLoaded, setImageLoaded] = useState(false); // ✅ Track image loading
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sizeConfig = SIZE_CONFIGS[size];
  const isDarkMode = actualTheme === "dark";

  // Sync with currentAvatar changes
  useEffect(() => {
    setAvatar(currentAvatar || "");
    setError("");
    setImageLoaded(false);
  }, [currentAvatar]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // ✅ Enhanced image compression with better quality handling
  const compressImage = useCallback(
    async (
      file: File,
      options: CompressionOptions = {
        maxWidth: 800,
        maxHeight: 800,
        quality: 0.85, // ✅ Slightly higher quality
        maxSizeMB,
      }
    ): Promise<File> => {
      return new Promise((resolve, reject) => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("Canvas not supported"));
          return;
        }

        const img = new Image();

        const timeout = setTimeout(() => {
          reject(new Error("Image loading timeout"));
        }, 15000); // ✅ Longer timeout

        img.onload = () => {
          clearTimeout(timeout);

          try {
            let { width, height } = img;
            const size = Math.min(width, height, options.maxWidth);

            canvas.width = size;
            canvas.height = size;

            const startX = (width - size) / 2;
            const startY = (height - size) / 2;

            // ✅ Enhanced image rendering
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = "high";

            // ✅ Fill with white background for transparency
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, size, size);

            ctx.drawImage(img, startX, startY, size, size, 0, 0, size, size);

            // ✅ Progressive compression with better logic
            const tryCompress = (currentQuality: number) => {
              canvas.toBlob(
                (blob) => {
                  if (!blob) {
                    reject(new Error("Failed to compress image"));
                    return;
                  }

                  // If still too large and we can reduce quality further
                  if (
                    blob.size > options.maxSizeMB * 1024 * 1024 &&
                    currentQuality > 0.3
                  ) {
                    tryCompress(Math.max(0.3, currentQuality - 0.1));
                    return;
                  }

                  const compressedFile = new File(
                    [blob],
                    `avatar-${Date.now()}.jpg`,
                    {
                      type: "image/jpeg",
                      lastModified: Date.now(),
                    }
                  );

                  resolve(compressedFile);
                },
                "image/jpeg",
                currentQuality
              );
            };

            tryCompress(options.quality);
          } catch (error) {
            clearTimeout(timeout);
            reject(error);
          }
        };

        img.onerror = () => {
          clearTimeout(timeout);
          reject(new Error("Failed to load image"));
        };

        img.src = URL.createObjectURL(file);
      });
    },
    [maxSizeMB]
  );

  // Validate file before processing
  const validateFile = useCallback(
    (file: File): string | null => {
      if (!acceptedFormats.includes(file.type)) {
        return `Invalid file type. Accepted: ${acceptedFormats
          .map((f) => f.split("/")[1])
          .join(", ")}`;
      }

      if (file.size > maxSizeMB * 1024 * 1024) {
        return `File too large. Maximum size: ${maxSizeMB}MB`;
      }

      return null;
    },
    [acceptedFormats, maxSizeMB]
  );

  // ✅ Enhanced file upload with better error handling
  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file || !user || disabled) return;

      // Validate file
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        toast.error(validationError);
        return;
      }

      setUploading(true);
      setError("");

      // Create abort controller for this upload
      abortControllerRef.current = new AbortController();

      try {
        // ✅ Better progress feedback
        const loadingToastId = toast.loading("Processing image...");

        const compressedFile = await compressImage(file);

        if (abortControllerRef.current.signal.aborted) {
          toast.dismiss(loadingToastId);
          return;
        }

        toast.loading("Uploading avatar...", { id: loadingToastId });

        const fileName = `${user.id}/avatar-${Date.now()}.jpg`;

        // ✅ Upload with retry logic
        let uploadAttempts = 0;
        const maxAttempts = 3;

        while (uploadAttempts < maxAttempts) {
          try {
            const { data, error: uploadError } = await supabase.storage
              .from("avatars")
              .upload(fileName, compressedFile, {
                cacheControl: "3600",
                upsert: true,
              });

            if (uploadError) {
              throw uploadError;
            }

            break; // Success, exit retry loop
          } catch (error) {
            uploadAttempts++;
            if (uploadAttempts >= maxAttempts) {
              throw error;
            }

            // Wait before retry
            await new Promise((resolve) =>
              setTimeout(resolve, 1000 * uploadAttempts)
            );
          }
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("avatars").getPublicUrl(fileName);

        const avatarUrl = `${publicUrl}?t=${Date.now()}`;

        // ✅ Update local state
        setAvatar(avatarUrl);

        // ✅ Notify parent component
        onAvatarChange(avatarUrl);

        // ✅ Broadcast to other components (like Header)
        localStorage.setItem("avatar_updated", Date.now().toString());
        window.dispatchEvent(new Event("storage"));

        // ✅ Also dispatch custom event
        window.dispatchEvent(
          new CustomEvent("avatarUpdated", {
            detail: { avatarUrl },
          })
        );

        toast.success("Avatar updated successfully!", { id: loadingToastId });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to upload avatar";
        setError(errorMessage);
        toast.error(errorMessage);
        console.error("Avatar upload error:", error);
      } finally {
        setUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        abortControllerRef.current = null;
      }
    },
    [user, disabled, validateFile, compressImage, onAvatarChange]
  );

  // Remove avatar with confirmation
  const removeAvatar = useCallback(async () => {
    if (!user || disabled) return;

    try {
      setUploading(true);
      setAvatar("");
      onAvatarChange("");
      toast.success("Avatar removed");
    } catch (error) {
      console.error("Error removing avatar:", error);
      toast.error("Failed to remove avatar");
    } finally {
      setUploading(false);
    }
  }, [user, disabled, onAvatarChange]);

  const triggerFileInput = useCallback(() => {
    if (!disabled && !uploading) {
      fileInputRef.current?.click();
    }
  }, [disabled, uploading]);

  // Cancel upload
  const cancelUpload = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setUploading(false);
      toast.dismiss("avatar-upload");
      toast.success("Upload cancelled");
    }
  }, []);

  // ✅ Handle image load success
  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
    setError("");
  }, []);

  // ✅ Handle image load error
  const handleImageError = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      console.error("Avatar image failed to load");
      setError("Failed to load avatar image");
      setImageLoaded(false);
      e.currentTarget.style.display = "none";
    },
    []
  );

  return (
    <div
      className={`flex flex-col items-center ${
        compact ? "space-y-2" : "space-y-4"
      } ${className}`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFormats.join(",")}
        onChange={handleFileSelect}
        disabled={uploading || disabled}
        className="hidden"
        aria-label="Upload avatar image"
      />

      {/* Avatar Display */}
      <div className="relative group">
        <div
          className={`
          ${sizeConfig.container} rounded-full overflow-hidden border-4 
          ${
            isDarkMode
              ? "border-gray-600 bg-gray-700"
              : "border-gray-200 bg-gray-100"
          }
          transition-all duration-200 
          ${disabled ? "opacity-50" : ""}
          ${uploading ? "animate-pulse" : ""}
        `}
        >
          {avatar ? (
            <>
              <img
                src={avatar}
                alt="Profile Avatar"
                className={`w-full h-full object-cover transition-opacity duration-200 ${
                  imageLoaded ? "opacity-100" : "opacity-0"
                }`}
                loading="lazy"
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
              {/* ✅ Loading placeholder while image loads */}
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2
                    className={`${sizeConfig.overlay} animate-spin ${
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User
                className={`${sizeConfig.icon} ${
                  isDarkMode ? "text-gray-400" : "text-gray-400"
                }`}
              />
            </div>
          )}
        </div>

        {/* Overlay buttons */}
        {!disabled && (
          <div className="absolute inset-0 rounded-full bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="flex space-x-2">
              {uploading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                  <button
                    onClick={cancelUpload}
                    className={`${sizeConfig.button} bg-red-500 rounded-full hover:bg-red-600 transition-colors`}
                    title="Cancel Upload"
                  >
                    <X className={`${sizeConfig.overlay} text-white`} />
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={triggerFileInput}
                    className={`${sizeConfig.button} bg-white rounded-full hover:bg-gray-100 transition-colors shadow-lg`}
                    title="Change Avatar"
                  >
                    <Camera className={`${sizeConfig.overlay} text-gray-600`} />
                  </button>

                  {avatar && (
                    <button
                      onClick={removeAvatar}
                      className={`${sizeConfig.button} bg-white rounded-full hover:bg-gray-100 transition-colors shadow-lg`}
                      title="Remove Avatar"
                    >
                      <X className={`${sizeConfig.overlay} text-red-600`} />
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && !compact && (
        <div className="flex items-center space-x-2 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Upload text - Only show if not compact and showUploadText is true */}
      {showUploadText && !compact && (
        <div className="text-center">
          <button
            onClick={triggerFileInput}
            disabled={uploading || disabled}
            className={`
              text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed 
              transition-colors flex items-center gap-2
              ${
                isDarkMode
                  ? "text-blue-400 hover:text-blue-300"
                  : "text-blue-600 hover:text-blue-700"
              }
            `}
          >
            {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
            {uploading
              ? "Uploading..."
              : avatar
              ? "Change Avatar"
              : "Upload Avatar"}
          </button>
          <p
            className={`text-xs mt-1 ${
              isDarkMode ? "text-gray-400" : "text-gray-500"
            }`}
          >
            Square images work best. Max {maxSizeMB}MB.
          </p>
          {acceptedFormats.length > 0 && (
            <p
              className={`text-xs ${
                isDarkMode ? "text-gray-500" : "text-gray-400"
              }`}
            >
              Supported:{" "}
              {acceptedFormats.map((f) => f.split("/")[1]).join(", ")}
            </p>
          )}
        </div>
      )}
    </div>
  );
});

export default AvatarUpload;
