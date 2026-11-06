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
    'HP Laptop': 'hp_laptop.png',
    'HTC Charger': 'charger_1.png',
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
