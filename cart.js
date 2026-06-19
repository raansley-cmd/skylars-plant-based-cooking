/* ═══════════════════════════════════════════════════════
   SKYLAR'S PLANT BASED COOKING — CART + STRIPE CHECKOUT
   cart.js  |  include on every page
═══════════════════════════════════════════════════════ */

/* ── BACKEND URL (your Render.com service) ──
   After deploying to Render, replace the URL below
   with your actual Render service URL             ── */
const BACKEND_URL = 'https://skylars-website-backend.onrender.com';

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
window.addToCart = function(name, price, img) {
  var cart = getCart();
  // Look up image from the page's image map if not passed directly
  var resolvedImg = img || (window.ITEM_IMAGES && window.ITEM_IMAGES[name]) || '';
  var existing = cart.find(function(i) { return i.name === name; });
  if (existing) {
    existing.qty += 1;
    if (!existing.img && resolvedImg) existing.img = resolvedImg;
  } else {
    cart.push({ name: name, price: price, qty: 1, img: resolvedImg });
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
    var thumbHtml = item.img
      ? '<img src="' + item.img + '" class="cart-item-thumb" alt="' + item.name + '">'
      : '<div class="cart-item-thumb cart-item-thumb-placeholder"></div>';

    html +=
      '<div class="cart-item" data-idx="' + idx + '">' +
        thumbHtml +
        '<div class="cart-item-info">' +
          '<span class="cart-item-name">' + item.name + '</span>' +
          '<span class="cart-item-price">$' + (item.price * item.qty).toFixed(0) + '</span>' +
        '</div>' +
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

/* ── HANDLE PAYMENT — Render.com backend → Stripe Checkout ── */
async function handlePayment() {
  var cart  = getCart();
  if (cart.length === 0) return;

  var name   = (document.getElementById('checkout-name')   || {}).value || '';
  var email  = (document.getElementById('checkout-email')  || {}).value || '';
  var phone  = (document.getElementById('checkout-phone')  || {}).value || '';
  var date   = (document.getElementById('checkout-date')   || {}).value || '';
  var street = (document.getElementById('checkout-street') || {}).value || '';
  var city   = (document.getElementById('checkout-city')   || {}).value || '';
  var state  = (document.getElementById('checkout-state')  || {}).value || '';
  var zip    = (document.getElementById('checkout-zip')    || {}).value || '';
  var other  = (document.getElementById('checkout-other')  || {}).value || '';

  if (!name.trim() || !email.trim() || !date || !street.trim() || !city.trim() || !zip.trim()) {
    alert('Please fill in all required fields: name, email, delivery date, and full address.');
    return;
  }

  var payBtn = document.getElementById('stripe-pay-btn');
  if (payBtn) { payBtn.disabled = true; payBtn.textContent = 'Preparing checkout…'; }

  try {
    // Call Render.com backend to create a Stripe Checkout Session
    var response = await fetch(BACKEND_URL + '/create-checkout-session', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: cart.map(function(i) {
          return { name: i.name, price: i.price, qty: i.qty };
        }),
        name:   name,
        email:  email,
        phone:  phone,
        date:   date,
        street: street,
        city:   city,
        state:  state,
        zip:    zip,
        other:  other
      })
    });

    var data = await response.json();

    if (data.url) {
      // Clear cart then redirect to Stripe's hosted checkout page
      saveCart([]);
      updateCartUI();
      window.location.href = data.url;
    } else {
      throw new Error(data.error || 'Could not create checkout session');
    }

  } catch(err) {
    console.error('Checkout error:', err);
    alert('Something went wrong: ' + err.message + '\n\nPlease try again or contact Skylar directly.');
    if (payBtn) { payBtn.disabled = false; payBtn.textContent = 'Pay $' + cartTotal(cart).toFixed(0) + ' Securely'; }
  }
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
          '<div class="stripe-field-group">' +
            '<label>Street Address <span style="color:var(--sage)">*</span></label>' +
            '<input type="text" id="checkout-street" placeholder="123 Main St">' +
          '</div>' +
          '<div class="stripe-field-row">' +
            '<div class="stripe-field-group">' +
              '<label>City <span style="color:var(--sage)">*</span></label>' +
              '<input type="text" id="checkout-city" placeholder="Temecula">' +
            '</div>' +
            '<div class="stripe-field-group">' +
              '<label>State <span style="color:var(--sage)">*</span></label>' +
              '<input type="text" id="checkout-state" placeholder="CA" maxlength="2" style="text-transform:uppercase;">' +
            '</div>' +
          '</div>' +
          '<div class="stripe-field-group">' +
            '<label>ZIP Code <span style="color:var(--sage)">*</span></label>' +
            '<input type="text" id="checkout-zip" placeholder="92592" maxlength="10">' +
          '</div>' +
          '<div class="stripe-field-group">' +
            '<label>Other Information</label>' +
            '<textarea id="checkout-other" placeholder="Allergies, special requests, delivery notes..." rows="3" style="width:100%;font-family:Cormorant Garamond,serif;font-size:16px;font-style:italic;color:var(--ink);background:var(--cream-dark);border:1px solid var(--sage-pale);padding:12px 14px;outline:none;resize:vertical;box-sizing:border-box;"></textarea>' +
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
