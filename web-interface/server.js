const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;
const archiver = require('archiver');
const dotenv = require('dotenv');

// Dynamic import for the core package
let Client;
(async () => {
    try {
        const coreModule = await import('@pluggy-ofx-export/core');
        Client = coreModule.Client;
    } catch (error) {
        console.error('Error loading core package:', error);
    }
})();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increase body size limit for ZIP files
app.use(express.static(path.join(__dirname)));

// Global variables
let client = null;
let credentials = null;
let accountConfigs = [];

// Load credentials from environment
async function loadCredentials() {
    try {
        const clientId = process.env.PLUGGY_CLIENT_ID;
        const clientSecret = process.env.PLUGGY_CLIENT_SECRET;
        const itemIds = process.env.PLUGGY_ITEM_IDS;
        const accountConfigStr = process.env.ACCOUNT_CONFIG;

        if (clientId && clientSecret && itemIds) {
            credentials = {
                clientId,
                clientSecret,
                itemIds: itemIds.split(',').map(id => id.trim())
            };
            client = new Client(credentials);
            
            if (accountConfigStr) {
                try {
                    accountConfigs = JSON.parse(accountConfigStr);
                    console.log('✅ Account configurations loaded from environment');
                } catch (parseError) {
                    console.log('⚠️ Could not parse ACCOUNT_CONFIG, using defaults');
                    accountConfigs = [];
                }
            }
            
            console.log('✅ Credentials loaded from environment');
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error loading credentials:', error);
        return false;
    }
}

// Initialize credentials on startup
loadCredentials();

// Helper function to save credentials and custom names to .env file
async function saveToEnvFile() {
    const envPath = path.join(__dirname, '..', '.env');
    const envContent = `# Pluggy API Configuration
PLUGGY_CLIENT_ID=${credentials.clientId}
PLUGGY_CLIENT_SECRET=${credentials.clientSecret}
PLUGGY_ITEM_IDS=${credentials.itemIds.join(',')}
YNAB_API_KEY=${process.env.YNAB_API_KEY || ''}

# Account Configuration
ACCOUNT_CONFIG='${JSON.stringify(accountConfigs, null, 2)}'
`;

    try {
        await fs.writeFile(envPath, envContent, 'utf8');
        console.log('✅ Configuration saved to .env file');
        return true;
    } catch (writeError) {
        console.error('Warning: Could not write to .env file:', writeError.message);
        return false;
    }
}

// API Routes

// Check if credentials exist
app.get('/api/credentials', async (req, res) => {
    const envPath = path.join(__dirname, '..', '.env');
    try {
        const envExists = await fs.access(envPath).then(() => true).catch(() => false);
        if (envExists && !credentials) {
            require('dotenv').config({ path: envPath });
            await loadCredentials();
        }
    } catch (error) {}

    res.json({
        hasCredentials: credentials !== null,
        hasClientId: !!process.env.PLUGGY_CLIENT_ID,
        hasClientSecret: !!process.env.PLUGGY_CLIENT_SECRET,
        hasItemIds: !!process.env.PLUGGY_ITEM_IDS
    });
});

// Save credentials (for web interface)
app.post('/api/credentials', async (req, res) => {
    try {
        const { clientId, clientSecret, itemIds } = req.body;

        if (!clientId || !clientSecret || !itemIds) {
            return res.status(400).json({
                success: false,
                message: 'All credential fields are required'
            });
        }

        credentials = {
            clientId,
            clientSecret,
            itemIds: itemIds.split(',').map(id => id.trim())
        };
        client = new Client(credentials);

        await saveToEnvFile();

        res.json({
            success: true,
            message: 'Credentials saved successfully to .env file'
        });
    } catch (error) {
        console.error('Error saving credentials:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save credentials'
        });
    }
});

// Add more item IDs to existing credentials
app.post('/api/credentials/add-items', async (req, res) => {
    try {
        const { newItemIds } = req.body;

        if (!newItemIds) {
            return res.status(400).json({
                success: false,
                message: 'No item IDs provided'
            });
        }

        if (!credentials) {
            return res.status(400).json({
                success: false,
                message: 'No credentials available. Please save credentials first.'
            });
        }

        const newIds = newItemIds.split(',').map(id => id.trim()).filter(id => id);
        
        if (newIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid item IDs provided'
            });
        }

        const existingIds = credentials.itemIds || [];
        const allIds = [...new Set([...existingIds, ...newIds])];

        credentials.itemIds = allIds;
        client = new Client(credentials);

        await saveToEnvFile();

        res.json({
            success: true,
            message: `Added ${newIds.length} new item IDs. Total: ${allIds.length} item IDs.`
        });
    } catch (error) {
        console.error('Error adding item IDs:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add item IDs'
        });
    }
});

// Get custom account names
app.get('/api/account-names', async (req, res) => {
    try {
        const customNames = accountConfigs.reduce((acc, config) => {
            acc[config.pluggy_id] = config.name;
            return acc;
        }, {});
        res.json({
            success: true,
            customNames: customNames
        });
    } catch (error) {
        console.error('Error fetching custom names:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch custom names'
        });
    }
});

// Save custom account name
app.post('/api/account-names', async (req, res) => {
    try {
        const { accountId, customName } = req.body;

        if (!accountId) {
            return res.status(400).json({
                success: false,
                message: 'Account ID is required'
            });
        }

        const accountConfig = accountConfigs.find(c => c.pluggy_id === accountId);
        if (accountConfig) {
            accountConfig.name = customName;
        } else {
            return res.status(404).json({
                success: false,
                message: 'Account not found in ACCOUNT_CONFIG. Please add it to your .env file.'
            });
        }

        await saveToEnvFile();

        res.json({
            success: true,
            message: 'Custom name saved successfully'
        });
    } catch (error) {
        console.error('Error saving custom name:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save custom name'
        });
    }
});

