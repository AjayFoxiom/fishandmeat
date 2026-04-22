# 🐟🥩 FishAndMeat API Documentation

> **Base URL:** `http://localhost:3001`  
> **API Prefix:** `/api`  
> **Content-Type:** `application/json`  
> **Authentication:** Bearer JWT Token (via `Authorization: Bearer <token>` header)

---

## 📋 Table of Contents

1. [Authentication Overview](#-authentication-overview)
2. [Response Format](#-response-format)
3. [Error Format](#-error-format)
4. [Health Endpoints](#-health-endpoints)
5. [Auth Endpoints](#-auth-endpoints)
6. [User Endpoints](#-user-endpoints)
7. [Product Endpoints](#-product-endpoints)
8. [Cart Endpoints](#-cart-endpoints)
9. [Checkout Endpoints](#-checkout-endpoints)
10. [Order Endpoints](#-order-endpoints)
11. [Promocode Endpoints](#-promocode-endpoints)
12. [Vendor Endpoints](#-vendor-endpoints)
13. [Admin Endpoints](#-admin-endpoints)
14. [HTTP Status Codes Reference](#-http-status-codes-reference)

---

## 🔐 Authentication Overview

Most protected endpoints require a **JWT Bearer Token** in the `Authorization` header.

**Header Format:**
```
Authorization: Bearer <your_jwt_token>
```

The token is obtained from `POST /api/auth/verify` after completing OTP verification. It is signed using **RS256** (or **HS256** depending on `JWT_PRIVATE_KEY`) and carries the `userId` as the payload.

**JWT Middleware Behavior:**
- Extracts the token from `Authorization: Bearer <token>`
- Verifies it using `JWT_PRIVATE_KEY` env variable
- Sets `req.payload = userId` for downstream controllers
- Returns `404` with `{ message: "error occur in jwt middleware", error: ... }` on failure

---

## 📦 Response Format

All successful responses follow this standard envelope:

```json
{
  "success": true,
  "message": "Human-readable message",
  "data": { ... }
}
```

| Field     | Type            | Description                            |
|-----------|-----------------|----------------------------------------|
| `success` | `boolean`       | `true` for success, `false` for error  |
| `message` | `string`        | Human-readable status message          |
| `data`    | `object\|array` | The actual payload (can be omitted)    |

---

## ❌ Error Format

### Development Mode (`NODE_ENV=development`)
```json
{
  "status": "fail",
  "message": "Descriptive error message",
  "stack": "Error stack trace...",
  "error": { ... }
}
```

### Production Mode (`NODE_ENV=production`)
```json
{
  "status": "fail",
  "message": "Descriptive error message"
}
```

### JWT Middleware Error
```json
{
  "message": "error occur in jwt middleware",
  "error": { ... }
}
```

---

## 🏥 Health Endpoints

Base path: `/api/health`  
Authentication: **None required**

---

### GET `/api/health` — Liveness Probe

Lightweight liveness probe. No database call — responds instantly.

```bash
curl -X GET http://localhost:3001/api/health
```

**✅ Success Response — `200 OK`**
```json
{
  "status": "ok",
  "environment": "development",
  "timestamp": "2026-04-22T09:00:00.000Z",
  "uptime": "0d 1h 23m 45s",
  "memory": {
    "heapUsed": "45.32 MB",
    "heapTotal": "72.00 MB",
    "rss": "89.50 MB"
  },
  "system": {
    "platform": "win32",
    "nodeVersion": "v20.12.0",
    "cpus": 8,
    "freeMemory": "4096.00 MB",
    "totalMemory": "16384.00 MB"
  }
}
```

---

### GET `/api/health/deep` — Readiness Probe

Performs a full readiness check including database connectivity and environment variables.

```bash
curl -X GET http://localhost:3001/api/health/deep
```

**✅ Success Response — `200 OK` (All checks pass)**
```json
{
  "status": "ok",
  "environment": "development",
  "timestamp": "2026-04-22T09:00:00.000Z",
  "uptime": "0d 1h 23m 45s",
  "responseTime": "23ms",
  "checks": {
    "database": {
      "status": "ok",
      "responseTime": "12ms"
    },
    "environment": {
      "status": "ok"
    }
  }
}
```

**⚠️ Warning Response — `200 OK` (Missing env vars)**
```json
{
  "status": "warning",
  "environment": "development",
  "timestamp": "2026-04-22T09:00:00.000Z",
  "uptime": "0d 0h 5m 10s",
  "responseTime": "15ms",
  "checks": {
    "database": {
      "status": "ok",
      "responseTime": "8ms"
    },
    "environment": {
      "status": "warning",
      "missingVariables": ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN"]
    }
  }
}
```

**❌ Error Response — `503 Service Unavailable` (DB down)**
```json
{
  "status": "degraded",
  "environment": "production",
  "timestamp": "2026-04-22T09:00:00.000Z",
  "uptime": "0d 0h 0m 5s",
  "responseTime": "5001ms",
  "checks": {
    "database": {
      "status": "error",
      "message": "Can't reach database server"
    },
    "environment": {
      "status": "ok"
    }
  }
}
```

**Checked environment variables:**  
`DATABASE_URL`, `JWT_PRIVATE_KEY`, `EMAIL_ID`, `EMAIL_PASS`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `STRIPE_SECRET_KEY`

---

## 🔑 Auth Endpoints

Base path: `/api/auth`  
Authentication: **None required** (public endpoints)

---

### POST `/api/auth/register` — Register User

Creates a new user and sends an OTP to the provided email. If user already exists, sends a fresh OTP.

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "mobile": "9876543210",
    "username": "johndoe",
    "fcmToken": "firebase_device_token_here"
  }'
```

**Request Body**

| Field      | Type     | Required | Description                    |
|------------|----------|----------|--------------------------------|
| `email`    | `string` | ✅ Yes   | User's email address           |
| `mobile`   | `string` | ✅ Yes   | User's mobile number           |
| `username` | `string` | ✅ Yes   | Display name                   |
| `fcmToken` | `string` | ❌ No    | Firebase Cloud Messaging token |

**✅ Success Response — `201 Created` (New user)**
```json
{
  "success": true,
  "message": "OTP send successfully"
}
```

**✅ Success Response — `200 OK` (Existing user)**
```json
{
  "success": true,
  "message": "User already exist , otp send successfully"
}
```

---

### POST `/api/auth/verify` — Verify OTP

Verifies the OTP and returns a JWT token on success.

```bash
curl -X POST http://localhost:3001/api/auth/verify \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "mobile": "9876543210",
    "otp": "482910"
  }'
```

**Request Body**

| Field    | Type     | Required | Description                            |
|----------|----------|----------|----------------------------------------|
| `email`  | `string` | ❌ *     | User's email (at least one of email/mobile required) |
| `mobile` | `string` | ❌ *     | User's mobile (at least one of email/mobile required) |
| `otp`    | `string` | ✅ Yes   | The 6-digit OTP received via email     |

**✅ Success Response — `200 OK`**
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NjFhYjIzNDU2Nzg5MCIsImlhdCI6MTc0NTMxMjAwMH0.abc123",
    "username": "johndoe"
  }
}
```

**❌ Error Response — `404 Not Found` (Invalid OTP)**
```json
{
  "status": "fail",
  "message": "Invalid OTP"
}
```

**❌ Error Response — `404 Not Found` (OTP Expired)**
```json
{
  "status": "fail",
  "message": "OTP expired. Please request a new one"
}
```

**❌ Error Response — `404 Not Found` (Missing data)**
```json
{
  "status": "fail",
  "message": "Invalid data"
}
```

---

### POST `/api/auth/resend` — Resend OTP

Resends a fresh OTP to the user's registered email.

```bash
curl -X POST http://localhost:3001/api/auth/resend \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com"
  }'
```

**Request Body**

| Field    | Type     | Required | Description                             |
|----------|----------|----------|-----------------------------------------|
| `email`  | `string` | ❌ *     | User email (provide at least one)       |
| `mobile` | `string` | ❌ *     | User mobile (provide at least one)      |

**✅ Success Response — `200 OK`**
```json
{
  "success": true,
  "message": "OTP Resended successfully"
}
```

**❌ Error Response — `404 Not Found`**
```json
{
  "status": "fail",
  "message": "User not found"
}
```

---

### POST `/api/auth/login` — Login (Existing User)

Sends an OTP to an existing, active user's email for login.

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com"
  }'
```

**Request Body**

| Field    | Type     | Required | Description                       |
|----------|----------|----------|-----------------------------------|
| `email`  | `string` | ❌ *     | User email (provide at least one) |
| `mobile` | `string` | ❌ *     | User mobile (provide at least one)|

> After receiving OTP, verify it using `POST /api/auth/verify` to get the JWT token.

**✅ Success Response — `200 OK`**
```json
{
  "success": true,
  "message": "otp send successfully"
}
```

**❌ Error Response — `404 Not Found`**
```json
{
  "status": "fail",
  "message": "Invalid Email or Mobile"
}
```

---

## 👤 User Endpoints

Base path: `/api/users`  
Authentication: **🔒 Required (JWT)**

---

### GET `/api/users` — Get User Details

Fetches the current logged-in user's profile.

```bash
curl -X GET http://localhost:3001/api/users \
  -H "Authorization: Bearer <your_jwt_token>"
```

**✅ Success Response — `200 OK`**
```json
{
  "success": true,
  "message": "user details retrived",
  "data": {
    "id": "661ab23456789012345abcde",
    "username": "johndoe",
    "email": "john.doe@example.com",
    "mobile": "9876543210",
    "address": "123 Marine Drive",
    "pincode": "400001",
    "fcmToken": "firebase_token_here",
    "vendor": "false",
    "isActive": true
  }
}
```

**❌ Error Response — `404 Not Found`**
```json
{
  "status": "fail",
  "message": "user not found"
}
```

---

### PUT `/api/users` — Update User Profile

Updates the current user's address, pincode, or FCM token.

```bash
curl -X PUT http://localhost:3001/api/users \
  -H "Authorization: Bearer <your_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "address": "456 Seafood Street, Mumbai",
    "pincode": "400002",
    "fcmToken": "new_firebase_device_token"
  }'
```

**Request Body** (at least one field required)

| Field      | Type     | Required | Description                     |
|------------|----------|----------|---------------------------------|
| `address`  | `string` | ❌ *     | Delivery address                |
| `pincode`  | `string` | ❌ *     | Postal / ZIP code               |
| `fcmToken` | `string` | ❌ *     | Firebase Cloud Messaging token  |

**✅ Success Response — `200 OK`**
```json
{
  "success": true,
  "message": "user profile updated",
  "data": {
    "id": "661ab23456789012345abcde",
    "username": "johndoe",
    "email": "john.doe@example.com",
    "mobile": "9876543210",
    "address": "456 Seafood Street, Mumbai",
    "pincode": "400002",
    "fcmToken": "new_firebase_device_token",
    "vendor": "false",
    "isActive": true
  }
}
```

**❌ Error Response — `404 Not Found`**
```json
{
  "status": "fail",
  "message": "Invalid data"
}
```

---

## 🐟 Product Endpoints

Base path: `/api/products`  
Authentication: **🔒 Required (JWT)**  
File uploads use `multipart/form-data` with field name `image`.

---

### GET `/api/products` — Get All Products

Fetches all products with optional filtering and cursor-based pagination.

```bash
# Basic fetch
curl -X GET http://localhost:3001/api/products \
  -H "Authorization: Bearer <your_jwt_token>"

# With filters
curl -X GET "http://localhost:3001/api/products?search=salmon&category=fish&price=500&limit=10" \
  -H "Authorization: Bearer <your_jwt_token>"

# With cursor pagination (use nextCursor from previous response)
curl -X GET "http://localhost:3001/api/products?cursor=661ab23456789012345abcde&limit=10" \
  -H "Authorization: Bearer <your_jwt_token>"
```

**Query Parameters**

| Parameter  | Type     | Required | Default | Description                          |
|------------|----------|----------|---------|--------------------------------------|
| `search`   | `string` | ❌ No    | `""`    | Search by product title (insensitive)|
| `category` | `string` | ❌ No    | `""`    | Filter by category (insensitive)     |
| `price`    | `number` | ❌ No    | `null`  | Max price filter (`lte`)             |
| `limit`    | `number` | ❌ No    | `15`    | Items per page                       |
| `cursor`   | `string` | ❌ No    | `null`  | MongoDB ObjectId for cursor pagination|

**✅ Success Response — `200 OK`**
```json
{
  "success": true,
  "message": "",
  "data": {
    "products": [
      {
        "id": "661ab23456789012345abcde",
        "userId": "661ab23456789012345abcdf",
        "title": "Fresh Atlantic Salmon",
        "description": "Wild-caught premium salmon fillet",
        "price": 450.00,
        "offerPrice": 380.00,
        "availability": [1, 2, 3, 4, 5],
        "stock": 50,
        "category": "fish",
        "image": "image-1713780000000-salmon.jpg",
        "reviews": []
      }
    ],
    "pagination": {
      "nextCursor": "661ab23456789012345abcdf",
      "hasNextPage": true
    }
  }
}
```

---

### GET `/api/products/user` — Get My Products

Fetches all products listed by the authenticated vendor/user.

```bash
curl -X GET http://localhost:3001/api/products/user \
  -H "Authorization: Bearer <your_jwt_token>"
```

**✅ Success Response — `200 OK`**
```json
{
  "success": true,
  "message": "",
  "data": [
    {
      "id": "661ab23456789012345abcde",
      "userId": "661ab23456789012345abcdf",
      "title": "Fresh Atlantic Salmon",
      "description": "Wild-caught premium salmon fillet",
      "price": 450.00,
      "offerPrice": 380.00,
      "availability": [1, 2, 3, 4, 5],
      "stock": 50,
      "category": "fish",
      "image": "image-1713780000000-salmon.jpg",
      "reviews": []
    }
  ]
}
```

---

### GET `/api/products/:id` — Get Product by ID

Fetches a single product along with its average rating and vendor's shop name.

```bash
curl -X GET http://localhost:3001/api/products/661ab23456789012345abcde \
  -H "Authorization: Bearer <your_jwt_token>"
```

**Path Parameters**

| Parameter | Type     | Description         |
|-----------|----------|---------------------|
| `id`      | `string` | MongoDB ObjectId    |

**✅ Success Response — `200 OK`**
```json
{
  "success": true,
  "message": "",
  "data": {
    "product": {
      "id": "661ab23456789012345abcde",
      "userId": "661ab23456789012345abcdf",
      "title": "Fresh Atlantic Salmon",
      "description": "Wild-caught premium salmon fillet",
      "price": 450.00,
      "offerPrice": 380.00,
      "availability": [1, 2, 3, 4, 5],
      "stock": 50,
      "category": "fish",
      "image": "image-1713780000000-salmon.jpg",
      "reviews": [
        { "review": "Great quality!", "rating": 5, "userId": "661ab23..." }
      ]
    },
    "shopname": "Ocean Fresh Seafood",
    "rating": 4.5
  }
}
```

---

### POST `/api/products` — Add New Product

Creates a new product listing. Requires `multipart/form-data` with an image file.

```bash
curl -X POST http://localhost:3001/api/products \
  -H "Authorization: Bearer <your_jwt_token>" \
  -F "title=Fresh Tuna Steak" \
  -F "description=Premium bluefin tuna, sashimi grade" \
  -F "price=650" \
  -F "offerPrice=580" \
  -F "stock=30" \
  -F "availability=1,2,3,4,5,6" \
  -F "category=fish" \
  -F "image=@/path/to/tuna.jpg"
```

**Form Fields**

| Field          | Type     | Required | Description                                    |
|----------------|----------|----------|------------------------------------------------|
| `title`        | `string` | ✅ Yes   | Product title                                  |
| `description`  | `string` | ✅ Yes   | Product description                            |
| `price`        | `number` | ✅ Yes   | Original price (float)                         |
| `offerPrice`   | `number` | ✅ Yes   | Discounted / offer price (float)               |
| `stock`        | `number` | ✅ Yes   | Available stock quantity                       |
| `availability` | `string` | ✅ Yes   | Comma-separated day indices (e.g., `"1,2,3"`)  |
| `category`     | `string` | ✅ Yes   | Product category (e.g., `fish`, `meat`)        |
| `image`        | `file`   | ✅ Yes   | Product image file (resized to 800px JPEG)     |

> **Image Processing:** Images are auto-resized to 800px width, converted to progressive JPEG at 60% quality using `sharp`.

**✅ Success Response — `201 Created`**
```json
{
  "success": true,
  "message": "Product added",
  "data": {
    "id": "661ab23456789012345abcde",
    "userId": "661ab23456789012345user1",
    "title": "Fresh Tuna Steak",
    "description": "Premium bluefin tuna, sashimi grade",
    "price": 650.00,
    "offerPrice": 580.00,
    "stock": 30,
    "availability": [1, 2, 3, 4, 5, 6],
    "category": "fish",
    "image": "image-1713780000000-tuna.jpg"
  }
}
```

**❌ Error Response — `400 Bad Request` (Missing fields)**
```json
{
  "status": "fail",
  "message": "title, description, price, stock, offerPrice, availability and category are required"
}
```

**❌ Error Response — `400 Bad Request` (No image)**
```json
{
  "status": "fail",
  "message": "no files"
}
```

---

### PUT `/api/products/:id` — Update Product

Updates an existing product. Optionally replaces the image.

```bash
# Update text fields only
curl -X PUT http://localhost:3001/api/products/661ab23456789012345abcde \
  -H "Authorization: Bearer <your_jwt_token>" \
  -F "title=Premium Tuna Steak" \
  -F "description=Updated description" \
  -F "price=700" \
  -F "availability=1,2,3,4,5" \
  -F "category=fish"

# Update with new image
curl -X PUT http://localhost:3001/api/products/661ab23456789012345abcde \
  -H "Authorization: Bearer <your_jwt_token>" \
  -F "title=Premium Tuna Steak" \
  -F "price=700" \
  -F "availability=1,2,3,4" \
  -F "category=fish" \
  -F "image=@/path/to/new_tuna.jpg"
```

**Path Parameters**

| Parameter | Type     | Description      |
|-----------|----------|------------------|
| `id`      | `string` | MongoDB ObjectId |

**Form Fields** (all optional)

| Field          | Type     | Description                                    |
|----------------|----------|------------------------------------------------|
| `title`        | `string` | Updated product title                          |
| `description`  | `string` | Updated description                            |
| `price`        | `number` | Updated price                                  |
| `availability` | `string` | Comma-separated day indices                    |
| `category`     | `string` | Updated category                               |
| `image`        | `file`   | New product image (optional)                   |

**✅ Success Response — `200 OK`**
```json
{
  "success": true,
  "message": "product updated successfully",
  "data": {
    "id": "661ab23456789012345abcde",
    "userId": "661ab23456789012345user1",
    "title": "Premium Tuna Steak",
    "description": "Updated description",
    "price": 700.00,
    "offerPrice": 580.00,
    "availability": [1, 2, 3, 4, 5],
    "stock": 30,
    "category": "fish",
    "image": "image-1713780001000-new_tuna.jpg"
  }
}
```

---

### DELETE `/api/products/:id` — Delete Product

Permanently deletes a product listing.

```bash
curl -X DELETE http://localhost:3001/api/products/661ab23456789012345abcde \
  -H "Authorization: Bearer <your_jwt_token>"
```

**Path Parameters**

| Parameter | Type     | Description      |
|-----------|----------|------------------|
| `id`      | `string` | MongoDB ObjectId |

**✅ Success Response — `200 OK`**
```json
{
  "success": true,
  "message": "product deleted",
  "data": {
    "id": "661ab23456789012345abcde",
    "title": "Fresh Tuna Steak"
  }
}
```

---

### PUT `/api/products/:id/review` — Add Product Review

Adds a review and rating to a product.

```bash
curl -X PUT http://localhost:3001/api/products/661ab23456789012345abcde/review \
  -H "Authorization: Bearer <your_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "review": "Absolutely fresh and delicious! Will order again.",
    "rating": 5
  }'
```

**Path Parameters**

| Parameter | Type     | Description      |
|-----------|----------|------------------|
| `id`      | `string` | MongoDB ObjectId |

**Request Body**

| Field    | Type     | Required | Description              |
|----------|----------|----------|--------------------------|
| `review` | `string` | ✅ Yes   | Text review content      |
| `rating` | `number` | ✅ Yes   | Rating (e.g., 1–5)       |

**✅ Success Response — `201 Created`**
```json
{
  "success": true,
  "message": "Review added successfully"
}
```

**❌ Error Response — `404 Not Found`**
```json
{
  "status": "fail",
  "message": "product not found"
}
```

---

## 🛒 Cart Endpoints

Base path: `/api/carts`  
Authentication: **🔒 Required (JWT)**

---

### POST `/api/carts` — Add to Cart

Adds a product to the user's cart. If the product already exists in the cart, increments the quantity by 1.

```bash
curl -X POST http://localhost:3001/api/carts \
  -H "Authorization: Bearer <your_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "661ab23456789012345abcde",
    "title": "Fresh Atlantic Salmon",
    "description": "Wild-caught premium salmon fillet",
    "price": 450.00,
    "offerPrice": 380.00,
    "stock": 50,
    "image": "image-1713780000000-salmon.jpg",
    "reviews": [],
    "availability": [1, 2, 3, 4, 5],
    "category": "fish"
  }'
```

**Request Body**

| Field          | Type     | Required | Description                     |
|----------------|----------|----------|---------------------------------|
| `productId`    | `string` | ✅ Yes   | MongoDB ObjectId of the product |
| `title`        | `string` | ✅ Yes   | Product title (denormalized)    |
| `description`  | `string` | ✅ Yes   | Product description             |
| `price`        | `number` | ✅ Yes   | Original price                  |
| `offerPrice`   | `number` | ❌ No    | Offer/discounted price          |
| `stock`        | `number` | ✅ Yes   | Product stock count             |
| `image`        | `string` | ✅ Yes   | Image filename                  |
| `reviews`      | `array`  | ❌ No    | Reviews array                   |
| `availability` | `array`  | ❌ No    | Availability days               |
| `category`     | `string` | ✅ Yes   | Product category                |

**✅ Success Response — `201 Created` (New cart item)**
```json
{
  "success": true,
  "message": "product added to cart",
  "data": {
    "id": "661ab23456789012345cart1",
    "userId": "661ab23456789012345user1",
    "productId": "661ab23456789012345abcde",
    "quantity": 1,
    "title": "Fresh Atlantic Salmon",
    "price": 450.00,
    "offerPrice": 380.00,
    "stock": 50,
    "image": "image-1713780000000-salmon.jpg",
    "category": "fish"
  }
}
```

**✅ Success Response — `200 OK` (Existing item, quantity updated)**
```json
{
  "success": true,
  "message": "Quantity Updated",
  "data": {
    "id": "661ab23456789012345cart1",
    "userId": "661ab23456789012345user1",
    "productId": "661ab23456789012345abcde",
    "quantity": 2
  }
}
```

---

### GET `/api/carts` — Get Cart Items

Retrieves all items in the current user's cart.

```bash
curl -X GET http://localhost:3001/api/carts \
  -H "Authorization: Bearer <your_jwt_token>"
```

**✅ Success Response — `200 OK`**
```json
{
  "success": true,
  "message": "",
  "data": [
    {
      "id": "661ab23456789012345cart1",
      "userId": "661ab23456789012345user1",
      "productId": "661ab23456789012345abcde",
      "quantity": 2,
      "title": "Fresh Atlantic Salmon",
      "description": "Wild-caught premium salmon fillet",
      "price": 450.00,
      "offerPrice": 380.00,
      "stock": 50,
      "image": "image-1713780000000-salmon.jpg",
      "reviews": [],
      "availability": [1, 2, 3, 4, 5],
      "category": "fish"
    }
  ]
}
```

---

### DELETE `/api/carts/:id` — Remove from Cart

Removes a specific item from the cart by its cart document ID.

```bash
curl -X DELETE http://localhost:3001/api/carts/661ab23456789012345cart1 \
  -H "Authorization: Bearer <your_jwt_token>"
```

**Path Parameters**

| Parameter | Type     | Description          |
|-----------|----------|----------------------|
| `id`      | `string` | Cart item MongoDB ID |

**✅ Success Response — `200 OK`**
```json
{
  "success": true,
  "message": "item deleted",
  "data": {
    "id": "661ab23456789012345cart1",
    "productId": "661ab23456789012345abcde"
  }
}
```

---

### GET `/api/carts/:id/increase` — Increase Item Quantity

Increments the quantity of a cart item by 1.

```bash
curl -X GET http://localhost:3001/api/carts/661ab23456789012345cart1/increase \
  -H "Authorization: Bearer <your_jwt_token>"
```

**Path Parameters**

| Parameter | Type     | Description          |
|-----------|----------|----------------------|
| `id`      | `string` | Cart item MongoDB ID |

**✅ Success Response — `200 OK`**
```json
{
  "success": true,
  "message": "Quantity Increased",
  "data": {
    "id": "661ab23456789012345cart1",
    "quantity": 3
  }
}
```

---

### GET `/api/carts/:id/decrease` — Decrease Item Quantity

Decrements the quantity of a cart item by 1. If quantity reaches 0, the item is automatically removed from the cart.

```bash
curl -X GET http://localhost:3001/api/carts/661ab23456789012345cart1/decrease \
  -H "Authorization: Bearer <your_jwt_token>"
```

**Path Parameters**

| Parameter | Type     | Description          |
|-----------|----------|----------------------|
| `id`      | `string` | Cart item MongoDB ID |

**✅ Success Response — `200 OK` (Quantity decreased)**
```json
{
  "success": true,
  "message": "Quantity Decreased",
  "data": {
    "id": "661ab23456789012345cart1",
    "quantity": 1
  }
}
```

**✅ Success Response — `200 OK` (Item removed when qty ≤ 1)**
```json
{
  "success": true,
  "message": "item removed from cart"
}
```

**❌ Error Response — `404 Not Found`**
```json
{
  "status": "fail",
  "message": "Cart item not found"
}
```

---

## 💳 Checkout Endpoints

Base path: `/api/checkouts`  
Authentication: **🔒 Required (JWT)**

---

### POST `/api/checkouts` — Checkout Cart

Creates a Razorpay order from the current cart and saves it as a PENDING order in the database.

```bash
# Standard delivery
curl -X POST http://localhost:3001/api/checkouts \
  -H "Authorization: Bearer <your_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "discountAmount": 350.00,
    "address": "456 Marine Drive, Mumbai",
    "pincode": "400001"
  }'

# Pre-order (scheduled delivery)
curl -X POST http://localhost:3001/api/checkouts \
  -H "Authorization: Bearer <your_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "discountAmount": 350.00,
    "address": "456 Marine Drive, Mumbai",
    "pincode": "400001",
    "preOrder": "25/12/2026"
  }'
```

**Request Body**

| Field            | Type     | Required | Description                              |
|------------------|----------|----------|------------------------------------------|
| `discountAmount` | `number` | ✅ Yes   | Final amount after applying promo codes  |
| `address`        | `string` | ✅ Yes   | Delivery address                         |
| `pincode`        | `string` | ✅ Yes   | Delivery postal code                     |
| `preOrder`       | `string` | ❌ No    | Pre-order date in `DD/MM/YYYY` format    |

**✅ Success Response — `201 Created`**
```json
{
  "success": true,
  "message": "order added successfully",
  "data": {
    "id": "661ab23456789012345order1",
    "userId": "661ab23456789012345user1",
    "amount": 900.00,
    "discountAmount": 350.00,
    "status": "PENDING",
    "address": "456 Marine Drive, Mumbai",
    "pincode": "400001",
    "razorpayOrderId": "order_RazorpayIdHere123",
    "paymentId": null,
    "preOrder": "2026-12-25",
    "date": "2026-04-22T09:00:00.000Z",
    "items": [
      {
        "productId": "661ab23456789012345abcde",
        "title": "Fresh Atlantic Salmon",
        "quantity": 2,
        "price": 450.00
      }
    ]
  }
}
```

**❌ Error Response — `404 Not Found` (Empty cart)**
```json
{
  "status": "fail",
  "message": "Cart is empty"
}
```

---

### POST `/api/checkouts/comfirm-payment` — Confirm Payment

Confirms a Razorpay payment, updates order status, generates and emails a PDF invoice, and decrements product stock. On PAID status, clears the cart.

```bash
curl -X POST http://localhost:3001/api/checkouts/comfirm-payment \
  -H "Authorization: Bearer <your_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "order_RazorpayIdHere123",
    "paymentId": "pay_RazorpayPaymentId456",
    "status": "PAID"
  }'
```

**Request Body**

| Field       | Type     | Required | Description                                          |
|-------------|----------|----------|------------------------------------------------------|
| `orderId`   | `string` | ✅ Yes   | Razorpay Order ID (from checkout response)           |
| `paymentId` | `string` | ✅ Yes   | Razorpay Payment ID (from Razorpay SDK callback)     |
| `status`    | `string` | ✅ Yes   | `"PAID"` or `"FAILED"`                               |

**Side Effects when `status === "PAID"`:**
- 📧 Generates and emails a PDF invoice to the user
- 📦 Decrements stock for each purchased product
- 🗑️ Clears the user's cart

**✅ Success Response — `200 OK`**
```json
{
  "success": true,
  "message": "payment conformed",
  "data": {
    "id": "661ab23456789012345order1",
    "userId": "661ab23456789012345user1",
    "amount": 900.00,
    "discountAmount": 350.00,
    "status": "PAID",
    "address": "456 Marine Drive, Mumbai",
    "pincode": "400001",
    "razorpayOrderId": "order_RazorpayIdHere123",
    "paymentId": "pay_RazorpayPaymentId456",
    "date": "2026-04-22T09:00:00.000Z",
    "items": [ ... ]
  }
}
```

---

## 📦 Order Endpoints

Base path: `/api/orders`  
Authentication: **🔒 Required (JWT)**

---

### GET `/api/orders` — Get Order History

Retrieves all orders placed by the authenticated user.

```bash
curl -X GET http://localhost:3001/api/orders \
  -H "Authorization: Bearer <your_jwt_token>"
```

**✅ Success Response — `200 OK`**
```json
{
  "success": true,
  "message": "",
  "data": [
    {
      "id": "661ab23456789012345order1",
      "userId": "661ab23456789012345user1",
      "amount": 900.00,
      "discountAmount": 350.00,
      "status": "PAID",
      "date": "2026-04-22T09:00:00.000Z",
      "address": "456 Marine Drive, Mumbai",
      "pincode": "400001",
      "razorpayOrderId": "order_RazorpayIdHere123",
      "paymentId": "pay_RazorpayPaymentId456",
      "preOrder": null,
      "items": [
        {
          "productId": "661ab23456789012345abcde",
          "title": "Fresh Atlantic Salmon",
          "quantity": 2,
          "price": 450.00
        }
      ]
    }
  ]
}
```

---

### GET `/api/orders/:id` — Get Single Order

Retrieves a specific order by its ID.

```bash
curl -X GET http://localhost:3001/api/orders/661ab23456789012345order1 \
  -H "Authorization: Bearer <your_jwt_token>"
```

**Path Parameters**

| Parameter | Type     | Description      |
|-----------|----------|------------------|
| `id`      | `string` | MongoDB ObjectId |

**✅ Success Response — `200 OK`**
```json
{
  "success": true,
  "message": "",
  "data": {
    "id": "661ab23456789012345order1",
    "userId": "661ab23456789012345user1",
    "amount": 900.00,
    "discountAmount": 350.00,
    "status": "PAID",
    "date": "2026-04-22T09:00:00.000Z",
    "address": "456 Marine Drive, Mumbai",
    "pincode": "400001",
    "razorpayOrderId": "order_RazorpayIdHere123",
    "paymentId": "pay_RazorpayPaymentId456",
    "preOrder": null,
    "items": [
      {
        "productId": "661ab23456789012345abcde",
        "title": "Fresh Atlantic Salmon",
        "quantity": 2,
        "price": 450.00
      }
    ]
  }
}
```

---

## 🎫 Promocode Endpoints

Base path: `/api/promocodes`  
Authentication: **🔒 Required (JWT)** (except DELETE which has no middleware)

---

### POST `/api/promocodes` — Create Promocode

Creates a new vendor-specific promo code. The vendor is identified from the JWT token.

```bash
curl -X POST http://localhost:3001/api/promocodes \
  -H "Authorization: Bearer <your_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "discount": 15,
    "minAmount": 500,
    "expiry": "31/12/2026"
  }'
```

**Request Body**

| Field       | Type     | Required | Description                              |
|-------------|----------|----------|------------------------------------------|
| `discount`  | `number` | ✅ Yes   | Discount percentage (e.g., `15` = 15%)   |
| `minAmount` | `number` | ✅ Yes   | Minimum order amount to apply code       |
| `expiry`    | `string` | ✅ Yes   | Expiry date in `DD/MM/YYYY` format       |

**✅ Success Response — `201 Created`**
```json
{
  "success": true,
  "message": "promocode created successfully",
  "data": {
    "id": "661ab23456789012345promo1",
    "code": "FISH2026XYZ",
    "vendorId": "661ab23456789012345vendor1",
    "discountPercentage": 15,
    "minAmount": 500,
    "expiry": "2026-12-31T23:59:59.999Z",
    "createdAt": "2026-04-22T09:00:00.000Z"
  }
}
```

---

### GET `/api/promocodes` — Get Vendor Promocodes

Returns all promo codes created by the authenticated vendor.

```bash
curl -X GET http://localhost:3001/api/promocodes \
  -H "Authorization: Bearer <your_jwt_token>"
```

**✅ Success Response — `200 OK`**
```json
{
  "success": true,
  "message": "",
  "data": [
    {
      "id": "661ab23456789012345promo1",
      "code": "FISH2026XYZ",
      "vendorId": "661ab23456789012345vendor1",
      "discountPercentage": 15,
      "minAmount": 500,
      "expiry": "2026-12-31T23:59:59.999Z",
      "createdAt": "2026-04-22T09:00:00.000Z"
    }
  ]
}
```

**❌ Error Response — `404 Not Found`**
```json
{
  "status": "fail",
  "message": "Vendor not found"
}
```

---

### POST `/api/promocodes/verify` — Apply / Verify Promocode

Validates a promo code and returns discount details if valid.

```bash
curl -X POST http://localhost:3001/api/promocodes/verify \
  -H "Authorization: Bearer <your_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "FISH2026XYZ"
  }'
```

**Request Body**

| Field  | Type     | Required | Description          |
|--------|----------|----------|----------------------|
| `code` | `string` | ✅ Yes   | Promo code to verify |

**✅ Success Response — `200 OK`**
```json
{
  "success": true,
  "message": "Valid promo code ",
  "data": {
    "id": "661ab23456789012345promo1",
    "code": "FISH2026XYZ",
    "vendorId": "661ab23456789012345vendor1",
    "discountPercentage": 15,
    "minAmount": 500,
    "expiry": "2026-12-31T23:59:59.999Z"
  }
}
```

**❌ Error Response — `404 Not Found` (Invalid code)**
```json
{
  "status": "fail",
  "message": "Invalid promo code"
}
```

**❌ Error Response — `404 Not Found` (Expired)**
```json
{
  "status": "fail",
  "message": "Expired promo code"
}
```

---

### PUT `/api/promocodes/:id` — Edit Promocode

Updates an existing promo code's discount percentage and/or expiry date.

```bash
curl -X PUT http://localhost:3001/api/promocodes/661ab23456789012345promo1 \
  -H "Authorization: Bearer <your_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "discount": 20,
    "expiry": "28/02/2027"
  }'
```

**Path Parameters**

| Parameter | Type     | Description      |
|-----------|----------|------------------|
| `id`      | `string` | MongoDB ObjectId |

**Request Body**

| Field     | Type     | Required | Description                          |
|-----------|----------|----------|--------------------------------------|
| `discount`| `number` | ✅ Yes   | New discount percentage              |
| `expiry`  | `string` | ✅ Yes   | New expiry in `DD/MM/YYYY` format    |

**✅ Success Response — `200 OK`**
```json
{
  "success": true,
  "message": "promocode updated",
  "data": {
    "id": "661ab23456789012345promo1",
    "discountPercentage": 20,
    "expiry": "2027-02-28T23:59:59.999Z"
  }
}
```

---

### DELETE `/api/promocodes/:id` — Delete Promocode

Permanently deletes a promo code.

> ⚠️ **Note:** This endpoint has **no JWT authentication middleware** in the current implementation.

```bash
curl -X DELETE http://localhost:3001/api/promocodes/661ab23456789012345promo1
```

**Path Parameters**

| Parameter | Type     | Description      |
|-----------|----------|------------------|
| `id`      | `string` | MongoDB ObjectId |

**✅ Success Response — `200 OK`**
```json
{
  "success": true,
  "message": "promocode deleted",
  "data": {
    "id": "661ab23456789012345promo1",
    "code": "FISH2026XYZ"
  }
}
```

---

## 🏪 Vendor Endpoints

Base path: `/api/vendor`  
Authentication: **🔒 Required (JWT)**

---

### POST `/api/vendor/apply` — Apply as Vendor

Submits a vendor application. Requires business KYC details.

```bash
curl -X POST http://localhost:3001/api/vendor/apply \
  -H "Authorization: Bearer <your_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "shopname": "Ocean Fresh Seafood",
    "pan": "ABCDE1234F",
    "aadhaar": "123456789012",
    "gstNumber": "27ABCDE1234F1Z5",
    "location": "Sassoon Docks, Mumbai"
  }'
```

**Request Body**

| Field       | Type     | Required | Description                     |
|-------------|----------|----------|---------------------------------|
| `shopname`  | `string` | ✅ Yes   | Name of the shop/business       |
| `pan`       | `string` | ✅ Yes   | PAN card number (India KYC)     |
| `aadhaar`   | `string` | ✅ Yes   | Aadhaar card number             |
| `gstNumber` | `string` | ✅ Yes   | GST registration number         |
| `location`  | `string` | ✅ Yes   | Physical shop location          |

**✅ Success Response — `201 Created`**
```json
{
  "success": true,
  "message": "Application send successfully"
}
```

**❌ Error Response — `404 Not Found` (Missing fields)**
```json
{
  "status": "fail",
  "message": "Invalid data"
}
```

**❌ Error Response — `404 Not Found` (Already applied)**
```json
{
  "status": "fail",
  "message": "vendor already exsist"
}
```

---

### GET `/api/vendor/status` — Get Application Status

Returns the current vendor application status and details.

```bash
curl -X GET http://localhost:3001/api/vendor/status \
  -H "Authorization: Bearer <your_jwt_token>"
```

**✅ Success Response — `200 OK`**
```json
{
  "success": true,
  "message": "Application details retrived",
  "data": {
    "id": "661ab23456789012345vendor1",
    "userId": "661ab23456789012345user1",
    "email": "vendor@example.com",
    "mobile": "9876543210",
    "name": "John Doe",
    "shopname": "Ocean Fresh Seafood",
    "pan": "ABCDE1234F",
    "aadhaar": "123456789012",
    "gstNumber": "27ABCDE1234F1Z5",
    "location": "Sassoon Docks, Mumbai",
    "status": "pending",
    "isActive": true,
    "createdAt": "2026-04-22T09:00:00.000Z"
  }
}
```

**Possible `status` values:** `"pending"`, `"success"`, `"rejected"`

**❌ Error Response — `404 Not Found`**
```json
{
  "status": "fail",
  "message": "Application not found"
}
```

---

### POST `/api/vendor/offers` — Request Special Offer Notification

Submits a request for a push-notification campaign to be approved by admin.

```bash
curl -X POST http://localhost:3001/api/vendor/offers \
  -H "Authorization: Bearer <your_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Weekend Fish Sale!",
    "body": "Get 20% off all fresh fish this weekend only. Limited stock!",
    "dateTime": "2026-05-01T10:00:00",
    "productId": "661ab23456789012345abcde"
  }'
