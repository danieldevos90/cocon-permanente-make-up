#!/usr/bin/env python3
"""
Salonized to WooCommerce CSV Converter

This script converts product data from Salonized CSV format to WooCommerce-compatible CSV format.
It handles Dutch product descriptions, proper field mapping, and groups similar products into variants.

Features:
- Groups similar products (e.g., different colors) into WooCommerce variable products
- Enhanced categorization and subcategorization
- Automatic variant detection based on product names
- Professional Dutch descriptions for PMU products

Usage:
    python salonized_to_woocommerce.py input.csv output.csv
    python salonized_to_woocommerce.py input.csv  # outputs to woocommerce-products-import.csv
    python salonized_to_woocommerce.py input.csv --variants  # enable product variants (default)
    python salonized_to_woocommerce.py input.csv --no-variants  # disable variants, keep as simple products
"""

import csv
import sys
import argparse
import re
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from collections import defaultdict


class SalonizedToWooCommerceConverter:
    """Converts Salonized CSV data to WooCommerce format with variant support"""
    
    # WooCommerce CSV headers for variable products
    WOOCOMMERCE_HEADERS = [
        'Type', 'SKU', 'Name', 'Published', 'Short description', 'Description',
        'Tax status', 'In stock?', 'Stock', 'Regular price', 'Categories',
        'Attribute 1 name', 'Attribute 1 value(s)', 'Attribute 1 visible', 'Attribute 1 global',
        'Weight (unit)', 'Length (unit)', 'Width (unit)', 'Height (unit)', 'Parent'
    ]
    
    # Product grouping patterns - products matching these patterns will be grouped into variants
    VARIANT_PATTERNS = [
        {
            'pattern': r'^Magic 3D eyebrow pencil - (.+)$',
            'base_name': 'Magic 3D eyebrow pencil',
            'attribute_name': 'Kleur',
            'category': 'Opleidingsbenodigdheden > Wenkbrauw Tools'
        },
        {
            'pattern': r'^(.+) naald- 20 stuks$',
            'base_name': 'PMU Naalden - 20 stuks',
            'attribute_name': 'Type',
            'category': 'Opleidingsbenodigdheden > Naalden'
        },
        {
            'pattern': r'^Latex oefenhuid - (.+)$',
            'base_name': 'Latex oefenhuid',
            'attribute_name': 'Type',
            'category': 'Opleidingsbenodigdheden > Oefenmaterialen'
        }
    ]
    
    
    # Enhanced category mapping with subcategories
    CATEGORY_DESCRIPTIONS = {
        'Opleidingsbenodigdheden': {
            'short_prefix': 'Professioneel',
            'long_prefix': 'Hoogwaardig product voor permanente make-up training en professionele behandelingen.',
            'subcategories': {
                'wenkbrauw': 'Wenkbrauw Tools',
                'naald': 'Naalden',
                'oefenhuid': 'Oefenmaterialen',
                'meetlint': 'Meetinstrumenten',
                'folie': 'Hygiëne & Bescherming',
                'schaaltje': 'Instrumenten',
                'apparaat': 'Apparatuur'
            }
        },
        'Overig': {
            'short_prefix': 'Premium',
            'long_prefix': 'Kwalitatief product voor professionele permanente make-up behandelingen.',
            'subcategories': {
                'nano': 'Nano Technologie',
                'zonnestick': 'Nazorg Producten',
                'combinal': 'Wenkbrauw Behandeling'
            }
        }
    }
    
    def __init__(self, enable_variants: bool = True):
        self.enable_variants = enable_variants
        self.products_converted = 0
        self.products_skipped = 0
        self.variant_groups = defaultdict(list)  # Group products by base name
        self.processed_groups = set()  # Track which groups have been processed
    
    def clean_price(self, price_str: str) -> str:
        """Convert Dutch decimal format (comma) to international format (dot)"""
        if not price_str or price_str.strip() == '':
            return '0'
        return price_str.replace(',', '.')
    
    def get_enhanced_category(self, name: str, category: str) -> str:
        """Generate enhanced category with subcategory based on product name"""
        base_category = category
        
        if category in self.CATEGORY_DESCRIPTIONS:
            subcategories = self.CATEGORY_DESCRIPTIONS[category].get('subcategories', {})
            name_lower = name.lower()
            
            # Check for subcategory matches
            for keyword, subcategory in subcategories.items():
                if keyword in name_lower:
                    return f"{base_category} > {subcategory}"
        
        return base_category
    
    def detect_variant_group(self, name: str) -> Optional[Tuple[str, str, str]]:
        """
        Detect if a product belongs to a variant group.
        Returns: (base_name, attribute_name, attribute_value) or None
        """
        if not self.enable_variants:
            return None
            
        for pattern_info in self.VARIANT_PATTERNS:
            match = re.match(pattern_info['pattern'], name)
            if match:
                attribute_value = match.group(1).strip()
                return (
                    pattern_info['base_name'],
                    pattern_info['attribute_name'],
                    attribute_value
                )
        return None
    
    def generate_descriptions(self, name: str, category: str) -> tuple[str, str]:
        """Generate short and long descriptions for a product"""
        if not name or name.strip() == '':
            return '', ''
        
        # Get category-specific prefixes
        cat_info = self.CATEGORY_DESCRIPTIONS.get(category, {
            'short_prefix': 'Professioneel',
            'long_prefix': 'Kwalitatief product voor permanente make-up behandelingen.'
        })
        
        # Generate short description
        short_desc = f"{cat_info['short_prefix']} {name.lower()}"
        if 'permanente make-up' not in short_desc.lower() and 'PMU' not in short_desc:
            short_desc += ' voor permanente make-up'
        
        # Generate long description
        long_desc = f"{cat_info['long_prefix']} "
        
        # Add specific details based on product name
        if 'naald' in name.lower():
            long_desc += 'Steriele naalden voor precieze en hygiënische behandelingen. '
        elif 'potlood' in name.lower() or 'pencil' in name.lower():
            long_desc += 'Ideaal voor het voorschetsen van vormen en correcties. '
        elif 'oefenhuid' in name.lower():
            long_desc += 'Realistische oefenhuid voor het perfectioneren van PMU-technieken. '
        elif 'apparaat' in name.lower():
            long_desc += 'Geavanceerde technologie voor professionele resultaten. '
        elif 'folie' in name.lower():
            long_desc += 'Hygiënische bescherming tijdens behandelingen. '
        
        long_desc += 'Voldoet aan alle professionele kwaliteitseisen.'
        
        return short_desc, long_desc
    
    def create_variable_product(self, base_name: str, products: List[Dict], attribute_name: str) -> Dict[str, str]:
        """Create a variable product (parent) from a group of similar products"""
        # Use the first product as the template
        first_product = products[0]
        
        # Get all attribute values
        attribute_values = []
        for product in products:
            variant_info = self.detect_variant_group(product['name'])
            if variant_info:
                attribute_values.append(variant_info[2])
        
        # Generate descriptions for the base product
        short_desc, long_desc = self.generate_descriptions(base_name, first_product['category'])
        
        # Enhanced category
        enhanced_category = self.get_enhanced_category(base_name, first_product['category'])
        
        return {
            'Type': 'variable',
            'SKU': f"{first_product['salonized_id']}-parent",
            'Name': base_name,
            'Published': '1',
            'Short description': short_desc,
            'Description': long_desc,
            'Tax status': 'taxable',
            'In stock?': '',
            'Stock': '',
            'Regular price': '',
            'Categories': enhanced_category,
            'Attribute 1 name': attribute_name,
            'Attribute 1 value(s)': ' | '.join(attribute_values),
            'Attribute 1 visible': '1',
            'Attribute 1 global': '0',
            'Weight (unit)': '',
            'Length (unit)': '',
            'Width (unit)': '',
            'Height (unit)': '',
            'Parent': ''
        }
    
    def create_variation(self, product: Dict[str, str], parent_sku: str, attribute_name: str, attribute_value: str) -> Dict[str, str]:
        """Create a product variation"""
        # Determine stock status
        stock_qty = product.get('stock', '0')
        try:
            stock_num = int(stock_qty) if stock_qty.strip() else 0
            in_stock = '1' if stock_num > 0 else '0'
        except ValueError:
            stock_num = 0
            in_stock = '0'
        
        return {
            'Type': 'variation',
            'SKU': product['salonized_id'],
            'Name': f"{attribute_name}: {attribute_value}",
            'Published': '1',
            'Short description': '',
            'Description': '',
            'Tax status': 'taxable',
            'In stock?': in_stock,
            'Stock': str(stock_num),
            'Regular price': self.clean_price(product.get('price', '0')),
            'Categories': '',
            'Attribute 1 name': attribute_name,
            'Attribute 1 value(s)': attribute_value,
            'Attribute 1 visible': '0',
            'Attribute 1 global': '0',
            'Weight (unit)': '',
            'Length (unit)': '',
            'Width (unit)': '',
            'Height (unit)': '',
            'Parent': parent_sku
        }
    
    def convert_row(self, row: Dict[str, str]) -> Optional[Dict[str, str]]:
        """Convert a single Salonized row - this method now just validates and stores for grouping"""
        # Handle BOM in CSV files - the first column might have a BOM prefix
        salonized_id_key = 'salonized_id'
        for key in row.keys():
            if key.endswith('salonized_id'):
                salonized_id_key = key
                break
        
        # Skip empty rows - check if salonized_id exists and is not empty
        salonized_id = row.get(salonized_id_key, '').strip()
        if not salonized_id:
            return None
        
        # Skip rows with no name
        name = row.get('name', '').strip()
        if not name:
            return None
        
        # Store the row data for processing
        return {
            'salonized_id': salonized_id,
            'name': name,
            'category': row.get('category', '').strip(),
            'price': row.get('price', '0'),
            'stock': row.get('stock', '0')
        }
    
    def convert_simple_product(self, product: Dict[str, str]) -> Dict[str, str]:
        """Convert a product to a simple WooCommerce product"""
        # Generate descriptions
        short_desc, long_desc = self.generate_descriptions(product['name'], product['category'])
        
        # Enhanced category
        enhanced_category = self.get_enhanced_category(product['name'], product['category'])
        
        # Determine stock status
        stock_qty = product.get('stock', '0')
        try:
            stock_num = int(stock_qty) if stock_qty.strip() else 0
            in_stock = '1' if stock_num > 0 else '0'
        except ValueError:
            stock_num = 0
            in_stock = '0'
        
        return {
            'Type': 'simple',
            'SKU': product['salonized_id'],
            'Name': product['name'],
            'Published': '1',
            'Short description': short_desc,
            'Description': long_desc,
            'Tax status': 'taxable',
            'In stock?': in_stock,
            'Stock': str(stock_num),
            'Regular price': self.clean_price(product['price']),
            'Categories': enhanced_category,
            'Attribute 1 name': '',
            'Attribute 1 value(s)': '',
            'Attribute 1 visible': '',
            'Attribute 1 global': '',
            'Weight (unit)': '',
            'Length (unit)': '',
            'Width (unit)': '',
            'Height (unit)': '',
            'Parent': ''
        }
    
    def convert_csv(self, input_file: Path, output_file: Path) -> None:
        """Convert entire CSV file from Salonized to WooCommerce format with variant support"""
        print(f"Converting {input_file} to {output_file}")
        if self.enable_variants:
            print("Variant grouping: ENABLED")
        else:
            print("Variant grouping: DISABLED")
        
        all_products = []
        
        try:
            # First pass: Read and validate all products
            with open(input_file, 'r', encoding='utf-8') as infile:
                # Detect delimiter (semicolon for Salonized)
                sample = infile.read(1024)
                infile.seek(0)
                delimiter = ';' if ';' in sample else ','
                
                reader = csv.DictReader(infile, delimiter=delimiter)
                
                for row in reader:
                    converted_row = self.convert_row(row)
                    if converted_row:
                        all_products.append(converted_row)
                    else:
                        self.products_skipped += 1
            
            # Second pass: Group products for variants (if enabled)
            if self.enable_variants:
                self._group_products_for_variants(all_products)
            
            # Third pass: Generate output
            with open(output_file, 'w', newline='', encoding='utf-8') as outfile:
                writer = csv.DictWriter(outfile, fieldnames=self.WOOCOMMERCE_HEADERS)
                writer.writeheader()
                
                for product in all_products:
                    variant_info = self.detect_variant_group(product['name'])
                    
                    if variant_info and self.enable_variants:
                        base_name, attribute_name, attribute_value = variant_info
                        
                        # Create variable product (parent) if not already created
                        if base_name not in self.processed_groups:
                            group_products = self.variant_groups[base_name]
                            variable_product = self.create_variable_product(base_name, group_products, attribute_name)
                            writer.writerow(variable_product)
                            self.products_converted += 1
                            
                            # Create all variations for this group
                            for group_product in group_products:
                                group_variant_info = self.detect_variant_group(group_product['name'])
                                if group_variant_info:
                                    variation = self.create_variation(
                                        group_product,
                                        variable_product['SKU'],
                                        group_variant_info[1],
                                        group_variant_info[2]
                                    )
                                    writer.writerow(variation)
                                    self.products_converted += 1
                            
                            self.processed_groups.add(base_name)
                    else:
                        # Create simple product
                        simple_product = self.convert_simple_product(product)
                        writer.writerow(simple_product)
                        self.products_converted += 1
        
        except FileNotFoundError:
            print(f"Error: Input file '{input_file}' not found.")
            sys.exit(1)
        except Exception as e:
            print(f"Error processing file: {e}")
            sys.exit(1)
        
        print(f"Conversion complete!")
        print(f"Products converted: {self.products_converted}")
        print(f"Products skipped: {self.products_skipped}")
        if self.enable_variants:
            print(f"Variant groups created: {len(self.processed_groups)}")
        print(f"Output saved to: {output_file}")
    
    def _group_products_for_variants(self, products: List[Dict[str, str]]) -> None:
        """Group products by their base name for variant creation"""
        for product in products:
            variant_info = self.detect_variant_group(product['name'])
            if variant_info:
                base_name = variant_info[0]
                self.variant_groups[base_name].append(product)


