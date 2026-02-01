import React from "react";
import { Participant } from "@/utils/calculator";
import { Trash2, User, DollarSign, ShoppingBag, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { MathInput } from "./MathInput";

interface ParticipantListProps {
  participants: Participant[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, field: keyof Participant, value: any) => void;
}

export function ParticipantList({
  participants,
  onAdd,
  onRemove,
  onUpdate,
}: ParticipantListProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {participants.map((person, index) => (
          <div
            key={person.id}
            className="flex flex-col gap-3 p-4 bg-white/5 border border-white/10 rounded-xl hover:border-purple-500/30 transition-all duration-300"
          >
            {/* Header: Name and Delete */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={person.name}
                  onChange={(e) => onUpdate(person.id, "name", e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 bg-transparent border-b border-white/10 focus:border-purple-500 text-white placeholder-gray-600 focus:outline-none transition-colors"
                  placeholder={`Friend ${index + 1}`}
                />
              </div>
              <button
                onClick={() => onRemove(person.id)}
                className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                title="Remove"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>

            {/* Inputs Row */}
            <div className="flex gap-3">
              {/* Ordered Amount */}
              <div className="relative flex-1">
                <label className="text-[10px] uppercase text-gray-500 font-bold tracking-wider mb-1 block">
                  Ordered
                </label>
                <div className="relative">
                  <ShoppingBag className="absolute top-2.5 left-3 h-4 w-4 text-blue-400" />
                  <MathInput
                    value={person.orderedAmount}
                    onChange={(val) =>
                      onUpdate(person.id, "orderedAmount", val)
                    }
                    className="pl-9 pr-2 py-2 bg-white/5 border border-white/10 rounded-lg focus:ring-1 focus:ring-blue-500 text-right text-white"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Paid Amount */}
              <div className="relative flex-1">
                <label className="text-[10px] uppercase text-gray-500 font-bold tracking-wider mb-1 block">
                  Paid
                </label>
                <div className="relative">
                  <span className="absolute top-2.5 left-3 text-xs font-bold text-green-400">E£</span>
                  <MathInput
                    value={person.paidAmount}
                    onChange={(val) => onUpdate(person.id, "paidAmount", val)}
                    className="pl-9 pr-2 py-2 bg-white/5 border border-white/10 rounded-lg focus:ring-1 focus:ring-green-500 text-right text-white"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onAdd}
        className="w-full py-4 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold shadow-lg shadow-purple-900/20 active:scale-[0.99] transition-all duration-200"
      >
        <Plus className="h-5 w-5" />
        Add Friend
      </button>
    </div>
  );
}
