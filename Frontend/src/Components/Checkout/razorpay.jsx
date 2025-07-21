export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const displayRazorpay = async (amount) => {
  const res = await loadRazorpayScript();
  if (!res) {
    alert('Razorpay SDK failed to load. Check your internet connection.');
    return;
  }

  // 1. Create order from backend
  const orderRes = await fetch(`${process.env.REACT_APP_API_BASE_URL}/create-order`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ amount }),
  });

  const data = await orderRes.json();
  if (!data.order) {
    alert('Order creation failed.');
    return;
  }

  // 2. Initialize Razorpay payment
  const options = {
    key: 'rzp_test_lqt0lY0IsNJ5MM',
    amount: data.order.amount,
    currency: 'INR',
    name: 'Shopper Store',
    description: 'Thanks for shopping with us!',
    order_id: data.order.id,
    handler: function (response) {
      alert('Payment Successful!');
      console.log('Payment ID:', response.razorpay_payment_id);
      console.log('Order ID:', response.razorpay_order_id);
      console.log('Signature:', response.razorpay_signature);
    },

  };

  const paymentObject = new window.Razorpay(options);
  paymentObject.open();
};
