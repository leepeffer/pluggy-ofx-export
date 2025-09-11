import 'dotenv/config';
import { Client } from '../packages/core/src/index';

interface AccountInfo {
  id: string;
  name: string;
  type: string;
  balance: number | null;
  currencyCode: string | null;
  number: string | null;
  bankData?: {
    transferNumber?: string;
    bankName?: string;
  };
}

async function testAccountDistinction() {
  const clientId = process.env.PLUGGY_CLIENT_ID;
  const clientSecret = process.env.PLUGGY_CLIENT_SECRET;
  const itemIdsStr = process.env.PLUGGY_ITEM_IDS;

  if (!clientId || !clientSecret) {
    console.error('❌ PLUGGY_CLIENT_ID and PLUGGY_CLIENT_SECRET must be set in your .env file.');
    return;
  }

  if (!itemIdsStr) {
    console.error('❌ PLUGGY_ITEM_IDS must be set in your .env file.');
    console.log('Add: PLUGGY_ITEM_IDS=item_id_1,item_id_2');
    return;
  }

  const client = new Client({ clientId, clientSecret });
  const itemIds = itemIdsStr.split(',').map(id => id.trim());

  console.log('🧪 Testing Account Distinction Under Same Item ID\n');
  console.log('This test will help you understand how to distinguish between different accounts (BANK vs CREDIT) under the same item ID.\n');

  for (const itemId of itemIds) {
    try {
      console.log(`📋 Item ID: ${itemId}`);
      console.log('─'.repeat(60));
      
      const accounts = await client.fetchAccounts(itemId);
      
      if (accounts.results.length === 0) {
        console.log('  No accounts found for this item.');
        continue;
      }

      console.log(`\n  Found ${accounts.results.length} accounts under this item ID:`);
      
      const accountGroups: { [key: string]: AccountInfo[] } = {};
      
      // Group accounts by type
      accounts.results.forEach(account => {
        const accountInfo: AccountInfo = {
          id: account.id,
          name: account.name,
          type: account.type,
          balance: account.balance,
          currencyCode: account.currencyCode,
          number: account.number,
          bankData: account.bankData
        };

        if (!accountGroups[account.type]) {
          accountGroups[account.type] = [];
        }
        accountGroups[account.type].push(accountInfo);
      });

      // Display accounts grouped by type
      Object.entries(accountGroups).forEach(([type, accounts]) => {
        console.log(`\n  📊 ${type} Accounts (${accounts.length}):`);
        console.log('  ' + '─'.repeat(40));
        
        accounts.forEach((account, index) => {
          console.log(`\n    Account ${index + 1}:`);
          console.log(`      ID: ${account.id}`);
          console.log(`      Name: ${account.name}`);
          console.log(`      Type: ${account.type}`);
          console.log(`      Balance: ${account.balance || 'N/A'}`);
          console.log(`      Currency: ${account.currencyCode || 'N/A'}`);
          console.log(`      Number: ${account.number || 'N/A'}`);
          
          if (account.bankData) {
            console.log(`      Bank Data:`);
            console.log(`        Transfer Number: ${account.bankData.transferNumber || 'N/A'}`);
            console.log(`        Bank Name: ${account.bankData.bankName || 'N/A'}`);
          }
        });
      });

      // Show how to distinguish accounts
      console.log(`\n  🔍 How to Distinguish Accounts:`);
      console.log('  ' + '─'.repeat(40));
      
      if (accountGroups['BANK'] && accountGroups['CREDIT']) {
        console.log(`    ✅ This item has both BANK and CREDIT accounts`);
        console.log(`    📝 You can distinguish them by:`);
        console.log(`       - Type: ${accountGroups['BANK'].map(a => a.type).join(', ')} vs ${accountGroups['CREDIT'].map(a => a.type).join(', ')}`);
        console.log(`       - Names: ${accountGroups['BANK'].map(a => a.name).join(', ')} vs ${accountGroups['CREDIT'].map(a => a.name).join(', ')}`);
        console.log(`       - Account Numbers: ${accountGroups['BANK'].map(a => a.number || 'N/A').join(', ')} vs ${accountGroups['CREDIT'].map(a => a.number || 'N/A').join(', ')}`);
      } else if (accountGroups['BANK']) {
        console.log(`    ℹ️  This item only has BANK accounts`);
      } else if (accountGroups['CREDIT']) {
        console.log(`    ℹ️  This item only has CREDIT accounts`);
      }

      // Generate sample config
      console.log(`\n  📋 Sample ACCOUNT_CONFIG for this item:`);
      console.log('  ' + '─'.repeat(40));
      console.log('  [');
      
      accounts.results.forEach((account, index) => {
        const isLast = index === accounts.results.length - 1;
        console.log(`    {`);
        console.log(`      "name": "${account.name}",`);
        console.log(`      "pluggy_id": "${account.id}",`);
        console.log(`      "ynab_budget_id": "your_ynab_budget_id",`);
        console.log(`      "ynab_account_id": "your_ynab_account_id",`);
        console.log(`      "type": "${account.type}"`);
        console.log(`    }${isLast ? '' : ','}`);
      });
      
      console.log('  ]');
      
      console.log('\n' + '═'.repeat(80) + '\n');
      
    } catch (error) {
      console.error(`❌ Error fetching accounts for item ${itemId}:`, error.message);
      console.log('\n' + '═'.repeat(80) + '\n');
    }
  }

  console.log('💡 Key Takeaways:');
  console.log('1. Each item ID can contain multiple accounts of different types');
  console.log('2. Use the "type" field to distinguish between BANK and CREDIT accounts');
  console.log('3. Account names and numbers can also help identify specific accounts');
  console.log('4. Each account gets its own entry in ACCOUNT_CONFIG with its unique pluggy_id');
}

testAccountDistinction();
