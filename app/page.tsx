"use client";

import { Calculator } from "@/components/Calculator";
import { AuthForm } from "@/components/AuthForm";
import { useAuth } from "@/components/AuthContext";
import { LogOut, User as UserIcon } from "lucide-react";

export default function Home() {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950">
        <div className="h-12 w-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-12 lg:p-24 bg-gray-950 selection:bg-purple-500/30">
      <div className="w-full max-w-5xl space-y-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-6xl font-black text-white bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-blue-400 to-emerald-400 animate-gradient">
              Check Calculator
            </h1>
            <p className="text-gray-400 font-medium text-lg">
              Split bills effortlessly with AI and friends.
            </p>
          </div>

          {user && (
            <div className="flex items-center gap-4 p-2 pl-4 bg-white/5 border border-white/10 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                  <UserIcon className="h-5 w-5 text-white" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-bold text-white leading-none mb-1">{user.name}</p>
                  <p className="text-xs text-gray-500 leading-none">{user.email}</p>
                </div>
              </div>
              <button
                onClick={logout}
                className="p-3 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                title="Log Out"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="flex justify-center">
          {user ? (
            <Calculator />
          ) : (
            <div className="w-full flex flex-col items-center gap-12 mt-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="text-center space-y-4 max-w-2xl px-4">
                <h2 className="text-3xl md:text-5xl font-bold text-white">
                  Save your history, share with ease.
                </h2>
                <p className="text-gray-400 text-lg">
                  Sign in to keep track of your receipt history, manage recurring friends, and access your splits from any device.
                </p>
              </div>
              <AuthForm />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
