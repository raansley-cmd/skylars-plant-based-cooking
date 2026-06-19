/* ═══════════════════════════════════════════════════════
   SKYLAR'S PLANT BASED COOKING — CART + STRIPE CHECKOUT
   cart.js  |  include on every page
═══════════════════════════════════════════════════════ */

const STRIPE_PK = 'pk_live_51TjpYrPsyogMhlE1MJp9MswgAqiKIE0SrmtebiSMaUr40VYO8U90ejjRuJV9JJYyXbrG6w2xtCLo3yJQDOZD7AoN001WO1c7d2';

/* ── STRIPE PAYMENT LINKS (one per item) ── */
const PAYMENT_LINKS = {
  'Kale Pasta Salad':                 'https://buy.stripe.com/fZu00l6JdaVh3sB3DF8k800',
  'Smash Cake — 1st Birthday':        'https://buy.stripe.com/6oU14paZt4wT5AJ6PR8k801',
  'Vanilla Buttercream Berry Cake':   'https://buy.stripe.com/28E7sNgjN1kH4wF2zB8k802'
};

/* ── CART STATE (localStorage) ── */
function getCart() {
  try { return JSON.parse(localStorage.getItem('skylars_cart') || '[]'); }
  catch(e) { return []; }
}
function saveCart(cart) {
  localStorage.setItem('skylars_cart', JSON.stringify(cart));
}
function cartTotal(cart) {
  return cart.reduce(function(sum, item) { return sum + item.price * item.qty; }, 0);
}
function cartCount(cart) {
  return cart.reduce(function(sum, item) { return sum + item.qty; }, 0);
}

/* ── ADD TO CART ── */
window.addToCart = function(name, price) {
  var cart = getCart();
  var existing = cart.find(function(i) { return i.name === name; });
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ name: name, price: price, qty: 1 });
  }
  saveCart(cart);
  updateCartUI();
  openCartDrawer();
  // Briefly show "Added!" on the button
  var btns = document.querySelectorAll('[data-name="' + name + '"]');
  btns.forEach(function(btn) {
    var orig = btn.textContent;
    btn.textContent = 'Added!';
    btn.classList.add('added');
    setTimeout(function() {
      btn.textContent = orig;
      btn.classList.remove('added');
    }, 1200);
  });
};

/* ── UPDATE ALL UI ── */
function updateCartUI() {
  var cart = getCart();
  var count = cartCount(cart);
  document.querySelectorAll('.cart-count').forEach(function(el) {
    el.textContent = count;
    if (count === 0) {
      el.classList.add('hidden');
    } else {
      el.classList.remove('hidden');
      el.classList.add('bump');
      setTimeout(function() { el.classList.remove('bump'); }, 200);
    }
  });
  renderCartDrawer(cart);
}

/* ── RENDER CART DRAWER CONTENTS ── */
function renderCartDrawer(cart) {
  var body   = document.getElementById('cart-drawer-body');
  var footer = document.getElementById('cart-drawer-footer');
  if (!body) return;

  if (cart.length === 0) {
    body.innerHTML =
      '<div class="cart-empty">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>' +
        '<p>Your cart is empty.<br>Browse the menu and add something delicious.</p>' +
        '<a href="gallery.html">View Menu &rarr;</a>' +
      '</div>';
    if (footer) footer.style.display = 'none';
    return;
  }

  if (footer) footer.style.display = 'block';

  var html = '';
  cart.forEach(function(item, idx) {
    html +=
      '<div class="cart-item" data-idx="' + idx + '">' +
        '<span class="cart-item-name">' + item.name + '</span>' +
        '<span class="cart-item-price">$' + (item.price * item.qty).toFixed(0) + '</span>' +
        '<div class="cart-item-controls">' +
          '<button class="cart-qty-btn" onclick="changeQty(' + idx + ', -1)">&#8722;</button>' +
          '<span class="cart-item-qty">' + item.qty + '</span>' +
          '<button class="cart-qty-btn" onclick="changeQty(' + idx + ', 1)">&#43;</button>' +
          '<button class="cart-item-remove" onclick="removeItem(' + idx + ')" title="Remove">&times;</button>' +
        '</div>' +
      '</div>';
  });
  body.innerHTML = html;

  var total = cartTotal(cart);
  var subtotalEl = document.getElementById('cart-subtotal');
  if (subtotalEl) subtotalEl.textContent = '$' + total.toFixed(0);
}

/* ── CHANGE QTY ── */
window.changeQty = function(idx, delta) {
  var cart = getCart();
  if (!cart[idx]) return;
  cart[idx].qty += delta;
  if (cart[idx].qty <= 0) cart.splice(idx, 1);
  saveCart(cart);
  updateCartUI();
};

/* ── REMOVE ITEM ── */
window.removeItem = function(idx) {
  var cart = getCart();
  cart.splice(idx, 1);
  saveCart(cart);
  updateCartUI();
};