// Get available accounts
app.get('/api/accounts', async (req, res) => {
    try {
        if (!client) {
            return res.status(400).json({
                success: false,
                message: 'No credentials available. Please configure your API credentials first.'
            });
        }

        const allAccounts = [];
        
        for (const itemId of credentials.itemIds) {
            try {
                const accountsResponse = await client.fetchAccounts(itemId);
                const accounts = accountsResponse.results.map(account => {
                    const config = accountConfigs.find(c => c.pluggy_id === account.id);
                    return {
                        id: account.id,
                        name: account.name,
                        customName: config ? config.name : null,
                        displayName: config ? config.name : account.name,
                        type: account.type,
                        balance: account.balance,
                        currencyCode: account.currencyCode,
                        number: account.number,
                        bankInfo: {
                            orgName: account.bankData?.transferNumber ? 
                                account.bankData.transferNumber.split('/')[0] : 
                                account.name
                        }
                    }
                });
                allAccounts.push(...accounts);
            } catch (error) {
                console.error(`Error fetching accounts for item ${itemId}:`, error);
            }
        }

        res.json({
            success: true,
            accounts: allAccounts
        });
    } catch (error) {
        console.error('Error fetching accounts:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch accounts. Please check your credentials and try again.'
        });
    }
});

// Export OFX files
app.post('/api/export', async (req, res) => {
    try {
        if (!client) {
            return res.status(400).json({
                success: false,
                message: 'No credentials available'
            });
        }

        const { accountIds, startDate, endDate, prefix, suffix } = req.body;

        if (!accountIds || accountIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No accounts selected'
            });
        }

        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'Invalid date range'
            });
        }

        const dateStart = new Date(startDate);
        const dateEnd = new Date(endDate);
        const generatedFiles = [];

        const allAccounts = [];
        for (const itemId of credentials.itemIds) {
            try {
                const accountsResponse = await client.fetchAccounts(itemId);
                allAccounts.push(...accountsResponse.results);
            } catch (error) {
                console.error(`Error fetching accounts for item ${itemId}:`, error);
            }
        }

        const selectedAccounts = allAccounts.filter(acc => accountIds.includes(acc.id));

        for (const account of selectedAccounts) {
            try {
                console.log(`Processing account: ${account.name} (${account.id})`);
                
                let accountItemId = null;
                for (const itemId of credentials.itemIds) {
                    try {
                        const accountsResponse = await client.fetchAccounts(itemId);
                        if (accountsResponse.results.some(acc => acc.id === account.id)) {
                            accountItemId = itemId;
                            break;
                        }
                    } catch (error) {
                        console.log(`Error checking item ${itemId} for account ${account.id}:`, error.message);
                    }
                }

                if (!accountItemId) {
                    console.error(`Could not find item ID for account ${account.id} (${account.name})`);
                    continue;
                }

                console.log(`Found item ID ${accountItemId} for account ${account.name}`);

                const ofxFiles = await client.outputOFXFiles(accountItemId, dateStart, dateEnd);
                console.log(`Generated ${ofxFiles.length} OFX files for account ${account.name}`);
                
                const accountFiles = ofxFiles.filter(file => true);

                for (const ofxFile of accountFiles) {
                    let fileName = ofxFile.getSuggestedFileName();
                    
                    const config = accountConfigs.find(c => c.pluggy_id === account.id);
                    const displayName = config ? config.name : account.name;
                    
                    if (prefix) {
                        fileName = `${prefix}-${fileName}`;
                    }
                    if (suffix) {
                        fileName = fileName.replace('.ofx', `-${suffix}.ofx`);
                    }

                    generatedFiles.push({
                        fileName,
                        content: ofxFile.output(),
                        accountName: displayName,
                        accountType: account.type
                    });
                }
            } catch (error) {
                console.error(`Error processing account ${account.id} (${account.name}):`, error);
                console.error(`Error details:`, error.message);
            }
        }

        console.log(`Total files generated: ${generatedFiles.length}`);
        
        if (generatedFiles.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No OFX files were generated. This could be due to no transactions in the selected date range or account processing errors.'
            });
        }

        res.json({
            success: true,
            message: `Successfully generated ${generatedFiles.length} OFX files`,
            files: generatedFiles
        });

    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({
            success: false,
            message: `Export failed: ${error.message}`
        });
    }
});

// Download individual file
app.get('/api/download/:filename', async (req, res) => {
    try {
        const { filename } = req.params;
        res.status(501).json({
            success: false,
            message: 'Individual file download not yet implemented'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Download failed'
        });
    }
});

// Create and download ZIP file
app.post('/api/export/zip', async (req, res) => {
    try {
        const { files } = req.body;

        if (!files || files.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No files provided for ZIP creation'
            });
        }

        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="OFX-Export-${new Date().toISOString().split('T')[0]}.zip"`);

        const archive = archiver('zip', {
            zlib: { level: 9 } 
        });

        archive.on('error', (err) => {
            if (!res.headersSent) {
                res.status(500).json({
                    success: false,
                    message: 'Failed to create ZIP file'
                });
            }
        });

        res.on('error', (err) => {
            console.error('Response error:', err);
        });

        archive.pipe(res);

        files.forEach((file, index) => {
            archive.append(file.content, { name: file.fileName });
        });

        await archive.finalize();

    } catch (error) {
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: 'Failed to create ZIP file'
            });
        }
    }
});

// Serve the HTML interface
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({
        success: false,
        message: 'Internal server error'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Pluggy OFX Exporter server running on http://localhost:${PORT}`);
    console.log(`📁 Open your browser and navigate to the URL above to use the interface`);
});

module.exports = app;