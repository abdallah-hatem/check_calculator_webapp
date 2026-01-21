"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthContext";
import { apiClient } from "@/lib/api-client";
import {
    ArrowLeft,
    Plus,
    Trash2,
    User as UserIcon,
    Users,
    Loader2,
    AlertCircle,
    Receipt as ReceiptIcon,
    History,
    ChevronRight,
    BarChart3,
    TrendingUp,
    ShoppingBag,
    Calendar as CalendarIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Friend {
    id: string;
    name: string;
    userId: string;
}

interface Receipt {
    id: string;
    total: number;
    createdAt: string;
    items: any[];
    payments: any[];
}

interface UserStats {
    totalPaid: number;
    totalOrdered: number;
    itemCounts: { name: string; count: number }[];
    monthlyStats: { month: string; paid: number; ordered: number }[];
}

export default function ProfilePage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    const [friends, setFriends] = useState<Friend[]>([]);
    const [receipts, setReceipts] = useState<Receipt[]>([]);
    const [stats, setStats] = useState<UserStats | null>(null);
    const [loading, setLoading] = useState(false);
    const [tabLoading, setTabLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"friends" | "history" | "stats">("friends");

    // Add Friend State
    const [showAddForm, setShowAddForm] = useState(false);
    const [newFriendName, setNewFriendName] = useState("");
    const [adding, setAdding] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/");
        }
    }, [user, authLoading, router]);

    const fetchFriends = async () => {
        try {
            setTabLoading(true);
            const data = await apiClient.get<Friend[]>("/friends");
            setFriends(data);
            setError(null);
        } catch (err) {
            console.error("Failed to fetch friends", err);
            setError("Failed to load friends.");
        } finally {
            setTabLoading(false);
        }
    };

    const fetchHistory = async () => {
        try {
            setTabLoading(true);
            const data = await apiClient.get<Receipt[]>("/receipts");
            setReceipts(data);
            setError(null);
        } catch (err) {
            console.error("Failed to fetch history", err);
            setError("Failed to load history.");
        } finally {
            setTabLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            setTabLoading(true);
            const data = await apiClient.get<UserStats>("/receipts/stats");
            setStats(data);
            setError(null);
        } catch (err) {
            console.error("Failed to fetch stats", err);
            setError("Failed to load statistics.");
        } finally {
            setTabLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            if (activeTab === "friends" && friends.length === 0) fetchFriends();
            if (activeTab === "history" && receipts.length === 0) fetchHistory();
            if (activeTab === "stats" && !stats) fetchStats();
        }
    }, [user, activeTab]);

    const handleAddFriend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newFriendName.trim()) return;

        try {
            setAdding(true);
            const newFriend = await apiClient.post<Friend>("/friends", {
                name: newFriendName,
            });
            setFriends((prev) => [...prev, newFriend]);
            setNewFriendName("");
            setShowAddForm(false);
        } catch (err) {
            console.error("Failed to add friend", err);
            alert("Failed to add friend. Please try again.");
        } finally {
            setAdding(false);
        }
    };

    const handleDeleteFriend = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete ${name}?`)) return;

        try {
            await apiClient.delete(`/friends/${id}`);
            setFriends((prev) => prev.filter((f) => f.id !== id));
        } catch (err) {
            console.error("Failed to delete friend", err);
            alert("Failed to delete friend. Please try again.");
        }
    };

    if (authLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-950">
                <Loader2 className="h-12 w-12 text-purple-500 animate-spin" />
            </div>
        );
    }

    if (!user) return null;

    return (
        <main className="flex min-h-screen flex-col items-center p-4 md:p-12 lg:p-24 bg-gray-950 selection:bg-purple-500/30">
            <div className="w-full max-w-2xl space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/"
                            className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
                        >
                            <ArrowLeft className="h-6 w-6" />
                        </Link>
                        <h1 className="text-3xl font-bold text-white">My Profile</h1>
                    </div>
                    {tabLoading && <Loader2 className="h-5 w-5 text-gray-500 animate-spin" />}
                </div>

                {/* User Card */}
                <div className="p-6 bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl shadow-xl flex items-center gap-6">
                    <div className="h-20 w-20 rounded-full bg-linear-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                        <UserIcon className="h-10 w-10 text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white">{user.name}</h2>
                        <p className="text-gray-400">{user.email}</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex p-1 bg-white/5 border border-white/10 rounded-xl">
                    <button
                        onClick={() => setActiveTab("friends")}
                        className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                            activeTab === "friends" ? "bg-purple-500 text-white shadow-lg" : "text-gray-400 hover:text-white"
                        }`}
                    >
                        Friends
                    </button>
                    <button
                        onClick={() => setActiveTab("history")}
                        className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                            activeTab === "history" ? "bg-blue-500 text-white shadow-lg" : "text-gray-400 hover:text-white"
                        }`}
                    >
                        History
                    </button>
                    <button
                        onClick={() => setActiveTab("stats")}
                        className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                            activeTab === "stats" ? "bg-emerald-500 text-white shadow-lg" : "text-gray-400 hover:text-white"
                        }`}
                    >
                        Statistics
                    </button>
                </div>

                {/* Content Sections */}
                {activeTab === "friends" && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <Users className="h-6 w-6 text-purple-400" />
                                Default Friends
                            </h3>
                            <button
                                onClick={() => setShowAddForm(true)}
                                className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white font-semibold rounded-xl flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-purple-900/20"
                            >
                                <Plus className="h-5 w-5" />
                                Add Friend
                            </button>
                        </div>

                        {error && !tabLoading && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400">
                                <AlertCircle className="h-5 w-5" />
                                <p>{error}</p>
                            </div>
                        )}

                        <div className="space-y-3">
                            {friends.length === 0 && !tabLoading && !error && (
                                <div className="text-center py-12 p-6 bg-white/5 border border-dashed border-white/10 rounded-2xl text-gray-500">
                                    You haven't added any default friends yet.
                                </div>
                            )}

                            {friends.map((friend) => (
                                <div
                                    key={friend.id}
                                    className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-gray-400 font-bold">
                                            {friend.name[0].toUpperCase()}
                                        </div>
                                        <span className="text-white font-medium">{friend.name}</span>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteFriend(friend.id, friend.name)}
                                        className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === "history" && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <History className="h-6 w-6 text-blue-400" />
                            Recent Receipts
                        </h3>

                        <div className="space-y-3">
                            {receipts.length === 0 && !tabLoading && !error && (
                                <div className="text-center py-12 p-6 bg-white/5 border border-dashed border-white/10 rounded-2xl text-gray-500">
                                    No receipt history found.
                                </div>
                            )}

                            {receipts.map((receipt) => (
                                <Link
                                    key={receipt.id}
                                    href={`/history/${receipt.id}`}
                                    className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                            <ReceiptIcon className="h-5 w-5 text-blue-400" />
                                        </div>
                                        <div>
                                            <div className="text-white font-medium">
                                                Receipt #{receipt.id.slice(-4).toUpperCase()}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {new Date(receipt.createdAt).toLocaleDateString(undefined, {
                                                    month: 'short', day: 'numeric', year: 'numeric'
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <div className="text-white font-bold">${receipt.total.toFixed(2)}</div>
                                            <div className="text-xs text-gray-500 uppercase tracking-wider">Total</div>
                                        </div>
                                        <ChevronRight className="h-5 w-5 text-gray-600 group-hover:text-white transition-colors" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === "stats" && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {stats ? (
                            <>
                                {/* Overall Stats */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl relative overflow-hidden group">
                                        <TrendingUp className="absolute -right-4 -bottom-4 h-24 w-24 text-emerald-500/10 group-hover:scale-110 transition-transform" />
                                        <p className="text-emerald-500 text-xs font-bold uppercase tracking-widest mb-2">Total Paid</p>
                                        <p className="text-3xl font-black text-white">${stats.totalPaid.toFixed(2)}</p>
                                    </div>
                                    <div className="p-6 bg-blue-500/10 border border-blue-500/20 rounded-2xl relative overflow-hidden group">
                                        <BarChart3 className="absolute -right-4 -bottom-4 h-24 w-24 text-blue-500/10 group-hover:scale-110 transition-transform" />
                                        <p className="text-blue-500 text-xs font-bold uppercase tracking-widest mb-2">Total Ordered</p>
                                        <p className="text-3xl font-black text-white">${stats.totalOrdered.toFixed(2)}</p>
                                    </div>
                                </div>

                                {/* Monthly Map */}
                                <section className="space-y-4">
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        <CalendarIcon className="h-5 w-5 text-gray-400" />
                                        Spending Trends
                                    </h3>
                                    <div className="space-y-2">
                                        {stats.monthlyStats.length === 0 && (
                                            <div className="col-span-2 text-center py-8 text-gray-500 bg-white/5 rounded-xl border border-dashed border-white/10">
                                                No monthly data available yet.
                                            </div>
                                        )}
                                        {stats.monthlyStats.map((ms) => (
                                            <div key={ms.month} className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-center gap-4">
                                                <div className="w-20 text-gray-400 font-medium">{ms.month}</div>
                                                <div className="flex-1 space-y-2">
                                                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                                        <div 
                                                            className="h-full bg-emerald-500 rounded-full" 
                                                            style={{ width: `${Math.min(100, (ms.paid / (stats.totalPaid || 1)) * 100)}%` }}
                                                        />
                                                    </div>
                                                    <div className="flex justify-between text-xs">
                                                        <span className="text-emerald-400">Paid: ${ms.paid.toFixed(2)}</span>
                                                        <span className="text-blue-400">Ordered: ${ms.ordered.toFixed(2)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                {/* Top Items */}
                                <section className="space-y-4">
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        <ShoppingBag className="h-5 w-5 text-purple-400" />
                                        Top Items
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {stats.itemCounts.length === 0 && (
                                            <div className="col-span-2 text-center py-8 text-gray-500 bg-white/5 rounded-xl border border-dashed border-white/10">
                                                No items found in your history.
                                            </div>
                                        )}
                                        {stats.itemCounts.slice(0, 6).map((item) => (
                                            <div key={item.name} className="p-3 bg-white/5 border border-white/10 rounded-xl flex justify-between items-center">
                                                <span className="text-gray-300 font-medium truncate pr-2">{item.name}</span>
                                                <span className="px-2 py-1 bg-purple-500/10 text-purple-400 rounded-lg text-xs font-bold">
                                                    {item.count}x
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            </>
                        ) : (
                            !tabLoading && (
                                <div className="text-center py-24 text-gray-500">
                                    Click "Statistics" to load your data.
                                </div>
                            )
                        )}
                    </div>
                )}
            </div>

            {/* Add Friend Modal */}
            {showAddForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-md bg-gray-900 border border-white/10 rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
                        <h2 className="text-xl font-bold text-white mb-4">Add Default Friend</h2>
                        <form onSubmit={handleAddFriend} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-400 mb-1 block">
                                    Friend's Name
                                </label>
                                <input
                                    type="text"
                                    autoFocus
                                    required
                                    value={newFriendName}
                                    onChange={(e) => setNewFriendName(e.target.value)}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-white transition-all"
                                    placeholder="e.g. John Doe"
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowAddForm(false)}
                                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-gray-300 font-semibold rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={adding || !newFriendName.trim()}
                                    className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl shadow-lg shadow-purple-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                                >
                                    {adding ? <Loader2 className="h-5 w-5 animate-spin" /> : "Save Friend"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}
