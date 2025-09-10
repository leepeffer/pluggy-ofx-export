const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Global variables for credentials
let credentials = null;

// Load credentials from environment
async function loadCredentials() {
    try {
        const clientId = process.env.PLUGGY_CLIENT_ID;
        const clientSecret = process.env.PLUGGY_CLIENT_SECRET;
        const itemIds = process.env.PLUGGY_ITEM_IDS;

        if (clientId && clientSecret && itemIds) {
            credentials = {
                clientId,
                clientSecret,
                itemIds: itemIds.split(',').map(id => id.trim())
            };
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

// API Routes

// Check if credentials exist
app.get('/api/credentials', (req, res) => {
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

        // Update credentials
        credentials = {
            clientId,
            clientSecret,
            itemIds: itemIds.split(',').map(id => id.trim())
        };

        res.json({
            success: true,
            message: 'Credentials saved successfully'
        });
    } catch (error) {
        console.error('Error saving credentials:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save credentials'
        });
    }
});

// Get available accounts (mock data for now)
app.get('/api/accounts', async (req, res) => {
    try {
        if (!credentials) {
            return res.status(400).json({
                success: false,
                message: 'No credentials available. Please configure your API credentials first.'
            });
        }

        // Mock accounts for demonstration
        const mockAccounts = [
            {
                id: 'acc-1',
                name: 'Conta Corrente Itaú',
                type: 'BANK',
                balance: 1500.50,
                currencyCode: 'BRL',
                number: '12345-6',
                bankInfo: {
                    orgName: 'Itaú Unibanco'
                }
            },
            {
                id: 'acc-2',
                name: 'Cartão de Crédito Nubank',
                type: 'CREDIT',
                balance: -250.75,
                currencyCode: 'BRL',
                number: '1713',
                bankInfo: {
                    orgName: 'NuPagamentos'
                }
            },
            {
                id: 'acc-3',
                name: 'Conta Poupança Bradesco',
                type: 'BANK',
                balance: 5000.00,
                currencyCode: 'BRL',
                number: '98765-4',
                bankInfo: {
                    orgName: 'Bradesco'
                }
            }
        ];

        res.json({
            success: true,
            accounts: mockAccounts
        });
    } catch (error) {
        console.error('Error fetching accounts:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch accounts. Please check your credentials and try again.'
        });
    }
});

// Export OFX files (mock implementation)
app.post('/api/export', async (req, res) => {
    try {
        if (!credentials) {
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

        // Generate files in memory for download

        // Mock OFX file generation
        const generatedFiles = [];
        const mockAccounts = [
            { id: 'acc-1', name: 'Conta Corrente Itaú', type: 'BANK' },
            { id: 'acc-2', name: 'Cartão de Crédito Nubank', type: 'CREDIT' },
            { id: 'acc-3', name: 'Conta Poupança Bradesco', type: 'BANK' }
        ];

        for (const accountId of accountIds) {
            const account = mockAccounts.find(acc => acc.id === accountId);
            if (!account) continue;

            let fileName = `${account.name.replace(/[^a-zA-Z0-9]/g, '')}-${account.type.toLowerCase()}-${startDate.replace(/-/g, '')}-${endDate.replace(/-/g, '')}.ofx`;
            
            // Apply custom naming
            if (prefix) {
                fileName = `${prefix}-${fileName}`;
            }
            if (suffix) {
                fileName = fileName.replace('.ofx', `-${suffix}.ofx`);
            }

            // Create mock OFX content
            const mockOFXContent = `OFXHEADER:100
DATA:OFXSGML
VERSION:102
SECURITY:NONE
ENCODING:UTF-8
CHARSET:NONE
COMPRESSION:NONE
OLDFILEUID:NONE
NEWFILEUID:NONE
<OFX>
  <SIGNONMSGSRSV1>
    <SONRS>
      <STATUS>
        <CODE>0</CODE>
        <SEVERITY>INFO</SEVERITY>
      </STATUS>
      <DTSERVER>20240115143022[0:GMT]</DTSERVER>
      <LANGUAGE>POR</LANGUAGE>
      <FI>
        <ORG>${account.name}</ORG>
        <FID>123</FID>
      </FI>
    </SONRS>
  </SIGNONMSGSRSV1>
  <BANKMSGSRSV1>
    <STMTTRNRS>
      <TRNUID>1</TRNUID>
      <STATUS>
        <CODE>0</CODE>
        <SEVERITY>INFO</SEVERITY>
      </STATUS>
      <STMTRS>
        <CURDEF>BRL</CURDEF>
        <BANKACCTFROM>
          <BANKID>123</BANKID>
          <BRANCHID>0001</BRANCHID>
          <ACCTID>123456</ACCTID>
          <ACCTTYPE>CHECKING</ACCTTYPE>
        </BANKACCTFROM>
        <BANKTRANLIST>
          <DTSTART>${startDate.replace(/-/g, '')}000000[0:GMT]</DTSTART>
          <DTEND>${endDate.replace(/-/g, '')}235959[0:GMT]</DTEND>
        </BANKTRANLIST>
      </STMTRS>
    </STMTTRNRS>
  </BANKMSGSRSV1>
</OFX>`;

            generatedFiles.push({
                fileName,
                content: mockOFXContent,
                accountName: account.name,
                accountType: account.type
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
    console.log(`⚠️  Note: This is a demo version with mock data. Real OFX export requires the core package.`);
});

module.exports = app;
