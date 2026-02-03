#!/bin/bash
# Start DirectAdmin MCP Server for Cocon Permanente Make-up
# This connects Cursor to DirectAdmin at coconpermanentemakeup.nl

cd "$(dirname "$0")/.directadmin-mcp"
source venv/bin/activate
python main.py
