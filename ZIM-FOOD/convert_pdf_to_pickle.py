#!/usr/bin/env python3
"""
Convert the entire Zimbabwe food composition table PDF into a pickle file.
This script extracts all content from the PDF and saves it as a pickle file.
"""

import os
import pickle
import pdfplumber
from pathlib import Path

# Set the working directory
WORK_DIR = Path("/Users/georgehove/mommingle-connection-hub/ZIM-FOOD")
PDF_PATH = WORK_DIR / "zim_food_omposition_table__1_(1).pdf"
OUTPUT_PATH = WORK_DIR / "zim_food_composition_full.pkl"

def extract_pdf_content():
    """Extract all content from the PDF and save as pickle."""
    print(f"Processing PDF: {PDF_PATH}")
    
    try:
        # Dictionary to store all PDF content
        pdf_content = {
            'metadata': {},
            'pages': []
        }
        
        # Open the PDF
        with pdfplumber.open(PDF_PATH) as pdf:
            # Extract metadata
            pdf_content['metadata'] = {
                'page_count': len(pdf.pages),
                'pdf_info': pdf.metadata
            }
            
            # Process each page
            for i, page in enumerate(pdf.pages):
                page_data = {
                    'page_number': i + 1,
                    'text': page.extract_text(),
                    'tables': page.extract_tables(),
                    'images': [],  # pdfplumber doesn't extract images directly
                    'width': page.width,
                    'height': page.height
                }
                
                # Extract words with their positions
                words = page.extract_words()
                page_data['words'] = words
                
                # Extract lines
                lines = page.lines
                page_data['lines'] = lines
                
                # Extract rectangles
                rects = page.rects
                page_data['rectangles'] = rects
                
                # Extract curves
                curves = page.curves
                page_data['curves'] = curves
                
                # Add page data to the full content
                pdf_content['pages'].append(page_data)
                
                # Print progress
                print(f"Processed page {i+1}/{len(pdf.pages)}")
        
        # Save the entire content as a pickle file
        with open(OUTPUT_PATH, 'wb') as f:
            pickle.dump(pdf_content, f)
        
        print(f"✅ Successfully saved complete PDF content to {OUTPUT_PATH}")
        print(f"Total pages processed: {pdf_content['metadata']['page_count']}")
        
        # Print file size
        file_size = os.path.getsize(OUTPUT_PATH) / (1024 * 1024)  # Convert to MB
        print(f"Pickle file size: {file_size:.2f} MB")
        
    except Exception as e:
        print(f"❌ Error extracting PDF content: {e}")

if __name__ == "__main__":
    extract_pdf_content()
