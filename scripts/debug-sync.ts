import 'dotenv/config';
import { Client as PluggyClient, YnabClient } from '@pluggy-ofx-export/core';

interface AccountConfig {
  name: string;
  pluggy_id: string;
  ynab_budget_id: string;
  ynab_account_id: string;
  type: 'BANK' | 'CREDIT';
}

async function debugSync() {
  const {
    ACCOUNT_CONFIG,
    YNAB_API_KEY,
    PLUGGY_CLIENT_ID,
    PLUGGY_CLIENT_SECRET,
  } = process.env;

  if (!ACCOUNT_CONFIG || !YNAB_API_KEY || !PLUGGY_CLIENT_ID || !PLUGGY_CLIENT_SECRET) {
    console.error('❌ All required environment variables must be set');
    process.exit(1);
  }

  const accountConfigs: AccountConfig[] = JSON.parse(ACCOUNT_CONFIG);
  const ynabClient = new YnabClient(YNAB_API_KEY);
  const pluggyClient = new PluggyClient({ 
    clientId: PLUGGY_CLIENT_ID, 
    clientSecret: PLUGGY_CLIENT_SECRET 
  });

  console.log('🔍 Debug Sync Analysis\n');
  console.log('═'.repeat(80));

  for (const config of accountConfigs) {
    const { name, pluggy_id, ynab_budget_id, ynab_account_id, type } = config;
    
    console.log(`\n📊 Account: ${name} (${type})`);
    console.log('─'.repeat(80));

    try {
      // Get the date range (last 30 days)
      const fromDate = new Date(new Date().setDate(new Date().getDate() - 30));
      const toDate = new Date();

      console.log(`📅 Date range: ${fromDate.toISOString().split('T')[0]} to ${toDate.toISOString().split('T')[0]}\n`);

      // Fetch Pluggy accounts for this item
      const accounts = await pluggyClient.fetchAccounts(pluggy_id);
      
      if (!accounts || !accounts.results || accounts.results.length === 0) {
        console.log(`⚠️  No accounts found for item ${pluggy_id}\n`);
        continue;
      }
      
      const targetAccount = accounts.results.find(account => account.type === type);

      if (!targetAccount) {
        console.log(`⚠️  No ${type} account found in Pluggy\n`);
        continue;
      }

      // Fetch transactions from Pluggy
      const pluggyTransactions = await pluggyClient.fetchTransactions(targetAccount.id, {
        from: fromDate.toISOString().split('T')[0],
        to: toDate.toISOString().split('T')[0],
      });

      console.log(`✅ Pluggy: ${pluggyTransactions.results.length} transactions`);

      // Fetch transactions from YNAB
      const ynabTransactions = await ynabClient.getTransactions(ynab_budget_id, ynab_account_id, fromDate);
      console.log(`✅ YNAB: ${ynabTransactions.length} transactions\n`);

      // Analyze YNAB import_ids
      const nullImportIds = ynabTransactions.filter(t => !t.import_id);
      const validImportIds = ynabTransactions.filter(t => t.import_id);
      
      console.log('📋 YNAB Import ID Analysis:');
      console.log(`   - Transactions with import_id: ${validImportIds.length}`);
      console.log(`   - Transactions with null/undefined import_id: ${nullImportIds.length}`);
      
      if (nullImportIds.length > 0) {
        console.log('\n   ⚠️  Transactions without import_id:');
        nullImportIds.slice(0, 5).forEach(t => {
          console.log(`      - Date: ${t.date}, Amount: ${t.amount}, Payee: ${t.payee_name}`);
        });
        if (nullImportIds.length > 5) {
          console.log(`      ... and ${nullImportIds.length - 5} more`);
        }
      }

      // Create lookup structures
      const ynabImportIdSet = new Set(ynabTransactions.map(t => t.import_id).filter(id => id));
      
      // Normalize amounts for comparison (YNAB uses milliunits)
      const normalizeAmount = (amount: number, isCredit: boolean) => {
        let normalized = Math.round(amount * 1000);
        if (isCredit) {
          normalized = -normalized;
        }
        return normalized;
      };

      // Create date+amount lookup for YNAB
      const ynabDateAmountSet = new Set(
        ynabTransactions.map(t => `${t.date}:${t.amount}`)
      );

      // Analyze Pluggy transactions
      console.log('\n🔍 Pluggy Transaction Analysis:');
      
      const inYnabByImportId: any[] = [];
      const notInYnabByImportId: any[] = [];
      const matchesByDateAmount: any[] = [];

      pluggyTransactions.results.forEach(pt => {
        const normalizedAmount = normalizeAmount(pt.amount, type === 'CREDIT');
        const dateAmountKey = `${new Date(pt.date).toISOString().split('T')[0]}:${normalizedAmount}`;
        
        const hasImportIdMatch = ynabImportIdSet.has(pt.id);
        const hasDateAmountMatch = ynabDateAmountSet.has(dateAmountKey);

        if (hasImportIdMatch) {
          inYnabByImportId.push(pt);
        } else if (hasDateAmountMatch) {
          matchesByDateAmount.push({
            pluggy: pt,
            normalizedAmount,
            dateAmountKey
          });
        } else {
          notInYnabByImportId.push({
            pluggy: pt,
            normalizedAmount,
            dateAmountKey
          });
        }
      });

      console.log(`   - Matched by import_id: ${inYnabByImportId.length}`);
      console.log(`   - Matched by date+amount only: ${matchesByDateAmount.length}`);
      console.log(`   - NOT in YNAB: ${notInYnabByImportId.length}`);

      if (matchesByDateAmount.length > 0) {
        console.log('\n   ⚠️  Transactions matching date+amount but NOT import_id:');
        matchesByDateAmount.slice(0, 5).forEach(item => {
          const pt = item.pluggy;
          console.log(`      - ID: ${pt.id}`);
          console.log(`        Date: ${new Date(pt.date).toISOString().split('T')[0]}`);
          console.log(`        Amount: ${pt.amount} (normalized: ${item.normalizedAmount})`);
          console.log(`        Description: ${pt.description?.substring(0, 60)}`);
        });
        if (matchesByDateAmount.length > 5) {
          console.log(`      ... and ${matchesByDateAmount.length - 5} more`);
        }
      }

      if (notInYnabByImportId.length > 0) {
        console.log('\n   🆕 Transactions NOT found in YNAB (will be synced):');
        notInYnabByImportId.slice(0, 5).forEach(item => {
          const pt = item.pluggy;
          console.log(`      - ID: ${pt.id}`);
          console.log(`        Date: ${new Date(pt.date).toISOString().split('T')[0]}`);
          console.log(`        Amount: ${pt.amount} (normalized: ${item.normalizedAmount})`);
          console.log(`        Description: ${pt.description?.substring(0, 60)}`);
        });
        if (notInYnabByImportId.length > 5) {
          console.log(`      ... and ${notInYnabByImportId.length - 5} more`);
        }
      }

      // Check for potential duplicates in YNAB (same date+amount)
      const ynabDateAmountMap = new Map<string, any[]>();
      ynabTransactions.forEach(t => {
        const key = `${t.date}:${t.amount}`;
        if (!ynabDateAmountMap.has(key)) {
          ynabDateAmountMap.set(key, []);
        }
        ynabDateAmountMap.get(key)!.push(t);
      });

      const duplicates = Array.from(ynabDateAmountMap.entries()).filter(([_, txs]) => txs.length > 1);
      if (duplicates.length > 0) {
        console.log(`\n   ⚠️  Potential duplicates in YNAB (same date+amount): ${duplicates.length} sets`);
        duplicates.slice(0, 3).forEach(([key, txs]) => {
          console.log(`      - ${key}: ${txs.length} transactions`);
          txs.forEach(t => {
            console.log(`        import_id: ${t.import_id || 'NULL'}, payee: ${t.payee_name}`);
          });
        });
      }

    } catch (error: any) {
      console.error(`❌ Error analyzing account ${name}:`, error.message);
      if (error.response) {
        console.error(`   Status: ${error.response.status}`);
        console.error(`   Data:`, JSON.stringify(error.response.data, null, 2));
      }
      if (error.request && !error.response) {
        console.error(`   No response received from API`);
      }
    }

    console.log('\n' + '═'.repeat(80));
  }

  console.log('\n✅ Debug analysis complete\n');
}

debugSync().catch(console.error);

