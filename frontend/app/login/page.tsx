"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

const roles = ["buyer", "producer", "rider", "admin"];

const roleDisplayNames: Record<string, string> = {
  buyer: "🛒 Customer",
  producer: "👨‍🌾 Seller",
  rider: "🚚 Delivery Partner",
  admin: "🧑‍💼 Admin",
};

type FormErrors = {
  email?: string;
  password?: string;
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("buyer");
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  // Validation
  const isValidEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!isValidEmail(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name === "email") {
      setEmail(value);
      if (errors.email) setErrors((prev) => ({ ...prev, email: "" }));
    } else if (name === "password") {
      setPassword(value);
      if (errors.password) setErrors((prev) => ({ ...prev, password: "" }));
    } else if (name === "role") {
      setRole(value);
    }
  };

  const findLocalUser = (email: string, password: string, role: string) => {
    if (typeof window === "undefined") return null;
    const stored = localStorage.getItem("agri-market-registered-users");
    if (!stored) return null;

    try {
      const users = JSON.parse(stored) as Array<{
        username: string;
        email: string;
        password: string;
        fullName: string;
        role: string;
      }>;

      return users.find(
        (user) =>
          user.email.toLowerCase().trim() === email.toLowerCase().trim() &&
          user.password === password &&
          user.role === role
      );
    } catch {
      return null;
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setServerError("");

    // Validate form
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }),
      });

      const payload = await response.json();
      const errorMessage = payload.message || payload.error;

      if (!response.ok) {
        const localUser = findLocalUser(email, password, role);
        if (localUser) {
          localStorage.setItem(
            "agri-market-user",
            JSON.stringify({ name: localUser.fullName, email: localUser.email, role: localUser.role })
          );
          router.push(`/${localUser.role}`);
          return;
        }

        setServerError(errorMessage || "Invalid email or password. Please try again.");
        return;
      }

      if (!payload.user || !payload.user.role) {
        setServerError("Invalid login response from server.");
        return;
      }

      localStorage.setItem("agri-market-user", JSON.stringify(payload.user));
      router.push(`/${payload.user.role}`);
    } catch (err) {
      const localUser = findLocalUser(email, password, role);
      if (localUser) {
        localStorage.setItem(
          "agri-market-user",
          JSON.stringify({ name: localUser.fullName, email: localUser.email, role: localUser.role })
        );
        router.push(`/${localUser.role}`);
        setLoading(false);
        return;
      }

      setServerError("Unable to connect to the server. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const isFormValid =
    !loading && email.trim() && password && Object.keys(errors).length === 0;

  return (
    <main className="min-h-screen bg-[#EEF3E4] text-[#1B1B1B]">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
        <div className="rounded-[2rem] border border-[#D8D3BC] bg-[#F7F3E7] p-8 shadow-xl">
          <div className="mb-8 space-y-3 text-center">
            <p className="text-sm uppercase tracking-[0.35em] text-[#2E7D32]">Agri Marketplace</p>
            <h1 className="text-3xl font-semibold tracking-tight text-[#1B1B1B]">Login to your account</h1>
            <p className="text-sm text-[#4F4F4F]">Secure access for buyers, producers, riders, and 🧑‍💼 admins.</p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-[#4F4F4F]">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={email}
                onChange={handleInputChange}
                className={`mt-1 w-full rounded-3xl border px-4 py-3 text-sm text-[#1B1B1B] outline-none transition ${
                  errors.email
                    ? "border-rose-500 bg-rose-50 focus:ring-2 focus:ring-rose-300"
                    : "border-[#E0E0E0] bg-[#F5F5F5] focus:border-[#2E7D32]"
                }`}
                placeholder="hello@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-rose-600">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-[#4F4F4F]">
                Password *
              </label>
              <input
                type="password"
                name="password"
                value={password}
                onChange={handleInputChange}
                className={`mt-1 w-full rounded-3xl border px-4 py-3 text-sm text-[#1B1B1B] outline-none transition ${
                  errors.password
                    ? "border-rose-500 bg-rose-50 focus:ring-2 focus:ring-rose-300"
                    : "border-[#E0E0E0] bg-[#F5F5F5] focus:border-[#2E7D32]"
                }`}
                placeholder="Enter your password"
              />
              {errors.password && (
                <p className="mt-1 text-xs text-rose-600">{errors.password}</p>
              )}
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-[#4F4F4F]">
                Login as *
              </label>
              <select
                name="role"
                value={role}
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

            {/* Server Error */}
            {serverError && (
              <div className="rounded-3xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {serverError}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!isFormValid}
              className="w-full rounded-3xl bg-[#2E7D32] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#256229] disabled:cursor-not-allowed disabled:bg-[#B3B3B3]"
            >
              {loading ? "Logging in…" : "Login"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-[#4F4F4F]">
            Don’t have an account?{' '}
            <Link href="/register" className="font-semibold text-[#2E7D32] hover:text-emerald-700">
              Register here
            </Link>
          </div>
          {/* Demo Credentials */}
          <div className="mt-8 rounded-3xl bg-emerald-50 px-6 py-4 text-sm text-emerald-900">
            <p className="font-semibold">📋 Demo Credentials (any role):</p>
            <p className="mt-2">
              Email: <span className="font-mono">test@example.com</span>
            </p>
            <p>
              Password: <span className="font-mono">password123</span>
            </p>
          </div>        </div>
      </div>
    </main>
  );
}

