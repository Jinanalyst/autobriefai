"use client";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Check, Star } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { SystemProgram, Transaction, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";

// Replace with your actual Solana wallet address for receiving payments
const YOUR_WALLET_ADDRESS = "DXMH7DLXRMHqpwSESmJ918uFhFQSxzvKEb7CA1ZDj1a2";

export interface PricingPlan {
  name: string;
  price: string;
  period: string;
  features: string[];
  description: string;
  buttonText: string;
  href: string;
  isPopular: boolean;
  tier: 'starter' | 'professional' | 'enterprise';
}

interface PricingProps {
  plans: PricingPlan[];
  title?: string;
  description?: string;
}

export function Pricing({
  plans,
  title = "Simple, Transparent Pricing",
  description = `Choose the plan that works for you`,
}: PricingProps) {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [isPaying, setIsPaying] = useState<string | null>(null);

  const handlePayment = async (plan: PricingPlan) => {
    if (!publicKey) {
      toast.error("Please connect your wallet first.");
      return;
    }

    setIsPaying(plan.name);
    const toastId = toast.loading(`Initiating payment for ${plan.name} plan...`);

    try {
      const recipient = new PublicKey(YOUR_WALLET_ADDRESS);
      const amount = Number(plan.price);
      
      const lamports = amount * LAMPORTS_PER_SOL;

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: recipient,
          lamports: lamports,
        })
      );

      const {
        context: { slot: minContextSlot },
        value: { blockhash, lastValidBlockHeight }
      } = await connection.getLatestBlockhashAndContext();

      const signature = await sendTransaction(transaction, connection, { minContextSlot });
      toast.loading(`Processing transaction...`, { id: toastId });
      
      await connection.confirmTransaction({ blockhash, lastValidBlockHeight, signature });

      // Call Supabase Edge Function to verify and update subscription
      const { data, error } = await supabase.functions.invoke('process-payment', {
        body: { signature, plan: plan.tier },
      });

      if (error || !data.success) {
        throw new Error(error?.message || data?.error || "Payment verification failed.");
      }
      
      toast.success(`Congratulations! You are now on the ${plan.name} plan.`, { id: toastId, duration: 5000 });

    } catch (error: any) {
      console.error("Payment failed", error);
      toast.error(`Payment failed: ${error.message}`, { id: toastId, duration: 5000 });
    } finally {
      setIsPaying(null);
    }
  };

  return (
    <div className="container py-20">
      <div className="text-center space-y-4 mb-12">
        <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
          {title}
        </h2>
        <p className="text-muted-foreground text-lg whitespace-pre-line">
          {description}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-4 items-stretch">
        {plans.map((plan, index) => (
          <motion.div
            key={index}
            initial={{ y: 50, opacity: 0 }}
            whileInView={{
                    y: 0,
                    opacity: 1,
                  }}
            viewport={{ once: true }}
            transition={{
              duration: 0.8,
              type: "spring",
              stiffness: 100,
              damping: 20,
              delay: 0.2 * index,
            }}
            className={cn(
              `rounded-2xl border p-8 bg-background/50 text-center flex flex-col`,
              plan.isPopular ? "border-primary shadow-lg lg:scale-105" : "border-border lg:scale-95",
            )}
          >
            {plan.isPopular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary py-1 px-3 rounded-full flex items-center shadow-md">
                <span className="text-primary-foreground font-sans font-semibold text-sm">
                  Most Popular
                </span>
              </div>
            )}
            <div className="flex-1 flex flex-col">
              <p className="text-lg font-semibold text-muted-foreground tracking-wider uppercase">
                {plan.name}
              </p>
              <div className="mt-6 flex items-baseline justify-center gap-x-2">
                {plan.price.toLowerCase() === 'free' ? (
                  <span className="text-5xl font-bold tracking-tight text-foreground">
                    Free
                  </span>
                ) : (
                  <>
                    <span className="text-5xl font-bold tracking-tight text-foreground">
                      {plan.price}
                    </span>
                    <span className="text-lg font-semibold leading-6 tracking-wide text-muted-foreground">
                      SOL
                    </span>
                  </>
                )}
              </div>

              <p className="text-sm leading-5 text-muted-foreground mt-2">
                {plan.period}
              </p>

              <ul
                role="list"
                className="mt-8 space-y-3 text-sm leading-6 text-muted-foreground text-left"
              >
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-x-3">
                    <Check
                      className="h-6 w-5 flex-none text-primary"
                      aria-hidden="true"
                    />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="mt-auto pt-8">
              {plan.price.toLowerCase() === 'free' ? (
                  <Link
                    href={plan.href}
                    className={cn(buttonVariants({ 
                      variant: plan.isPopular ? "default" : "outline", 
                      size: "lg" 
                    }), "w-full")}
                  >
                    {plan.buttonText}
                  </Link>
                ) : (
                  <button
                    onClick={() => handlePayment(plan)}
                    disabled={isPaying === plan.name || !publicKey}
                    className={cn(buttonVariants({ 
                      variant: plan.isPopular ? "default" : "outline", 
                      size: "lg" 
                    }), "w-full")}
                  >
                    {isPaying === plan.name ? 'Processing...' : plan.buttonText}
                  </button>
              )}

              <p className="text-sm text-muted-foreground mt-6">
                {plan.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
} 