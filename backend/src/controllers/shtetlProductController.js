const pool = require('../database/connection');
const logger = require('../utils/logger');

class ShtetlProductController {
  // Get all products for a store
  static async getStoreProducts(req, res) {
    try {
      const { storeId } = req.params;
      const {
        category,
        isActive,
        isKosher,
        minPrice,
        maxPrice,
        inStock,
        limit = 50,
        offset = 0,
        sortBy = 'created_at',
        sortOrder = 'DESC',
      } = req.query;

      let query = `
        SELECT p.*, s.name as store_name
        FROM shtetl_products p
        LEFT JOIN shtetl_stores s ON p.store_id = s.id
        WHERE p.store_id = $1
      `;
      const params = [storeId];
      let paramCount = 1;

      // Add filters
      if (category) {
        paramCount++;
        query += ` AND p.category = $${paramCount}`;
        params.push(category);
      }

      if (isActive !== undefined) {
        paramCount++;
        query += ` AND p.is_active = $${paramCount}`;
        params.push(isActive === 'true');
      }

      if (isKosher !== undefined) {
        paramCount++;
        query += ` AND p.is_kosher = $${paramCount}`;
        params.push(isKosher === 'true');
      }

      if (minPrice) {
        paramCount++;
        query += ` AND p.price >= $${paramCount}`;
        params.push(parseFloat(minPrice));
      }

      if (maxPrice) {
        paramCount++;
        query += ` AND p.price <= $${paramCount}`;
        params.push(parseFloat(maxPrice));
      }

      if (inStock !== undefined) {
        if (inStock === 'true') {
          query += ' AND p.stock_quantity > 0';
        } else {
          query += ' AND p.stock_quantity = 0';
        }
      }

      // Add ordering
      const validSortColumns = [
        'name',
        'price',
        'created_at',
        'updated_at',
        'stock_quantity',
      ];
      const sortColumn = validSortColumns.includes(sortBy)
        ? `p.${sortBy}`
        : 'p.created_at';
      const orderDirection = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
      query += ` ORDER BY ${sortColumn} ${orderDirection}`;

      // Add pagination
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      params.push(parseInt(limit, 10));

      paramCount++;
      query += ` OFFSET $${paramCount}`;
      params.push(parseInt(offset, 10));

      const result = await pool.query(query, params);

      res.json({
        success: true,
        data: {
          products: result.rows,
          pagination: {
            limit: parseInt(limit, 10),
            offset: parseInt(offset, 10),
            total: result.rowCount,
          },
        },
      });
    } catch (error) {
      logger.error('Error fetching store products:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch products',
        message: error.message,
      });
    }
  }

  // Get single product by ID
  static async getProductById(req, res) {
    try {
      const { id } = req.params;

      const query = `
        SELECT p.*, s.name as store_name, s.owner_id
        FROM shtetl_products p
        LEFT JOIN shtetl_stores s ON p.store_id = s.id
        WHERE p.id = $1
      `;

      const result = await pool.query(query, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Product not found',
        });
      }

      res.json({
        success: true,
        data: {
          product: result.rows[0],
        },
      });
    } catch (error) {
      logger.error('Error fetching product:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch product',
        message: error.message,
      });
    }
  }

  // Create new product
  static async createProduct(req, res) {
    try {
      const { storeId } = req.params;
      const {
        name,
        description,
        price,
        currency = 'USD',
        category,
        images = [],
        stockQuantity = 0,
        sku,
        weight,
        dimensions,
        isKosher = false,
        kosherCertification,
        tags = [],
      } = req.body;

      const ownerId = req.user?.id || req.guest?.id;

      if (!ownerId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
      }

      // Check if user owns the store
      const ownershipQuery = 'SELECT owner_id FROM shtetl_stores WHERE id = $1';
      const ownershipResult = await pool.query(ownershipQuery, [storeId]);

      if (ownershipResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Store not found',
        });
      }

      if (ownershipResult.rows[0].owner_id !== ownerId) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to add products to this store',
        });
      }

      const query = `
        INSERT INTO shtetl_products (
          store_id, name, description, price, currency, category,
          images, stock_quantity, sku, weight, dimensions,
          is_kosher, kosher_certification, tags
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *
      `;

      const values = [
        storeId,
        name,
        description,
        price,
        currency,
        category,
        JSON.stringify(images),
        stockQuantity,
        sku,
        weight,
        dimensions ? JSON.stringify(dimensions) : null,
        isKosher,
        kosherCertification,
        tags,
      ];

      const result = await pool.query(query, values);

      res.status(201).json({
        success: true,
        data: {
          product: result.rows[0],
        },
      });
    } catch (error) {
      logger.error('Error creating product:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create product',
        message: error.message,
      });
    }
  }

  // Update product
  static async updateProduct(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const ownerId = req.user?.id || req.guest?.id;

      if (!ownerId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
      }

      // Check if user owns the store that contains this product
      const ownershipQuery = `
        SELECT s.owner_id 
        FROM shtetl_products p
        LEFT JOIN shtetl_stores s ON p.store_id = s.id
        WHERE p.id = $1
      `;
      const ownershipResult = await pool.query(ownershipQuery, [id]);

      if (ownershipResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Product not found',
        });
      }

      if (ownershipResult.rows[0].owner_id !== ownerId) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to update this product',
        });
      }

      // Build dynamic update query
      const updateFields = [];
      const values = [];
      let paramCount = 0;

      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined) {
          paramCount++;
          let value = updateData[key];

          // Handle JSON fields
          if (key === 'images' || key === 'dimensions') {
            value = JSON.stringify(value);
          }

          updateFields.push(`${key} = $${paramCount}`);
          values.push(value);
        }
      });

      if (updateFields.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No fields to update',
        });
      }

      paramCount++;
      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);

      const query = `
        UPDATE shtetl_products 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `;

      const result = await pool.query(query, values);

      res.json({
        success: true,
        data: {
          product: result.rows[0],
        },
      });
    } catch (error) {
      logger.error('Error updating product:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update product',
        message: error.message,
      });
    }
  }

  // Delete product
  static async deleteProduct(req, res) {
    try {
      const { id } = req.params;
      const ownerId = req.user?.id || req.guest?.id;

      if (!ownerId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
      }

      // Check if user owns the store that contains this product
      const ownershipQuery = `
        SELECT s.owner_id 
        FROM shtetl_products p
        LEFT JOIN shtetl_stores s ON p.store_id = s.id
        WHERE p.id = $1
      `;
      const ownershipResult = await pool.query(ownershipQuery, [id]);

      if (ownershipResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Product not found',
        });
      }

      if (ownershipResult.rows[0].owner_id !== ownerId) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to delete this product',
        });
      }

      // Soft delete by setting is_active to false
      const query =
        'UPDATE shtetl_products SET is_active = false WHERE id = $1';
      await pool.query(query, [id]);

      res.json({
        success: true,
        message: 'Product deleted successfully',
      });
    } catch (error) {
      logger.error('Error deleting product:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete product',
        message: error.message,
      });
    }
  }

  // Search products across all stores
  static async searchProducts(req, res) {
    try {
      const {
        q,
        category,
        storeType,
        kosherLevel,
        isKosher,
        minPrice,
        maxPrice,
        inStock,
        city,
        state,
        limit = 50,
        offset = 0,
        sortBy = 'created_at',
        sortOrder = 'DESC',
      } = req.query;

      if (!q || q.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Search query is required',
        });
      }

      let query = `
        SELECT 
          p.*,
          s.name as store_name,
          s.city,
          s.state,
          s.store_type,
          s.rating as store_rating
        FROM shtetl_products p
        LEFT JOIN shtetl_stores s ON p.store_id = s.id
        WHERE p.is_active = true 
        AND s.is_active = true
        AND (
          p.name ILIKE $1 
          OR p.description ILIKE $1 
          OR p.category ILIKE $1
          OR p.tags::text ILIKE $1
        )
      `;
      const params = [`%${q}%`];
      let paramCount = 1;

      // Add filters
      if (category) {
        paramCount++;
        query += ` AND p.category = $${paramCount}`;
        params.push(category);
      }

      if (storeType) {
        paramCount++;
        query += ` AND s.store_type = $${paramCount}`;
        params.push(storeType);
      }

      if (kosherLevel) {
        paramCount++;
        query += ` AND s.kosher_level = $${paramCount}`;
        params.push(kosherLevel);
      }

      if (isKosher !== undefined) {
        paramCount++;
        query += ` AND p.is_kosher = $${paramCount}`;
        params.push(isKosher === 'true');
      }

      if (minPrice) {
        paramCount++;
        query += ` AND p.price >= $${paramCount}`;
        params.push(parseFloat(minPrice));
      }

      if (maxPrice) {
        paramCount++;
        query += ` AND p.price <= $${paramCount}`;
        params.push(parseFloat(maxPrice));
      }

      if (inStock !== undefined) {
        if (inStock === 'true') {
          query += ' AND p.stock_quantity > 0';
        } else {
          query += ' AND p.stock_quantity = 0';
        }
      }

      if (city) {
        paramCount++;
        query += ` AND s.city ILIKE $${paramCount}`;
        params.push(`%${city}%`);
      }

      if (state) {
        paramCount++;
        query += ` AND s.state ILIKE $${paramCount}`;
        params.push(`%${state}%`);
      }

      // Add ordering
      const validSortColumns = ['name', 'price', 'created_at', 'store_rating'];
      const sortColumn = validSortColumns.includes(sortBy)
        ? `p.${sortBy}`
        : 'p.created_at';
      const orderDirection = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
      query += ` ORDER BY ${sortColumn} ${orderDirection}`;

      // Add pagination
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      params.push(parseInt(limit, 10));

      paramCount++;
      query += ` OFFSET $${paramCount}`;
      params.push(parseInt(offset, 10));

      const result = await pool.query(query, params);

      res.json({
        success: true,
        data: {
          products: result.rows,
          query: q,
          pagination: {
            limit: parseInt(limit, 10),
            offset: parseInt(offset, 10),
            total: result.rowCount,
          },
        },
      });
    } catch (error) {
      logger.error('Error searching products:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to search products',
        message: error.message,
      });
    }
  }
}

module.exports = ShtetlProductController;
