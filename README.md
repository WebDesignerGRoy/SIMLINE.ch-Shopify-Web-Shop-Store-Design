# SIM-LINE — Static HTML/CSS/JS Site

Plain HTML, CSS, and JavaScript version of the SIM-LINE storefront with live Shopify Storefront API integration.

## Pages
- `index.html` — Homepage (hero, USPs, designer story, product teaser, testimonials, newsletter, final CTA)
- `scarves.html` — Collection page with fabric filters
- `product.html?handle=PRODUCT-HANDLE` — Product detail page (variant picker, gallery, add to cart)
- `story.html` — Brand story
- `info.html` — Shipping, returns, care, contact

## Structure
```
/
├─ index.html
├─ scarves.html
├─ product.html
├─ story.html
├─ info.html
├─ css/style.css       — design system + all components
├─ js/shopify.js       — Storefront API client + cart store (localStorage)
├─ js/app.js           — header, footer, cart drawer, toast, product card
└─ assets/             — hero & editorial images
```

## How it works
- **Shopify**: Configured for store `sim-line-elegance-7c9q2.myshopify.com` using API version `2025-07`.
  Update the constants at the top of `js/shopify.js` if you connect a different store.
- **Cart**: Persists in `localStorage` under `shopify-cart`. Checkout opens the official
  Shopify checkout in a new tab via the Storefront API `cartCreate` mutation.
- **No build step**: open `index.html` in any modern browser, or serve the folder with any
  static host (Netlify, Cloudflare Pages, GitHub Pages, S3, an existing Apache/Nginx, etc.).

## Local preview
```bash
# any static server works, for example:
npx serve .
# or
python3 -m http.server 8080
```
Then open http://localhost:8080
