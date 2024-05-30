# Top-up API Documentation

This document outlines the endpoints and usage of the Top-up API.

## Authentication

All endpoints require authentication using Access Token or Basic Token.

---

## Endpoints

### 1. Top-up Payment API

- **URL:** `/topup/api/v1/payments/topup`
- **Method:** POST
- **Authentication:** Access Token
- **Request Body:**
  - `topup_type` - Type of top-up (e.g., maya, gcash)
  - `amount` - Amount to top-up
- **Description:** Initiates a top-up payment transaction.
- **Response:**
  - `status` - HTTP status code
  - `data` - Result data
  - `message` - Success message

---

### 2. GCash Payment Verification API

- **URL:** `/topup/api/v1/payments/tenant/gcash/:token/:topup_id`
- **Method:** GET
- **Authentication:** Basic Token
- **Parameters:**
  - `:token` - GCash payment token
  - `:topup_id` - Top-up ID
- **Description:** Verifies GCash payment transaction.
- **Response:**
  - `status` - HTTP status code
  - `data` - Result data
  - `message` - Success message

---

### 3. Maya Payment Verification API

- **URL:** `/topup/api/v1/payments/tenant/maya/:token/:transaction_id`
- **Method:** GET
- **Authentication:** Basic Token
- **Parameters:**
  - `:token` - Maya payment token
  - `:transaction_id` - Transaction ID
- **Description:** Verifies Maya payment transaction.
- **Response:**
  - `status` - HTTP status code
  - `data` - Result data
  - `message` - Success message

---

### 4. Payment Verification API

- **URL:** `/topup/api/v1/payments/tenant/verify/:transaction_id`
- **Method:** GET
- **Authentication:** Basic Token
- **Parameters:**
  - `:transaction_id` - Transaction ID
- **Description:** Verifies payment transaction.
- **Response:**
  - `status` - HTTP status code
  - `data` - Result data
  - `message` - Success message

---

### 5. Get Transactions API

- **URL:** `/topup/api/v1/transactions`
- **Method:** GET
- **Authentication:** Access Token
- **Query Parameters:**
  - `limit` - Limit the number of transactions (optional)
  - `offset` - Offset for pagination (optional)
- **Description:** Retrieves user transactions.
- **Response:**
  - `status` - HTTP status code
  - `data` - Result data
  - `message` - Success message

---

## Error Handling

All endpoints are equipped with error handling middleware. If an error occurs, it will be logged, and an appropriate error response will be sent.
