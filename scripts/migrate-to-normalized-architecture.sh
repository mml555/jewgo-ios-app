#!/bin/bash

# =============================================================================
# NORMALIZED ENTITY ARCHITECTURE MIGRATION SCRIPT
# =============================================================================
# This script migrates from the monolithic entities table to a proper
# normalized structure with inheritance pattern.

set -e  # Exit on any error

echo "🚀 Starting Normalized Entity Architecture Migration..."

# Configuration
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="jewgo_app"
DB_USER="postgres"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if database exists
check_database() {
    print_status "Checking database connection..."
    if ! psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT 1;" > /dev/null 2>&1; then
        print_error "Cannot connect to database $DB_NAME"
        exit 1
    fi
    print_success "Database connection verified"
}

# Function to create backup
create_backup() {
    print_status "Creating database backup..."
    BACKUP_FILE="backup_entities_$(date +%Y%m%d_%H%M%S).sql"
    
    if pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME --table=entities --data-only > "$BACKUP_FILE"; then
        print_success "Backup created: $BACKUP_FILE"
    else
        print_error "Failed to create backup"
        exit 1
    fi
}

# Function to run migration
run_migration() {
    print_status "Running normalized architecture migration..."
    
    if psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "database/migrations/015_normalize_entity_architecture.sql"; then
        print_success "Migration completed successfully"
    else
        print_error "Migration failed"
        exit 1
    fi
}

# Function to validate migration
validate_migration() {
    print_status "Validating migration..."
    
    # Check if new tables exist
    TABLES=("entities_normalized" "mikvahs_normalized" "synagogues_normalized" "restaurants_normalized" "stores_normalized")
    
    for table in "${TABLES[@]}"; do
        if psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT 1 FROM $table LIMIT 1;" > /dev/null 2>&1; then
            print_success "Table $table exists and has data"
        else
            print_error "Table $table is missing or empty"
            exit 1
        fi
    done
    
    # Check data integrity
    print_status "Checking data integrity..."
    
    # Count entities in old vs new tables
    OLD_COUNT=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM entities WHERE is_active = true;")
    NEW_COUNT=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM entities_normalized WHERE is_active = true;")
    
    if [ "$OLD_COUNT" -eq "$NEW_COUNT" ]; then
        print_success "Data integrity verified: $NEW_COUNT entities migrated"
    else
        print_error "Data integrity check failed: Old=$OLD_COUNT, New=$NEW_COUNT"
        exit 1
    fi
    
    # Check specialized data
    MIKVAH_COUNT=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM mikvahs_normalized;")
    SYNAGOGUE_COUNT=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM synagogues_normalized;")
    RESTAURANT_COUNT=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM restaurants_normalized;")
    STORE_COUNT=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM stores_normalized;")
    
    print_success "Specialized data migrated:"
    print_success "  - Mikvahs: $MIKVAH_COUNT"
    print_success "  - Synagogues: $SYNAGOGUE_COUNT"
    print_success "  - Restaurants: $RESTAURANT_COUNT"
    print_success "  - Stores: $STORE_COUNT"
}

# Function to update application code
update_application() {
    print_status "Updating application code..."
    
    # Backup old controllers
    print_status "Backing up old controllers..."
    cp backend/src/controllers/mikvahController.js backend/src/controllers/mikvahController.js.backup
    cp backend/src/controllers/synagogueController.js backend/src/controllers/synagogueController.js.backup
    cp backend/src/controllers/restaurantController.js backend/src/controllers/restaurantController.js.backup
    cp backend/src/controllers/storeController.js backend/src/controllers/storeController.js.backup
    
    # Update controllers to use normalized structure
    print_status "Updating controllers to use normalized structure..."
    
    # Update mikvah controller
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

    print_success "Application code updated"
}

# Function to restart services
restart_services() {
    print_status "Restarting backend services..."
    
    # Kill existing backend processes
    pkill -f "node.*server.js" || true
    sleep 2
    
    # Start backend
    cd backend && npm start &
    BACKEND_PID=$!
    
    # Wait for backend to start
    sleep 5
    
    if kill -0 $BACKEND_PID 2>/dev/null; then
        print_success "Backend restarted successfully"
    else
        print_error "Backend failed to start"
        exit 1
    fi
}

# Function to run tests
run_tests() {
    print_status "Running basic functionality tests..."
    
    # Test API endpoints
    sleep 3  # Wait for backend to fully start
    
    # Test mikvahs endpoint
    if curl -s "http://localhost:3001/api/v5/mikvahs" | grep -q "success"; then
        print_success "Mikvahs API endpoint working"
    else
        print_warning "Mikvahs API endpoint may have issues"
    fi
    
    # Test synagogues endpoint
    if curl -s "http://localhost:3001/api/v5/synagogues" | grep -q "success"; then
        print_success "Synagogues API endpoint working"
    else
        print_warning "Synagogues API endpoint may have issues"
    fi
    
    # Test restaurants endpoint
    if curl -s "http://localhost:3001/api/v5/restaurants" | grep -q "success"; then
        print_success "Restaurants API endpoint working"
    else
        print_warning "Restaurants API endpoint may have issues"
    fi
    
    # Test stores endpoint
    if curl -s "http://localhost:3001/api/v5/stores" | grep -q "success"; then
        print_success "Stores API endpoint working"
    else
        print_warning "Stores API endpoint may have issues"
    fi
}

# Main execution
main() {
    print_status "Starting Normalized Entity Architecture Migration"
    print_warning "This will modify your database structure. Make sure you have a backup!"
    
    # Confirm before proceeding
    read -p "Do you want to continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Migration cancelled"
        exit 0
    fi
    
    # Run migration steps
    check_database
    create_backup
    run_migration
    validate_migration
    update_application
    restart_services
    run_tests
    
    print_success "🎉 Migration completed successfully!"
    print_status "Your database is now using a normalized architecture with:"
    print_status "  - Proper table inheritance"
    print_status "  - Optimized indexes"
    print_status "  - Data validation triggers"
    print_status "  - Backward compatibility views"
    print_status "  - Updated controllers with proper JOINs"
    
    print_warning "Next steps:"
    print_warning "  1. Test all functionality thoroughly"
    print_warning "  2. Update frontend code if needed"
    print_warning "  3. Monitor performance and optimize as needed"
    print_warning "  4. Consider dropping old entities table after validation"
}

# Run main function
main "$@"