```

**Request Body**

| Field       | Type     | Required | Description                         |
|-------------|----------|----------|-------------------------------------|
| `title`     | `string` | ✅ Yes   | Notification title                  |
| `body`      | `string` | ✅ Yes   | Notification body text              |
| `dateTime`  | `string` | ✅ Yes   | Scheduled date/time for campaign    |
| `productId` | `string` | ✅ Yes   | Product MongoDB ObjectId            |

**✅ Success Response — `201 Created`**
```json
{
  "success": true,
  "message": "data added successfully wait for admins approval"
}
```

**❌ Error Response — `404 Not Found`**
```json
{
  "status": "fail",
  "message": "vendor not found"
}
```

---

### GET `/api/vendor/offer/:id` — Get Offer Notification Status

Gets the status of a specific offer notification request.

```bash
curl -X GET http://localhost:3001/api/vendor/offer/661ab23456789012345offer1 \
  -H "Authorization: Bearer <your_jwt_token>"
```

**Path Parameters**

| Parameter | Type     | Description      |
|-----------|----------|------------------|
| `id`      | `string` | MongoDB ObjectId |

**✅ Success Response — `200 OK`**
```json
{
  "success": true,
  "message": "",
  "data": {
    "id": "661ab23456789012345offer1",
    "title": "Weekend Fish Sale!",
    "body": "Get 20% off all fresh fish this weekend only. Limited stock!",
    "status": "pending",
    "dateTime": "2026-05-01T10:00:00",
    "vendorId": "661ab23456789012345vendor1",
    "productId": "661ab23456789012345abcde"
  }
}
```

**Possible `status` values:** `"pending"`, `"approved"`, `"rejected"`

**❌ Error Response — `404 Not Found`**
```json
{
  "status": "fail",
  "message": "offer notification not found"
}
```

---

### GET `/api/vendor/offers` — Get Notification History

Returns all offer notification requests submitted by the authenticated vendor.

```bash
curl -X GET http://localhost:3001/api/vendor/offers \
  -H "Authorization: Bearer <your_jwt_token>"
