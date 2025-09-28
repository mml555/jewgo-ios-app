-- Shtetl Stores and Products Schema
-- This migration adds support for the shtetl marketplace functionality

-- Create shtetl_stores table
CREATE TABLE shtetl_stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    address VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(50) NOT NULL,
    zip_code VARCHAR(10) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    
    -- Store branding
    logo_url VARCHAR(500),
    banner_url VARCHAR(500),
    
    -- Store type and kosher information
    store_type VARCHAR(50) NOT NULL DEFAULT 'general',
    kosher_level VARCHAR(50),
    kosher_certification VARCHAR(255),
    
    -- Services offered
    delivery_available BOOLEAN DEFAULT FALSE,
    pickup_available BOOLEAN DEFAULT TRUE,
    shipping_available BOOLEAN DEFAULT FALSE,
    
    -- Status and verification
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    
    -- Ratings and reviews (denormalized for performance)
    rating DECIMAL(3, 2) DEFAULT 0.00,
    review_count INTEGER DEFAULT 0,
    product_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create shtetl_products table
CREATE TABLE shtetl_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES shtetl_stores(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    category VARCHAR(100),
    
    -- Product images (stored as JSON array)
    images JSONB DEFAULT '[]',
    
    -- Inventory
    stock_quantity INTEGER DEFAULT 0,
    sku VARCHAR(100),
    
    -- Physical properties
    weight DECIMAL(8, 2), -- in pounds
    dimensions JSONB, -- {length, width, height, unit}
    
    -- Kosher information
    is_kosher BOOLEAN DEFAULT FALSE,
    kosher_certification VARCHAR(255),
    
    -- Product status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Tags for search and filtering
    tags TEXT[] DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create shtetl_store_social_links table
CREATE TABLE shtetl_store_social_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES shtetl_stores(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL, -- 'facebook', 'instagram', 'twitter', etc.
    url VARCHAR(500) NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(store_id, platform)
);

-- Create shtetl_store_reviews table
CREATE TABLE shtetl_store_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES shtetl_stores(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    content TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    is_moderated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(store_id, user_id) -- One review per user per store
);

-- Create indexes for performance
CREATE INDEX idx_shtetl_stores_owner_id ON shtetl_stores(owner_id);
CREATE INDEX idx_shtetl_stores_city_state ON shtetl_stores(city, state);
CREATE INDEX idx_shtetl_stores_active ON shtetl_stores(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_shtetl_stores_verified ON shtetl_stores(is_verified) WHERE is_verified = TRUE;
CREATE INDEX idx_shtetl_stores_rating ON shtetl_stores(rating DESC);
CREATE INDEX idx_shtetl_stores_store_type ON shtetl_stores(store_type);
CREATE INDEX idx_shtetl_stores_created_at ON shtetl_stores(created_at DESC);

CREATE INDEX idx_shtetl_products_store_id ON shtetl_products(store_id);
CREATE INDEX idx_shtetl_products_active ON shtetl_products(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_shtetl_products_category ON shtetl_products(category);
CREATE INDEX idx_shtetl_products_price ON shtetl_products(price);
CREATE INDEX idx_shtetl_products_stock ON shtetl_products(stock_quantity);
CREATE INDEX idx_shtetl_products_created_at ON shtetl_products(created_at DESC);
CREATE INDEX idx_shtetl_products_tags ON shtetl_products USING GIN(tags);

CREATE INDEX idx_shtetl_store_social_links_store_id ON shtetl_store_social_links(store_id);
CREATE INDEX idx_shtetl_store_social_links_platform ON shtetl_store_social_links(platform);

CREATE INDEX idx_shtetl_store_reviews_store_id ON shtetl_store_reviews(store_id);
CREATE INDEX idx_shtetl_store_reviews_user_id ON shtetl_store_reviews(user_id);
CREATE INDEX idx_shtetl_store_reviews_rating ON shtetl_store_reviews(rating);
CREATE INDEX idx_shtetl_store_reviews_created_at ON shtetl_store_reviews(created_at DESC);

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_shtetl_stores_updated_at BEFORE UPDATE ON shtetl_stores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shtetl_products_updated_at BEFORE UPDATE ON shtetl_products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shtetl_store_social_links_updated_at BEFORE UPDATE ON shtetl_store_social_links
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shtetl_store_reviews_updated_at BEFORE UPDATE ON shtetl_store_reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update store rating aggregation
CREATE OR REPLACE FUNCTION update_shtetl_store_rating_aggregation()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Update rating and review count for the store
        UPDATE shtetl_stores 
        SET 
            rating = (
                SELECT COALESCE(AVG(rating::DECIMAL), 0)
                FROM shtetl_store_reviews 
                WHERE store_id = NEW.store_id AND is_moderated = FALSE
            ),
            review_count = (
                SELECT COUNT(*)
                FROM shtetl_store_reviews 
                WHERE store_id = NEW.store_id AND is_moderated = FALSE
            )
        WHERE id = NEW.store_id;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Update rating and review count for the store
        UPDATE shtetl_stores 
        SET 
            rating = (
                SELECT COALESCE(AVG(rating::DECIMAL), 0)
                FROM shtetl_store_reviews 
                WHERE store_id = NEW.store_id AND is_moderated = FALSE
            ),
            review_count = (
                SELECT COUNT(*)
                FROM shtetl_store_reviews 
                WHERE store_id = NEW.store_id AND is_moderated = FALSE
            )
        WHERE id = NEW.store_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Update rating and review count for the store
        UPDATE shtetl_stores 
        SET 
            rating = (
                SELECT COALESCE(AVG(rating::DECIMAL), 0)
                FROM shtetl_store_reviews 
                WHERE store_id = OLD.store_id AND is_moderated = FALSE
            ),
            review_count = (
                SELECT COUNT(*)
                FROM shtetl_store_reviews 
                WHERE store_id = OLD.store_id AND is_moderated = FALSE
            )
        WHERE id = OLD.store_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for rating aggregation
CREATE TRIGGER update_shtetl_store_rating_on_review_insert
    AFTER INSERT ON shtetl_store_reviews
    FOR EACH ROW EXECUTE FUNCTION update_shtetl_store_rating_aggregation();

CREATE TRIGGER update_shtetl_store_rating_on_review_update
    AFTER UPDATE ON shtetl_store_reviews
    FOR EACH ROW EXECUTE FUNCTION update_shtetl_store_rating_aggregation();

CREATE TRIGGER update_shtetl_store_rating_on_review_delete
    AFTER DELETE ON shtetl_store_reviews
    FOR EACH ROW EXECUTE FUNCTION update_shtetl_store_rating_aggregation();

-- Function to update store product count
CREATE OR REPLACE FUNCTION update_shtetl_store_product_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE shtetl_stores 
        SET product_count = (
            SELECT COUNT(*)
            FROM shtetl_products 
            WHERE store_id = NEW.store_id AND is_active = TRUE
        )
        WHERE id = NEW.store_id;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE shtetl_stores 
        SET product_count = (
            SELECT COUNT(*)
            FROM shtetl_products 
            WHERE store_id = NEW.store_id AND is_active = TRUE
        )
        WHERE id = NEW.store_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE shtetl_stores 
        SET product_count = (
            SELECT COUNT(*)
            FROM shtetl_products 
            WHERE store_id = OLD.store_id AND is_active = TRUE
        )
        WHERE id = OLD.store_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for product count
CREATE TRIGGER update_shtetl_store_product_count_on_product_insert
    AFTER INSERT ON shtetl_products
    FOR EACH ROW EXECUTE FUNCTION update_shtetl_store_product_count();

CREATE TRIGGER update_shtetl_store_product_count_on_product_update
    AFTER UPDATE ON shtetl_products
    FOR EACH ROW EXECUTE FUNCTION update_shtetl_store_product_count();

CREATE TRIGGER update_shtetl_store_product_count_on_product_delete
    AFTER DELETE ON shtetl_products
    FOR EACH ROW EXECUTE FUNCTION update_shtetl_store_product_count();

COMMIT;

