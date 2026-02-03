#!/bin/bash
# FTP Helper for Cocon Permanente Make-up
# Usage: ./ftp-helper.sh <command> [args]

FTP_HOST="ftp.coconpermanentemakeup.nl"
FTP_USER="altfawesome@coconpermanentemakeup.nl"
FTP_PASS="KzpBtwUcQYEznzphTq8m"
REMOTE_BASE="/domains/coconpermanentemakeup.nl/public_html"
LOCAL_SYNC="/Users/danieldevos/Documents/ALT F AWESOME/cocon-permanente-make-up/cocon-permanente-make-up/Divi"

function ftp_cmd() {
    lftp -u "$FTP_USER,$FTP_PASS" "$FTP_HOST" -e "$1; quit"
}

function show_help() {
    echo "FTP Helper for coconpermanentemakeup.nl"
    echo ""
    echo "Usage: ./ftp-helper.sh <command> [args]"
    echo ""
    echo "Commands:"
    echo "  ls [path]           List files (default: public_html)"
    echo "  get <remote> <local> Download a file"
    echo "  put <local> <remote> Upload a file"
    echo "  cat <remote>        View file contents"
    echo "  sync-down <folder>  Download folder to local"
    echo "  sync-up <folder>    Upload folder to remote"
    echo "  shell               Interactive FTP shell"
    echo ""
    echo "Examples:"
    echo "  ./ftp-helper.sh ls wp-content/themes/Divi"
    echo "  ./ftp-helper.sh get wp-content/themes/Divi/functions.php ./functions.php"
    echo "  ./ftp-helper.sh put ./functions.php wp-content/themes/Divi/functions.php"
    echo "  ./ftp-helper.sh cat wp-content/themes/Divi/style.css"
}

case "$1" in
    ls)
        path="${2:-}"
        ftp_cmd "cd $REMOTE_BASE/$path && ls -la"
        ;;
    get)
        if [ -z "$2" ] || [ -z "$3" ]; then
            echo "Usage: ./ftp-helper.sh get <remote_path> <local_path>"
            exit 1
        fi
        ftp_cmd "get $REMOTE_BASE/$2 -o $3"
        echo "Downloaded: $2 -> $3"
        ;;
    put)
        if [ -z "$2" ] || [ -z "$3" ]; then
            echo "Usage: ./ftp-helper.sh put <local_path> <remote_path>"
            exit 1
        fi
        ftp_cmd "put $2 -o $REMOTE_BASE/$3"
        echo "Uploaded: $2 -> $3"
        ;;
    cat)
        if [ -z "$2" ]; then
            echo "Usage: ./ftp-helper.sh cat <remote_path>"
            exit 1
        fi
        ftp_cmd "cat $REMOTE_BASE/$2"
        ;;
    sync-down)
        if [ -z "$2" ]; then
            echo "Usage: ./ftp-helper.sh sync-down <folder>"
            exit 1
        fi
        mkdir -p "./$2"
        ftp_cmd "mirror $REMOTE_BASE/$2 ./$2"
        echo "Synced down: $2"
        ;;
    sync-up)
        if [ -z "$2" ]; then
            echo "Usage: ./ftp-helper.sh sync-up <folder>"
            exit 1
        fi
        ftp_cmd "mirror -R ./$2 $REMOTE_BASE/$2"
        echo "Synced up: $2"
        ;;
    shell)
        lftp -u "$FTP_USER,$FTP_PASS" "$FTP_HOST" -e "cd $REMOTE_BASE"
        ;;
    *)
        show_help
        ;;
esac
