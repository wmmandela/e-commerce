const express = require('express');
const router = express.Router();
const { get, all } = require('../db');

/**
 * List all categories with product count
 * GET /api/products/categories
 */
router.get('/categories', async (req, res) => {
  try {
    const categories = await all(`
      SELECT c.*, COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id
      GROUP BY c.id
      ORDER BY c.name ASC
    `);
    return res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return res.status(500).json({ error: 'Could not fetch categories.' });
  }
});

/**
 * Browse product catalogue
 * GET /api/products
 * Query params: search, category (slug), brand, minPrice, maxPrice, sort, featured
 */
router.get('/', async (req, res) => {
  try {
    const { search, category, brand, minPrice, maxPrice, sort, featured } = req.query;

    let sql = `
      SELECT p.*, c.name as category_name, c.slug as category_slug
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      sql += ` AND (p.title LIKE ? OR p.description LIKE ? OR p.brand LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    if (category && category !== 'all') {
      sql += ` AND (c.slug = ? OR c.id = ?)`;
      params.push(category, category);
    }

    if (brand && brand !== 'all') {
      sql += ` AND LOWER(p.brand) = LOWER(?)`;
      params.push(brand);
    }

    if (minPrice) {
      sql += ` AND p.price >= ?`;
      params.push(Number(minPrice));
    }

    if (maxPrice) {
      sql += ` AND p.price <= ?`;
      params.push(Number(maxPrice));
    }

    if (featured === 'true' || featured === '1') {
      sql += ` AND p.is_featured = 1`;
    }

    // Sorting
    switch (sort) {
      case 'price_asc':
        sql += ` ORDER BY p.price ASC`;
        break;
      case 'price_desc':
        sql += ` ORDER BY p.price DESC`;
        break;
      case 'rating':
        sql += ` ORDER BY p.rating DESC, p.review_count DESC`;
        break;
      case 'newest':
        sql += ` ORDER BY p.created_at DESC`;
        break;
      default:
        sql += ` ORDER BY p.is_featured DESC, p.rating DESC, p.id ASC`;
    }

    const products = await all(sql, params);

    // Parse JSON specs
    const parsed = products.map(p => {
      let specs = {};
      try {
        if (p.specs) specs = JSON.parse(p.specs);
      } catch (e) {}
      return { ...p, specs };
    });

    return res.json(parsed);
  } catch (error) {
    console.error('Error fetching products:', error);
    return res.status(500).json({ error: 'Could not fetch product catalogue.' });
  }
});

/**
 * Get single product by id or slug
 * GET /api/products/:identifier
 */
router.get('/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    let product;

    if (/^\d+$/.test(identifier)) {
      product = await get(`
        SELECT p.*, c.name as category_name, c.slug as category_slug
        FROM products p
        JOIN categories c ON p.category_id = c.id
        WHERE p.id = ?
      `, [Number(identifier)]);
    } else {
      product = await get(`
        SELECT p.*, c.name as category_name, c.slug as category_slug
        FROM products p
        JOIN categories c ON p.category_id = c.id
        WHERE p.slug = ?
      `, [identifier]);
    }

    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    let specs = {};
    try {
      if (product.specs) specs = JSON.parse(product.specs);
    } catch (e) {}

    // Related products in the same category
    const related = await all(`
      SELECT id, title, slug, brand, price, original_price, rating, image_url
      FROM products
      WHERE category_id = ? AND id != ?
      LIMIT 4
    `, [product.category_id, product.id]);

    return res.json({
      ...product,
      specs,
      related
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    return res.status(500).json({ error: 'Could not fetch product details.' });
  }
});

module.exports = router;
