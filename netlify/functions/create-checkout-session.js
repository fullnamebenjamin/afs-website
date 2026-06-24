// netlify/functions/create-checkout-session.js
//
// This function runs on Netlify's servers, not in the browser.
// Your Stripe secret key lives here as an environment variable —
// it is never exposed to anyone visiting the website.

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async function (event) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { quantity } = JSON.parse(event.body);

    // Validate quantity: must be a whole number between 1 and 10
    const qty = parseInt(quantity, 10);
    if (!Number.isInteger(qty) || qty < 1 || qty > 10) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid quantity. Must be between 1 and 10.' })
      };
    }

    // Create the Checkout Session with the quantity already set
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID, // the Price ID from Step 2
          quantity: qty,
          adjustable_quantity: {
            enabled: true,
            minimum: 1,
            maximum: 10
          }
        }
      ],
      success_url: 'https://afeltsense.ai/reserve.html?success=true',
      cancel_url: 'https://afeltsense.ai/reserve.html?canceled=true'
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url })
    };

  } catch (err) {
    console.error('Stripe error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Something went wrong creating the checkout session.' })
    };
  }
};
