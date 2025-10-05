#!/bin/bash

# Update controllers to use normalized structure
echo "🔄 Updating controllers to use normalized structure..."

# Backup old controllers
echo "📦 Backing up old controllers..."
cp backend/src/controllers/mikvahController.js backend/src/controllers/mikvahController.js.backup
cp backend/src/controllers/synagogueController.js backend/src/controllers/synagogueController.js.backup
cp backend/src/controllers/restaurantController.js backend/src/controllers/restaurantController.js.backup
cp backend/src/controllers/storeController.js backend/src/controllers/storeController.js.backup

# Update mikvah controller
echo "🔄 Updating mikvah controller..."
cat > backend/src/controllers/mikvahController.js << 'EOF'
const EntityControllerNormalized = require('./EntityControllerNormalized');

class MikvahController {
  static async getAllMikvahs(req, res) {
    req.query.entityType = 'mikvah';
    return EntityControllerNormalized.getAllEntities(req, res);
  }

  static async getMikvahById(req, res) {
    return EntityControllerNormalized.getEntityById(req, res);
  }

  static async searchMikvahs(req, res) {
    req.query.entityType = 'mikvah';
    return EntityControllerNormalized.searchEntities(req, res);
  }
}

module.exports = MikvahController;
EOF

# Update synagogue controller
echo "🔄 Updating synagogue controller..."
cat > backend/src/controllers/synagogueController.js << 'EOF'
const EntityControllerNormalized = require('./EntityControllerNormalized');

class SynagogueController {
  static async getAllSynagogues(req, res) {
    req.query.entityType = 'synagogue';
    return EntityControllerNormalized.getAllEntities(req, res);
  }

  static async getSynagogueById(req, res) {
    return EntityControllerNormalized.getEntityById(req, res);
  }

  static async searchSynagogues(req, res) {
    req.query.entityType = 'synagogue';
    return EntityControllerNormalized.searchEntities(req, res);
  }
}

module.exports = SynagogueController;
EOF

# Update restaurant controller
echo "🔄 Updating restaurant controller..."
cat > backend/src/controllers/restaurantController.js << 'EOF'
const EntityControllerNormalized = require('./EntityControllerNormalized');

class RestaurantController {
  static async getAllRestaurants(req, res) {
    req.query.entityType = 'restaurant';
    return EntityControllerNormalized.getAllEntities(req, res);
  }

  static async getRestaurantById(req, res) {
    return EntityControllerNormalized.getEntityById(req, res);
  }

  static async searchRestaurants(req, res) {
    req.query.entityType = 'restaurant';
    return EntityControllerNormalized.searchEntities(req, res);
  }
}

module.exports = RestaurantController;
EOF

# Update store controller
echo "🔄 Updating store controller..."
cat > backend/src/controllers/storeController.js << 'EOF'
const EntityControllerNormalized = require('./EntityControllerNormalized');

class StoreController {
  static async getAllStores(req, res) {
    req.query.entityType = 'store';
    return EntityControllerNormalized.getAllEntities(req, res);
  }

  static async getStoreById(req, res) {
    return EntityControllerNormalized.getEntityById(req, res);
  }

  static async searchStores(req, res) {
    req.query.entityType = 'store';
    return EntityControllerNormalized.searchEntities(req, res);
  }
}

module.exports = StoreController;
EOF

echo "✅ Controllers updated successfully!"
echo "📦 Backups created with .backup extension"
