'use client';

import { Suspense } from 'react';
import Header from '@/components/Header';
import PaymentFlow from './PaymentFlow';

export default function PaymentPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      <main className="flex-grow flex items-center justify-center container mx-auto px-4 py-12">
        <Suspense fallback={<div>Loading payment details...</div>}>
          <PaymentFlow />
        </Suspense>
      </main>
    </div>
  );
} 