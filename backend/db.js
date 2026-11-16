const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(__dirname, 'ecommerce.db');
const usesTurso = Boolean(process.env.TURSO_DATABASE_URL);
if (process.env.VERCEL && !usesTurso) {
  throw new Error('TURSO_DATABASE_URL is required when running the backend on Vercel.');
}
const sqlite3 = usesTurso ? null : require('sqlite3').verbose();
const turso = usesTurso
  ? require('@libsql/client/web').createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN
    })
  : null;
const db = turso || new sqlite3.Database(dbPath);

const run = (sql, params = []) => {
  if (turso) {
    return turso.execute({ sql, args: params }).then((result) => ({
      id: Number(result.lastInsertRowid || 0),
      changes: result.rowsAffected
    }));
  }
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

const get = (sql, params = []) => {
  if (turso) {
    return turso.execute({ sql, args: params }).then((result) => result.rows[0] || undefined);
  }
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
};

const all = (sql, params = []) => {
  if (turso) {
    return turso.execute({ sql, args: params }).then((result) => result.rows);
  }
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
};

const initDb = async (forceReset = false) => {
  await run('PRAGMA foreign_keys = ON');

  if (forceReset) {
    await run('DROP TABLE IF EXISTS payments');
    await run('DROP TABLE IF EXISTS order_items');
    await run('DROP TABLE IF EXISTS orders');
    await run('DROP TABLE IF EXISTS cart_items');
    await run('DROP TABLE IF EXISTS products');
    await run('DROP TABLE IF EXISTS categories');
    await run('DROP TABLE IF EXISTS user_devices');
    await run('DROP TABLE IF EXISTS users');
  }

  // Users Table
  await run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT NOT NULL,
      county TEXT DEFAULT 'Nairobi',
      estate TEXT DEFAULT 'Kilimani',
      password_hash TEXT NOT NULL,
      avatar_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // User Devices Table (Multi-Device Shopping & Cross-Device Sync)
  await run(`
    CREATE TABLE IF NOT EXISTS user_devices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      device_id TEXT NOT NULL,
      device_name TEXT NOT NULL,
      device_type TEXT DEFAULT 'desktop',
      browser TEXT,
      os TEXT,
      ip_address TEXT,
      last_active DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, device_id)
    )
  `);

  // Categories Table
  await run(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      icon TEXT,
      description TEXT
    )
  `);

  // Products Table
  await run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL REFERENCES categories(id),
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      brand TEXT NOT NULL,
      description TEXT NOT NULL,
      price REAL NOT NULL,
      original_price REAL,
      rating REAL DEFAULT 4.8,
      review_count INTEGER DEFAULT 0,
      stock INTEGER DEFAULT 15,
      image_url TEXT NOT NULL,
      is_featured INTEGER DEFAULT 0,
      kebs_certified INTEGER DEFAULT 1,
      specs TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Cart Items Table (Database-backed for multi-device synchronization)
  await run(`
    CREATE TABLE IF NOT EXISTS cart_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      quantity INTEGER NOT NULL DEFAULT 1,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, product_id)
    )
  `);

  // Orders Table
  await run(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL REFERENCES users(id),
      device_name TEXT,
      subtotal REAL NOT NULL,
      shipping_fee REAL NOT NULL DEFAULT 0,
      tax REAL NOT NULL DEFAULT 0,
      total_amount REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      shipping_name TEXT NOT NULL,
      shipping_phone TEXT NOT NULL,
      shipping_county TEXT NOT NULL,
      shipping_estate TEXT NOT NULL,
      shipping_address TEXT NOT NULL,
      payment_method TEXT DEFAULT 'mpesa',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Order Items Table
  await run(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id),
      title TEXT NOT NULL,
      price REAL NOT NULL,
      quantity INTEGER NOT NULL,
      image_url TEXT
    )
  `);

  // Payments Table (Lipa Na M-Pesa & Daraja)
  await run(`
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL REFERENCES orders(id),
      user_id INTEGER NOT NULL REFERENCES users(id),
      phone TEXT NOT NULL,
      amount REAL NOT NULL,
      mpesa_ref TEXT,
      checkout_request_id TEXT,
      merchant_request_id TEXT,
      status TEXT DEFAULT 'pending',
      result_code INTEGER,
      result_desc TEXT,
      simulated INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME
    )
  `);

  const catCount = await get('SELECT COUNT(*) as count FROM categories');
  if (catCount.count === 0) {
    console.log('Seeding authentic Kenyan categories & catalogue for SokoBora...');

    const categories = [
      { name: 'Smartphones & Mobile', slug: 'smartphones', icon: 'Smartphone', description: 'Flagships, dual SIM devices, and Safaricom 5G certified phones' },
      { name: 'Laptops & Computing', slug: 'laptops', icon: 'Laptop', description: 'High-performance MacBooks, coder workstations, and corporate laptops' },
      { name: 'Audio & Wearables', slug: 'audio', icon: 'Headphones', description: 'Noise-canceling headphones, Oraimo HavyBass earbuds, and smartwatches' },
      { name: 'Kenyan Fashion & Footwear', slug: 'fashion', icon: 'Shirt', description: 'Original Bata Safari Boots, Narok Maasai beadwork, and Nairobi streetwear' },
      { name: 'Home & Living', slug: 'home', icon: 'Home', description: 'Starlink Kenya satellite kits, Ramtons appliances, and Mount Kenya AA coffee' }
    ];

    for (const cat of categories) {
      await run(
        'INSERT INTO categories (name, slug, icon, description) VALUES (?, ?, ?, ?)',
        [cat.name, cat.slug, cat.icon, cat.description]
      );
    }

    const catRows = await all('SELECT id, slug FROM categories');
    const catMap = {};
    catRows.forEach(c => { catMap[c.slug] = c.id; });

    const products = [
      {
        category_id: catMap['smartphones'],
        title: 'Apple iPhone 15 Pro Max (256GB - Natural Titanium, Safaricom 5G Certified)',
        slug: 'apple-iphone-15-pro-max-kenya',
        brand: 'Apple',
        description: 'Official East Africa Apple model with A17 Pro chip, 48MP main camera, USB-C speeds, and certified for Safaricom 5G and Airtel Kenya VoLTE networks.',
        price: 185000,
        original_price: 198000,
        rating: 4.95,
        review_count: 92,
        stock: 12,
        image_url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80',
        is_featured: 1,
        kebs_certified: 1,
        specs: JSON.stringify({ 'Carrier Compatibility': 'Safaricom 5G / Airtel 5G / Telkom 4G', 'Warranty': '1 Year Apple East Africa Official Warranty', 'Storage': '256GB NVMe', 'Display': '6.7" Super Retina XDR 120Hz', 'Origin': 'KEBS Import Approved' })
      },
      {
        category_id: catMap['smartphones'],
        title: 'Samsung Galaxy S24 Ultra (512GB - Titanium Gray, Dual SIM East Africa Edition)',
        slug: 'samsung-galaxy-s24-ultra-kenya',
        brand: 'Samsung',
        description: 'Galaxy AI flagship with 200MP camera, 100x Space Zoom, titanium frame, built-in S Pen, and 2-year Samsung East Africa Care warranty.',
        price: 172000,
        original_price: 184000,
        rating: 4.88,
        review_count: 76,
        stock: 14,
        image_url: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&w=800&q=80',
        is_featured: 1,
        kebs_certified: 1,
        specs: JSON.stringify({ 'Warranty': '24 Months Samsung East Africa Warranty', 'SIM Configuration': 'Dual Nano-SIM + eSIM', 'Processor': 'Snapdragon 8 Gen 3 for Galaxy', 'Display': '6.8" Dynamic AMOLED 2X 2600 nits' })
      },
      {
        category_id: catMap['smartphones'],
        title: 'Tecno Camon 30 Premier 5G (512GB, 12GB RAM - Polar Night)',
        slug: 'tecno-camon-30-premier-kenya',
        brand: 'Tecno',
        description: 'Kenyan favorite portrait flagship with Sony IMX890 triple 50MP periscope cameras, MediaTek Dimensity 8200 Ultimate 5G chip, and 70W Ultra Charge.',
        price: 49500,
        original_price: 54000,
        rating: 4.8,
        review_count: 140,
        stock: 25,
        image_url: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=80',
        is_featured: 1,
        kebs_certified: 1,
        specs: JSON.stringify({ 'Local Service': 'Carlcare Kenya Official Service Centers', 'RAM': '12GB + 12GB Extended RAM', 'Storage': '512GB UFS 3.1', 'Battery': '5000mAh with 70W Fast Charge' })
      },
      {
        category_id: catMap['laptops'],
        title: 'Apple MacBook Pro 16" M3 Max (36GB RAM, 1TB SSD - Space Black)',
        slug: 'apple-macbook-pro-16-m3-max-kenya',
        brand: 'Apple',
        description: 'The definitive machine for Nairobi software engineers, fintech developers, and digital creators. Liquid Retina XDR display with up to 22 hours battery life.',
        price: 435000,
        original_price: 465000,
        rating: 4.98,
        review_count: 54,
        stock: 7,
        image_url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
        is_featured: 1,
        kebs_certified: 1,
        specs: JSON.stringify({ 'Chipset': 'Apple M3 Max 14-core CPU / 30-core GPU', 'Memory': '36GB Unified RAM', 'Battery': 'Up to 22 Hours (All-Day Work)', 'Plug': 'UK 3-pin Plug (Standard Kenya 240V)' })
      },
      {
        category_id: catMap['laptops'],
        title: 'HP Pavilion 15 Core i7 13th Gen (16GB RAM, 512GB SSD - Natural Silver)',
        slug: 'hp-pavilion-15-nairobi-edition',
        brand: 'HP',
        description: 'Popular university student and corporate laptop across Nairobi. 13th Gen Intel Core i7, backlit keyboard, FHD micro-edge display, and genuine Windows 11 Pro.',
        price: 89000,
        original_price: 98000,
        rating: 4.75,
        review_count: 65,
        stock: 18,
        image_url: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=800&q=80',
        is_featured: 0,
        kebs_certified: 1,
        specs: JSON.stringify({ 'Processor': 'Intel Core i7-1355U Turbo 5.0GHz', 'Audio': 'B&O Dual Speakers', 'Battery': 'HP Fast Charge (50% in 45 mins)', 'Warranty': '1 Year HP Kenya On-Site' })
      },
      {
        category_id: catMap['audio'],
        title: 'Sony WH-1000XM5 Wireless Noise-Cancelling Headphones (Silver)',
        slug: 'sony-wh-1000xm5-headphones-kenya',
        brand: 'Sony',
        description: 'Block out Nairobi traffic noise with industry-leading active noise cancellation. 30 hours of continuous music playback and crystal-clear voice calling.',
        price: 49500,
        original_price: 55000,
        rating: 4.9,
        review_count: 110,
        stock: 20,
        image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
        is_featured: 1,
        kebs_certified: 1,
        specs: JSON.stringify({ 'Noise Cancellation': 'Dual HD Noise Cancelling Processor QN1', 'Fast Charge': '3 mins gives 3 hrs playback', 'Weight': '250 grams ultra-light', 'Audio Codec': 'LDAC, AAC, SBC' })
      },
      {
        category_id: catMap['audio'],
        title: 'Oraimo FreePods 4 Pro Wireless ANC Earbuds (HavyBass Sound)',
        slug: 'oraimo-freepods-4-pro-kenya',
        brand: 'Oraimo',
        description: 'Kenya’s bestselling wireless earbuds. 30dB active noise cancellation, punchy HavyBass tuned for Afrobeats and Gengetone, and 35.5 hours total battery life.',
        price: 6500,
        original_price: 7800,
        rating: 4.85,
        review_count: 320,
        stock: 45,
        image_url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80',
        is_featured: 1,
        kebs_certified: 1,
        specs: JSON.stringify({ 'Tuning': 'Signature Oraimo HavyBass Algorithm', 'Battery Life': '35.5 Hours total with charging case', 'Water Resistance': 'IPX5 Sweat & Dust Proof', 'Warranty': '365 Days Replacement Guarantee' })
      },
      {
        category_id: catMap['fashion'],
        title: 'Original Bata Safari Boots (Handmade Genuine Suede - Kenya Heritage)',
        slug: 'original-bata-safari-boots-kenya',
        brand: 'Bata Kenya',
        description: 'The legendary boot born in Limuru, Kenya. Crafted from genuine Kenyan suede leather with natural crepe rubber soles. Timeless, durable, and effortlessly stylish.',
        price: 6800,
        original_price: 7500,
        rating: 4.95,
        review_count: 215,
        stock: 30,
        image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
        is_featured: 1,
        kebs_certified: 1,
        specs: JSON.stringify({ 'Craftsmanship': 'Handmade in Limuru, Kenya', 'Upper Material': '100% Genuine Kenyan Calf Suede', 'Sole': 'Natural Vulcanized Crepe Rubber', 'Origin': 'Authentic Kenyan Heritage' })
      },
      {
        category_id: catMap['fashion'],
        title: 'Authentic Maasai Beaded Leather Belt (Narok Artisan Guild)',
        slug: 'maasai-beaded-leather-belt',
        brand: 'Narok Artisans',
        description: 'Hand-stitched glass beads on durable Kenyan cowhide leather, crafted by Maasai women artisans in Narok County. Solid brass buckle with traditional geometric motifs.',
        price: 4500,
        original_price: 5200,
        rating: 4.92,
        review_count: 88,
        stock: 22,
        image_url: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80',
        is_featured: 0,
        kebs_certified: 1,
        specs: JSON.stringify({ 'Origin': 'Narok County, Kenya', 'Material': 'Vegetable-Tanned Cowhide & Czech Glass Beads', 'Hardware': 'Solid Cast Brass Buckle', 'Impact': '10% proceeds support Maasai Girls Education' })
      },
      {
        category_id: catMap['fashion'],
        title: 'Nairobi Shujaa Heavyweight Streetwear Hoodie (Black / Gold Crest)',
        slug: 'nairobi-shujaa-streetwear-hoodie',
        brand: 'Nairobi Wear',
        description: 'Designed in Nairobi for chilly July mornings. 450 GSM ultra-heavy French Terry cotton with gold embroidered Kenya Shujaa emblem.',
        price: 5200,
        original_price: 6000,
        rating: 4.86,
        review_count: 94,
        stock: 28,
        image_url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80',
        is_featured: 0,
        kebs_certified: 1,
        specs: JSON.stringify({ 'Fabric': '450 GSM 100% Combed Cotton', 'Embroidery': 'High-Density Metallic Gold Thread', 'Fit': 'Oversized Nairobi Streetwear Fit', 'Care': 'Machine wash cold' })
      },
      {
        category_id: catMap['home'],
        title: 'Starlink Standard Satellite Internet Kit (Safaricom / Kenya Approved)',
        slug: 'starlink-standard-satellite-kit-kenya',
        brand: 'Starlink',
        description: 'High-speed, low-latency satellite broadband anywhere in Kenya — from Nairobi to Turkana, Naivasha, and Diani. Easy self-install dish with Wi-Fi 6 router.',
        price: 45000,
        original_price: 49000,
        rating: 4.94,
        review_count: 73,
        stock: 15,
        image_url: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80',
        is_featured: 1,
        kebs_certified: 1,
        specs: JSON.stringify({ 'Speeds': '150 - 250 Mbps Download', 'Coverage': 'Entire 47 Counties of Kenya', 'Router': 'Wi-Fi 6 Dual Band 3x3 MIMO', 'Weather Rating': 'IP67 Snow/Rain/Dust Resistant' })
      },
      {
        category_id: catMap['home'],
        title: 'Ramtons 4-Gas Cooker with Electric Oven & Rotisserie (Stainless Steel)',
        slug: 'ramtons-4-gas-cooker-kenya',
        brand: 'Ramtons Kenya',
        description: 'The quintessential Kenyan kitchen centerpiece. 4 high-efficiency gas burners, electric oven with grill, rotisserie spit, and safety auto-ignition.',
        price: 39999,
        original_price: 44500,
        rating: 4.8,
        review_count: 51,
        stock: 10,
        image_url: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?auto=format&fit=crop&w=800&q=80',
        is_featured: 0,
        kebs_certified: 1,
        specs: JSON.stringify({ 'Burners': '4 European Gas Burners', 'Oven Capacity': '60 Litres with Rotisserie', 'Body': 'Full Stainless Steel with Glass Lid', 'Warranty': '1 Year Ramtons Kenya Warranty' })
      },
      {
        category_id: catMap['home'],
        title: 'Single-Origin Nyeri Hill Estate AA Kenyan Arabica Coffee (1kg Whole Bean)',
        slug: 'nyeri-hill-estate-aa-coffee-1kg',
        brand: 'Nyeri Hill Estate',
        description: 'Award-winning volcanic high-altitude Arabica coffee harvested on the slopes of Mount Kenya. Complex blackcurrant and citrus notes with a rich body.',
        price: 2800,
        original_price: 3400,
        rating: 4.96,
        review_count: 165,
        stock: 40,
        image_url: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=800&q=80',
        is_featured: 1,
        kebs_certified: 1,
        specs: JSON.stringify({ 'Grade': 'Kenya AA (Screen Size 17/18)', 'Altitude': '1,900 - 2,100 Meters ASL', 'Roast Profile': 'Medium City Roast', 'Certification': 'Rainforest Alliance & KEBS Certified' })
      }
    ];

    for (const p of products) {
      await run(
        `INSERT INTO products (category_id, title, slug, brand, description, price, original_price, rating, review_count, stock, image_url, is_featured, kebs_certified, specs)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [p.category_id, p.title, p.slug, p.brand, p.description, p.price, p.original_price, p.rating, p.review_count, p.stock, p.image_url, p.is_featured, p.kebs_certified, p.specs]
      );
    }
  }

  // Affordable sample items for illustrating small M-PESA purchases.
  await run(
    'INSERT OR IGNORE INTO categories (name, slug, icon, description) VALUES (?, ?, ?, ?)',
    ['Everyday Finds', 'everyday-finds', 'ShoppingBag', 'Small useful finds under KSh 100']
  );
  const everydayCategory = await get('SELECT id FROM categories WHERE slug = ?', ['everyday-finds']);
  const affordableProducts = [
    {
      title: 'Pocket Phone Stand', slug: 'pocket-phone-stand', brand: 'SokoBora Finds',
      description: 'A compact foldable stand for hands-free calls and videos, at home or on the go.',
      price: 80, rating: 4.8, review_count: 18, stock: 40,
      image_url: 'https://images.unsplash.com/photo-1698314440355-eaf5ff14899c?auto=format&fit=crop&w=800&q=80',
      specs: JSON.stringify({ 'Style': 'Foldable', 'Use': 'Phones and small tablets' })
    },
    {
      title: 'Braided USB-C Cable Clip', slug: 'braided-usb-c-cable-clip', brand: 'SokoBora Finds',
      description: 'Keep charging cables tidy with a reusable clip sized for everyday carry.',
      price: 50, rating: 4.7, review_count: 12, stock: 55,
      image_url: 'https://images.unsplash.com/photo-1760348213270-7cd00b8c3405?auto=format&fit=crop&w=800&q=80',
      specs: JSON.stringify({ 'Material': 'Flexible silicone', 'Use': 'Cable organiser' })
    },
    {
      title: 'Reusable Screen Cleaning Cloth', slug: 'reusable-screen-cleaning-cloth', brand: 'SokoBora Finds',
      description: 'A soft, pocket-sized cloth for keeping phone, tablet, and laptop screens clear.',
      price: 30, rating: 4.9, review_count: 24, stock: 70,
      image_url: 'https://cdn11.bigcommerce.com/s-rf3zb7qgit/images/stencil/2048x2048/products/2482/22951/ed-hicks-16-premium-microfibre-glasses-cleaning-cloths-12-x-12cm__14540.1630498232.jpg?c=1',
      specs: JSON.stringify({ 'Material': 'Microfibre', 'Care': 'Washable and reusable' })
    },
    {
      title: 'Everyday Protective Phone Case', slug: 'everyday-phone-grip', brand: 'SokoBora Finds',
      description: 'A lightweight protective case that helps guard your phone from everyday bumps and scratches.',
      price: 100, rating: 4.8, review_count: 16, stock: 35,
      image_url: 'https://images.unsplash.com/photo-1753802864039-e990cc28fa68?auto=format&fit=crop&w=800&q=80',
      specs: JSON.stringify({ 'Style': 'Protective phone case', 'Use': 'Everyday scratch and bump protection' })
    }
  ];
  for (const product of affordableProducts) {
    const existing = await get('SELECT id FROM products WHERE slug = ?', [product.slug]);
    if (!existing) {
      await run(
        `INSERT INTO products (category_id, title, slug, brand, description, price, original_price, rating, review_count, stock, image_url, is_featured, kebs_certified, specs)
         VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, 0, 0, ?)`,
        [everydayCategory.id, product.title, product.slug, product.brand, product.description, product.price, product.rating, product.review_count, product.stock, product.image_url, product.specs]
      );
    }
  }
  await run('UPDATE products SET image_url = ? WHERE slug = ?', ['https://images.unsplash.com/photo-1698314440355-eaf5ff14899c?auto=format&fit=crop&w=800&q=80', 'pocket-phone-stand']);
  await run('UPDATE products SET title = ?, description = ?, image_url = ? WHERE slug = ?', [
    'Desk Cable Tidy Clip', 'A reusable clip that keeps a charging cable neatly organised on your desk.',
    'https://images.unsplash.com/photo-1760348213270-7cd00b8c3405?auto=format&fit=crop&w=800&q=80', 'braided-usb-cable-clip'
  ]);
  await run('UPDATE products SET image_url = ? WHERE slug = ?', ['https://cdn11.bigcommerce.com/s-rf3zb7qgit/images/stencil/2048x2048/products/2482/22951/ed-hicks-16-premium-microfibre-glasses-cleaning-cloths-12-x-12cm__14540.1630498232.jpg?c=1', 'reusable-screen-cleaning-cloth']);
  await run('UPDATE products SET title = ?, description = ?, image_url = ?, specs = ? WHERE slug = ?', [
    'Everyday Protective Phone Case', 'A lightweight protective case that helps guard your phone from everyday bumps and scratches.',
    'https://images.unsplash.com/photo-1753802864039-e990cc28fa68?auto=format&fit=crop&w=800&q=80',
    JSON.stringify({ 'Style': 'Protective phone case', 'Use': 'Everyday scratch and bump protection' }), 'everyday-phone-grip'
  ]);

  await run(
    'INSERT OR IGNORE INTO categories (name, slug, icon, description) VALUES (?, ?, ?, ?)',
    ['Stationery', 'stationery', 'Pencil', 'Pens, pencils, and everyday school supplies']
  );
  const stationeryCategory = await get('SELECT id FROM categories WHERE slug = ?', ['stationery']);
  const stationeryProducts = [
    {
      title: 'Assorted Writing Pens', slug: 'blue-ballpoint-pens-3-pack', brand: 'SokoBora Stationery',
      description: 'A handy assortment of smooth writing pens for class, notes, and everyday writing.',
      price: 60, rating: 4.8, review_count: 14, stock: 60,
      image_url: 'https://images.unsplash.com/photo-1663057826218-18e78f582513?auto=format&fit=crop&w=800&q=80',
      specs: JSON.stringify({ 'Colour': 'Blue', 'Pack size': '3 pens' })
    },
    {
      title: 'HB Writing Pencil', slug: 'hb-writing-pencils-3-pack', brand: 'SokoBora Stationery',
      description: 'A classic HB pencil for writing, sketching, and everyday schoolwork.',
      price: 30, rating: 4.7, review_count: 11, stock: 70,
      image_url: 'https://images.unsplash.com/photo-1661732017082-a82ecf38af87?auto=format&fit=crop&w=800&q=80',
      specs: JSON.stringify({ 'Grade': 'HB', 'Use': 'Writing and sketching' })
    },
    {
      title: 'Pencils and Erasers Set', slug: 'pencils-and-erasers-set', brand: 'SokoBora Stationery',
      description: 'Two everyday pencils with erasers for quick notes, homework, and drawing.',
      price: 45, rating: 4.8, review_count: 9, stock: 45,
      image_url: 'https://images.unsplash.com/photo-1726378033347-4c5163612e88?auto=format&fit=crop&w=800&q=80',
      specs: JSON.stringify({ 'Includes': '2 pencils and 2 erasers' })
    },
    {
      title: 'A5 Exercise Book', slug: 'a5-exercise-book', brand: 'SokoBora Stationery',
      description: 'A compact lined notebook for class notes, lists, and ideas on the go.',
      price: 80, rating: 4.8, review_count: 13, stock: 50,
      image_url: 'https://images.unsplash.com/photo-1632211218746-41fa4826134c?auto=format&fit=crop&w=800&q=80',
      specs: JSON.stringify({ 'Size': 'A5', 'Pages': 'Ruled' })
    },
    {
      title: 'Mini Colouring Pencils', slug: 'mini-colouring-pencils', brand: 'SokoBora Stationery',
      description: 'A cheerful set of coloured pencils for doodles, homework, and small creative projects.',
      price: 100, rating: 4.9, review_count: 17, stock: 35,
      image_url: 'https://images.unsplash.com/photo-1779144639478-72cd4e2794b4?auto=format&fit=crop&w=800&q=80',
      specs: JSON.stringify({ 'Use': 'Colouring and drawing', 'Set': 'Assorted colours' })
    },
    {
      title: 'Desk Pen and Pencil Holder', slug: 'pocket-pencil-case', brand: 'SokoBora Stationery',
      description: 'A desk organiser for keeping pens, pencils, and markers within easy reach.',
      price: 100, rating: 4.7, review_count: 8, stock: 28,
      image_url: 'https://images.unsplash.com/photo-1791739915508-0ce17fd8017e?auto=format&fit=crop&w=800&q=80',
      specs: JSON.stringify({ 'Style': 'Desk organiser', 'Use': 'Pen and pencil storage' })
    }
  ];
  for (const product of stationeryProducts) {
    const existing = await get('SELECT id FROM products WHERE slug = ?', [product.slug]);
    if (!existing) {
      await run(
        `INSERT INTO products (category_id, title, slug, brand, description, price, original_price, rating, review_count, stock, image_url, is_featured, kebs_certified, specs)
         VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, 0, 0, ?)`,
        [stationeryCategory.id, product.title, product.slug, product.brand, product.description, product.price, product.rating, product.review_count, product.stock, product.image_url, product.specs]
      );
    }
  }
  await run('UPDATE products SET title = ?, description = ? WHERE slug = ?', [
    'Assorted Writing Pens', 'A handy assortment of smooth writing pens for class, notes, and everyday writing.', 'blue-ballpoint-pens-3-pack'
  ]);
  await run('UPDATE products SET title = ?, description = ?, specs = ? WHERE slug = ?', [
    'HB Writing Pencil', 'A classic HB pencil for writing, sketching, and everyday schoolwork.',
    JSON.stringify({ 'Grade': 'HB', 'Use': 'Writing and sketching' }), 'hb-writing-pencils-3-pack'
  ]);
  await run('UPDATE products SET title = ?, description = ?, specs = ? WHERE slug = ?', [
    'Desk Pen and Pencil Holder', 'A desk organiser for keeping pens, pencils, and markers within easy reach.',
    JSON.stringify({ 'Style': 'Desk organiser', 'Use': 'Pen and pencil storage' }), 'pocket-pencil-case'
  ]);

  // Seed demo user with Kenyan details
  const userCount = await get('SELECT COUNT(*) as count FROM users');
  if (userCount.count === 0) {
    console.log('Seeding demo user with authentic Kenyan profile...');
    const salt = await bcrypt.genSalt(10);
    const passHash = await bcrypt.hash('DemoPass123!', salt);

    const userRes = await run(
      `INSERT INTO users (name, email, phone, county, estate, password_hash, avatar_url)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ['Mandela Machera', 'user@demo.com', '254712345678', 'Nairobi', 'Kilimani', passHash, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80']
    );

    // Initial devices for demo user reflecting Kenyan devices
    await run(
      `INSERT INTO user_devices (user_id, device_id, device_name, device_type, browser, os, ip_address)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userRes.id, 'device_laptop_demo_1', 'MacBook Pro - Nairobi Office', 'desktop', 'Chrome 131', 'macOS Sonoma', '197.232.88.14']
    );

    await run(
      `INSERT INTO user_devices (user_id, device_id, device_name, device_type, browser, os, ip_address)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userRes.id, 'device_phone_demo_2', 'Tecno Camon 30 Pro (Safaricom 5G)', 'mobile', 'Chrome Mobile', 'Android 14', '197.232.88.22']
    );

    // Seed cart items in database
    const sampleProducts = await all('SELECT id FROM products LIMIT 2');
    if (sampleProducts.length >= 2) {
      await run(
        `INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?), (?, ?, ?)`,
        [userRes.id, sampleProducts[0].id, 1, userRes.id, sampleProducts[1].id, 2]
      );
    }
  }

  console.log('SokoBora Database initialized successfully.');
};

module.exports = {
  db,
  run,
  get,
  all,
  initDb
};
