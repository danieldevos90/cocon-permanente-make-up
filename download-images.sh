#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  Downloading Images from Live Site${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# FTP Credentials
FTP_HOST="ftp.coconpermanentemakeup.nl"
FTP_USER="altfawesome@coconpermanentemakeup.nl"
FTP_PASS="10Aspe6ra!d4n"
FTP_PATH="/home/coconper/domains/coconpermanentemakeup.nl/public_html/wp-content/uploads"

# Check if lftp is installed
if ! command -v lftp &> /dev/null; then
    echo -e "${YELLOW}lftp is not installed. Installing it now...${NC}"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew install lftp
        else
            echo -e "${YELLOW}Please install Homebrew first: https://brew.sh${NC}"
            echo "Then run: brew install lftp"
            exit 1
        fi
    else
        # Linux
        sudo apt-get update && sudo apt-get install -y lftp
    fi
fi

echo -e "${GREEN}✓ Connecting to FTP server...${NC}"

# Create temporary directory for downloads
mkdir -p ./temp-downloads

# Download uploads folder using lftp
echo -e "${GREEN}✓ Downloading wp-content/uploads folder...${NC}"
echo -e "${YELLOW}  This may take several minutes depending on file size...${NC}"
echo ""

lftp -c "
open ftp://${FTP_USER}:${FTP_PASS}@${FTP_HOST};
set ssl:verify-certificate no;
mirror --verbose --parallel=4 ${FTP_PATH} ./temp-downloads/uploads;
bye
"

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓ Download complete!${NC}"
    
    # Check download size
    DOWNLOAD_SIZE=$(du -sh ./temp-downloads/uploads | cut -f1)
    echo -e "${GREEN}✓ Downloaded: ${DOWNLOAD_SIZE}${NC}"
    
    # Copy to Docker container
    echo -e "${GREEN}✓ Copying files to Docker container...${NC}"
    docker cp ./temp-downloads/uploads cocon_wordpress:/var/www/html/wp-content/
    
    # Fix permissions
    echo -e "${GREEN}✓ Fixing permissions...${NC}"
    docker exec cocon_wordpress chown -R www-data:www-data /var/www/html/wp-content/uploads
    docker exec cocon_wordpress chmod -R 755 /var/www/html/wp-content/uploads
    
    # Clear WordPress cache
    echo -e "${GREEN}✓ Clearing WordPress cache...${NC}"
    docker exec cocon_wp_cli wp cache flush --allow-root 2>/dev/null
    
    # Clean up temporary files
    echo -e "${GREEN}✓ Cleaning up...${NC}"
    rm -rf ./temp-downloads
    
    echo ""
    echo -e "${BLUE}================================================${NC}"
    echo -e "${GREEN}✓ SUCCESS! Images have been imported.${NC}"
    echo -e "${BLUE}================================================${NC}"
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo "1. Refresh your browser: http://localhost:8080"
    echo "2. Hard refresh if needed: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)"
    echo ""
else
    echo ""
    echo -e "${YELLOW}⚠ Download failed. Please check your internet connection.${NC}"
    echo -e "${YELLOW}  You can also download manually via FTP client:${NC}"
    echo -e "  Host: ${FTP_HOST}"
    echo -e "  User: ${FTP_USER}"
    echo -e "  Path: ${FTP_PATH}"
    echo ""
    exit 1
fi

