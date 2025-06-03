import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login - PorchLite",
  description: "Login to your PorchLite account",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome Back to PorchLite
            </h1>
            <p className="text-gray-600">Login to your account</p>
          </div>

          <form className="mt-6 space-y-4">
            <input
              type="email"
              placeholder="Email"
              className="w-full px-3 py-2 border rounded-md"
              required
            />
            <input
              type="password"
              placeholder="Password"
              className="w-full px-3 py-2 border rounded-md"
              required
            />
            <button
              type="submit"
              className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Login
            </button>
          </form>

          <div className="mt-4 text-center">
            <a
              href="/forgot-password"
              className="text-sm text-blue-600 hover:underline"
            >
              Forgot your password?
            </a>
          </div>

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <a href="/register" className="text-blue-600 hover:underline">
                Create one
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
