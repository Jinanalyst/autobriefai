"use client";

import { buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Check, Star, Wallet } from "lucide-react";
import Link from "next/link";
import { useState, useRef } from "react";
import confetti from "canvas-confetti";
import NumberFlow from "@number-flow/react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { SystemProgram, Transaction, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";

export interface PricingPlan {
  name: string;
  price: string;
  yearlyPrice: string;
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
  description = `Choose the plan that works for you
All plans include access to our platform, lead generation tools, and dedicated support.`,
}: PricingProps) {
  const [isMonthly, setIsMonthly] = useState(true);
  const switchRef = useRef<HTMLButtonElement>(null);
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [isPaying, setIsPaying] = useState<string | null>(null);

  const handleToggle = (checked: boolean) => {
    setIsMonthly(!checked);
    if (checked && switchRef.current) {
      const rect = switchRef.current.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;

      confetti({
        particleCount: 50,
        spread: 60,
        origin: {
          x: x / window.innerWidth,
          y: y / window.innerHeight,
        },
        colors: [
          "hsl(var(--primary))",
          "hsl(var(--accent))",
          "hsl(var(--secondary))",
          "hsl(var(--muted))",
        ],
        ticks: 200,
        gravity: 1.2,
        decay: 0.94,
        startVelocity: 30,
        shapes: ["circle"],
      });
    }
  };

  const handlePayment = async (plan: PricingPlan) => {
    if (!publicKey) {
      toast.error("Please connect your wallet first.");
      return;
    }

    setIsPaying(plan.name);
    const toastId = toast.loading(`Initiating payment for ${plan.name} plan...`);

    try {
      const recipient = new PublicKey("YOUR_WALLET_ADDRESS_HERE"); // <-- IMPORTANT: REPLACE WITH YOUR WALLET ADDRESS
      const amount = isMonthly ? Number(plan.price) : Number(plan.yearlyPrice);
      
      // For demo purposes, we'll send a tiny amount of SOL
      // In production, you would use USDC or another SPL token
      const lamports = 0.01 * LAMPORTS_PER_SOL;

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

      toast.success(`Congratulations! You are now on the ${plan.name} plan.`, { id: toastId });
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });

    } catch (error: any) {
      console.error("Payment failed", error);
      toast.error(`Payment failed: ${error.message}`, { id: toastId });
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
        <div className="pt-4">
          <Link href="/" className={buttonVariants({ variant: 'outline' })}>
            Back to Home
          </Link>
        </div>
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
              `rounded-2xl border p-6 bg-background text-center flex flex-col`,
              plan.isPopular ? "border-primary border-2 lg:scale-105" : "border-border lg:scale-95",
            )}
          >
            {plan.isPopular && (
              <div className="absolute top-0 right-0 bg-primary py-0.5 px-2 rounded-bl-xl rounded-tr-xl flex items-center">
                <Star className="text-primary-foreground h-4 w-4 fill-current" />
                <span className="text-primary-foreground ml-1 font-sans font-semibold">
                  Popular
                </span>
              </div>
            )}
            <div className="flex-1 flex flex-col">
              <p className="text-base font-semibold text-muted-foreground">
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

              <p className="text-xs leading-5 text-muted-foreground">
                One-time payment
              </p>

              <ul className="mt-5 gap-2 flex flex-col">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                    <span className="text-left">{feature}</span>
                  </li>
                ))}
              </ul>

              <hr className="w-full my-4" />

              <Link
                href={plan.href}
                className={cn(
                  buttonVariants({
                    variant: "outline",
                  }),
                  "group relative w-full gap-2 overflow-hidden text-lg font-semibold tracking-tighter",
                  "transform-gpu ring-offset-current transition-all duration-300 ease-out hover:ring-2 hover:ring-primary hover:ring-offset-1 hover:bg-primary hover:text-primary-foreground",
                  plan.isPopular
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-foreground",
                  "hover:bg-primary/90",
                )}
              >
                <Wallet className="h-5 w-5" />
                <span>{plan.buttonText}</span>
              </Link>
              <p className="mt-6 text-xs leading-5 text-muted-foreground">
                {plan.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
} 