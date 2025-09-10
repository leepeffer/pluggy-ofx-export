# Pluggy OFX Export - Web Interface

A user-friendly web interface for exporting Brazilian bank transactions to OFX format using the Pluggy API.

## Features

- 🎨 **Modern Web Interface**: Clean, responsive design that works on any device
- 🔑 **Smart Credential Management**: Auto-detects .env credentials or prompts for input
- 📅 **Flexible Date Ranges**: Custom date selection with quick presets
- 🏦 **Selective Account Export**: Choose exactly which accounts to export
- 📝 **Custom File Naming**: Add prefixes and suffixes to your OFX files
- 💾 **Direct Downloads**: Files are automatically downloaded to your browser's Downloads folder
- ⚡ **Real-time Progress**: Visual feedback during export process

## Quick Start

### 1. Install Dependencies

```bash
cd web-interface
npm install
```

### 2. Configure Credentials

**Option A: Use .env file (Recommended)**
```bash
# In the project root directory
cp .env.example .env
# Edit .env with your Pluggy API credentials
```

**Option B: Enter credentials in the web interface**
- The interface will prompt you to enter credentials if none are found in .env

### 3. Start the Server

```bash
npm start
```

### 4. Open in Browser

Navigate to: http://localhost:3001

## Usage Guide

### 1. Credential Setup
- If you have credentials in your .env file, they'll be loaded automatically
- If not, you'll see a form to enter your Pluggy API credentials
- Credentials are stored in memory for the session

### 2. Select Date Range
- Use quick presets: Last 3 Months, Last 6 Months, Last Year
- Or choose a custom date range using the date pickers

### 3. Choose Accounts
- View all available accounts from your Pluggy connections
- Select specific accounts to export
- Use "Select All" or "Select None" for convenience

### 4. Customize File Names
- Add a prefix (e.g., "MyBank") to all file names
- Add a suffix (e.g., "Export") to all file names
- Preview how your files will be named

### 5. Export Files
- Click "Export & Download OFX Files" to start the process
- Watch the progress bar and status messages
- Files will be automatically downloaded to your browser's Downloads folder

## File Downloads

Your OFX files will be automatically downloaded to your browser's default Downloads folder with descriptive names:

```
Downloads/
├── Itau-checking-1234-MyBank-Export-20240101-20240131.ofx
├── NuPagament-cc-MASTERCA-BLACK-1713-MyBank-Export-20240101-20240131.ofx
└── ...
```

## API Endpoints

The web interface uses these REST API endpoints:

- `GET /api/credentials` - Check if credentials exist
- `POST /api/credentials` - Save credentials
- `GET /api/accounts` - List available accounts
- `POST /api/export` - Export OFX files
- `GET /api/download/zip` - Download all files as ZIP

## Development

### Run in Development Mode

```bash
npm run dev
```

This uses nodemon to automatically restart the server when files change.

### Project Structure

```
web-interface/
├── index.html          # Main web interface
├── server.js           # Express backend server
├── package.json        # Dependencies and scripts
└── README.md          # This file
```

## Troubleshooting

### Common Issues

**"No credentials available"**
- Make sure your .env file is in the project root directory
- Check that PLUGGY_CLIENT_ID, PLUGGY_CLIENT_SECRET, and PLUGGY_ITEM_IDS are set
- Or enter credentials directly in the web interface

**"Failed to load accounts"**
- Verify your Pluggy API credentials are correct
- Check that your item IDs are valid and active
- Ensure you have active connections in your Pluggy dashboard

**"Export failed"**
- Check that the export folder path is valid and writable
- Ensure you have sufficient disk space
- Verify your date range is valid

**"Port already in use"**
- Change the PORT environment variable: `PORT=3001 npm start`
- Or kill the process using port 3000

### Getting Help

1. Check the browser console for JavaScript errors
2. Check the server console for backend errors
3. Verify your Pluggy API credentials and connections
4. Ensure all dependencies are installed correctly

## Security Notes

- Credentials entered in the web interface are stored in memory only
- They are not saved to disk or logged anywhere
- The web interface should only be used on trusted networks
- For production use, consider adding authentication

## Browser Compatibility

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

The interface uses modern web APIs and may not work in older browsers.
