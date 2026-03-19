# Razorpay Payment Links Integration Guide

This document describes the Razorpay Payment Links integration with UPI-first payment method support.

## Overview

The payment system integrates Razorpay Payment Links API to enable UPI-first payment processing. The system supports:
- UPI-first payment links (primary payment method)
- Order creation and management
- Transaction tracking
- Webhook handling for real-time payment updates
- Refund management (full and partial)
- Admin dashboard for payment management

## Setup

### 1. Environment Variables

Add the following environment variables to your `.env` file:

```env
# Razorpay Configuration
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

**Important:** 
- Get your Razorpay credentials from [Razorpay Dashboard](https://dashboard.razorpay.com/)
- Generate a webhook secret in Razorpay Dashboard → Settings → Webhooks

### 2. Database Migration

Run the payment system migration to create required tables:

```bash
npm run migrate:payments
```

This creates the following tables:
- `payment_links` - Stores payment link details
- `transactions` - Stores transaction records
- `refunds` - Stores refund records
- `webhook_events` - Audit trail for webhook events

### 3. Webhook Configuration

Configure webhook endpoint in Razorpay Dashboard:

1. Go to Razorpay Dashboard → Settings → Webhooks
2. Add webhook URL: `https://api.gauallamilk.com/api/webhook` (Production)
   - Alternative endpoint also available: `https://api.gauallamilk.com/api/webhooks/razorpay`
3. Subscribe to the following events:
   - `payment_link.paid`
   - `payment_link.expired`
   - `payment_link.cancelled`
   - `payment.captured`
   - `payment.failed`
   - `refund.created`
   - `refund.processed`
4. Copy the webhook secret and add it to `.env` as `RAZORPAY_WEBHOOK_SECRET`

**Important:** Razorpay automatically calls this webhook URL when payment events occur. You don't need to call it from your code.

## API Endpoints

### User APIs

#### Create Payment Link
```
POST /api/user/payment-links/create
Authorization: Bearer <token> or Cookie: user=<token>

Body:
{
  "address_id": 1,
  "cart_items": [
    {
      "product_id": 1,
      "quantity": 2,
      "price": 500
    }
  ],
  "total_amount": 1000,
  "type": "onetime",
  "description": "Order description",
  "customer_name": "John Doe",
  "customer_email": "john@example.com",
  "customer_contact": "+91 8378-000052
",
  "expire_by_hours": 24,
  "notes": "Special instructions"
}

Response:
{
  "success": true,
  "message": "Payment link created successfully",
  "data": {
    "payment_link": {
      "id": 1,
      "razorpay_payment_link_id": "plink_xxx",
      "payment_link_url": "https://rzp.io/i/xxx",
      "amount": 1000,
      "currency": "INR",
      "status": "created",
      "order_id": 123
    },
    "order_id": 123
  }
}
```

#### Get Payment Links
```
GET /api/user/payment-links?status=paid&limit=50&offset=0
Authorization: Bearer <token> or Cookie: user=<token>
```

#### Get Payment Link Details
```
GET /api/user/payment-links/:id
Authorization: Bearer <token> or Cookie: user=<token>
```

#### Check Payment Status (Polling Fallback)
```
GET /api/user/payment-links/:payment_link_id/status
Authorization: Bearer <token> or Cookie: user=<token>
```

#### Cancel Payment Link
```
POST /api/user/payment-links/:id/cancel
Authorization: Bearer <token> or Cookie: user=<token>
```

### Admin APIs

#### Get Payment Statistics
```
GET /admin/payments/statistics?start_date=2024-01-01&end_date=2024-12-31
Authorization: Bearer <admin_token> or Cookie: admin=<token>
```

#### Get All Payment Links
```
GET /admin/payments/payment-links?status=paid&user_id=1&limit=50&offset=0
Authorization: Bearer <admin_token> or Cookie: admin=<token>
```

#### Get Payment Link Details
```
GET /admin/payments/payment-links/:id
Authorization: Bearer <admin_token> or Cookie: admin=<token>
```

#### Cancel Payment Link
```
POST /admin/payments/payment-links/:id/cancel
Authorization: Bearer <admin_token> or Cookie: admin=<token>
```

#### Get All Transactions
```
GET /admin/payments/transactions?status=captured&payment_method=upi&limit=50&offset=0
Authorization: Bearer <admin_token> or Cookie: admin=<token>
```

#### Get Transaction Details
```
GET /admin/payments/transactions/:id
Authorization: Bearer <admin_token> or Cookie: admin=<token>
```