```

**✅ Success Response — `200 OK`**
```json
{
  "success": true,
  "message": "",
  "data": [
    {
      "id": "661ab23456789012345offer1",
      "title": "Weekend Fish Sale!",
      "body": "Get 20% off all fresh fish this weekend only.",
      "status": "approved",
      "dateTime": "2026-05-01T10:00:00",
      "vendorId": "661ab23456789012345vendor1",
      "productId": "661ab23456789012345abcde"
    }
  ]
}
```

---

## 🛡️ Admin Endpoints

Base path: `/api/admin`  
Authentication: **None enforced at route level** *(admin auth should be added in production)*

> ⚠️ **Security Note:** Admin routes currently have **no JWT middleware**. All admin endpoints are unprotected at the route level in the current implementation.

---

### 👥 User Management

#### GET `/api/admin/users` — Get All Users

Returns all non-vendor user accounts.

```bash
curl -X GET http://localhost:3001/api/admin/users
```

**✅ Success Response — `200 OK`**
```json
{
  "success": true,
  "message": "",
  "data": [
    {
      "id": "661ab23456789012345user1",
      "username": "johndoe",
      "email": "john@example.com",
      "mobile": "9876543210",
      "address": "123 Marine Drive",
      "pincode": "400001",
      "vendor": "false",
      "isActive": true
    }
  ]
}
```

---

#### GET `/api/admin/user/:id` — Get Single User

```bash
curl -X GET http://localhost:3001/api/admin/user/661ab23456789012345user1
```

**Path Parameters**

| Parameter | Type     | Description      |
|-----------|----------|------------------|
| `id`      | `string` | MongoDB ObjectId |

**✅ Success Response — `200 OK`**
```json
{
  "success": true,
  "message": "",
  "data": {
    "id": "661ab23456789012345user1",
    "username": "johndoe",
    "email": "john@example.com",
    "mobile": "9876543210",
    "isActive": true,
    "vendor": "false"
  }
}
```

---

#### PUT `/api/admin/users/activate/:id` — Activate Account

Activates a user or vendor account.

```bash
# Activate a user
curl -X PUT http://localhost:3001/api/admin/users/activate/661ab23456789012345user1 \
  -H "Content-Type: application/json" \
  -d '{ "role": "user" }'

