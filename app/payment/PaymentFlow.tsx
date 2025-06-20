'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Wallet, ClipboardCopy } from 'lucide-react';
import toast from 'react-hot-toast';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const RECIPIENT_WALLET_ADDRESS = 'DXMH7DLXRMHqpwSESmJ918uFhFQSxzvKEb7CA1ZDj1a2';

export default function PaymentFlow() {
  const searchParams = useSearchParams();
  const plan = searchParams.get('plan');
  const amount = searchParams.get('amount');

  const [signature, setSignature] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(RECIPIENT_WALLET_ADDRESS);
    toast.success('Address copied to clipboard!');
  };

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signature) {
      toast.error('Please enter the transaction signature.');
      return;
    }
    setIsLoading(true);
    const toastId = toast.loading('Verifying transaction...');

    try {
      // In a real app, you would have a robust user session
      const response = await fetch('/api/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signature, plan, amount }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Verification failed.');
      }

      toast.success('Payment successful! Your plan has been upgraded.', { id: toastId });
      // Redirect or update UI
      window.location.href = '/demo';

    } catch (error: any) {
      console.error(error);
      toast.error(`Verification failed: ${error.message}`, { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  if (!plan || !amount) {
    return (
      <div className="text-center p-8 border rounded-lg shadow-lg bg-white">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Invalid Payment Link</h2>
        <p className="text-gray-600">The payment link is missing required information. Please go back to the pricing page and select a plan.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg text-center p-8 border rounded-lg shadow-lg bg-white">
      <Wallet className="w-12 h-12 mx-auto text-primary mb-4" />
      <h1 className="text-3xl font-bold mb-2 capitalize">{plan} Plan</h1>
      <p className="text-gray-600 mb-6">Complete your purchase by sending SOL to the address below.</p>
      
      <div className="mb-6">
        <p className="text-lg font-semibold">Please send exactly:</p>
        <p className="text-4xl font-bold text-primary my-2">{amount} SOL</p>
      </div>

      <div className="mb-8">
        <p className="text-sm text-gray-500 mb-2">To this Solana address:</p>
        <div className="flex items-center justify-center p-3 bg-gray-100 rounded-lg">
          <code className="text-sm truncate mr-4 text-gray-900">{RECIPIENT_WALLET_ADDRESS}</code>
          <button onClick={copyToClipboard} className="p-1 hover:bg-gray-200 rounded-md">
            <ClipboardCopy className="w-4 h-4 text-gray-600" />
          </button>
        </div>
        <p className="text-xs text-red-500 mt-2">
          <strong>Important:</strong> Only send SOL from a wallet you control. Do not send from an exchange.
        </p>
      </div>

      <form onSubmit={handleVerification}>
        <label htmlFor="signature" className="block text-sm font-medium text-gray-700 mb-2">
          Paste Transaction Signature Below
        </label>
        <input
          id="signature"
          type="text"
          value={signature}
          onChange={(e) => setSignature(e.target.value)}
          placeholder="Enter your 64-character transaction signature here"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:ring-primary focus:border-primary"
          required
        />
        <button
          type="submit"
          disabled={isLoading}
          className={cn(buttonVariants(), 'w-full')}
        >
          {isLoading ? 'Verifying...' : 'Verify Payment'}
        </button>
      </form>
    </div>
  );
} 