def main():
    """Main function with command-line interface"""
    parser = argparse.ArgumentParser(
        description='Convert Salonized CSV to WooCommerce format with variant support',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python salonized_to_woocommerce.py products.csv
  python salonized_to_woocommerce.py products.csv woocommerce_products.csv
  python salonized_to_woocommerce.py products.csv --variants
  python salonized_to_woocommerce.py products.csv --no-variants
  python salonized_to_woocommerce.py --help

Variant Grouping:
  The script automatically groups similar products into WooCommerce variable products:
  - Magic 3D eyebrow pencils (different colors) → Color variants
  - PMU Naalden (different types) → Type variants  
  - Latex oefenhuid (different types) → Type variants
        """
    )
    
    parser.add_argument('input_file', 
                       help='Input CSV file from Salonized export')
    parser.add_argument('output_file', 
                       nargs='?', 
                       default='woocommerce-products-import.csv',
                       help='Output CSV file for WooCommerce (default: woocommerce-products-import.csv)')
    
    # Variant options
    variant_group = parser.add_mutually_exclusive_group()
    variant_group.add_argument('--variants', 
                              action='store_true', 
                              default=True,
                              help='Enable product variants (default)')
    variant_group.add_argument('--no-variants', 
                              action='store_false', 
                              dest='variants',
                              help='Disable variants, create simple products only')
    
    args = parser.parse_args()
    
    # Validate input file
    input_path = Path(args.input_file)
    if not input_path.exists():
        print(f"Error: Input file '{input_path}' does not exist.")
        sys.exit(1)
    
    # Prepare output file
    output_path = Path(args.output_file)
    
    # Confirm overwrite if output file exists
    if output_path.exists():
        response = input(f"Output file '{output_path}' already exists. Overwrite? (y/N): ")
        if response.lower() != 'y':
            print("Operation cancelled.")
            sys.exit(0)
    
    # Perform conversion
    converter = SalonizedToWooCommerceConverter(enable_variants=args.variants)
    converter.convert_csv(input_path, output_path)


if __name__ == '__main__':
    main()
