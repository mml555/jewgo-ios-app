# Neon Database Setup Guide for Jewgo App

## Prerequisites

1. Active Neon account with a database created
2. PostgreSQL client (`psql`) installed locally, OR access to Neon's SQL Editor
3. Your Neon connection string

## Quick Setup (Using Neon SQL Editor)

This is the easiest method if you don't have `psql` installed locally.

1. Log in to [Neon Console](https://console.neon.tech)
2. Select your project
3. Click on **SQL Editor** in the left sidebar
4. Copy and paste each SQL file's contents in order (see order below)
5. Click **Run** after each file

## Setup Using psql (Command Line)

### Step 1: Get Your Connection String

```bash
# Replace with your actual Neon connection string
export DATABASE_URL="postgresql://username:password@ep-xxxxx.us-east-2.aws.neon.tech/dbname?sslmode=require"
```

### Step 2: Run Initial Schema

```bash
cd /Users/mendell/JewgoAppFinal/database

# Core schema
psql $DATABASE_URL -f init/01_schema_enhanced.sql

# Sample data (optional - for development/testing)
psql $DATABASE_URL -f init/02_sample_data_enhanced.sql
psql $DATABASE_URL -f init/03_specials_sample_data.sql
psql $DATABASE_URL -f init/04_events_sample_data.sql
psql $DATABASE_URL -f init/04_jobs_sample_data.sql
psql $DATABASE_URL -f init/05_job_seeker_profiles_sample_data.sql
```

### Step 3: Run Migrations in Order

```bash
# Run all migrations
psql $DATABASE_URL -f migrations/008_enhanced_schema_migration.sql
psql $DATABASE_URL -f migrations/009_enhanced_specials_schema.sql
psql $DATABASE_URL -f migrations/010_specials_performance_optimizations_corrected.sql
psql $DATABASE_URL -f migrations/011_shtetl_stores_schema.sql
psql $DATABASE_URL -f migrations/012_add_category_to_shtetl_stores.sql
psql $DATABASE_URL -f migrations/012_mikvah_synagogue_schema.sql
psql $DATABASE_URL -f migrations/013_add_missing_mikvah_synagogue_fields.sql
psql $DATABASE_URL -f migrations/014_jobs_schema.sql
psql $DATABASE_URL -f migrations/015_normalize_entity_architecture.sql
psql $DATABASE_URL -f migrations/016_add_postgis_optimization.sql
psql $DATABASE_URL -f migrations/016_job_seekers_schema.sql
psql $DATABASE_URL -f migrations/017_job_seekers_sample_data.sql
psql $DATABASE_URL -f migrations/017_simplified_spatial_optimization.sql
psql $DATABASE_URL -f migrations/018_enhanced_jobs_schema.sql
psql $DATABASE_URL -f migrations/020_complete_jobs_system.sql
psql $DATABASE_URL -f migrations/021_complete_events_system.sql
psql $DATABASE_URL -f migrations/021_fix_jobs_table_schema.sql
psql $DATABASE_URL -f migrations/022_complete_claiming_system.sql
psql $DATABASE_URL -f migrations/022_events_schema_enhancements.sql
psql $DATABASE_URL -f migrations/023_complete_admin_system.sql
```

## Automated Setup Script

We've also provided a bash script to automate this process:

```bash
cd /Users/mendell/JewgoAppFinal/database/scripts
chmod +x setup_neon.sh
./setup_neon.sh
```

## Verify Setup

After running all migrations, verify the tables were created:

```bash
psql $DATABASE_URL -c "\dt"
```

You should see tables like:

- `entities`
- `users`
- `jwt_keys`
- `sessions`
- `permissions`
- `roles`
- `user_roles`
- `reviews`
- `favorites`
- `events`
- `jobs`
- `job_seekers`
- And many more...

## Important Tables for Auth System

The auth system specifically needs these tables (created by migrations):

- `jwt_keys` - For JWT key rotation
- `users` - User accounts
- `sessions` - User sessions
- `refresh_tokens` - JWT refresh tokens
- `roles` - RBAC roles
- `permissions` - RBAC permissions
- `user_roles` - User role assignments
- `role_permissions` - Role permission mappings
- `guest_sessions` - Guest user sessions

## Troubleshooting

### Error: "relation already exists"

This means a table was already created. You can either:

1. Skip that migration file
2. Drop all tables and start fresh (⚠️ This will delete all data!)

```sql
-- Drop all tables (USE WITH CAUTION!)
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO public;
```

### Error: "permission denied"

Make sure your Neon user has proper permissions:

```sql
GRANT ALL PRIVILEGES ON DATABASE your_db_name TO your_username;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_username;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_username;
```

### Error: "could not connect to server"

1. Check your connection string is correct
2. Verify your Neon database is active (not paused)
3. Check if your IP is allowed (Neon free tier usually allows all IPs)

## Production vs Development

### Production (Neon)

- Don't run sample data scripts (`*_sample_data.sql`)
- Only run schema and migration files
- Ensure PostGIS extension is enabled if using location features

### Development (Local)

- You can run all scripts including sample data
- Use Docker Compose for local PostgreSQL instance

## Next Steps

After setting up the database:

1. Configure `DATABASE_URL` in Render dashboard
2. Deploy your backend to Render
3. Verify health check: `https://jewgo-app-oyoh.onrender.com/health`
4. Test API endpoints

## Migration File Summary

| Order | File                                                   | Description                            |
| ----- | ------------------------------------------------------ | -------------------------------------- |
| 1     | `01_schema_enhanced.sql`                               | Core schema with entities, users, auth |
| 2     | `008_enhanced_schema_migration.sql`                    | Enhanced schema features               |
| 3     | `009_enhanced_specials_schema.sql`                     | Specials/deals system                  |
| 4     | `010_specials_performance_optimizations_corrected.sql` | Performance improvements               |
| 5     | `011_shtetl_stores_schema.sql`                         | Marketplace stores                     |
| 6     | `012_add_category_to_shtetl_stores.sql`                | Store categories                       |
| 7     | `012_mikvah_synagogue_schema.sql`                      | Religious facility schemas             |
| 8     | `013_add_missing_mikvah_synagogue_fields.sql`          | Additional fields                      |
| 9     | `014_jobs_schema.sql`                                  | Jobs board                             |
| 10    | `015_normalize_entity_architecture.sql`                | Entity normalization                   |
| 11    | `016_add_postgis_optimization.sql`                     | Spatial indexing                       |
| 12    | `016_job_seekers_schema.sql`                           | Job seeker profiles                    |
| 13    | `017_simplified_spatial_optimization.sql`              | Spatial performance                    |
| 14    | `018_enhanced_jobs_schema.sql`                         | Enhanced jobs features                 |
| 15    | `020_complete_jobs_system.sql`                         | Complete jobs system                   |
| 16    | `021_complete_events_system.sql`                       | Events system                          |
| 17    | `021_fix_jobs_table_schema.sql`                        | Jobs table fixes                       |
| 18    | `022_complete_claiming_system.sql`                     | Business claiming                      |
| 19    | `022_events_schema_enhancements.sql`                   | Event enhancements                     |
| 20    | `023_complete_admin_system.sql`                        | Admin dashboard                        |

## Notes

- Some migration files have multiple versions (e.g., `010_specials_performance_optimizations.sql` vs `010_specials_performance_optimizations_corrected.sql`)
- Use the "corrected" or "enhanced" versions when available
- Migration order matters - run them sequentially!
- If a migration fails, fix the issue before proceeding to the next one
