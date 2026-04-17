// SIM-LINE — Shared UI: header, cart drawer, toast

function $(s, r = document) { return r.querySelector(s); }
function $$(s, r = document) { return Array.from(r.querySelectorAll(s)); }

function toast(message) {
  let container = $('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = message;
  container.appendChild(t);
  setTimeout(() => t.remove(), 2500);
}
window.toast = toast;

function renderHeader(active) {
  const links = [
    { href: 'index.html', label: 'Home', key: 'home' },
    { href: 'scarves.html', label: 'Scarves', key: 'scarves' },
    { href: 'story.html', label: 'Story', key: 'story' },
    { href: 'info.html', label: 'Info', key: 'info' },
  ];
  const navHtml = links.map(l =>
    `<a href="${l.href}" class="${active === l.key ? 'active' : ''}">${l.label}</a>`
  ).join('');
  return `
  <header class="site-header">
    <div class="container header-inner">
      <a href="index.html" class="brand">SIM-LINE<small>by Simona</small></a>
      <nav class="nav" id="mainNav">${navHtml}</nav>
    <div class="header-side header-right">
        <button class="icon-btn" id="searchToggle" aria-label="Search">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </button>
        <a class="icon-btn" href="#wishlist" aria-label="Wishlist">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        </a>
        <a class="icon-btn" href="#account" aria-label="Account / Login">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        </a>
        <button class="icon-btn" id="openCart" aria-label="Cart">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
          <span class="cart-badge" id="cartBadge" style="display:none">0</span>
        </button>
    <button class="icon-btn" id="openCart" aria-label="Cart">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/></svg>
          <span class="cart-badge" id="cartBadge" style="display:none">0</span>
        </button>
      </div>
    </div>
  </header>`;
}

function renderFooter() {
  return `
  <footer class="site-footer">
    <div class="container">
      <div class="footer-grid">
        <div>
          <div class="brand" style="color:var(--eggshell)">SIM-LINE<small>by Simona</small></div>
          <p style="opacity:0.7; font-size:0.875rem; margin-top:1rem; max-width:22rem;">Handmade unique scarves crafted with care in Switzerland. One of a kind, made to be worn every day.</p>
        </div>
        <div>
          <h4>Shop</h4>
          <ul>
            <li><a href="scarves.html">All scarves</a></li>
            <li><a href="scarves.html?filter=new">New pieces</a></li>
          </ul>
        </div>
        <div>
          <h4>About</h4>
          <ul>
            <li><a href="story.html">Our story</a></li>
            <li><a href="info.html">Information</a></li>
          </ul>
        </div>
        <div>
          <h4>Contact</h4>
          <ul>
            <li><a href="mailto:hello@simline.ch">hello@simline.ch</a></li>
            <li><a href="https://www.simline.ch" target="_blank" rel="noopener">simline.ch</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom">© ${new Date().getFullYear()} SIM-LINE · Handmade in Switzerland</div>
    </div>
  </footer>`;
}

function renderCartDrawer() {
  return `
  <div class="drawer-backdrop" id="drawerBackdrop"></div>
  <aside class="drawer" id="cartDrawer" aria-hidden="true">
    <div class="drawer-header">
      <h3>Your bag</h3>
      <button class="icon-btn" id="closeCart" aria-label="Close">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div class="drawer-body" id="cartBody"></div>
    <div class="drawer-footer" id="cartFooter" style="display:none">
      <div class="cart-row-total"><span class="label">Total</span><span class="amount" id="cartTotal"></span></div>
      <button class="btn btn-primary" style="width:100%" id="checkoutBtn">Checkout</button>
    </div>
  </aside>`;
}

function renderCartBody(state) {
  const body = $('#cartBody');
  const footer = $('#cartFooter');
  if (!body) return;
  if (state.items.length === 0) {
    body.innerHTML = `<div class="empty-cart">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" style="margin:0 auto 1rem;display:block;opacity:0.4"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/></svg>
      <p>Your bag is empty</p>
    </div>`;
    footer.style.display = 'none';
    return;
  }
  footer.style.display = 'block';
  body.innerHTML = state.items.map(item => {
    const img = item.product?.images?.edges?.[0]?.node?.url || '';
    const opts = (item.selectedOptions || []).map(o => o.value).join(' · ');
    return `
    <div class="cart-item">
      <div class="cart-item-img">${img ? `<img src="${img}" alt="">` : ''}</div>
      <div class="cart-item-info">
        <h4>${item.product?.title || 'Item'}</h4>
        ${opts ? `<div class="opt">${opts}</div>` : ''}
        <div class="price">${item.price.currencyCode} ${parseFloat(item.price.amount).toFixed(2)}</div>
      </div>
      <div class="cart-item-actions">
        <button class="icon-btn" data-remove="${item.variantId}" aria-label="Remove" style="width:1.75rem;height:1.75rem">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/></svg>
        </button>
        <div class="qty">
          <button data-qty="${item.variantId}" data-delta="-1">−</button>
          <span>${item.quantity}</span>
          <button data-qty="${item.variantId}" data-delta="1">+</button>
        </div>
      </div>
    </div>`;
  }).join('');
  $('#cartTotal').textContent = `${CartStore.currency()} ${CartStore.totalPrice().toFixed(2)}`;
  $$('button[data-qty]', body).forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-qty');
      const delta = parseInt(btn.getAttribute('data-delta'), 10);
      const it = CartStore.state.items.find(i => i.variantId === id);
      if (it) CartStore.updateQuantity(id, it.quantity + delta);
    });
  });
  $$('button[data-remove]', body).forEach(btn => {
    btn.addEventListener('click', () => CartStore.removeItem(btn.getAttribute('data-remove')));
  });
}

