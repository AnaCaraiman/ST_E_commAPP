/* tools/seed.js - fills the EMPTY backend with categories and products (the backend has no seed data).

   Run (Node 18+ has fetch built in):   node tools/seed.js
   Another backend address:             API_BASE_URL=http://localhost:9090 node tools/seed.js

   It talks to the same endpoints a future admin page would use (LEFT OUT #6):
     GET /categories, POST /categories, GET /products, POST /products
   Safe to run twice: categories/products that already exist (same name) are skipped.
   With the embedded Mongo run mode (-Pembedded-mongo) the data is lost on every restart, so run it again. */

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8080';

const categories = [
    { name: 'Laptops', description: 'Laptops and notebooks' },
    { name: 'Phones', description: 'Smartphones and accessories' },
    { name: 'Home & Kitchen', description: 'Appliances and kitchen tools' },
    { name: 'Books', description: 'Fiction, non-fiction and textbooks' }
];

// stock values are chosen for testing: 0 (out of stock), 1 and 3 (low stock / boundary), 5 and 6 (the LOW_STOCK_LIMIT edge), large
const products = [
    { name: 'AeroBook 14', category: 'Laptops', price: 3499, stock: 12, description: 'Lightweight 14 inch laptop with 16 GB RAM and a 512 GB SSD, made for students and commuters.' },
    { name: 'ProStation 16', category: 'Laptops', price: 7999, stock: 3, description: 'Powerful 16 inch workstation with a dedicated GPU, for video editing and 3D work.' },
    { name: 'Netbook Mini', category: 'Laptops', price: 1299, stock: 0, description: 'Compact budget laptop for browsing and documents. Currently sold out.' },
    { name: 'Nova X Phone', category: 'Phones', price: 2899, stock: 25, description: '6.5 inch OLED smartphone with a 50 MP camera and two-day battery life.' },
    { name: 'Nova Lite Phone', category: 'Phones', price: 999, stock: 6, description: 'Affordable smartphone with everything you need and a clean Android experience.' },
    { name: 'Fast Charger 65W', category: 'Phones', price: 129, stock: 100, description: 'USB-C charger that fills a phone in under 40 minutes and also charges laptops.' },
    { name: 'Barista Coffee Machine', category: 'Home & Kitchen', price: 1599, stock: 5, description: 'Espresso machine with a milk frother and a removable 1.8 L water tank.' },
    { name: 'AirCrisp Fryer', category: 'Home & Kitchen', price: 499, stock: 40, description: 'Oil-free air fryer with a 4.5 L basket and 8 presets.' },
    { name: 'Chef Knife Set', category: 'Home & Kitchen', price: 249, stock: 1, description: 'Five stainless steel knives with a wooden block. Only one set left.' },
    { name: 'Software Testing Fundamentals', category: 'Books', price: 89, stock: 30, description: 'A practical introduction to unit, integration and system testing, with exercises.' },
    { name: 'Clean Code in Practice', category: 'Books', price: 99, stock: 18, description: 'Readable code, small functions and honest names, explained with real refactorings.' },
    { name: 'Spring Boot by Example', category: 'Books', price: 119, stock: 9, description: 'Build REST APIs with Spring Boot and MongoDB, step by step.' }
];

async function call(method, path, body) {
    const response = await fetch(API_BASE_URL + path, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : {},
        body: body ? JSON.stringify(body) : undefined
    });
    const text = await response.text();
    const data = text ? JSON.parse(text) : null;
    if (!response.ok) {
        throw new Error(`${method} ${path} -> ${response.status} ${data && data.error ? data.error : ''}`);
    }
    return data;
}

async function seed() {
    console.log('Seeding ' + API_BASE_URL + ' ...');

    const existingCategories = await call('GET', '/categories');
    const categoryIds = {};
    existingCategories.forEach(c => { categoryIds[c.name] = c.id; });

    for (const category of categories) {
        if (categoryIds[category.name]) {
            console.log('  category exists : ' + category.name);
            continue;
        }
        const created = await call('POST', '/categories', category);   // BACKEND: CategoryController.createCategory
        categoryIds[created.name] = created.id;
        console.log('  category created: ' + created.name);
    }

    const existingProducts = await call('GET', '/products');
    const existingNames = new Set(existingProducts.map(p => p.name));

    for (const product of products) {
        if (existingNames.has(product.name)) {
            console.log('  product exists  : ' + product.name);
            continue;
        }
        await call('POST', '/products', {                                // BACKEND: ProductController.createProduct
            name: product.name,
            description: product.description,
            price: product.price,
            stock: product.stock,
            categoryId: categoryIds[product.category]
        });
        console.log('  product created : ' + product.name + ' (stock ' + product.stock + ')');
    }

    console.log('Done.');
}

seed().catch(error => {
    console.error('Seeding failed: ' + error.message);
    console.error('Is the backend running on ' + API_BASE_URL + '?');
    process.exit(1);
});