#### Create Refund
```
POST /admin/payments/refunds/create
Authorization: Bearer <admin_token> or Cookie: admin=<token>

Body:
{
  "payment_id": "pay_xxx",
  "amount": 500,
  "speed": "normal",
  "notes": "Refund reason",
  "receipt": "RCPT_xxx"
}
```

#### Get All Refunds
```
GET /admin/payments/refunds?status=processed&limit=50&offset=0
Authorization: Bearer <admin_token> or Cookie: admin=<token>
```

#### Get Webhook Events (Audit Trail)
```
GET /admin/payments/webhooks?event_type=payment.captured&processed=true&limit=50&offset=0
Authorization: Bearer <admin_token> or Cookie: admin=<token>
```

### Webhook Endpoint

**Production Endpoint:**
```
POST 
Content-Type: application/json
X-Razorpay-Signature: <signature>

Body: (Razorpay webhook payload)
```

**Alternative Endpoint (also available):**
```
POST 
```

**Note:** 
- Razorpay automatically calls this endpoint when payment events occur (you don't call it from your code)
- The endpoint automatically verifies webhook signatures and processes events
- All webhook events are stored in the `webhook_events` table for audit trail

## Payment Flow

1. **Create Order & Payment Link**
   - User creates order with cart items
   - System creates order in database
   - System creates UPI-first payment link via Razorpay
   - Payment link URL is returned to frontend

2. **Payment Processing**
   - User clicks payment link URL
   - Razorpay shows UPI apps (primary) and other payment methods
   - User completes payment via UPI or other method
   - Razorpay sends webhook event to backend

3. **Webhook Processing**
   - Backend receives webhook event
   - Verifies webhook signature
   - Updates payment link status
   - Creates/updates transaction record
   - Updates order payment status

4. **Order Fulfillment**
   - Order status changes to "processing"
   - Order can be fulfilled

## Refund Flow

1. **Initiate Refund**
   - Admin creates refund via API
   - System creates refund record
   - Updates transaction refund status
   - Updates order status if fully refunded

2. **Refund Processing**
   - Razorpay processes refund
   - Webhook event received
   - Refund status updated
   - Transaction and order updated

## Security Features

1. **Webhook Signature Verification**
   - All webhooks are verified using HMAC SHA256
   - Invalid signatures are rejected

2. **Idempotent Webhook Processing**
   - Webhook events are stored with unique event IDs
   - Duplicate events are detected and ignored

3. **Secure API Keys**
   - API keys stored in environment variables
   - Never exposed in client-side code

4. **User Authorization**
   - All user endpoints require authentication
   - Users can only access their own payment links

5. **Admin Authorization**
   - All admin endpoints require admin authentication
   - Admin middleware validates admin tokens

## Error Handling

The system includes comprehensive error handling:

- **Payment Link Creation Errors**: Returns detailed error messages
- **Webhook Processing Errors**: Logged and stored in webhook_events table
- **Refund Errors**: Validates amounts and transaction status
- **Database Errors**: Transaction rollback on failures

## Logging

All payment-related operations are logged:
- Payment link creation
- Webhook events
- Transaction updates
- Refund processing
- Error conditions

Check console logs for detailed information.

## Testing

### Test Payment Links

1. Use Razorpay Test Mode credentials
2. Create a test payment link
3. Use Razorpay test UPI: `success@razorpay`
4. Verify webhook events are received

### Test Webhooks Locally

Use tools like:
- [ngrok](https://ngrok.com/) to expose local server
- [Razorpay Webhook Testing](https://razorpay.com/docs/payments/webhooks/test/) guide

## Troubleshooting

### Payment Link Not Created
- Check Razorpay API credentials
- Verify amount is valid (minimum ₹1)
- Check database connection

### Webhooks Not Received
- Verify webhook URL is correct in Razorpay Dashboard
- Check webhook secret matches `.env` file
- Ensure server is accessible from internet
- Check webhook_events table for failed events

### Refund Failed
- Verify payment is captured
- Check refund amount doesn't exceed available amount
- Ensure transaction exists in database

### Signature Verification Failed
- Verify `RAZORPAY_WEBHOOK_SECRET` is correct
- Check webhook body is not modified
- Ensure raw body parsing is configured correctly

## References

- [Razorpay Payment Links Documentation](https://razorpay.com/docs/payments/payment-links/)
- [Razorpay UPI Payment Links](https://razorpay.com/docs/payments/payment-links/upi/)
- [Razorpay Webhooks Guide](https://razorpay.com/docs/payments/webhooks/)
- [Razorpay Refunds API](https://razorpay.com/docs/payments/refunds/)

## Support

For issues or questions:
1. Check Razorpay Dashboard logs
2. Review webhook_events table
3. Check application logs
4. Contact Razorpay support if needed
