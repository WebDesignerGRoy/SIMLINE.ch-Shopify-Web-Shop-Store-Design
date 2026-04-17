// SIM-LINE — Shopify Storefront API client
const SHOPIFY_API_VERSION = '2025-07';
const SHOPIFY_STORE_PERMANENT_DOMAIN = 'sim-line-elegance-7c9q2.myshopify.com';
const SHOPIFY_STOREFRONT_URL = `https://${SHOPIFY_STORE_PERMANENT_DOMAIN}/api/${SHOPIFY_API_VERSION}/graphql.json`;
const SHOPIFY_STOREFRONT_TOKEN = 'cf17cbf082a3a34a23a753d4dea8168b';

async function storefrontApiRequest(query, variables = {}) {
  try {
    const response = await fetch(SHOPIFY_STOREFRONT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': SHOPIFY_STOREFRONT_TOKEN,
      },
      body: JSON.stringify({ query, variables }),
    });
    if (response.status === 402) {
      window.toast && toast('Shopify billing required to load products');
      return null;
    }
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (data.errors) {
      console.error('Shopify errors:', data.errors);
      return null;
    }
    return data;
  } catch (err) {
    console.error('Storefront request failed:', err);
    return null;
  }
}

const PRODUCTS_QUERY = `
  query GetProducts($first: Int!) {
    products(first: $first) {
      edges {
        node {
          id title description handle
          priceRange { minVariantPrice { amount currencyCode } }
          images(first: 5) { edges { node { url altText } } }
          variants(first: 10) {
            edges {
              node {
                id title
                price { amount currencyCode }
                availableForSale
                selectedOptions { name value }
              }
            }
          }
          options { name values }
        }
      }
    }
  }
`;

const PRODUCT_BY_HANDLE_QUERY = `
  query GetProduct($handle: String!) {
    product(handle: $handle) {
      id title description handle
      priceRange { minVariantPrice { amount currencyCode } }
      images(first: 10) { edges { node { url altText } } }
      variants(first: 20) {
        edges {
          node {
            id title
            price { amount currencyCode }
            availableForSale
            selectedOptions { name value }
          }
        }
      }
      options { name values }
    }
  }
`;

async function fetchProducts(first = 12) {
  const data = await storefrontApiRequest(PRODUCTS_QUERY, { first });
  return data?.data?.products?.edges || [];
}

async function fetchProductByHandle(handle) {
  const data = await storefrontApiRequest(PRODUCT_BY_HANDLE_QUERY, { handle });
  return data?.data?.product || null;
}

/* ============== CART ============== */
const CART_CREATE = `
  mutation cartCreate($input: CartInput!) {
    cartCreate(input: $input) {
      cart {
        id checkoutUrl
        lines(first: 100) { edges { node { id merchandise { ... on ProductVariant { id } } } } }
      }
      userErrors { field message }
    }
  }
`;
const CART_LINES_ADD = `
  mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart { id lines(first: 100) { edges { node { id merchandise { ... on ProductVariant { id } } } } } }
      userErrors { field message }
    }
  }
`;
const CART_LINES_UPDATE = `
  mutation cartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) { cart { id } userErrors { message } }
  }
`;
const CART_LINES_REMOVE = `
  mutation cartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) { cart { id } userErrors { message } }
  }
`;
const CART_QUERY = `query cart($id: ID!) { cart(id: $id) { id totalQuantity } }`;

function formatCheckoutUrl(url) {
  try { const u = new URL(url); u.searchParams.set('channel', 'online_store'); return u.toString(); }
  catch { return url; }
}
function isCartNotFound(errs) {
  return (errs || []).some(e => /cart not found|does not exist/i.test(e.message || ''));
}

