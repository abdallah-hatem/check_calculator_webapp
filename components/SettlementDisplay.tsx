import React from 'react';
import { ParticipantResult, Settlement } from '@/utils/calculator';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

interface SettlementDisplayProps {
  settlements: Settlement[];
  participants: ParticipantResult[];
}

export function SettlementDisplay({ settlements, participants }: SettlementDisplayProps) {
  if (participants.length === 0) return null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Settlements */}
      {settlements.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-400" />
            Settlements
          </h3>
          <div className="grid gap-3">
            {settlements.map((s, idx) => (
              <div 
                key={idx}
                className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <span className="font-medium text-white">{s.from}</span>
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] uppercase text-gray-500 font-bold tracking-widest">pays</span>
                    <ArrowRight className="h-4 w-4 text-emerald-400" />
                  </div>
                  <span className="font-medium text-white">{s.to}</span>
                </div>
                <div className="font-bold text-emerald-400 text-lg">
                  E£{s.amount.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
          <div className="p-6 text-center border border-white/10 rounded-xl bg-white/5">
            <p className="text-gray-400">All settled up! No payments needed.</p>
          </div>
      )}

      {/* Detailed Breakdown */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-400 uppercase bg-white/5">
              <tr>
                <th className="px-4 py-3 rounded-l-lg">Name</th>
                <th className="px-4 py-3">Subtotal</th>
                <th className="px-4 py-3">Tax/Service</th>
                <th className="px-4 py-3">Total Due</th>
                <th className="px-4 py-3 rounded-r-lg">Net</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {participants.map((p) => {
                const extras = p.taxShare + p.serviceShare + p.deliveryShare;
                return (
                    <tr key={p.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3 font-medium text-white">{p.name}</td>
                        <td className="px-4 py-3 text-gray-300">E£{p.subtotalShare.toFixed(2)}</td>
                        <td className="px-4 py-3 text-gray-400">+E£{extras.toFixed(2)}</td>
                        <td className="px-4 py-3 font-bold text-white">E£{p.totalOwed.toFixed(2)}</td>
                        <td className={`px-4 py-3 font-bold ${p.netBalance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {p.netBalance >= 0 ? '+' : ''}E£{p.netBalance.toFixed(2)}
                        </td>
                    </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
