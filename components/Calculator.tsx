"use client";

import React, { useState, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  BillDetails,
  Participant,
  calculateSplits,
  calculateSettlements,
} from "@/utils/calculator";
import { BillInput } from "./BillInput";
import { ParticipantList } from "./ParticipantList";
import { SettlementDisplay } from "./SettlementDisplay";
import { ReceiptUploader } from "./ReceiptUploader";
import { ItemAssigner } from "./ItemAssigner";
import { ScanResult, ScannedItem } from "@/app/actions/scan";
import {
  Wallet,
  Calculator as CalculatorIcon,
  X,
  ArrowLeft,
  RotateCcw,
} from "lucide-react";

import { useAuth } from "./AuthContext";
import { apiClient } from "@/lib/api-client";

interface Friend {
  id: string;
  name: string;
  userId: string;
}

export function Calculator() {
  const { user } = useAuth();
  const resultsRef = useRef<HTMLDivElement>(null);

  // UI Modes
  const [showResults, setShowResults] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  // Data State
  const [bill, setBill] = useState<BillDetails>({
    delivery: 0,
    tax: 0,
    service: 0,
  });

  const [targetTotal, setTargetTotal] = useState<number | null>(null);

  const [participants, setParticipants] = useState<Participant[]>([]);

  React.useEffect(() => {
    const fetchFriends = async () => {
      try {
        const friends = await apiClient.get<Friend[]>("/friends");
        setParticipants(
          friends.map((f) => ({
            id: f.id,
            name: f.name,
            orderedAmount: 0,
            paidAmount: 0,
          }))
        );
      } catch (error) {
        console.error("Failed to fetch friends", error);
      }
    };

    if (user) {
      fetchFriends();
    }
  }, [user]);

  // Scanned Data State
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [assignedItems, setAssignedItems] = useState<Record<string, string[]>>(
    {},
  );

  // Friend Add State
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [newFriendName, setNewFriendName] = useState("");

  const handleBillChange = (key: keyof BillDetails, value: number) => {
    setBill((prev) => ({ ...prev, [key]: value }));
  };

  const handleAddParticipant = (name?: string) => {
    if (name && name.trim()) {
      const tempId = uuidv4();
      setParticipants((prev) => [
        ...prev,
        {
          id: tempId,
          name: name.trim(),
          orderedAmount: 0,
          paidAmount: 0,
        },
      ]);
      return;
    }
    setNewFriendName("");
    setShowAddFriend(true);
  };

  const handleSaveFriend = () => {
    if (!newFriendName.trim()) return;

    // Frontend only add friend
    const tempId = uuidv4();
    setParticipants((prev) => [
      ...prev,
      {
        id: tempId,
        name: newFriendName,
        orderedAmount: 0,
        paidAmount: 0,
      },
    ]);
    setShowAddFriend(false);
  };

  const handleRemoveParticipant = (id: string) => {
    setParticipants((prev) => prev.filter((p) => p.id !== id));
    // Clear any assignments for this participant so items become available again
    setAssignedItems((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((itemId) => {
        if (next[itemId].includes(id)) {
          next[itemId] = next[itemId].filter((pid) => pid !== id);
          if (next[itemId].length === 0) {
            delete next[itemId];
          }
        }
      });
      return next;
    });
  };

  const handleParticipantUpdate = (
    id: string,
    field: keyof Participant,
    value: any,
  ) => {
    setParticipants((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
    );
  };

  const handleReset = () => {
    if (window.confirm("Reset all data? This cannot be undone.")) {
      setBill({ delivery: 0, tax: 0, service: 0 });
      setTargetTotal(null);
      setParticipants([]);
      // Re-fetch friends would be better but for now just clear or keep them?
      // Actually, reset usually implies "start over with the same friends but 0 amounts".
      // But the original code reset to hardcoded list.
      // Let's reset amounts but keep friends.
      setParticipants(prev => prev.map(p => ({ ...p, orderedAmount: 0, paidAmount: 0 })));
      setScannedItems([]);
      setAssignedItems({});
    }
  };

  const handleScanComplete = (data: ScanResult) => {
    // 1. Update Global Fees
    setBill({
      delivery: data.delivery,
      tax: data.tax,
      service: data.service,
    });

    // 2. Set Target Total if found
    if (data.total > 0) {
      setTargetTotal(data.total);
    }

    // 3. Store Items & formatting
    setScannedItems(data.items);

    // Reset assignments on new scan
    setAssignedItems({});

    // 4. Switch to assignment view? (Or just show them)
    // We already in "Scanner" view which contains the assigner, so we just populate it.
  };

  const handleLoadTestData = () => {
    const dummyData: ScanResult = {
      items: [
        { id: "test-1", name: "Supreme Pizza", price: 25.5, quantity: 1 },
        { id: "test-2", name: "Garlic Bread", price: 8.0, quantity: 1 },
        { id: "test-3", name: "Coke (Large)", price: 4.5, quantity: 1 },
        { id: "test-4", name: "Chicken Wings", price: 12.0, quantity: 1 },
      ],
      subtotal: 50.0,
      delivery: 5.0,
      tax: 4.5,
      service: 3.0,
      total: 62.5,
    };
    handleScanComplete(dummyData);
  };

  const handleToggleAssign = (itemId: string, participantId: string) => {
    setAssignedItems((prev) => {
      const current = prev[itemId] || [];
      const isAssigned = current.includes(participantId);

      const next = isAssigned
        ? current.filter((id) => id !== participantId)
        : [...current, participantId];

      const nextState = { ...prev };
      if (next.length === 0) {
        delete nextState[itemId];
      } else {
        nextState[itemId] = next;
      }
      return nextState;
    });
  };

  // Recalculate ordered amounts based on assignments
  const participantsWithSharedCosts = participants.map((p) => {
    let sharedTotal = 0;
    scannedItems.forEach((item) => {
      const assignees = assignedItems[item.id] || [];
      if (assignees.includes(p.id)) {
        sharedTotal += item.price / assignees.length;
      }
    });

    return {
      ...p,
      orderedAmount: sharedTotal > 0 ? sharedTotal : p.orderedAmount,
    };
  });

  const results = calculateSplits(participantsWithSharedCosts, bill);
  const settlements = calculateSettlements(results);

  const totalBill =
    participantsWithSharedCosts.reduce((sum, p) => sum + p.orderedAmount, 0) +
    bill.delivery +
    bill.tax +
    bill.service;

  const totalPaid = participantsWithSharedCosts.reduce(
    (sum, p) => sum + p.paidAmount,
    0,
  );

  const isPaidMatched = Math.abs(totalPaid - totalBill) < 0.1;
  const isTargetMatched = targetTotal
    ? Math.abs(targetTotal - totalBill) < 0.1
    : true;

  // View Switching Logic
  if (showScanner) {
    return (
      <div className="pb-32 space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => setShowScanner(false)}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <ArrowLeft className="h-6 w-6 text-white" />
          </button>
          <h2 className="text-xl font-bold text-white">Scan & Assign</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="p-6 bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl shadow-xl">
              <h3 className="text-lg font-bold text-white mb-4">
                1. Upload Receipt
              </h3>
              <ReceiptUploader
                onScanComplete={handleScanComplete}
                onTestData={handleLoadTestData}
              />
            </div>
          </div>

          <div className="space-y-6">
            {scannedItems.length > 0 && (
              <div className="p-6 bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl shadow-xl animate-in slide-in-from-right-4 duration-500">
                <h3 className="text-lg font-bold text-white mb-4">
                  2. Assign Items
                </h3>
                <ItemAssigner
                  items={scannedItems}
                  participants={participantsWithSharedCosts}
                  assignedItems={assignedItems}
                  onToggleAssign={handleToggleAssign}
                  onRemoveParticipant={handleRemoveParticipant}
                  onAddParticipant={handleAddParticipant}
                  onUpdateParticipant={handleParticipantUpdate}
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer for quick participant add during scan */}
        {scannedItems.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-gray-900/90 backdrop-blur-md border-t border-white/10 z-50">
            <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
              <button
                onClick={() => handleAddParticipant()}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg text-sm"
              >
                + Add Friend
              </button>

              <button
                onClick={() => setShowScanner(false)}
                className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-green-900/20 active:scale-95 transition-all text-center"
              >
                Done Assigning ({scannedItems.length} items)
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 w-full pb-32">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-extrabold text-white bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
          Check Calculator
        </h1>
        <div className="flex gap-4">
          <button
            onClick={handleReset}
            className="p-2 bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
            title="Reset All"
          >
            <RotateCcw className="h-5 w-5" />
          </button>
          <button
            onClick={() => setShowScanner(true)}
            className="px-6 py-2 bg-purple-500/10 border border-purple-500/30 text-purple-400 hover:text-white hover:bg-purple-500 rounded-xl transition-all font-medium flex items-center gap-2"
          >
            ✨ Scan Receipt with AI
          </button>
        </div>
      </div>

      {/* Input Section */}
      <div className="space-y-6">
        {/* Bill Details Card */}
        <div className="p-6 bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl shadow-xl">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <CalculatorIcon className="h-6 w-6 text-purple-400" />
            Bill Details
          </h2>
          <BillInput
            bill={bill}
            onChange={handleBillChange}
            targetTotal={targetTotal}
            onTargetTotalChange={setTargetTotal}
            calculatedTotal={totalBill}
          />
        </div>

        {/* Participants Card */}
        <div className="p-6 bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl shadow-xl">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Wallet className="h-6 w-6 text-blue-400" />
            Friends & Orders
          </h2>
          <ParticipantList
            participants={participantsWithSharedCosts}
            onAdd={handleAddParticipant}
            onRemove={handleRemoveParticipant}
            onUpdate={handleParticipantUpdate}
          />
        </div>
      </div>

      {/* Floating Action Bar / Calculate Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gray-900/90 backdrop-blur-md border-t border-white/10 z-50">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <div className="flex-1">
            <div className="text-xs text-gray-400 uppercase font-bold tracking-wider">
              Total Bill
            </div>
            <div
              className={`text-xl font-bold ${!isTargetMatched ? "text-red-400" : "text-white"}`}
            >
              ${totalBill.toFixed(2)}
            </div>
          </div>
          <button
            onClick={() => setShowResults(true)}
            className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-xl shadow-lg shadow-purple-900/30 flex items-center gap-2 active:scale-95 transition-transform"
          >
            <CalculatorIcon className="h-5 w-5" />
            Calculate
          </button>
        </div>
      </div>

      {/* Results Modal */}
      {
        showResults && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg bg-gray-900 border border-white/10 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-10 duration-300">
              <button
                onClick={() => setShowResults(false)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white bg-white/5 rounded-full z-10"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="p-6 space-y-6">
                <h2 className="text-2xl font-bold text-white">Split Results</h2>

                {/* Status Check in Modal */}
                <div
                  className={`p-4 rounded-xl border ${isPaidMatched ? "bg-green-500/10 border-green-500/20" : "bg-red-500/10 border-red-500/20"}`}
                >
                  <div className="flex justify-between items-center">
                    <span
                      className={`font-semibold ${isPaidMatched ? "text-green-400" : "text-red-400"}`}
                    >
                      {isPaidMatched
                        ? "Total Paid Matches Bill ✅"
                        : "Payment Mismatch ⚠️"}
                    </span>
                  </div>
                  {!isPaidMatched && (
                    <div className="mt-1 text-sm text-gray-400">
                      Friends paid ${totalPaid.toFixed(2)} but bill is $
                      {totalBill.toFixed(2)}.
                    </div>
                  )}
                </div>

                <SettlementDisplay
                  settlements={settlements}
                  participants={results}
                />

                <button
                  onClick={() => setShowResults(false)}
                  className="w-full py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-colors"
                >
                  Back to Edit
                </button>
              </div>
            </div>
          </div>
        )
      }
      {/* Add Friend Modal */}
      {showAddFriend && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-gray-900 border border-white/10 rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-white mb-4">Add New Friend</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveFriend();
              }}
              className="space-y-4"
            >
              <div>
                <label className="text-sm font-medium text-gray-400 mb-1 block">
                  Friend's Name
                </label>
                <input
                  type="text"
                  autoFocus
                  value={newFriendName}
                  onChange={(e) => setNewFriendName(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-white transition-all"
                  placeholder="e.g. Alice"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddFriend(false)}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-gray-300 font-semibold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveFriend}
                  disabled={!newFriendName.trim()}
                  className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl shadow-lg shadow-purple-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Add Friend
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
