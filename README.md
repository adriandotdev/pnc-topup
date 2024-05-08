# PNC Topup Service

This service includes all of the topups for GCash, and Maya

## APIs

### `POST /api/v1/payments/topup`

This API is for the initial topup transaction.

**Authorization:** Bearer TOKEN

**Request Body**

```json
"topup_type": ["gcash", "maya"], // either gcash or maya
"amount": 100
```

> NOTE: amount must be minimum of 100

**Response**

The response includes the redirection url to process the payment.

```json
{
	"status": 200,
	"data": {
		"checkout_url": "https://test-sources.paymongo.com/sources?id=src_JwZXkcfngyRdBMU72RfCH3D9"
	},
	"message": "Success"
}
```

---

### GCash Payment API - `GET /api/v1/payments/tenant/gcash/:token/:topup_id`

GCash Payment API

**Authorization:** Basic TOKEN

**Parameters**

- **token** - Token from the redirection url
- **topup_id** - ID of topup

**Response**

```json
{
	"status": 200,
	"data": {
		"topup_status": "paid",
		"transaction_id": "src_d9hWWG4oyuUcWaZnDyhcsdjU"
	},
	"message": "SUCCESS"
}
```

> NOTE: Client should have a route following this URL path

`https://v2-stg-parkncharge.sysnetph.com/gcashPayment/:token/:user_id/:topup_id/tenant`

---

### Maya Payment API - `GET /api/v1/payments/tenant/maya/:token/:transaction_id`

Maya Payment API

**Authorization:** Basic TOKEN

**Parameters**

- **token** - Token from the redirection url
- **transaction_id** - Transaction ID from the redirection url

**Response**

```json
{
	"status": 200,
	"data": {
		"topup_status": "paid",
		"transaction_id": "src_d9hWWG4oyuUcWaZnDyhcsdjU"
	},
	"message": "SUCCESS"
}
```

> NOTE: Client should have a route following this URL path

`https://v2-stg-parkncharge.sysnetph.com/mayaPayment/:token/:user_id/tenant/?payment_intent_id=<payment_intent_id>`

---

### Payment Verification - `GET /api/v1/payments/tenant/verify/:transaction_id`

Verify or check the status of topup

**Parameter**

- **transaction_id** - Transaction ID of the topup

**Response**

```json
{
	"status": 200,
	"data": {
		"topup_status": "paid",
		"transaction_id": "src_d9hWWG4oyuUcWaZnDyhcsdjU"
	},
	"message": "SUCCESS"
}
```

---

### User's Transactions - `GET /api/v1/transactions?limit=10&offset=0`

Retrieve user transactions

**Authorization:** Basic TOKEN

**Queries**

- **limit** - Number of objects to retrieved. Type of Number.
- **offset** - Starting row to retrieved. Type of Number.

**Response**

```json
{
	"status": 200,
	"data": [],
	"message": "SUCCESS"
}
```