# Activate a vendor
curl -X PUT http://localhost:3001/api/admin/users/activate/661ab23456789012345vendor1 \
  -H "Content-Type: application/json" \
  -d '{ "role": "vendor" }'
```

**Request Body**

| Field  | Type     | Required | Values              |
|--------|----------|----------|---------------------|
| `role` | `string` | ✅ Yes   | `"user"` or `"vendor"` |

**✅ Success Response — `200 OK`**
```json
{
  "success": true,
  "message": "",
  "data": {
    "id": "661ab23456789012345user1",
    "isActive": true
  }
}
```

---

#### PUT `/api/admin/users/deactivate/:id` — Deactivate Account

Deactivates a user or vendor account.

```bash
curl -X PUT http://localhost:3001/api/admin/users/deactivate/661ab23456789012345user1 \
  -H "Content-Type: application/json" \
  -d '{ "role": "user" }'
```

**Request Body**

| Field  | Type     | Required | Values                   |
|--------|----------|----------|--------------------------|
| `role` | `string` | ✅ Yes   | `"user"` or `"vendor"` |

**✅ Success Response — `200 OK`**
```json
{
  "success": true,
  "message": "",
  "data": {
    "id": "661ab23456789012345user1",
    "isActive": false
  }
}
```

---

### 🏪 Vendor Management

#### GET `/api/admin/vendors/applications` — Get Pending Vendor Applications

Returns all vendor applications with `status: "pending"`.

```bash
curl -X GET http://localhost:3001/api/admin/vendors/applications
```

**✅ Success Response — `200 OK`**
```json
{
  "success": true,
  "message": "",
  "data": [
    {
      "id": "661ab23456789012345vendor1",
      "userId": "661ab23456789012345user1",
      "email": "vendor@example.com",
      "name": "John Doe",
      "shopname": "Ocean Fresh Seafood",
      "pan": "ABCDE1234F",
      "aadhaar": "123456789012",
      "gstNumber": "27ABCDE1234F1Z5",
      "location": "Sassoon Docks, Mumbai",
      "status": "pending",
      "createdAt": "2026-04-22T09:00:00.000Z"
    }
  ]
}
```

---

#### GET `/api/admin/vendors/application/:id` — Get Specific Vendor Application

```bash
curl -X GET http://localhost:3001/api/admin/vendors/application/661ab23456789012345vendor1
```

**Path Parameters**

| Parameter | Type     | Description      |
|-----------|----------|------------------|
| `id`      | `string` | MongoDB ObjectId |

---

#### PUT `/api/admin/vendors/:id/verify` — Verify Vendor Application

Approves or rejects a vendor application and updates the user's vendor status accordingly.

```bash
# Approve
curl -X PUT http://localhost:3001/api/admin/vendors/661ab23456789012345vendor1/verify \
  -H "Content-Type: application/json" \
  -d '{ "status": "success" }'

