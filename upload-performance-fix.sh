#!/bin/bash

# Scroll Performance Fix - FTP Upload Script
# This script uploads the performance optimization files to your live server

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}==============================================
Scroll Performance Fix - Upload Script
==============================================${NC}\n"

# Check if FTP credentials file exists
if [ ! -f "ftp.md" ]; then
    echo -e "${RED}Error: ftp.md file not found!${NC}"
    echo "Please create ftp.md with your FTP credentials first."
    exit 1
fi

# Read FTP credentials from ftp.md
echo -e "${YELLOW}Reading FTP credentials from ftp.md...${NC}"

# You'll need to manually set these based on your ftp.md file
FTP_HOST="your-ftp-host.com"
FTP_USER="your-username"
FTP_PASS="your-password"
FTP_REMOTE_DIR="/wp-content/themes/Divi"

echo -e "\n${YELLOW}WARNING:${NC} This script will upload files to your live server."
echo -e "Files to be uploaded:"
echo "  1. Divi/js/scroll-performance-fix.js (NEW)"
echo "  2. Divi/css/scroll-performance.css (NEW)"
echo "  3. Divi/functions.php (MODIFIED)"
echo ""
read -p "Do you want to continue? (yes/no): " -r
echo

if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]
then
    echo -e "${YELLOW}Upload cancelled.${NC}"
    exit 1
fi

# Create backup of functions.php on server first
echo -e "${GREEN}Step 1: Creating backup of functions.php...${NC}"
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)

# Note: This requires lftp to be installed
# On Mac: brew install lftp
# On Ubuntu: sudo apt-get install lftp

if ! command -v lftp &> /dev/null
then
    echo -e "${YELLOW}lftp is not installed.${NC}"
    echo "You'll need to manually backup functions.php via FTP client."
    echo ""
    read -p "Have you backed up functions.php manually? (yes/no): " -r
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]
    then
        echo -e "${RED}Please backup functions.php first!${NC}"
        exit 1
    fi
else
    echo "Creating backup: functions.php.backup-$BACKUP_DATE"
    # Uncomment and configure this if you have lftp installed
    # lftp -c "open -u $FTP_USER,$FTP_PASS $FTP_HOST; cd $FTP_REMOTE_DIR; mv functions.php functions.php.backup-$BACKUP_DATE"
fi

echo -e "\n${GREEN}Step 2: Uploading new files...${NC}"

# Check if files exist locally
if [ ! -f "Divi/js/scroll-performance-fix.js" ]; then
    echo -e "${RED}Error: scroll-performance-fix.js not found!${NC}"
    exit 1
fi

if [ ! -f "Divi/css/scroll-performance.css" ]; then
    echo -e "${RED}Error: scroll-performance.css not found!${NC}"
    exit 1
fi

if [ ! -f "Divi/functions.php" ]; then
    echo -e "${RED}Error: functions.php not found!${NC}"
    exit 1
fi

echo -e "\n${YELLOW}MANUAL UPLOAD REQUIRED:${NC}"
echo "This script cannot automatically upload files without FTP credentials."
echo ""
echo "Please manually upload these files via your FTP client:"
echo ""
echo "  FROM LOCAL                              TO REMOTE"
echo "  ---------------------------------------- ----------------------------------------"
echo "  Divi/js/scroll-performance-fix.js    -> ${FTP_REMOTE_DIR}/js/scroll-performance-fix.js"
echo "  Divi/css/scroll-performance.css      -> ${FTP_REMOTE_DIR}/css/scroll-performance.css"
echo "  Divi/functions.php                   -> ${FTP_REMOTE_DIR}/functions.php"
echo ""
echo -e "${YELLOW}After uploading, remember to:${NC}"
echo "  1. Clear WordPress cache"
echo "  2. Clear Divi cache (Theme Options → Builder → Advanced)"
echo "  3. Clear browser cache (Ctrl+Shift+R)"
echo "  4. Test the website"
echo ""
echo -e "${GREEN}For detailed instructions, see: SCROLL-PERFORMANCE-FIX.md${NC}"

# Alternative: If you want to use lftp for automated upload (requires setup):
# Uncomment and configure these lines after setting FTP credentials above:
#
# lftp -c "
# open -u $FTP_USER,$FTP_PASS $FTP_HOST
# cd $FTP_REMOTE_DIR
# mkdir -p js css
# put Divi/js/scroll-performance-fix.js -o js/scroll-performance-fix.js
# put Divi/css/scroll-performance.css -o css/scroll-performance.css
# put Divi/functions.php -o functions.php
# bye
# "

echo ""
echo -e "${GREEN}==============================================
Script Complete
==============================================${NC}"

