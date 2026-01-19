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
    AlertCircle
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Friend {
    id: string;
    name: string;
    userId: string;
}

export default function ProfilePage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    const [friends, setFriends] = useState<Friend[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
            setLoading(true);
            const data = await apiClient.get<Friend[]>("/friends");
            setFriends(data);
            setError(null);
        } catch (err) {
            console.error("Failed to fetch friends", err);
            setError("Failed to load your friends. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchFriends();
        }
    }, [user]);

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

    if (authLoading || (loading && friends.length === 0)) {
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
                <div className="flex items-center gap-4">
                    <Link
                        href="/"
                        className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
                    >
                        <ArrowLeft className="h-6 w-6" />
                    </Link>
                    <h1 className="text-3xl font-bold text-white">My Profile</h1>
                </div>

                {/* User Card */}
                <div className="p-6 bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl shadow-xl flex items-center gap-6">
                    <div className="h-20 w-20 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                        <UserIcon className="h-10 w-10 text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white">{user.name}</h2>
                        <p className="text-gray-400">{user.email}</p>
                    </div>
                </div>

                {/* Friends Section */}
                <div className="space-y-6">
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

                    {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400">
                            <AlertCircle className="h-5 w-5" />
                            <p>{error}</p>
                        </div>
                    )}

                    {/* Friends List */}
                    <div className="space-y-3">
                        {friends.length === 0 && !loading && (
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
            </div>

            {/* Add Friend Modal */}
            {showAddForm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
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