# Reject
curl -X PUT http://localhost:3001/api/admin/vendors/661ab23456789012345vendor1/verify \
  -H "Content-Type: application/json" \
  -d '{ "status": "rejected" }'
```

**Request Body**

| Field    | Type     | Required | Values                         |
|----------|----------|----------|--------------------------------|
| `status` | `string` | ✅ Yes   | `"success"` or `"rejected"` |

**✅ Success Response — `200 OK`**
```json
{
  "success": true,
  "message": "Application status updated"
}
```

**❌ Error Response — `400 Bad Request`**
```json
{
  "status": "fail",
  "message": "status required"
}
```

---

#### GET `/api/admin/vendors` — Get All Approved Vendors

Returns all vendors with `status: "success"`.

```bash
curl -X GET http://localhost:3001/api/admin/vendors
```

**✅ Success Response — `200 OK`**
```json
{
  "success": true,
  "message": "",
  "data": [
    {
      "id": "661ab23456789012345vendor1",
      "shopname": "Ocean Fresh Seafood",
      "email": "vendor@example.com",
      "status": "success",
      "isActive": true
    }
  ]
}
```

---

#### GET `/api/admin/vendor/:id` — Get Single Vendor

```bash
curl -X GET http://localhost:3001/api/admin/vendor/661ab23456789012345vendor1
```

---

### 📊 Analytics

#### GET `/api/admin/analytics/sales-report` — Sales Report

Returns total revenue (sum of discount amounts) and total order count.

```bash
curl -X GET http://localhost:3001/api/admin/analytics/sales-report
```

**✅ Success Response — `200 OK`**
```json
{
  "success": true,
  "message": "",
  "data": {
    "totalRevenue": 125430.50,
    "totalOrders": 342
  }
}
```

---

#### POST `/api/admin/analytics/top-product` — Top Selling Products

Returns top 5 most sold products within a time period.

```bash
# Top products this week
curl -X POST http://localhost:3001/api/admin/analytics/top-product \
  -H "Content-Type: application/json" \
  -d '{ "period": "week" }'