function updateCartBadge(state) {
  const badge = $('#cartBadge');
  if (!badge) return;
  const total = state.items.reduce((s, i) => s + i.quantity, 0);
  if (total > 0) { badge.style.display = 'flex'; badge.textContent = total; }
  else { badge.style.display = 'none'; }
}

function openCart() {
  $('#cartDrawer').classList.add('open');
  $('#drawerBackdrop').classList.add('open');
  CartStore.sync();
}
function closeCart() {
  $('#cartDrawer').classList.remove('open');
  $('#drawerBackdrop').classList.remove('open');
}

function mountChrome(active) {
  document.body.insertAdjacentHTML('afterbegin', renderHeader(active));
  document.body.insertAdjacentHTML('beforeend', renderCartDrawer());
  document.body.insertAdjacentHTML('beforeend', renderFooter());

  $('#menuToggle')?.addEventListener('click', () => $('#mainNav').classList.toggle('open'));
  $('#openCart').addEventListener('click', openCart);
  $('#closeCart').addEventListener('click', closeCart);
  $('#drawerBackdrop').addEventListener('click', closeCart);
  $('#checkoutBtn').addEventListener('click', () => {
    if (CartStore.state.checkoutUrl) {
      window.open(CartStore.state.checkoutUrl, '_blank');
      closeCart();
    }
  });

  CartStore.init();
  CartStore.subscribe(state => { updateCartBadge(state); renderCartBody(state); });
  updateCartBadge(CartStore.state);
  renderCartBody(CartStore.state);

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') CartStore.sync();
  });
}

window.mountChrome = mountChrome;
window.openCart = openCart;

/* Product card renderer (shared) */
function productCardHtml(edge) {
  const p = edge.node;
  const img = p.images.edges[0]?.node;
  const price = p.priceRange.minVariantPrice;
  return `
  <a class="product-card" href="product.html?handle=${encodeURIComponent(p.handle)}">
    <div class="product-image">
      ${img ? `<img src="${img.url}" alt="${img.altText || p.title}" loading="lazy">` : ''}
      <span class="product-badge">Unique</span>
    </div>
    <div class="product-info">
      <h3 class="product-title">${p.title}</h3>
      <div class="product-price">${price.currencyCode} ${parseFloat(price.amount).toFixed(2)}</div>
    </div>
  </a>`;
}
window.productCardHtml = productCardHtml;
