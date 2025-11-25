# Database Setup Guide

## Quick Fix for Database Errors

If you're getting database connection errors, follow these steps:

### 1. Create `.env` File

Create a `.env` file in the `gauallabackend-main` folder with the following content:

```env
# Database Configuration
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=your_database_name

# Server Configuration
PORT=9002

# JWT Secret (for token generation)
JWT_SECRET=your_jwt_secret_key_here
```

### 2. Update the Values

Replace the following with your actual MySQL credentials:
- `DB_USER`: Your MySQL username (usually `root`)
- `DB_PASSWORD`: Your MySQL password
- `DB_NAME`: Your database name (e.g., `milk_app`, `gauallamilk`, etc.)
- `JWT_SECRET`: Any random string for JWT token encryption

### 3. Check MySQL is Running

**Windows:**
- Open Services (Win + R, type `services.msc`)
- Look for "MySQL" or "MariaDB"
- Make sure it's "Running"

**Mac/Linux:**
```bash
# Check if MySQL is running
sudo systemctl status mysql
# or
sudo service mysql status
```

### 4. Create Database (if it doesn't exist)

1. Open MySQL command line or phpMyAdmin
2. Run this SQL command:
```sql
CREATE DATABASE your_database_name;
```

### 5. Import Database Schema (if you have SQL file)

If you have a `nodejsdb.sql` file:
```bash
mysql -u root -p your_database_name < nodejsdb.sql
```

### 6. Test Connection

After setting up `.env`, restart your backend server:
```bash
npm run dev
```

You should see:
```
✅ Database connection successful!
   Database: your_database_name
   Host: 127.0.0.1
```

### Common Errors and Solutions

**Error: `ECONNREFUSED`**
- MySQL server is not running
- Solution: Start MySQL service

**Error: `ER_ACCESS_DENIED_ERROR`**
- Wrong username or password
- Solution: Check your `.env` file credentials

**Error: `ER_BAD_DB_ERROR`**
- Database doesn't exist
- Solution: Create the database first

**Error: Missing environment variables**
- `.env` file is missing or incomplete
- Solution: Create/update `.env` file with all required variables

### Health Check

Test your database connection:
```bash
# In browser or Postman
GET http://localhost:9002/health
```

Should return:
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2024-..."
}
```





