/* ==========================================================================
   images.js  -  product pictures live ONLY in the front-end (folder /images)
   The backend has no image field (ProductDTO = id, name, description, price, stock, categoryId),
   and it does not need one: the cart only stores a product id, and the picture is looked up here by product name.

   To use a real photo: copy it into /images and change the file name on the product's line below.
   Products that are not listed get their category picture, and if there is none, default.svg.
   ========================================================================== */

const IMAGE_FOLDER = '../images/';

// Product name (exactly as in the backend) -> file in /images.
// The pictures below are simple placeholder illustrations that match tools/seed.js
// [LEFT OUT #9] real product photos, or an imageUrl field in the backend so images can be managed by an admin
const PRODUCT_IMAGES = {
    'AeroBook 14': 'aerobook-14.svg',
    'ProStation 16': 'prostation-16.svg',
    'Netbook Mini': 'netbook-mini.svg',
    'Nova X Phone': 'nova-x-phone.svg',
    'Nova Lite Phone': 'nova-lite-phone.svg',
    'Fast Charger 65W': 'fast-charger-65w.svg',
    'Barista Coffee Machine': 'barista-coffee-machine.svg',
    'AirCrisp Fryer': 'aircrisp-fryer.svg',
    'Chef Knife Set': 'chef-knife-set.svg',
    'Software Testing Fundamentals': 'software-testing-fundamentals.svg',
    'Clean Code in Practice': 'clean-code-in-practice.svg',
    'Spring Boot by Example': 'spring-boot-by-example.svg'
};

// Category name -> picture used when the product itself has none
const CATEGORY_IMAGES = {
    'Laptops': 'category-laptops.svg',
    'Phones': 'category-phones.svg',
    'Home & Kitchen': 'category-home-kitchen.svg',
    'Books': 'category-books.svg'
};

const DEFAULT_IMAGE = 'default.svg';

// Returns the path to use in <img src="...">. categoryName is optional (the cart does not know it).
function getProductImage(productName, categoryName) {
    if (PRODUCT_IMAGES[productName]) {
        return IMAGE_FOLDER + PRODUCT_IMAGES[productName];
    }
    if (CATEGORY_IMAGES[categoryName]) {
        return IMAGE_FOLDER + CATEGORY_IMAGES[categoryName];
    }
    return IMAGE_FOLDER + DEFAULT_IMAGE;
}
