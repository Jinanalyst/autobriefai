import { NextRequest, NextResponse } from 'next/server';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { supabase } from '@/lib/supabase';

const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
const RECIPIENT_WALLET_ADDRESS = 'DXMH7DLXRMHqpwSESmJ918uFhFQSxzvKEb7CA1ZDj1a2';

export async function POST(req: NextRequest) {
  const { signature, plan, amount } = await req.json();

  if (!signature || !plan || !amount) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const connection = new Connection(SOLANA_RPC_URL, 'confirmed');

  try {
    // 1. Check if signature has already been processed
    const { data: existingTx, error: selectError } = await supabase
      .from('processed_transactions')
      .select('id')
      .eq('signature', signature)
      .single();

    if (selectError && selectError.code !== 'PGRST116') { // Ignore 'No rows found' error
      throw new Error('Database error checking transaction.');
    }
    if (existingTx) {
      return NextResponse.json({ error: 'Transaction has already been processed.' }, { status: 400 });
    }

    // 2. Fetch transaction details from Solana
    const tx = await connection.getParsedTransaction(signature, 'confirmed');

    if (!tx) {
      throw new Error('Transaction not found on the blockchain.');
    }
    if (tx.meta?.err) {
      throw new Error('Transaction failed on the blockchain.');
    }

    // 3. Verify the transaction details
    const instruction = tx.transaction.message.instructions.find(
      (ix) => 'parsed' in ix && ix.parsed.type === 'transfer'
    );

    if (!instruction || !('parsed' in instruction)) {
        throw new Error('No transfer instruction found in the transaction.');
    }

    const { info } = instruction.parsed;
    const recipient = info.destination;
    const sentLamports = info.lamports;
    const sentSOL = sentLamports / LAMPORTS_PER_SOL;
    
    // Use a small tolerance for floating point comparisons
    const amountDifference = Math.abs(sentSOL - parseFloat(amount));

    if (recipient !== RECIPIENT_WALLET_ADDRESS) {
      throw new Error(`Invalid recipient. Expected ${RECIPIENT_WALLET_ADDRESS}.`);
    }
    if (amountDifference > 0.0001) {
        throw new Error(`Invalid amount. Sent ${sentSOL} SOL, expected ${amount} SOL.`);
    }

    // 4. Record the successful transaction
    const { error: insertError } = await supabase
      .from('processed_transactions')
      .insert({ signature, plan, amount });

    if (insertError) {
      // This is a critical error, as we might double-process a payment
      console.error('CRITICAL: Failed to record processed transaction!', insertError);
      throw new Error('Failed to save transaction details.');
    }
    
    // 5. TODO: Upgrade user's plan in your `users` or `subscriptions` table
    // For now, we just return success.
    
    return NextResponse.json({ success: true, message: 'Payment verified successfully!' });

  } catch (error: any) {
    console.error('Verification failed:', error);
    return NextResponse.json({ error: error.message || 'An unknown error occurred' }, { status: 400 });
  }
} 