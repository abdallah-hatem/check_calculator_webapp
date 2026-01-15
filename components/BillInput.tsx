import React, { useState, useEffect } from "react";
import { Receipt, Truck, Percent, Calculator } from "lucide-react";
import { BillDetails } from "@/utils/calculator";
import { cn } from "@/lib/utils";

interface BillInputProps {
  bill: BillDetails;
  onChange: (key: keyof BillDetails, value: number) => void;
  targetTotal: number | null;
  onTargetTotalChange: (val: number | null) => void;
  calculatedTotal: number;
}

export function BillInput({
  bill,
  onChange,
  targetTotal,
  onTargetTotalChange,
  calculatedTotal,
}: BillInputProps) {
  // Local string states to allow typing decimals (e.g., "12.")
  const [deliveryStr, setDeliveryStr] = useState(bill.delivery.toString());
  const [taxStr, setTaxStr] = useState(bill.tax.toString());
  const [serviceStr, setServiceStr] = useState(bill.service.toString());
  const [targetStr, setTargetStr] = useState(targetTotal?.toString() || "");

  // Sync from parent if changed externally (e.g., AI scan)
  useEffect(() => {
    if (parseFloat(deliveryStr) !== bill.delivery) {
      setDeliveryStr(bill.delivery.toString());
    }
  }, [bill.delivery]);

  useEffect(() => {
    if (parseFloat(taxStr) !== bill.tax) {
      setTaxStr(bill.tax.toString());
    }
  }, [bill.tax]);

  useEffect(() => {
    if (parseFloat(serviceStr) !== bill.service) {
      setServiceStr(bill.service.toString());
    }
  }, [bill.service]);

  useEffect(() => {
    if (parseFloat(targetStr) !== targetTotal) {
      setTargetStr(targetTotal?.toString() || "");
    }
  }, [targetTotal]);

  const handleInputChange = (key: keyof BillDetails, text: string) => {
    const cleanedText = text.replace(/[^0-9.]/g, "");
    if (key === "delivery") setDeliveryStr(cleanedText);
    if (key === "tax") setTaxStr(cleanedText);
    if (key === "service") setServiceStr(cleanedText);

    const val = parseFloat(cleanedText) || 0;
    onChange(key, val);
  };

  const handleTargetChange = (text: string) => {
    const cleanedText = text.replace(/[^0-9.]/g, "");
    setTargetStr(cleanedText);
    onTargetTotalChange(cleanedText ? parseFloat(cleanedText) : null);
  };

  const inputs = [
    {
      key: "delivery",
      label: "Delivery Fee",
      icon: Truck,
      color: "text-blue-400",
      value: deliveryStr,
    },
    {
      key: "tax",
      label: "Tax",
      icon: Receipt,
      color: "text-green-400",
      value: taxStr,
    },
    {
      key: "service",
      label: "Service Fee",
      icon: Percent,
      color: "text-yellow-400",
      value: serviceStr,
    },
  ] as const;

  const difference = targetTotal ? calculatedTotal - targetTotal : 0;
  const isMatch = Math.abs(difference) < 0.01;

  return (
    <div className="space-y-6">
      {/* Target Total Input */}
      <div className="relative group">
        <label className="text-xs text-gray-400 ml-1 mb-1 block uppercase tracking-wider font-semibold">
          Receipt Total (Target)
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Calculator className="h-4 w-4 text-purple-400" />
          </div>
          <input
            type="text"
            inputMode="decimal"
            value={targetStr}
            onChange={(e) => handleTargetChange(e.target.value)}
            className={cn(
              "block w-full pl-10 pr-3 py-3 bg-white/5 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all duration-200 text-white placeholder-gray-500 text-lg font-bold",
              targetTotal && !isMatch ? "border-red-500/50" : "border-white/10",
            )}
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="border-t border-white/10 my-4"></div>

      {/* Fees */}
      <div className="grid grid-cols-2 gap-4">
        {inputs.map(({ key, label, icon: Icon, color, value }) => (
          <div key={key} className="relative group">
            <label className="text-xs text-gray-400 ml-1 mb-1 block uppercase tracking-wider font-semibold">
              {label}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Icon className={cn("h-4 w-4", color)} />
              </div>
              <input
                type="text"
                inputMode="decimal"
                value={value}
                onChange={(e) => handleInputChange(key, e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-lg 
                         focus:ring-2 focus:ring-purple-500 focus:border-transparent 
                         text-white placeholder-gray-500 transition-all duration-200
                         hover:bg-white/10"
                placeholder="0.00"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Live Summary Box */}
      <div className="mt-8 p-4 bg-white/5 border border-white/10 rounded-2xl space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-400 font-bold uppercase tracking-widest">
            Total Calculated
          </span>
          <span className="text-2xl font-black text-white">
            ${calculatedTotal.toFixed(2)}
          </span>
        </div>
        {targetTotal !== null && (
          <div className="flex justify-between items-center pt-2 border-t border-white/5">
            <span className="text-sm text-gray-400 font-bold uppercase tracking-widest">
              Difference
            </span>
            <span
              className={cn(
                "text-lg font-bold",
                isMatch ? "text-green-400" : "text-red-400",
              )}
            >
              {isMatch ? "Perfect Match!" : `$${difference.toFixed(2)}`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
