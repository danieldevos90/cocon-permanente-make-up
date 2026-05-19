#!/bin/bash

# Wait for WordPress to be ready
echo "Waiting for WordPress to be ready..."
sleep 30

# Check if WordPress is already installed
if ! wp core is-installed --allow-root 2>/dev/null; then
    echo "Installing WordPress..."
    wp core install \
        --url="http://localhost:8080" \
        --title="Cocon Permanente Make-up" \
        --admin_user="admin" \
        --admin_password="admin123" \
        --admin_email="admin@cocon.local" \
        --skip-email \
        --allow-root

    echo "WordPress installed successfully!"
else
    echo "WordPress is already installed."
fi

# Activate Divi theme
echo "Activating Divi theme..."
wp theme activate Divi --allow-root

# Install and activate WooCommerce
echo "Installing WooCommerce..."
if ! wp plugin is-installed woocommerce --allow-root; then
    wp plugin install woocommerce --activate --allow-root
else
    wp plugin activate woocommerce --allow-root
fi

# Install and activate Storefront (useful as fallback)
echo "Installing useful plugins..."
wp plugin install wordpress-importer --activate --allow-root
wp plugin install regenerate-thumbnails --activate --allow-root

# Configure WooCommerce basic settings
echo "Configuring WooCommerce..."
wp option update woocommerce_store_address "Voorstraat 123" --allow-root
wp option update woocommerce_store_city "Rotterdam" --allow-root
wp option update woocommerce_default_country "NL" --allow-root
wp option update woocommerce_store_postcode "3011 AB" --allow-root
wp option update woocommerce_currency "EUR" --allow-root
wp option update woocommerce_price_thousand_sep "." --allow-root
wp option update woocommerce_price_decimal_sep "," --allow-root
wp option update woocommerce_price_num_decimals "2" --allow-root

# Create WooCommerce pages if they don't exist
echo "Creating WooCommerce pages..."
wp wc tool run install_pages --user=admin --allow-root

# Import WooCommerce sample products
echo "Importing WooCommerce sample data..."
if ! wp post list --post_type=product --format=count --allow-root | grep -q '^[1-9]'; then
    # Download and import sample products
    wp plugin install woocommerce-sample-data --activate --allow-root 2>/dev/null || true
fi

# Create some custom products for beauty/cosmetics
echo "Creating custom beauty products..."

# Product 1: Microblading Treatment
wp post create --post_type=product --post_title='Microblading Wenkbrauwen' --post_content='Professionele microblading behandeling voor perfecte wenkbrauwen. Duurt ongeveer 2-3 uur inclusief nabehandeling advies.' --post_status=publish --allow-root
PRODUCT_ID=$(wp post list --post_type=product --post_title='Microblading Wenkbrauwen' --field=ID --format=csv --allow-root)
if [ ! -z "$PRODUCT_ID" ]; then
    wp post meta add $PRODUCT_ID _price 350 --allow-root
    wp post meta add $PRODUCT_ID _regular_price 350 --allow-root
    wp post meta add $PRODUCT_ID _virtual yes --allow-root
fi

# Product 2: Permanent Eyeliner
wp post create --post_type=product --post_title='Permanente Eyeliner' --post_content='Zijdezachte eyeliner die jaren meegaat. Perfect voor een natuurlijke of dramatische look.' --post_status=publish --allow-root
PRODUCT_ID=$(wp post list --post_type=product --post_title='Permanente Eyeliner' --field=ID --format=csv --allow-root)
if [ ! -z "$PRODUCT_ID" ]; then
    wp post meta add $PRODUCT_ID _price 275 --allow-root
    wp post meta add $PRODUCT_ID _regular_price 295 --allow-root
    wp post meta add $PRODUCT_ID _sale_price 275 --allow-root
    wp post meta add $PRODUCT_ID _virtual yes --allow-root
fi

# Product 3: Lip Blush
wp post create --post_type=product --post_title='Lip Blush Behandeling' --post_content='Geef je lippen een mooie natuurlijke kleur met onze lip blush techniek.' --post_status=publish --allow-root
PRODUCT_ID=$(wp post list --post_type=product --post_title='Lip Blush Behandeling' --field=ID --format=csv --allow-root)
if [ ! -z "$PRODUCT_ID" ]; then
    wp post meta add $PRODUCT_ID _price 325 --allow-root
    wp post meta add $PRODUCT_ID _regular_price 325 --allow-root
    wp post meta add $PRODUCT_ID _virtual yes --allow-root