/* ── OPEN / CLOSE DRAWER ── */
function openCartDrawer() {
  var drawer  = document.getElementById('cart-drawer');
  var overlay = document.getElementById('cart-overlay');
  if (drawer)  drawer.classList.add('open');
  if (overlay) overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeCartDrawer() {
  var drawer  = document.getElementById('cart-drawer');
  var overlay = document.getElementById('cart-overlay');
  if (drawer)  drawer.classList.remove('open');
  if (overlay) overlay.classList.remove('open');
  document.body.style.overflow = '';
}

/* ── OPEN CHECKOUT MODAL ── */
function openCheckout() {
  var cart = getCart();
  if (cart.length === 0) return;
  closeCartDrawer();

  // Build order summary in modal
  var summaryHtml = '';
  cart.forEach(function(item) {
    summaryHtml +=
      '<div class="stripe-order-row">' +
        '<span>' + item.name + ' &times; ' + item.qty + '</span>' +
        '<span>$' + (item.price * item.qty).toFixed(0) + '</span>' +
      '</div>';
  });
  var total = cartTotal(cart);
  summaryHtml +=
    '<div class="stripe-order-total">' +
      '<span>Total</span>' +
      '<span>$' + total.toFixed(0) + '</span>' +
    '</div>';

  var summaryEl = document.getElementById('stripe-order-summary');
  if (summaryEl) summaryEl.innerHTML = summaryHtml;

  var payBtn = document.getElementById('stripe-pay-btn');
  if (payBtn) payBtn.textContent = 'Pay $' + total.toFixed(0) + ' Securely';

  // Set min delivery date
  setCheckoutMinDate();

  // Reset form state
  var modalContent = document.getElementById('stripe-modal-content');
  var successEl    = document.getElementById('stripe-success');
  if (modalContent) modalContent.style.display = 'block';
  if (successEl)    successEl.style.display    = 'none';

  // Show modal
  var modalOverlay = document.getElementById('stripe-modal-overlay');
  if (modalOverlay) {
    modalOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
}

function closeCheckoutModal() {
  var modalOverlay = document.getElementById('stripe-modal-overlay');
  if (modalOverlay) modalOverlay.classList.remove('open');
  document.body.style.overflow = '';
}

/* ── HANDLE PAYMENT — redirect to Stripe Payment Link ── */
function handlePayment() {
  var cart  = getCart();
  if (cart.length === 0) return;

  var name  = (document.getElementById('checkout-name')  || {}).value || '';
  var email = (document.getElementById('checkout-email') || {}).value || '';
  var date  = (document.getElementById('checkout-date')  || {}).value || '';

  if (!name.trim() || !email.trim() || !date) {
    alert('Please fill in your name, email, and requested delivery date.');
    return;
  }

  var payBtn = document.getElementById('stripe-pay-btn');
  if (payBtn) { payBtn.disabled = true; payBtn.textContent = 'Redirecting to payment…'; }

  /* ── Build the Stripe Payment Link ──────────────────────────
     Strategy: if cart has ONE item → go straight to its link
               if cart has MULTIPLE items → go to the first
               item's link (Stripe Payment Links are per-product;
               for multi-item orders we redirect item by item).

     We pass prefill params so Stripe pre-fills the customer's
     email and the quantity they selected.
  ──────────────────────────────────────────────────────────── */

  // Send order notification email first
  var orderLines = cart.map(function(i) {
    return i.qty + 'x ' + i.name + ' @ $' + i.price + ' = $' + (i.price * i.qty).toFixed(0);
  }).join(' | ');

  var phone = (document.getElementById('checkout-phone') || {}).value || '';

  var payload = {
    access_key:  '4b24cde9-9ae0-4a5e-a4e4-4e4c070b20f8',
    subject:     "New Order – Skylar's Plant Based Cooking",
    from_name:   "Skylar's Plant Based Cooking Website",
    Name:        name,
    Email:       email,
    Phone:       phone || 'Not provided',
    'Requested Delivery Date': date,
    'Order Items': orderLines,
    'Total':     '$' + cartTotal(cart).toFixed(0)
  };

  // Send notification then redirect to Stripe
  fetch('https://api.web3forms.com/submit', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload)
  })
  .catch(function(e) { console.warn('Email notification failed', e); })
  .finally(function() {
    // Redirect each item to its Stripe Payment Link
    // For multi-item carts, open additional items in new tabs
    // then redirect main window to first item
    var firstLink = null;

    cart.forEach(function(item, idx) {
      var baseLink = PAYMENT_LINKS[item.name];
      if (!baseLink) return;

      // Append prefill params: email and quantity
      var url = baseLink +
        '?prefilled_email=' + encodeURIComponent(email) +
        '&quantity='        + item.qty;

      if (idx === 0) {
        firstLink = url;
      } else {
        // Open additional items in new tabs
        window.open(url, '_blank');
      }
    });

    // Save cart before clearing so Stripe return works
    var orderNote = 'Order placed: ' + orderLines + ' | Date: ' + date;
    localStorage.setItem('skylars_last_order', orderNote);

    // Clear cart
    saveCart([]);
    updateCartUI();

    // Redirect to first item's Stripe page
    if (firstLink) {
      window.location.href = firstLink;
    } else {
      // No matching payment link found
      if (payBtn) { payBtn.disabled = false; payBtn.textContent = 'Pay Securely'; }
      alert('Sorry, something went wrong. Please try again or contact Skylar directly.');
    }
  });
}