# Top products this month
curl -X POST http://localhost:3001/api/admin/analytics/top-product \
  -H "Content-Type: application/json" \
  -d '{ "period": "month" }'
```

**Request Body**

| Field    | Type     | Required | Values              |
|----------|----------|----------|---------------------|
| `period` | `string` | ✅ Yes   | `"week"` or `"month"` |

**✅ Success Response — `200 OK`**
```json
{
  "success": true,
  "message": "",
  "data": [
    {
      "id": "661ab23456789012345abcde",
      "title": "Fresh Atlantic Salmon",
      "price": 450.00,
      "category": "fish",
      "stock": 48
    },
    {
      "id": "661ab23456789012345abcdf",
      "title": "Premium Chicken Breast",
      "price": 250.00,
      "category": "meat",
      "stock": 95
    }
  ]
}
```

**❌ Error Response — `404 Not Found` (Invalid period)**
```json
{
  "status": "fail",
  "message": "Invalid period. Use week or month"
}
```

---

#### POST `/api/admin/analytics/top-vendor` — Top Revenue Generating Vendor

Returns the single highest-revenue vendor within a time period.

```bash
curl -X POST http://localhost:3001/api/admin/analytics/top-vendor \
  -H "Content-Type: application/json" \
  -d '{ "period": "month" }'
