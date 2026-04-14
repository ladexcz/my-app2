"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

const roles = ["buyer", "producer", "rider"];

const roleDisplayNames: Record<string, string> = {
  buyer: "🛒 Customer",
  producer: "👨‍🌾 Seller",
  rider: "🚚 Delivery Partner",
};

type FormData = {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  address: string;
  phoneNumber: string;
  role: string;
};

type FormErrors = Partial<Record<keyof FormData, string>>;

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    address: "",
    phoneNumber: "",
    role: "buyer",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState("");

  // Validation functions
  const isValidEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const isValidPhoneNumber = (phone: string): boolean => {
    return /^\d{10,}$/.test(phone.replace(/\D/g, ""));
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Username validation
    if (!form.username.trim()) {
      newErrors.username = "Username is required";
    } else if (form.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    }

    // Email validation
    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!isValidEmail(form.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Password validation
    if (!form.password) {
      newErrors.password = "Password is required";
    } else if (form.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    // Confirm password validation
    if (!form.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    // Full name validation
    if (!form.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }

    // Address validation
    if (!form.address.trim()) {
      newErrors.address = "Address is required";
    }

    // Phone number validation
    if (!form.phoneNumber.trim()) {
      newErrors.phoneNumber = "Phone number is required";
    } else if (!isValidPhoneNumber(form.phoneNumber)) {
      newErrors.phoneNumber = "Phone number must be at least 10 digits";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field when user starts typing
    if (errors[name as keyof FormData]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setServerError("");
    setSuccess("");

    // Validate form
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.fullName,
          username: form.username,
          email: form.email,
          password: form.password,
          fullName: form.fullName,
          address: form.address,
          phoneNumber: form.phoneNumber,
          role: form.role,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        setServerError(payload.message || payload.error || "Unable to register. Please try again.");
        setLoading(false);
        return;
      }

      // Success - save user locally for fallback login if server state resets
      const storedUsers = localStorage.getItem("agri-market-registered-users");
      const registeredUsers = storedUsers ? JSON.parse(storedUsers) : [];
      registeredUsers.push({
        username: form.username,
        email: form.email.toLowerCase().trim(),
        password: form.password,
        fullName: form.fullName,
        address: form.address,
        phoneNumber: form.phoneNumber,
        role: form.role,
      });
      localStorage.setItem("agri-market-registered-users", JSON.stringify(registeredUsers));

      localStorage.setItem(
        "agri-market-user",
        JSON.stringify({ name: form.fullName, role: form.role, email: form.email.toLowerCase().trim() })
      );
      setSuccess("✓ Account created successfully! Redirecting...");
      
      // Redirect after 1.5 seconds
      setTimeout(() => {
        router.push(`/${form.role}`);
      }, 1500);
    } catch (err) {
      setServerError("Unable to connect to the server. Please try again.");
      setLoading(false);
    }
  };

  const isFormValid =
    !loading &&
    form.username.trim() &&
    form.email.trim() &&
    form.password &&
    form.confirmPassword &&
    form.fullName.trim() &&
    form.address.trim() &&
    form.phoneNumber.trim() &&
    Object.keys(errors).length === 0;

  return (
    <main className="min-h-screen bg-[#EEF3E4] text-[#1B1B1B] py-8">
      <div className="mx-auto flex max-w-2xl flex-col justify-center px-4">
        <div className="rounded-[2rem] border border-[#D8D3BC] bg-[#F7F3E7] p-8 shadow-xl">
          <div className="mb-8 space-y-2 text-center">
            <p className="text-sm uppercase tracking-[0.35em] text-[#2E7D32]">
              Create Account
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-[#1B1B1B]">
              Register for Agri Marketplace
            </h1>
            <p className="text-sm text-[#4F4F4F]">
              Join as buyer, producer, or rider
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Row: Username & Email */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-[#4F4F4F]">
                  Username *
                </label>
                <input
                  type="text"
                  name="username"
                  value={form.username}
                  onChange={handleInputChange}
                  className={`mt-1 w-full rounded-3xl border px-4 py-3 text-sm text-[#1B1B1B] outline-none transition ${
                    errors.username
                      ? "border-rose-500 bg-rose-50 focus:ring-2 focus:ring-rose-300"
                      : "border-[#E0E0E0] bg-[#F5F5F5] focus:border-[#2E7D32]"
                  }`}
                  placeholder="johndoe"
                />
                {errors.username && (
                  <p className="mt-1 text-xs text-rose-600">{errors.username}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#4F4F4F]">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleInputChange}
                  className={`mt-1 w-full rounded-3xl border px-4 py-3 text-sm text-[#1B1B1B] outline-none transition ${
                    errors.email
                      ? "border-rose-500 bg-rose-50 focus:ring-2 focus:ring-rose-300"
                      : "border-[#E0E0E0] bg-[#F5F5F5] focus:border-[#2E7D32]"
                  }`}
                  placeholder="john@example.com"
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-rose-600">{errors.email}</p>
                )}
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-[#4F4F4F]">
                Full Name *
              </label>
              <input
                type="text"
                name="fullName"
                value={form.fullName}
                onChange={handleInputChange}
                className={`mt-1 w-full rounded-3xl border px-4 py-3 text-sm text-[#1B1B1B] outline-none transition ${
                  errors.fullName
                    ? "border-rose-500 bg-rose-50 focus:ring-2 focus:ring-rose-300"
                    : "border-[#E0E0E0] bg-[#F5F5F5] focus:border-[#2E7D32]"
                }`}
                placeholder="Juan Dela Cruz"
              />
              {errors.fullName && (
                <p className="mt-1 text-xs text-rose-600">{errors.fullName}</p>
              )}
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-[#4F4F4F]">
                Address *
              </label>
              <input
                type="text"
                name="address"
                value={form.address}
                onChange={handleInputChange}
                className={`mt-1 w-full rounded-3xl border px-4 py-3 text-sm text-[#1B1B1B] outline-none transition ${
                  errors.address
                    ? "border-rose-500 bg-rose-50 focus:ring-2 focus:ring-rose-300"
                    : "border-[#E0E0E0] bg-[#F5F5F5] focus:border-[#2E7D32]"
                }`}
                placeholder="123 Main Street, Cavite"
              />
              {errors.address && (
                <p className="mt-1 text-xs text-rose-600">{errors.address}</p>
              )}
            </div>

            {/* Row: Phone & Role */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-[#4F4F4F]">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={form.phoneNumber}
                  onChange={handleInputChange}
                  className={`mt-1 w-full rounded-3xl border px-4 py-3 text-sm text-[#1B1B1B] outline-none transition ${
                    errors.phoneNumber
                      ? "border-rose-500 bg-rose-50 focus:ring-2 focus:ring-rose-300"
                      : "border-[#E0E0E0] bg-[#F5F5F5] focus:border-[#2E7D32]"
                  }`}
                  placeholder="09171234567"
                />
                {errors.phoneNumber && (
                  <p className="mt-1 text-xs text-rose-600">
                    {errors.phoneNumber}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#4F4F4F]">
                  Role *
                </label>
                <select
                  name="role"
                  value={form.role}
                  onChange={handleInputChange}
                  className="mt-1 w-full rounded-3xl border border-[#E0E0E0] bg-[#F5F5F5] px-4 py-3 text-sm text-[#1B1B1B] outline-none transition focus:border-[#2E7D32]"
                >
                  {roles.map((item) => (
                    <option key={item} value={item}>
                      {roleDisplayNames[item]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row: Password & Confirm Password */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-[#4F4F4F]">
                  Password *
                </label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleInputChange}
                  className={`mt-1 w-full rounded-3xl border px-4 py-3 text-sm text-[#1B1B1B] outline-none transition ${
                    errors.password
                      ? "border-rose-500 bg-rose-50 focus:ring-2 focus:ring-rose-300"
                      : "border-[#E0E0E0] bg-[#F5F5F5] focus:border-[#2E7D32]"
                  }`}
                  placeholder="Min. 6 characters"
                />
                {errors.password && (
                  <p className="mt-1 text-xs text-rose-600">{errors.password}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#4F4F4F]">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleInputChange}
                  className={`mt-1 w-full rounded-3xl border px-4 py-3 text-sm text-[#1B1B1B] outline-none transition ${
                    errors.confirmPassword
                      ? "border-rose-500 bg-rose-50 focus:ring-2 focus:ring-rose-300"
                      : "border-[#E0E0E0] bg-[#F5F5F5] focus:border-[#2E7D32]"
                  }`}
                  placeholder="Re-enter password"
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs text-rose-600">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            </div>

            {/* Server Error */}
            {serverError && (
              <div className="rounded-3xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {serverError}
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="rounded-3xl bg-[#E8F5E9] px-4 py-3 text-sm text-emerald-700">
                {success}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!isFormValid}
              className="w-full rounded-3xl bg-[#2E7D32] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#256229] disabled:cursor-not-allowed disabled:bg-[#B3B3B3]"
            >
              {loading ? "Creating account…" : "Register"}
            </button>
          </form>

          {/* Link to Login */}
          <div className="mt-6 text-center text-sm text-[#4F4F4F]">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-[#2E7D32] hover:text-emerald-700"
            >
              Login here
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

