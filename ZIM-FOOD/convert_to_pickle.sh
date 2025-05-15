#!/bin/bash
# Convert Zimbabwe food composition PDF to pickle file

# Set working directory
WORK_DIR="/Users/georgehove/mommingle-connection-hub/ZIM-FOOD"
cd "$WORK_DIR" || { echo "Error: Could not change to directory $WORK_DIR"; exit 1; }

# Install required packages if needed
echo "Installing required packages..."
pip3 install pdfplumber

# Run the conversion script
echo "Converting PDF to pickle..."
python3 convert_pdf_to_pickle.py

echo "Process completed!"
echo "Full PDF content saved to $WORK_DIR/zim_food_composition_full.pkl"