```

**Request Body**

| Field    | Type     | Required | Values              |
|----------|----------|----------|---------------------|
| `period` | `string` | ✅ Yes   | `"week"` or `"month"` |

**✅ Success Response — `200 OK`**
```json
{
  "success": true,
  "message": "",
  "data": {
    "vendor": {
      "id": "661ab23456789012345vendor1",
      "shopname": "Ocean Fresh Seafood",
      "email": "vendor@example.com",
      "location": "Sassoon Docks, Mumbai"
    },
    "profit": 45230.00,
    "quantity": 134
  }
}
```

---

### 🔔 Notification Management

#### GET `/api/admin/notifications/requests` — Get Pending Offer Requests

Returns all offer notification requests with `status: "pending"`.

```bash
curl -X GET http://localhost:3001/api/admin/notifications/requests
```

**✅ Success Response — `200 OK`**
```json
{
  "success": true,
  "message": "",
  "data": [
    {
      "id": "661ab23456789012345offer1",
      "title": "Weekend Fish Sale!",
      "body": "Get 20% off all fresh fish this weekend only.",
      "status": "pending",
      "dateTime": "2026-05-01T10:00:00",
      "vendorId": "661ab23456789012345vendor1",
      "productId": "661ab23456789012345abcde"
    }
  ]
}
```

---

#### GET `/api/admin/notifications/requests/:id` — Get Single Offer Request

```bash
curl -X GET http://localhost:3001/api/admin/notifications/requests/661ab23456789012345offer1
```

---

#### PUT `/api/admin/notifications/requests/:id` — Approve/Reject Offer Request

Updates the status of an offer notification request.

```bash
# Approve
curl -X PUT http://localhost:3001/api/admin/notifications/requests/661ab23456789012345offer1 \
  -H "Content-Type: application/json" \
  -d '{ "status": "approved" }'