const CartStore = {
  state: { items: [], cartId: null, checkoutUrl: null, isLoading: false },
  listeners: new Set(),
  init() {
    try {
      const raw = localStorage.getItem('shopify-cart');
      if (raw) {
        const s = JSON.parse(raw);
        this.state.items = s.items || [];
        this.state.cartId = s.cartId || null;
        this.state.checkoutUrl = s.checkoutUrl || null;
      }
    } catch {}
    this.sync();
  },
  persist() {
    localStorage.setItem('shopify-cart', JSON.stringify({
      items: this.state.items, cartId: this.state.cartId, checkoutUrl: this.state.checkoutUrl
    }));
  },
  subscribe(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); },
  emit() { this.persist(); this.listeners.forEach(fn => fn(this.state)); },
  setLoading(v) { this.state.isLoading = v; this.emit(); },
  clear() { this.state = { items: [], cartId: null, checkoutUrl: null, isLoading: false }; this.emit(); },
  async sync() {
    if (!this.state.cartId) return;
    const data = await storefrontApiRequest(CART_QUERY, { id: this.state.cartId });
    if (!data) return;
    const cart = data?.data?.cart;
    if (!cart || cart.totalQuantity === 0) this.clear();
  },
  async addItem(item) {
    this.setLoading(true);
    try {
      const existing = this.state.items.find(i => i.variantId === item.variantId);
      if (!this.state.cartId) {
        const data = await storefrontApiRequest(CART_CREATE, {
          input: { lines: [{ quantity: item.quantity, merchandiseId: item.variantId }] }
        });
        const cart = data?.data?.cartCreate?.cart;
        const errs = data?.data?.cartCreate?.userErrors || [];
        if (errs.length || !cart) { console.error(errs); return; }
        const lineId = cart.lines.edges[0]?.node?.id;
        this.state.cartId = cart.id;
        this.state.checkoutUrl = formatCheckoutUrl(cart.checkoutUrl);
        this.state.items = [{ ...item, lineId }];
      } else if (existing) {
        const newQty = existing.quantity + item.quantity;
        const data = await storefrontApiRequest(CART_LINES_UPDATE, {
          cartId: this.state.cartId,
          lines: [{ id: existing.lineId, quantity: newQty }]
        });
        const errs = data?.data?.cartLinesUpdate?.userErrors || [];
        if (isCartNotFound(errs)) { this.clear(); return this.addItem(item); }
        existing.quantity = newQty;
      } else {
        const data = await storefrontApiRequest(CART_LINES_ADD, {
          cartId: this.state.cartId,
          lines: [{ quantity: item.quantity, merchandiseId: item.variantId }]
        });
        const errs = data?.data?.cartLinesAdd?.userErrors || [];
        if (isCartNotFound(errs)) { this.clear(); return this.addItem(item); }
        const lines = data?.data?.cartLinesAdd?.cart?.lines?.edges || [];
        const newLine = lines.find(l => l.node.merchandise.id === item.variantId);
        this.state.items.push({ ...item, lineId: newLine?.node?.id });
      }
      toast('Added to bag');
    } finally { this.setLoading(false); }
  },
  async updateQuantity(variantId, qty) {
    if (qty <= 0) return this.removeItem(variantId);
    const it = this.state.items.find(i => i.variantId === variantId);
    if (!it || !this.state.cartId) return;
    this.setLoading(true);
    try {
      const data = await storefrontApiRequest(CART_LINES_UPDATE, {
        cartId: this.state.cartId, lines: [{ id: it.lineId, quantity: qty }]
      });
      const errs = data?.data?.cartLinesUpdate?.userErrors || [];
      if (isCartNotFound(errs)) { this.clear(); return; }
      it.quantity = qty;
    } finally { this.setLoading(false); }
  },
  async removeItem(variantId) {
    const it = this.state.items.find(i => i.variantId === variantId);
    if (!it || !this.state.cartId) return;
    this.setLoading(true);
    try {
      const data = await storefrontApiRequest(CART_LINES_REMOVE, {
        cartId: this.state.cartId, lineIds: [it.lineId]
      });
      const errs = data?.data?.cartLinesRemove?.userErrors || [];
      if (isCartNotFound(errs)) { this.clear(); return; }
      this.state.items = this.state.items.filter(i => i.variantId !== variantId);
      if (this.state.items.length === 0) this.clear();
    } finally { this.setLoading(false); }
  },
  totalItems() { return this.state.items.reduce((s, i) => s + i.quantity, 0); },
  totalPrice() { return this.state.items.reduce((s, i) => s + parseFloat(i.price.amount) * i.quantity, 0); },
  currency() { return this.state.items[0]?.price.currencyCode || 'CHF'; },
};

window.CartStore = CartStore;
window.fetchProducts = fetchProducts;
window.fetchProductByHandle = fetchProductByHandle;
