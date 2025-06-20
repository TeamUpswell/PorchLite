"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Eye,
  EyeOff,
  UserPlus,
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  Mail,
  Lock,
  User,
  Shield,
} from "lucide-react";
import { toast } from "react-hot-toast";

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  acceptTerms: boolean;
}

interface PasswordStrength {
  score: number;
  feedback: string[];
  color: string;
  text: string;
}

export default function SignUpPage() {
  const { signUp, user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    acceptTerms: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<FormData>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof FormData, boolean>>>({});

  // Refs for optimization
  const mountedRef = useRef(true);
  const formRef = useRef<HTMLFormElement>(null);

  // Component cleanup
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (user && !authLoading) {
      console.log("✅ User already logged in, redirecting...");
      router.push("/");
    }
  }, [user, authLoading, router]);

  // Password strength checker
  const passwordStrength = useMemo((): PasswordStrength => {
    const password = formData.password;
    const feedback: string[] = [];
    let score = 0;

    if (!password) {
      return { score: 0, feedback: [], color: "bg-gray-300", text: "" };
    }

    // Length check
    if (password.length >= 8) {
      score += 1;
    } else {
      feedback.push("Use at least 8 characters");
    }

    // Lowercase check
    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push("Include lowercase letters");
    }

    // Uppercase check
    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push("Include uppercase letters");
    }

    // Number check
    if (/\d/.test(password)) {
      score += 1;
    } else {
      feedback.push("Include numbers");
    }

    // Special character check
    if (/[^a-zA-Z0-9]/.test(password)) {
      score += 1;
    } else {
      feedback.push("Include special characters");
    }

    // Determine color and text
    let color = "bg-red-500";
    let text = "Weak";

    if (score >= 4) {
      color = "bg-green-500";
      text = "Strong";
    } else if (score >= 3) {
      color = "bg-yellow-500";
      text = "Medium";
    }

    return { score, feedback, color, text };
  }, [formData.password]);

  // Email validation
  const isValidEmail = useMemo(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(formData.email);
  }, [formData.email]);

  // Form validation
  const formValidation = useMemo(() => {
    const errors: Partial<FormData> = {};

    // Email validation
    if (touched.email && formData.email) {
      if (!isValidEmail) {
        errors.email = "Please enter a valid email address";
      }
    }

    // Password validation
    if (touched.password && formData.password) {
      if (formData.password.length < 8) {
        errors.password = "Password must be at least 8 characters";
      } else if (passwordStrength.score < 3) {
        errors.password = "Password is too weak";
      }
    }

    // Confirm password validation
    if (touched.confirmPassword && formData.confirmPassword) {
      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = "Passwords do not match";
      }
    }

    // Full name validation
    if (touched.fullName && formData.fullName) {
      if (formData.fullName.trim().length < 2) {
        errors.fullName = "Please enter your full name";
      }
    }

    return errors;
  }, [formData, touched, isValidEmail, passwordStrength.score]);

  // Check if form is valid
  const isFormValid = useMemo(() => {
    return (
      isValidEmail &&
      formData.password.length >= 8 &&
      passwordStrength.score >= 3 &&
      formData.password === formData.confirmPassword &&
      formData.fullName.trim().length >= 2 &&
      formData.acceptTerms &&
      Object.keys(formValidation).length === 0
    );
  }, [formData, isValidEmail, passwordStrength.score, formValidation]);

  // Handle input changes with validation
  const handleInputChange = useCallback((field: keyof FormData) => {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!mountedRef.current) return;

      const value = field === "acceptTerms" ? e.target.checked : e.target.value;

      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));

      // Mark field as touched
      setTouched((prev) => ({
        ...prev,
        [field]: true,
      }));

      // Clear global error when user starts typing
      if (error) {
        setError("");
      }
    };
  }, [error]);

  // Handle form submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!mountedRef.current || loading || !isFormValid) {
        return;
      }

      // Mark all fields as touched for validation display
      setTouched({
        email: true,
        password: true,
        confirmPassword: true,
        fullName: true,
        acceptTerms: true,
      });

      // Final validation check
      if (Object.keys(formValidation).length > 0) {
        setError("Please fix the errors above");
        return;
      }

      setLoading(true);
      setError("");

      try {
        console.log("🔐 Creating account for:", formData.email);

        const { data, error: signUpError } = await signUp(formData.email, formData.password, {
          full_name: formData.fullName.trim(),
          email_confirm: true,
        });

        if (!mountedRef.current) {
          console.log("⚠️ Component unmounted, aborting");
          return;
        }

        if (signUpError) {
          console.error("❌ Signup error:", signUpError);
          setError(signUpError.message || "Failed to create account");
          toast.error(signUpError.message || "Failed to create account");
        } else {
          console.log("✅ Account created successfully");
          toast.success("Account created successfully! Welcome to PorchLite!");

          // Small delay to show success message before redirect
          setTimeout(() => {
            if (mountedRef.current) {
              router.push("/");
            }
          }, 1000);
        }
      } catch (error) {
        console.error("❌ Unexpected signup error:", error);
        if (mountedRef.current) {
          const errorMessage = error instanceof Error ? error.message : "Failed to create account";
          setError(errorMessage);
          toast.error(errorMessage);
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    },
    [formData, loading, isFormValid, formValidation, signUp, router]
  );

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        handleSubmit(e as any);
      }
    },
    [handleSubmit]
  );

  // Don't render if already authenticated (prevent flash)
  if (user && !authLoading) {
    return null;
  }

  // Loading state while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
          <p className="text-gray-600">⏳ Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Join PorchLite</h1>
            <p className="text-gray-600">
              Create your account to start managing your properties
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <form
              ref={formRef}
              onSubmit={handleSubmit}
              onKeyDown={handleKeyDown}
              className="space-y-6"
            >
              {/* Global Error Message */}
              {error && (
                <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Full Name */}
              <div>
                <Label
                  htmlFor="fullName"
                  className="text-sm font-medium text-gray-700 flex items-center"
                >
                  <User className="h-4 w-4 mr-2" />
                  Full Name *
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={handleInputChange("fullName")}
                  disabled={loading}
                  className={`mt-1 ${
                    fieldErrors.fullName
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : ""
                  }`}
                  placeholder="Enter your full name"
                  autoComplete="name"
                  required
                />
                {fieldErrors.fullName && (
                  <p className="mt-1 text-xs text-red-600 flex items-center">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {fieldErrors.fullName}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <Label
                  htmlFor="email"
                  className="text-sm font-medium text-gray-700 flex items-center"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Email Address *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange("email")}
                  disabled={loading}
                  className={`mt-1 ${
                    fieldErrors.email
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : touched.email && isValidEmail
                      ? "border-green-500 focus:border-green-500 focus:ring-green-500"
                      : ""
                  }`}
                  placeholder="Enter your email address"
                  autoComplete="email"
                  required
                />
                {fieldErrors.email && (
                  <p className="mt-1 text-xs text-red-600 flex items-center">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {fieldErrors.email}
                  </p>
                )}
                {touched.email && isValidEmail && !fieldErrors.email && (
                  <p className="mt-1 text-xs text-green-600 flex items-center">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Valid email address
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <Label
                  htmlFor="password"
                  className="text-sm font-medium text-gray-700 flex items-center"
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Password *
                </Label>
                <div className="relative mt-1">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleInputChange("password")}
                    disabled={loading}
                    className={`pr-10 ${
                      fieldErrors.password
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                        : ""
                    }`}
                    placeholder="Create a strong password"
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-700"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {formData.password && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                      <span>Password strength</span>
                      <span
                        className={`font-medium ${
                          passwordStrength.score <= 1
                            ? "text-red-600"
                            : passwordStrength.score <= 3
                            ? "text-yellow-600"
                            : "text-green-600"
                        }`}
                      >
                        {passwordStrength.text}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                        style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                      />
                    </div>
                    {passwordStrength.feedback.length > 0 && (
                      <ul className="mt-1 text-xs text-gray-500 space-y-1">
                        {passwordStrength.feedback.slice(0, 3).map((item, index) => (
                          <li key={index} className="flex items-center">
                            <span className="w-1 h-1 bg-gray-400 rounded-full mr-2"></span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {fieldErrors.password && (
                  <p className="mt-1 text-xs text-red-600 flex items-center">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {fieldErrors.password}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <Label
                  htmlFor="confirmPassword"
                  className="text-sm font-medium text-gray-700 flex items-center"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Confirm Password *
                </Label>
                <div className="relative mt-1">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={handleInputChange("confirmPassword")}
                    disabled={loading}
                    className={`pr-10 ${
                      fieldErrors.confirmPassword
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                        : touched.confirmPassword &&
                          formData.password === formData.confirmPassword &&
                          formData.confirmPassword
                        ? "border-green-500 focus:border-green-500 focus:ring-green-500"
                        : ""
                    }`}
                    placeholder="Confirm your password"
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-gray-700"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>

                {fieldErrors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-600 flex items-center">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {fieldErrors.confirmPassword}
                  </p>
                )}
                {touched.confirmPassword &&
                  formData.password === formData.confirmPassword &&
                  formData.confirmPassword && !fieldErrors.confirmPassword && (
                    <p className="mt-1 text-xs text-green-600 flex items-center">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Passwords match
                    </p>
                  )}
              </div>

              {/* Terms of Service */}
              <div className="flex items-start">
                <input
                  id="acceptTerms"
                  type="checkbox"
                  checked={formData.acceptTerms}
                  onChange={handleInputChange("acceptTerms")}
                  disabled={loading}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-0.5"
                  required
                />
                <label
                  htmlFor="acceptTerms"
                  className="ml-3 text-sm text-gray-700"
                >
                  I agree to the{" "}
                  <Link
                    href="/terms"
                    className="text-blue-600 hover:text-blue-700 underline"
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/privacy"
                    className="text-blue-600 hover:text-blue-700 underline"
                  >
                    Privacy Policy
                  </Link>
                  *
                </label>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading || !isFormValid}
                className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating Account...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Create Account
                  </>
                )}
              </Button>

              {/* Keyboard Shortcut Hint */}
              <p className="text-xs text-gray-500 text-center">
                Press{" "}
                <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">
                  Ctrl + Enter
                </kbd>{" "}
                to submit
              </p>
            </form>

            {/* Footer Links */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  Sign in instead
                </Link>
              </p>
            </div>
          </div>

          {/* Back to Home */}
          <div className="text-center mt-6">
            <Link
              href="/"
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
