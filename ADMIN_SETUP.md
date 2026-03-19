# Admin Authentication Setup Guide

This guide explains how to set up and use the admin authentication system for the Milk App backend.

## Table of Contents
- [Database Setup](#database-setup)
- [Creating an Admin User](#creating-an-admin-user)
- [Updating Admin Password](#updating-admin-password)
- [API Endpoints](#api-endpoints)
- [Frontend Integration](#frontend-integration)

## Database Setup

First, run the migration to create the `admins` table:

```bash
npm run migrate:admin
```

Or directly:

```bash
node models/adminModel.js
```

This will create the `admins` table with the following schema:
- `id` - Primary key
- `name` - Admin name
- `email` - Admin email (unique)
- `password` - Hashed password
- `created_at` - Timestamp
- `updated_at` - Timestamp

## Creating an Admin User

You can create an admin user using the provided script:

### Basic Usage (with defaults)
```bash
npm run admin:create
```
This will create an admin with:
- Name: "Admin"
- Email: "admin@example.com"
- Password: "admin123"

### Custom Admin User
```bash
npm run admin:create "John Doe" "john@example.com" "securePassword123"
```

Or directly:
```bash
node scripts/createAdmin.js "John Doe" "john@example.com" "securePassword123"
```

### Arguments Order
1. Name (optional, default: "Admin")
2. Email (optional, default: "admin@example.com")
3. Password (optional, default: "admin123")

**Note:** If an admin with the same email already exists, the script will not create a duplicate.

## Updating Admin Password

To update an admin user's password:

```bash
npm run admin:update-password "admin@example.com" "newPassword123"
```

Or directly:
```bash
node scripts/updateAdminPassword.js "admin@example.com" "newPassword123"
```

### Arguments
1. Email (required) - The email of the admin whose password you want to update
2. New Password (required) - The new password (must be at least 6 characters)

## API Endpoints

### Authentication Endpoints

All admin authentication endpoints are prefixed with `/admin`.

#### 1. Admin Login
```
POST /admin/login
```

**Request Body:**
```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt_token_here",
  "admin": {
    "id": 1,
    "name": "Admin",
    "email": "admin@example.com"
  },
  "message": "Login successful"
}
```

**Cookie:** Sets an `admin` cookie with the JWT token.

---

#### 2. Verify Admin Authentication
```
GET /admin/verify
```

**Headers:** 
- Cookie: `admin=<token>` (automatically sent by browser)
- OR Authorization: `Bearer <token>`

**Response:**
```json
{
  "success": true,
  "admin": {
    "id": 1,
    "name": "Admin",
    "email": "admin@example.com",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

---

#### 3. Admin Logout
```
GET /admin/logout
```

**Response:**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

**Cookie:** Clears the `admin` cookie.

---

#### 4. Get Admin Profile (Protected)
```
GET /admin/getadmin
```

**Headers:** Requires admin authentication (via cookie or Authorization header)

**Response:**
```json
{
  "success": true,
  "admin": {
    "id": 1,
    "name": "Admin",
    "email": "admin@example.com",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

---

#### 5. Update Admin Password (Protected)
```
PUT /admin/update-password
```

**Headers:** Requires admin authentication

**Request Body:**
```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newPassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password updated successfully"
}
```

**Validation:**
- Current password and new password are required
- New password must be at least 6 characters
- Current password must be correct

## Middleware

The admin middleware (`middlewere/adminMiddleware.js`) can be used to protect routes:

```javascript
import { adminMiddleware } from "../middlewere/adminMiddleware.js";

router.get("/protected-route", adminMiddleware, yourController);
```

The middleware:
- Checks for `admin` cookie or Authorization header
- Verifies the JWT token
- Attaches the admin object to `req.admin`
- Returns 401 if authentication fails

## Frontend Integration

### Login Page

The admin login page is located at:
- Frontend: `/admin/Login`
- Component: `milk_pp-main/app/admin/Login/page.jsx`

### Layout Protection

The admin layout (`milk_pp-main/app/admin/layout.jsx`) automatically:
- Checks authentication on all routes except `/admin/Login`
- Redirects to login if not authenticated
- Shows loading state during auth check

### API Configuration

Update the admin API URL in:
- `milk_pp-main/app/admin/adminCompo/adminapis.js`

```javascript
export const adminurl = `http://localhost:9002/admin`
```

For production, update to:
```javascript
export const adminurl = `https://your-domain.com/admin`
```

## Security Notes

1. **Password Hashing:** All passwords are hashed using bcrypt with salt rounds of 10.

2. **JWT Tokens:** Tokens expire after 90 days. You can modify this in `helper/Jwttoken.js`.

3. **Cookies:** Admin cookies are:
   - HttpOnly (prevents JavaScript access)
   - Secure (HTTPS only in production)
   - SameSite: 'none' (for cross-origin requests)

4. **Environment Variables:** Make sure your `.env` file has proper database credentials and JWT secret key.

## Troubleshooting

### Admin table doesn't exist
Run the migration: `npm run migrate:admin`

### Cannot create admin user
- Check database connection in `config.js`
- Verify `.env` file has correct database credentials
- Check if admin with same email already exists

### Login fails
- Verify admin exists in database
- Check password is correct
- Ensure backend server is running on correct port
- Check CORS settings in `app.js`

### Cookie not being set
- Check CORS configuration allows credentials
- Verify cookie settings in controller
- Check browser console for CORS errors
- In development, ensure frontend and backend URLs are correct

## Example Usage Flow

1. **Setup:**
   ```bash
   npm run migrate:admin
   npm run admin:create "Admin User" "admin@example.com" "SecurePass123"
   ```

2. **Login:**
   - Navigate to `/admin/Login`
   - Enter email and password
   - Submit form
   - Cookie is automatically set
   - Redirected to dashboard

3. **Access Protected Routes:**
   - Layout automatically verifies authentication
   - If authenticated, access granted
   - If not authenticated, redirected to login

4. **Logout:**
   - Click logout in sidebar
   - Cookie is cleared
   - Redirected to login page

## Additional Scripts

You can add these to your `package.json`:

```json
{
  "scripts": {
    "migrate:admin": "node models/adminModel.js",
    "admin:create": "node scripts/createAdmin.js",
    "admin:update-password": "node scripts/updateAdminPassword.js"
  }
}
```

These scripts are already included in the package.json file.
