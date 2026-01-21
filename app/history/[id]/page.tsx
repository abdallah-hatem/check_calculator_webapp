"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import {
    calculateSplits,
    calculateSettlements,
    Participant,
    BillDetails,
} from "@/utils/calculator";
import {
    ArrowLeft,
    Receipt as ReceiptIcon,
    Users,
    CreditCard,
    ChevronDown,
    ChevronUp,
    Loader2,
    Calendar,
    DollarSign,
    CheckCircle2,
    User as UserIcon,
} from "lucide-react";
import Link from "next/link";

interface HistoryItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    assignments: {
        userId: string | null;
        friendId: string | null;
        friend?: { name: string };
        user?: { name: string };
    }[];
}

interface HistoryPayment {
    id: string;
    amount: number;
    userId: string | null;
    friendId: string | null;
    friend?: { name: string };
    user?: { name: string };
}

interface HistoryReceipt {
    id: string;
    name: string | null;
    subtotal: number;
    delivery: number;
    tax: number;
    service: number;
    total: number;
    createdAt: string;
    items: HistoryItem[];
    payments: HistoryPayment[];
}

export default function HistoryDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [receipt, setReceipt] = useState<HistoryReceipt | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchReceipt = async () => {
            try {
                setLoading(true);
                const data = await apiClient.get<HistoryReceipt>(`/receipts/${id}`);
                setReceipt(data);
            } catch (err) {
                console.error("Failed to fetch receipt", err);
                setError("Failed to load receipt details.");
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchReceipt();
        }
    }, [id]);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-950">
                <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
            </div>
        );
    }

    if (error || !receipt) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-gray-950 p-4">
                <div className="p-8 bg-white/5 border border-white/10 rounded-2xl text-center space-y-4 max-w-md">
                    <h2 className="text-xl font-bold text-white">{error || "Receipt not found"}</h2>
                    <p className="text-gray-400">The receipt you're looking for might have been deleted or moved.</p>
                    <button
                        onClick={() => router.push("/profile")}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors"
                    >
                        Back to Profile
                    </button>
                </div>
            </div>
        );
    }

    // Transform backend data to calculator-compatible participants
    // 1. Identify all involved participants
    const participantMap = new Map<string, { id: string; name: string; paidAmount: number; orderedAmount: number }>();
    
    // Process payments to get paid amounts
    receipt.payments.forEach(p => {
        const pId = p.userId || p.friendId || "unknown";
        const name = p.user?.name || p.friend?.name || "Guest";
        const current = participantMap.get(pId) || { id: pId, name, paidAmount: 0, orderedAmount: 0 };
        current.paidAmount += p.amount;
        participantMap.set(pId, current);
    });

    // Process items to get ordered amounts (split among assignees)
    receipt.items.forEach(item => {
        if (item.assignments.length === 0) return;
        const perPerson = item.price / item.assignments.length;
        item.assignments.forEach(a => {
            const pId = a.userId || a.friendId || "unknown";
            const name = a.user?.name || a.friend?.name || "Guest";
            const current = participantMap.get(pId) || { id: pId, name, paidAmount: 0, orderedAmount: 0 };
            current.orderedAmount += perPerson;
            participantMap.set(pId, current);
        });
    });

    const participants: Participant[] = Array.from(participantMap.values());
    const bill: BillDetails = {
        delivery: receipt.delivery,
        tax: receipt.tax,
        service: receipt.service,
    };

    const results = calculateSplits(participants, bill);
    const settlements = calculateSettlements(results);

    return (
        <main className="flex min-h-screen flex-col items-center p-4 md:p-12 lg:p-24 bg-gray-950 selection:bg-blue-500/30">
            <div className="w-full max-w-3xl space-y-8">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link
                        href="/profile"
                        className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
                    >
                        <ArrowLeft className="h-6 w-6" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-white">Receipt Details</h1>
                        <p className="text-gray-500 flex items-center gap-2 mt-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(receipt.createdAt).toLocaleDateString(undefined, {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </p>
                    </div>
                </div>

                {/* Summary Card */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                        <p className="text-gray-500 text-sm font-medium uppercase tracking-wider mb-1">Total Bill</p>
                        <p className="text-3xl font-black text-white">${receipt.total.toFixed(2)}</p>
                    </div>
                    <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                        <p className="text-gray-500 text-sm font-medium uppercase tracking-wider mb-1">Participants</p>
                        <p className="text-3xl font-black text-blue-400">{participants.length}</p>
                    </div>
                    <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                        <p className="text-gray-500 text-sm font-medium uppercase tracking-wider mb-1">Items</p>
                        <p className="text-3xl font-black text-purple-400">{receipt.items.length}</p>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column: Items & Breakdowns */}
                    <div className="space-y-6">
                        <section className="space-y-4">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <ReceiptIcon className="h-5 w-5 text-purple-400" />
                                Scanned Items
                            </h3>
                            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                                {receipt.items.map((item, idx) => (
                                    <div 
                                        key={item.id}
                                        className={`p-4 ${idx !== receipt.items.length - 1 ? 'border-b border-white/5' : ''}`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="text-white font-medium">{item.name}</div>
                                            <div className="text-white font-bold">${item.price.toFixed(2)}</div>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {item.assignments.map((a, i) => (
                                                <span 
                                                    key={i}
                                                    className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-md text-xs font-medium"
                                                >
                                                    {a.user?.name || a.friend?.name || "Guest"}
                                                </span>
                                            ))}
                                            {item.assignments.length === 0 && (
                                                <span className="text-gray-600 text-xs italic">Unassigned</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="space-y-4">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <DollarSign className="h-5 w-5 text-emerald-400" />
                                Bill Fees
                            </h3>
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
                                <div className="flex justify-between text-gray-400">
                                    <span>Subtotal</span>
                                    <span>${receipt.subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-gray-400">
                                    <span>Tax</span>
                                    <span>${receipt.tax.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-gray-400">
                                    <span>Service</span>
                                    <span>${receipt.service.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-gray-400">
                                    <span>Delivery</span>
                                    <span>${receipt.delivery.toFixed(2)}</span>
                                </div>
                                <div className="pt-3 border-t border-white/5 flex justify-between text-white font-bold">
                                    <span>Total</span>
                                    <span>${receipt.total.toFixed(2)}</span>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Right Column: Settlements */}
                    <div className="space-y-6">
                        <section className="space-y-4">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-blue-400" />
                                Settlement Plan
                            </h3>
                            
                            {settlements.length === 0 ? (
                                <div className="p-12 text-center bg-white/5 border border-dashed border-white/10 rounded-2xl text-gray-500">
                                    All balances are fully settled.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {settlements.map((s, idx) => (
                                        <div 
                                            key={idx}
                                            className="p-4 bg-linear-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/20 rounded-2xl flex items-center justify-between"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="text-right">
                                                    <p className="text-white font-bold">{s.from}</p>
                                                    <p className="text-[10px] text-gray-400 uppercase tracking-tighter">Pays</p>
                                                </div>
                                                <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                                                    <ArrowLeft className="h-4 w-4 text-blue-400 rotate-180" />
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-white font-bold">{s.to}</p>
                                                    <p className="text-[10px] text-gray-400 uppercase tracking-tighter">To</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-2xl font-black text-white">${s.amount.toFixed(2)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                        <section className="space-y-4">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <Users className="h-5 w-5 text-orange-400" />
                                Individual Breakdown
                            </h3>
                            <div className="space-y-3">
                                {results.map((r) => (
                                    <div 
                                        key={r.id}
                                        className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-3"
                                    >
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-gray-400">
                                                    {r.name[0].toUpperCase()}
                                                </div>
                                                <span className="text-white font-bold">{r.name}</span>
                                            </div>
                                            <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                r.netBalance >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                                            }`}>
                                                {r.netBalance >= 0 ? 'Credit' : 'Debt'}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div className="text-gray-500">Should have paid:</div>
                                            <div className="text-right text-gray-300 font-medium">${r.totalOwed.toFixed(2)}</div>
                                            <div className="text-gray-500">Actually paid:</div>
                                            <div className="text-right text-emerald-400 font-medium">${r.paidAmount.toFixed(2)}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </main>
    );
}