# Reject
curl -X PUT http://localhost:3001/api/admin/notifications/requests/661ab23456789012345offer1 \
  -H "Content-Type: application/json" \
  -d '{ "status": "rejected" }'
```

**Request Body**

| Field    | Type     | Required | Values                         |
|----------|----------|----------|--------------------------------|
| `status` | `string` | ✅ Yes   | `"approved"` or `"rejected"` |

**✅ Success Response — `200 OK`**
```json
{
  "success": true,
  "message": "",
  "data": {
    "id": "661ab23456789012345offer1",
    "status": "approved"
  }
}
```

---

### 📦 Product Management (Admin)

#### GET `/api/admin/products` — Get All Products

Returns every product in the system (no filtering).

```bash
curl -X GET http://localhost:3001/api/admin/products
```

**✅ Success Response — `200 OK`**
```json
{
  "success": true,
  "message": "",
  "data": [
    {
      "id": "661ab23456789012345abcde",
      "userId": "661ab23456789012345user1",
      "title": "Fresh Atlantic Salmon",
      "description": "Wild-caught premium salmon fillet",
      "price": 450.00,
      "offerPrice": 380.00,
      "availability": [1, 2, 3, 4, 5],
      "stock": 50,
      "category": "fish",
      "image": "image-1713780000000-salmon.jpg"
    }
  ]
}
```

---

#### GET `/api/admin/product/:id` — Get Single Product (Admin)

```bash
curl -X GET http://localhost:3001/api/admin/product/661ab23456789012345abcde
```

---

#### DELETE `/api/admin/product/:id` — Remove Product (Admin)

Permanently removes a product from the platform.

```bash
curl -X DELETE http://localhost:3001/api/admin/product/661ab23456789012345abcde
```

**✅ Success Response — `200 OK`**
```json
{
  "success": true,
  "message": "product deleted",
  "data": {
    "id": "661ab23456789012345abcde",
    "title": "Fresh Atlantic Salmon"
  }
}
```

---

### 📋 Order Management (Admin)

#### POST `/api/admin/orders` — Get All Orders

Returns all orders filtered by time period.

```bash
curl -X POST http://localhost:3001/api/admin/orders \
  -H "Content-Type: application/json" \
  -d '{ "period": "week" }'
```

**Request Body**

| Field    | Type     | Required | Values              |
|----------|----------|----------|---------------------|
| `period` | `string` | ✅ Yes   | `"week"` or `"month"` |

**✅ Success Response — `200 OK`**
```json
{
  "success": true,
  "message": "",
  "data": [
    {
      "id": "661ab23456789012345order1",
      "userId": "661ab23456789012345user1",
      "amount": 900.00,
      "discountAmount": 350.00,
      "status": "PAID",
      "date": "2026-04-22T09:00:00.000Z",
      "address": "456 Marine Drive, Mumbai",
      "pincode": "400001",
      "razorpayOrderId": "order_RazorpayIdHere123",
      "paymentId": "pay_RazorpayPaymentId456",
      "items": [ ... ]
    }
  ]
}
```

**❌ Error Response — `404 Not Found`**
```json
{
  "status": "fail",
  "message": "Invalid period. Use week or month"
}
```

---

## 📁 Static File Access

Product images are served as static files:

```bash
# Access a product image
curl http://localhost:3001/uploads/image-1713780000000-salmon.jpg

# In browser / img src
http://localhost:3001/uploads/<image_filename>
```

---

## 📊 HTTP Status Codes Reference

| Code  | Meaning              | When Used                                          |
|-------|----------------------|----------------------------------------------------|
| `200` | OK                   | Successful GET, PUT, DELETE operations             |
| `201` | Created              | Successful POST creating a new resource            |
| `400` | Bad Request          | Invalid input, missing required fields             |
| `404` | Not Found            | Resource not found or not-found-style app errors   |
| `500` | Internal Server Error| Unhandled server errors                            |
| `503` | Service Unavailable  | Deep health check fails (DB unreachable)           |

---

## 🔑 Order Status Values

| Status    | Description                                |
|-----------|--------------------------------------------|
| `PENDING` | Order created, awaiting payment            |
| `PAID`    | Payment confirmed, stock decremented       |
| `FAILED`  | Payment failed                             |

---

## 🏪 Vendor Status Values

| Status    | Description                          |
|-----------|--------------------------------------|
| `pending` | Application submitted, under review  |
| `success` | Application approved by admin        |
| `rejected`| Application rejected by admin        |

---

## 🔔 Offer Notification Status Values

| Status     | Description                          |
|------------|--------------------------------------|
| `pending`  | Submitted, awaiting admin approval   |
| `approved` | Approved, notification will be sent  |
| `rejected` | Rejected by admin                    |

---

## ⚙️ Environment Variables

| Variable               | Description                             | Example                              |
|------------------------|-----------------------------------------|--------------------------------------|
| `NODE_ENV`             | Environment mode                        | `development`                        |
| `PORT`                 | Server port                             | `3001`                               |
| `DATABASE_URL`         | MongoDB connection string (Prisma)      | `mongodb+srv://user:pass@cluster...` |
| `JWT_PRIVATE_KEY`      | JWT signing secret                      | `supersecretkey`                     |
| `EMAIL_ID`             | Gmail sender address                    | `app@gmail.com`                      |
| `EMAIL_PASS`           | Gmail App Password                      | `xxxx xxxx xxxx xxxx`                |
| `FIREBASE_API_KEY`     | Firebase API key (FCM push)             | `AIzaSy...`                          |
| `TWILIO_ACCOUNT_SID`   | Twilio Account SID (SMS)                | `ACxxxxxxxx...`                      |
| `TWILIO_AUTH_TOKEN`    | Twilio Auth Token                       | `xxxxxxxx...`                        |
| `TWILIO_PHONE_NUMBER`  | Twilio sender phone number              | `+1xxxxxxxxxx`                       |
| `RAZORPAY_KEY_ID`      | Razorpay Key ID                         | `rzp_test_xxx`                       |
| `RAZORPAY_KEY_SECRET`  | Razorpay Key Secret                     | `xxxxxxxxxx`                         |
| `STRIPE_Publishable_key` | Stripe Publishable Key               | `pk_test_xxx`                        |
| `STRIPE_SECRET_KEY`    | Stripe Secret Key                       | `sk_test_xxx`                        |

---

*Generated from source code analysis of the FishAndMeat API — `c:\Users\user\OneDrive\Desktop\works\FIshAndMeatApp`*