fi

# Product 4: Aftercare Product
wp post create --post_type=product --post_title='Aftercare Crème' --post_content='Speciale verzorgingscrème voor na je permanente make-up behandeling. Versnelt de genezing.' --post_status=publish --allow-root
PRODUCT_ID=$(wp post list --post_type=product --post_title='Aftercare Crème' --field=ID --format=csv --allow-root)
if [ ! -z "$PRODUCT_ID" ]; then
    wp post meta add $PRODUCT_ID _price 25 --allow-root
    wp post meta add $PRODUCT_ID _regular_price 25 --allow-root
    wp post meta add $PRODUCT_ID _stock_status instock --allow-root
    wp post meta add $PRODUCT_ID _manage_stock yes --allow-root
    wp post meta add $PRODUCT_ID _stock 50 --allow-root
fi

# Product 5: Touch-up Session
wp post create --post_type=product --post_title='Touch-up Sessie (6-8 weken)' --post_content='Tweede behandeling om je permanente make-up te perfectioneren. Aanbevolen na 6-8 weken.' --post_status=publish --allow-root
PRODUCT_ID=$(wp post list --post_type=product --post_title='Touch-up Sessie (6-8 weken)' --field=ID --format=csv --allow-root)
if [ ! -z "$PRODUCT_ID" ]; then
    wp post meta add $PRODUCT_ID _price 125 --allow-root
    wp post meta add $PRODUCT_ID _regular_price 125 --allow-root
    wp post meta add $PRODUCT_ID _virtual yes --allow-root
fi

# Product 6: Consultation
wp post create --post_type=product --post_title='Gratis Intakegesprek' --post_content='Persoonlijk adviesgesprek om je wensen te bespreken en kleuren uit te kiezen.' --post_status=publish --allow-root
PRODUCT_ID=$(wp post list --post_type=product --post_title='Gratis Intakegesprek' --field=ID --format=csv --allow-root)
if [ ! -z "$PRODUCT_ID" ]; then
    wp post meta add $PRODUCT_ID _price 0 --allow-root
    wp post meta add $PRODUCT_ID _regular_price 0 --allow-root
    wp post meta add $PRODUCT_ID _virtual yes --allow-root
fi

# Create product categories
echo "Creating product categories..."
wp term create product_cat 'Wenkbrauwen' --description='Wenkbrauw behandelingen' --allow-root
wp term create product_cat 'Eyeliner' --description='Eyeliner behandelingen' --allow-root
wp term create product_cat 'Lippen' --description='Lippen behandelingen' --allow-root
wp term create product_cat 'Verzorging' --description='Nazorg producten' --allow-root
wp term create product_cat 'Touch-ups' --description='Opfris behandelingen' --allow-root

# Set permalink structure
echo "Setting permalink structure..."
wp rewrite structure '/%postname%/' --allow-root
wp rewrite flush --allow-root

# Create some sample pages
echo "Creating sample pages..."
wp post create --post_type=page --post_title='Over Ons' --post_content='Welkom bij Cocon Permanente Make-up. Wij zijn gespecialiseerd in permanente make-up behandelingen.' --post_status=publish --allow-root
wp post create --post_type=page --post_title='Contact' --post_content='Neem contact met ons op voor een afspraak of voor meer informatie.' --post_status=publish --allow-root
wp post create --post_type=page --post_title='Veelgestelde Vragen' --post_content='<h2>Wat is permanente make-up?</h2><p>Permanente make-up is een vorm van cosmetische tatoeage...</p>' --post_status=publish --allow-root

# Set homepage
SHOP_PAGE_ID=$(wp post list --post_type=page --name=shop --field=ID --format=csv --allow-root)
if [ ! -z "$SHOP_PAGE_ID" ]; then
    wp option update show_on_front 'page' --allow-root
    wp option update page_on_front $SHOP_PAGE_ID --allow-root
fi

echo "✅ Setup complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 WordPress Site: http://localhost:8080"
echo "🔐 Admin Login: http://localhost:8080/wp-admin"
echo "👤 Username: admin"
echo "🔑 Password: admin123"
echo "🛍️ WooCommerce: Installed & Configured"
echo "🎨 Theme: Divi (Activated)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

