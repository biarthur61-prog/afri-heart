"use client";

import { useState } from "react";
import PaystackPop from "@paystack/inline-js";

interface VIPSubscriptionButtonProps {
  email: string;
  amount?: number; // Montant en monnaie locale (ex: 4900 pour 4900 XOF)
  onSuccess?: (transaction: any) => void;
  onCancel?: () => void;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export default function VIPSubscriptionButton({
  email,
  amount = 4900,
  onSuccess,
  onCancel,
  className,
  style,
  children,
}: VIPSubscriptionButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = () => {
    if (isProcessing) return;
    setIsProcessing(true);

    const paystack = new PaystackPop();

    paystack.newTransaction({
      key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY as string,
      email,
      amount: amount * 100, // Paystack attend le montant en kobo / centimes
      metadata: {
        custom_fields: [
          {
            display_name: "Plan Type",
            variable_name: "plan_type",
            value: "VIP Subscription",
          },
        ],
      },
      onSuccess: (transaction: any) => {
        setIsProcessing(false);
        // Déléguer la logique post-paiement au parent via le callback
        if (onSuccess) onSuccess(transaction);
      },
      onCancel: () => {
        setIsProcessing(false);
        if (onCancel) onCancel();
        console.log("Paiement annulé par l'utilisateur.");
      },
      onError: (error: any) => {
        setIsProcessing(false);
        console.error("Erreur de paiement Paystack :", error);
      },
    });
  };

  // Si children ou className personnalisé, rendre un bouton flexible
  if (children || className) {
    return (
      <button
        onClick={handlePayment}
        disabled={isProcessing}
        className={className}
        style={style}
      >
        {isProcessing ? (
          <span className="flex items-center justify-center gap-2 opacity-70">
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Traitement...
          </span>
        ) : (
          children
        )}
      </button>
    );
  }

  // Bouton VIP par défaut (standalone)
  return (
    <button
      onClick={handlePayment}
      disabled={isProcessing}
      className="relative overflow-hidden px-8 py-4 bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 text-white font-bold rounded-xl shadow-[0_4px_15px_rgba(251,191,36,0.4)] hover:shadow-[0_6px_20px_rgba(251,191,36,0.6)] transform hover:-translate-y-1 transition-all duration-300 ease-out disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
    >
      <div className="absolute inset-0 bg-white/20 blur-md rounded-xl opacity-0 hover:opacity-100 transition-opacity duration-300" />
      <span className="relative flex items-center justify-center gap-2">
        {isProcessing ? (
          <>
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Traitement...
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
            </svg>
            Devenir VIP
          </>
        )}
      </span>
    </button>
  );
}