/* ── INJECT DRAWER + MODAL HTML INTO PAGE ── */
function injectCartUI() {
  var cartHTML =
    /* Overlay */
    '<div class="cart-overlay" id="cart-overlay" onclick="closeCartDrawer()"></div>' +

    /* Drawer */
    '<div class="cart-drawer" id="cart-drawer">' +
      '<div class="cart-drawer-header">' +
        '<span class="cart-drawer-title">Your Cart</span>' +
        '<button class="cart-close-btn" onclick="closeCartDrawer()" aria-label="Close cart">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
        '</button>' +
      '</div>' +
      '<div class="cart-drawer-body" id="cart-drawer-body"></div>' +
      '<div class="cart-drawer-footer" id="cart-drawer-footer" style="display:none;">' +
        '<div class="cart-subtotal-row">' +
          '<span class="cart-subtotal-label">Total</span>' +
          '<span class="cart-subtotal-amount" id="cart-subtotal">$0</span>' +
        '</div>' +
        '<p class="cart-note">Delivery: Temecula &amp; surrounding Inland Empire &nbsp;&middot;&nbsp; 3 week lead time</p>' +
        '<button class="cart-checkout-btn" onclick="openCheckout()">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>' +
          'Proceed to Checkout' +
        '</button>' +
        '<button class="cart-continue-btn" onclick="closeCartDrawer()">Continue Shopping</button>' +
      '</div>' +
    '</div>' +

    /* Checkout Modal */
    '<div class="stripe-modal-overlay" id="stripe-modal-overlay">' +
      '<div class="stripe-modal">' +
        '<button class="stripe-modal-close" onclick="closeCheckoutModal()" aria-label="Close">&times;</button>' +

        /* Success state */
        '<div id="stripe-success" style="display:none;" class="stripe-success">' +
          '<div class="stripe-success-icon">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>' +
          '</div>' +
          '<h3>Redirecting to Payment…</h3>' +
          '<p>You\'re being sent to Stripe\'s secure checkout. Your order details have been sent to Skylar.</p>' +
        '</div>' +

        /* Checkout form */
        '<div id="stripe-modal-content">' +
          '<p class="stripe-modal-brand">Skylar\'s Plant Based Cooking</p>' +
          '<h2 class="stripe-modal-title">Complete Your Order</h2>' +

          '<div class="stripe-order-summary" id="stripe-order-summary"></div>' +

          '<div class="stripe-field-group">' +
            '<label>Full Name <span style="color:var(--sage)">*</span></label>' +
            '<input type="text" id="checkout-name" placeholder="Jane Smith">' +
          '</div>' +
          '<div class="stripe-field-row">' +
            '<div class="stripe-field-group">' +
              '<label>Email <span style="color:var(--sage)">*</span></label>' +
              '<input type="email" id="checkout-email" placeholder="jane@example.com">' +
            '</div>' +
            '<div class="stripe-field-group">' +
              '<label>Phone</label>' +
              '<input type="tel" id="checkout-phone" placeholder="(555) 000-0000">' +
            '</div>' +
          '</div>' +
          '<div class="stripe-field-group">' +
            '<label>Requested Delivery Date <span style="color:var(--sage)">*</span></label>' +
            '<input type="date" id="checkout-date">' +
          '</div>' +

          '<button class="stripe-pay-btn" id="stripe-pay-btn" onclick="handlePayment()">Pay Securely</button>' +

          '<div class="stripe-secure-note">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>' +
            'Payments processed securely by Stripe &nbsp;&middot;&nbsp; 256-bit SSL' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';

  var container = document.createElement('div');
  container.innerHTML = cartHTML;
  document.body.appendChild(container);
}

/* ── ADD CART ICON TO NAV ── */
function injectCartIcon() {
  var navOrder = document.querySelector('.nav-order');
  if (!navOrder) return;

  var btn = document.createElement('button');
  btn.className = 'nav-cart-btn';
  btn.setAttribute('aria-label', 'Open cart');
  btn.onclick = openCartDrawer;
  btn.innerHTML =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">' +
      '<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>' +
      '<path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>' +
    '</svg>' +
    '<span class="cart-count hidden">0</span>';

  navOrder.parentNode.insertBefore(btn, navOrder);
}

/* ── SET MIN DATE (3 weeks out) ── */
function setCheckoutMinDate() {
  var d = new Date();
  d.setDate(d.getDate() + 21);
  var mm  = String(d.getMonth() + 1).padStart(2, '0');
  var dd  = String(d.getDate()).padStart(2, '0');
  var min = d.getFullYear() + '-' + mm + '-' + dd;
  var el  = document.getElementById('checkout-date');
  if (el) { el.setAttribute('min', min); el.value = min; }
}

/* ── INIT ── */
document.addEventListener('DOMContentLoaded', function() {
  injectCartUI();
  injectCartIcon();
  updateCartUI();
});
