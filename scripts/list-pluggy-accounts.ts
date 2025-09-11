import 'dotenv/config';
import { Client } from '../packages/core/src/index';

interface AccountConfig {
  name: string;
  pluggy_id: string;
  ynab_budget_id: string;
  ynab_account_id: string;
  type: 'BANK' | 'CREDIT';
}

async function listAccounts() {
  const clientId = process.env.PLUGGY_CLIENT_ID;
  const clientSecret = process.env.PLUGGY_CLIENT_SECRET;
  const accountConfigStr = process.env.ACCOUNT_CONFIG;
  const itemIdsStr = process.env.PLUGGY_ITEM_IDS;

  if (!clientId || !clientSecret) {
    console.error('PLUGGY_CLIENT_ID and PLUGGY_CLIENT_SECRET must be set in your .env file.');
    console.log('\nTo use this script:');
    console.log('1. Create a .env file with your Pluggy credentials');
    console.log('2. Add: PLUGGY_CLIENT_ID=your_client_id');
    console.log('3. Add: PLUGGY_CLIENT_SECRET=your_client_secret');
    console.log('4. Add either PLUGGY_ITEM_IDS or ACCOUNT_CONFIG');
    return;
  }

  const client = new Client({ clientId, clientSecret });
  let accountConfigs: AccountConfig[] = [];
  let itemIds: string[] = [];

  // Try to get item IDs from PLUGGY_ITEM_IDS (old format)
  if (itemIdsStr) {
    itemIds = itemIdsStr.split(',').map(id => id.trim());
    console.log('📋 Using PLUGGY_ITEM_IDS from environment...');
  }
  
  // Try to get item IDs from ACCOUNT_CONFIG (new format)
  if (accountConfigStr) {
    try {
      accountConfigs = JSON.parse(accountConfigStr);
      console.log('📋 Using ACCOUNT_CONFIG from environment...');
      
      // Extract unique item IDs from account configs
      // We need to make an API call to get the item ID for each account
      // For now, let's assume we can get this from the Pluggy API
      console.log('🔍 Fetching item information for configured accounts...');
      
      // This is a simplified approach - in reality, we'd need to call a different API
      // to get the item ID for each account, or store it in the config
      console.log('⚠️  Note: To get item IDs from ACCOUNT_CONFIG, we need to know the item ID for each account.');
      console.log('   For now, please use PLUGGY_ITEM_IDS or add item_id to your account configs.');
      
    } catch (error) {
      console.error('❌ Failed to parse ACCOUNT_CONFIG JSON:', error.message);
      return;
    }
  }

  if (itemIds.length === 0 && accountConfigs.length === 0) {
    console.log('No PLUGGY_ITEM_IDS or ACCOUNT_CONFIG found in your .env file.');
    console.log('\nAdd one of these to your .env file:');
    console.log('\nOption 1 - Using PLUGGY_ITEM_IDS (old format):');
    console.log('PLUGGY_ITEM_IDS=item_id_1,item_id_2');
    console.log('\nOption 2 - Using ACCOUNT_CONFIG (new format):');
    console.log(`
ACCOUNT_CONFIG='[
  {
    "name": "My Checking Account",
    "pluggy_id": "pluggy_account_id_1",
    "ynab_budget_id": "ynab_budget_id_1",
    "ynab_account_id": "ynab_account_id_1",
    "type": "BANK"
  }
]'`);
    return;
  }

  console.log('🔍 Fetching detailed account information from Pluggy...\n');
  
  // If we have item IDs, use them directly
  if (itemIds.length > 0) {
    for (const itemId of itemIds) {
      try {
        console.log(`📋 Item ID: ${itemId}`);
        console.log('─'.repeat(50));
        
        const accounts = await client.fetchAccounts(itemId);
        
        if (accounts.results.length === 0) {
          console.log('  No accounts found for this item.');
          continue;
        }

        console.log(`\n  Found ${accounts.results.length} accounts in Pluggy:`);
        
        accounts.results.forEach((account, index) => {
          console.log(`\n  Account ${index + 1}:`);
          console.log(`    Name: ${account.name}`);
          console.log(`    ID: ${account.id}`);
          console.log(`    Type: ${account.type}`);
          console.log(`    Balance: ${account.balance || 'N/A'}`);
          console.log(`    Currency: ${account.currencyCode || 'N/A'}`);
          console.log(`    Number: ${account.number || 'N/A'}`);
          
          if (account.bankData) {
            console.log(`    Bank Data:`);
            console.log(`      Transfer Number: ${account.bankData.transferNumber || 'N/A'}`);
            console.log(`      Bank Name: ${account.bankData.bankName || 'N/A'}`);
          }
          
          console.log(`    Pluggy Type: ${account.type}`);
          
          // Check if this account is in our config
          const configMatch = accountConfigs.find(c => c.pluggy_id === account.id);
          if (configMatch) {
            console.log(`    ✅ Configured as: "${configMatch.name}" (${configMatch.type})`);
            console.log(`    YNAB Budget: ${configMatch.ynab_budget_id}`);
            console.log(`    YNAB Account: ${configMatch.ynab_account_id}`);
          } else {
            console.log(`    ⚠️  Not in ACCOUNT_CONFIG`);
          }
        });
        
        console.log('\n' + '═'.repeat(60) + '\n');
        
      } catch (error) {
        console.error(`❌ Error fetching accounts for item ${itemId}:`, error.message);
        console.log('\n' + '═'.repeat(60) + '\n');
      }
    }
  }

  console.log('💡 To add more accounts to your config:');
  console.log('1. Copy the account ID and type from above');
  console.log('2. Add a new entry to your ACCOUNT_CONFIG:');
  console.log(`
  {
    "name": "Your Custom Name",
    "pluggy_id": "account_id_from_above",
    "ynab_budget_id": "your_ynab_budget_id",
    "ynab_account_id": "your_ynab_account_id",
    "type": "BANK|CREDIT"
  }`);
}

listAccounts();

