// server/routes/razorpayRoutes.js (example)
import express from "express";
const router = express.Router();

router.get("/checkout", (req, res) => {
  const { order_id, amount } = req.query;
  const KEY_ID = process.env.RAZORPAY_KEY_ID;

  const html = `<!DOCTYPE html>
<html>
<body>
  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
  <script>
    const options = {
      key: "${KEY_ID}",
      amount: ${Number(amount) * 100},
      currency: "INR",
      order_id: "${order_id}",
      handler: function(response) {
        const msg = { type: "payment.success", payload: response };
        window.ReactNativeWebView.postMessage(JSON.stringify(msg));
      },
      modal: {
        ondismiss: function() {
          const msg = { type: "payment.dismiss" };
          window.ReactNativeWebView.postMessage(JSON.stringify(msg));
        }
      }
    };
    const rzp = new Razorpay(options);
    rzp.open();
  </script>
</body>
</html>`;
  res.send(html);
});


export default router;
