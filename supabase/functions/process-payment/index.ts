import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.0.0";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "https://esm.sh/@solana/web3.js@1.73.0";

const SOLANA_RPC_URL = 'https://api.devnet.solana.com';
const YOUR_WALLET_ADDRESS = 'YOUR_WALLET_ADDRESS_HERE'; // IMPORTANT: Replace with your actual wallet address

serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
    }

    const { signature, plan } = await req.json();
    if (!signature || !plan) {
      return new Response(JSON.stringify({ error: "Missing signature or plan" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }

    const connection = new Connection(SOLANA_RPC_URL, 'confirmed');
    const tx = await connection.getTransaction(signature, { maxSupportedTransactionVersion: 0 });

    if (!tx) {
      throw new Error("Transaction not found.");
    }
    
    // --- Security Verification ---
    // 1. Verify the transaction was successful
    if (tx.meta?.err) {
      throw new Error("Transaction failed on-chain.");
    }

    // 2. Verify the recipient
    const recipientAccount = tx.transaction.message.accountKeys.find(key => key.pubkey.toBase58() === YOUR_WALLET_ADDRESS);
    if (!recipientAccount || !recipientAccount.writable) {
      throw new Error("Invalid recipient address.");
    }

    // 3. Verify the amount (for this demo, we check if it's the 0.01 SOL)
    const preBalance = tx.meta.preBalances[0];
    const postBalance = tx.meta.postBalances[0];
    if (preBalance - postBalance !== 0.01 * LAMPORTS_PER_SOL) {
        throw new Error("Invalid transaction amount.");
    }
    
    // --- Update Database ---
    const { error: dbError } = await supabaseClient
      .from('subscriptions')
      .upsert({
        user_id: user.id,
        plan: plan,
        status: 'active',
        transaction_signature: signature,
      }, { onConflict: 'user_id' });

    if (dbError) {
      throw dbError;
    }

    return new Response(JSON.stringify({ success: true, message: `Subscription updated to ${plan}` }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}); 