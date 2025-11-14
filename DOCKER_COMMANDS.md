# Docker Commands Guide

## Running the Containers

### Start all containers
```bash
docker-compose up -d
```

### Start containers and see logs
```bash
docker-compose up
```

### Stop containers
```bash
docker-compose down
```

### Stop containers and remove volumes (clean slate)
```bash
docker-compose down -v
```

### Rebuild containers after code changes
```bash
docker-compose up -d --build
```

## Checking the PostgreSQL Database

### Method 1: Access PostgreSQL container directly
```bash
docker exec -it library_db psql -U postgres -d library_db
```

Once inside psql, you can run these commands:

```sql
-- List all tables
\dt

-- List all tables with details
\dt+

-- Show structure of a specific table
\d Users
\d Author
\d Publisher
\d Books
\d Bookings
\d Reservations
\d Reviews
\d TransactionHistory

-- Count records in each table
SELECT 'Users' as table_name, COUNT(*) as count FROM Users
UNION ALL
SELECT 'Author', COUNT(*) FROM Author
UNION ALL
SELECT 'Publisher', COUNT(*) FROM Publisher
UNION ALL
SELECT 'Books', COUNT(*) FROM Books
UNION ALL
SELECT 'Bookings', COUNT(*) FROM Bookings
UNION ALL
SELECT 'Reservations', COUNT(*) FROM Reservations
UNION ALL
SELECT 'Reviews', COUNT(*) FROM Reviews
UNION ALL
SELECT 'TransactionHistory', COUNT(*) FROM TransactionHistory;

-- Check foreign key constraints
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name;

-- Exit psql
\q
```

### Method 2: Run SQL commands directly from command line
```bash
# List all tables
docker exec -it library_db psql -U postgres -d library_db -c "\dt"

# Show Users table structure
docker exec -it library_db psql -U postgres -d library_db -c "\d Users"

# Count all tables
docker exec -it library_db psql -U postgres -d library_db -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"
```

### Method 3: Check container logs
```bash
# Check PostgreSQL logs
docker logs library_db

# Check backend logs
docker logs library_backend

# Follow logs in real-time
docker logs -f library_db
docker logs -f library_backend
```

## Quick Verification Script

Run this to quickly verify all tables exist:

```bash
docker exec -it library_db psql -U postgres -d library_db -c "
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
"
```

## Expected Tables

After running the containers, you should see these 8 tables:
1. Users
2. Author
3. Publisher
4. Books
5. Bookings
6. Reservations
7. Reviews
8. TransactionHistory

