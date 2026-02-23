/*  ============================================
    Shopify Storefront API Integration
    ============================================
    
    To connect your Shopify store:
    1. Go to your Shopify Admin -> Settings -> Apps and sales channels
    2. Develop apps -> Create an app -> Configure Storefront API scopes
    3. Enable: unauthenticated_read_product_listings, unauthenticated_read_checkouts, unauthenticated_write_checkouts
    4. Install the app and copy the Storefront access token
    5. Replace the values below with your store domain and token
*/

const ShopifyConfig = {
  storeDomain: 'echoplex-merch.myshopify.com',
  storefrontToken: 'b269344acc2cd51df11185a8d2935eeb',
};

const CART_STORAGE_KEY = 'echoplex_cart';

const ShopifyStore = {
  cart: [],

  init() {
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    if (saved) {
      try { this.cart = JSON.parse(saved); } catch (e) { this.cart = []; }
    }
    this.updateUI();
  },

  saveCart() {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(this.cart));
  },

  addItem(item) {
    const existing = this.cart.find(i => i.id === item.id);
    if (existing) {
      existing.qty += 1;
    } else {
      this.cart.push({ ...item, qty: 1 });
    }
    this.saveCart();
    this.updateUI();
  },

  removeItem(id) {
    this.cart = this.cart.filter(i => i.id !== id);
    this.saveCart();
    this.updateUI();
  },

  updateQty(id, qty) {
    const item = this.cart.find(i => i.id === id);
    if (item) {
      item.qty = Math.max(0, qty);
      if (item.qty === 0) {
        this.removeItem(id);
        return;
      }
    }
    this.saveCart();
    this.updateUI();
  },

  getTotal() {
    return this.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  },

  getCount() {
    return this.cart.reduce((sum, item) => sum + item.qty, 0);
  },

  updateUI() {
    const countEl = document.getElementById('cartCount');
    const bodyEl = document.getElementById('cartBody');
    const footerEl = document.getElementById('cartFooter');
    const totalEl = document.getElementById('cartTotal');

    if (countEl) countEl.textContent = this.getCount();

    if (!bodyEl) return;

    if (this.cart.length === 0) {
      bodyEl.innerHTML = `
        <div class="cart-panel__empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="48" height="48"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg>
          <p>Your cart is empty</p>
          <a href="#" class="btn btn--primary btn--sm" id="cartShopBtn">Shop Now</a>
        </div>`;
      if (footerEl) footerEl.style.display = 'none';
      const newShopBtn = document.getElementById('cartShopBtn');
      if (newShopBtn) {
        newShopBtn.addEventListener('click', (e) => {
          e.preventDefault();
          if (typeof window.closeCart === 'function') window.closeCart();
          if (typeof window.navigateTo === 'function') window.navigateTo('shop');
        });
      }
    } else {
      bodyEl.innerHTML = this.cart.map(item => `
        <div class="cart-panel__item">
          <div class="cart-panel__item-img">
            ${item.image ? `<img src="${item.image}" alt="${item.name}">` : ''}
          </div>
          <div class="cart-panel__item-info">
            <span class="cart-panel__item-name">${item.name}</span>
            <span class="cart-panel__item-price">$${item.price.toFixed(2)} × ${item.qty}</span>
            <button class="cart-panel__item-remove" data-id="${item.id}">Remove</button>
          </div>
        </div>`).join('');

      bodyEl.querySelectorAll('.cart-panel__item-remove').forEach(btn => {
        btn.addEventListener('click', () => {
          this.removeItem(btn.dataset.id);
        });
      });

      if (footerEl) footerEl.style.display = '';
      if (totalEl) totalEl.textContent = '$' + this.getTotal().toFixed(2);
    }
  },

  isConfigured() {
    return ShopifyConfig.storeDomain && ShopifyConfig.storefrontToken;
  },

  async fetchProducts() {
    if (!this.isConfigured()) return null;

    const query = `{
      products(first: 50) {
        edges {
          node {
            id
            title
            description
            descriptionHtml
            productType
            images(first: 1) {
              edges {
                node {
                  url
                  altText
                }
              }
            }
            variants(first: 10) {
              edges {
                node {
                  id
                  title
                  price {
                    amount
                    currencyCode
                  }
                  availableForSale
                  selectedOptions { name value }
                }
              }
            }
          }
        }
      }
    }`;

    try {
      const res = await fetch(`https://${ShopifyConfig.storeDomain}/api/2024-01/graphql.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Storefront-Access-Token': ShopifyConfig.storefrontToken,
        },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      return data.data.products.edges.map(edge => {
        const node = edge.node;
        const variant = node.variants.edges[0]?.node;
        const image = node.images.edges[0]?.node;
        return {
          id: variant?.id || node.id,
          productId: node.id,
          title: node.title,
          description: node.description,
          descriptionHtml: node.descriptionHtml,
          type: node.productType,
          price: parseFloat(variant?.price?.amount || 0),
          image: image?.url || null,
          imageAlt: image?.altText || node.title,
          variantId: variant?.id,
          variants: node.variants.edges.map(e => ({
            id: e.node.id,
            title: e.node.title,
            price: parseFloat(e.node.price.amount),
            available: e.node.availableForSale,
            options: e.node.selectedOptions,
          })),
        };
      });
    } catch (err) {
      console.error('Shopify fetch error:', err);
      return null;
    }
  },

  async fetchProduct(productId) {
    if (!this.isConfigured()) return null;

    const query = `{
      node(id: "${productId}") {
        ... on Product {
          id
          title
          descriptionHtml
          productType
          images(first: 5) {
            edges {
              node { url altText }
            }
          }
          variants(first: 20) {
            edges {
              node {
                id
                title
                price { amount currencyCode }
                availableForSale
                selectedOptions { name value }
              }
            }
          }
        }
      }
    }`;

    try {
      const res = await fetch(`https://${ShopifyConfig.storeDomain}/api/2024-01/graphql.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Storefront-Access-Token': ShopifyConfig.storefrontToken,
        },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      const node = data.data.node;
      if (!node) return null;

      return {
        id: node.id,
        title: node.title,
        descriptionHtml: node.descriptionHtml,
        type: node.productType,
        images: node.images.edges.map(e => ({ url: e.node.url, alt: e.node.altText })),
        variants: node.variants.edges.map(e => ({
          id: e.node.id,
          title: e.node.title,
          price: parseFloat(e.node.price.amount),
          available: e.node.availableForSale,
          options: e.node.selectedOptions,
        })),
      };
    } catch (err) {
      console.error('Shopify product fetch error:', err);
      return null;
    }
  },

  async createCheckout() {
    if (!this.isConfigured() || this.cart.length === 0) return null;

    const lines = this.cart
      .filter(item => item.variantId)
      .map(item => `{ merchandiseId: "${item.variantId}", quantity: ${item.qty} }`)
      .join(',');

    const mutation = `mutation {
      cartCreate(input: { lines: [${lines}] }) {
        cart {
          checkoutUrl
        }
        userErrors {
          field
          message
        }
      }
    }`;

    try {
      const res = await fetch(`https://${ShopifyConfig.storeDomain}/api/2024-01/graphql.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Storefront-Access-Token': ShopifyConfig.storefrontToken,
        },
        body: JSON.stringify({ query: mutation }),
      });
      const data = await res.json();
      if (data.data?.cartCreate?.userErrors?.length) {
        console.error('Cart errors:', data.data.cartCreate.userErrors);
        return null;
      }
      return data.data.cartCreate.cart.checkoutUrl;
    } catch (err) {
      console.error('Checkout error:', err);
      return null;
    }
  },

  renderProducts(products, gridEl) {
    if (!products || !gridEl) return;

    gridEl.innerHTML = products.map(product => {
      const category = (product.type || '').toLowerCase();
      const catAttr = category.includes('apparel') || category.includes('shirt') || category.includes('tee')
        ? 'apparel'
        : category.includes('sticker') ? 'stickers'
        : category.includes('vinyl') || category.includes('cd') || category.includes('music') ? 'music'
        : 'other';

      return `
        <div class="shop-card" data-category="${catAttr}">
          <div class="shop-card__img">
            ${product.image
              ? `<img src="${product.image}" alt="${product.imageAlt}" loading="lazy">`
              : `<div class="merch__placeholder"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="40" height="40"><rect x="3" y="3" width="18" height="18" rx="2"/></svg></div>`
            }
          </div>
          <div class="shop-card__info">
            <h3>${product.title}</h3>
            <p class="shop-card__price">$${product.price.toFixed(2)}</p>
            <button class="btn btn--primary btn--sm shop-card__add"
              data-id="${product.id}"
              data-name="${product.title}"
              data-price="${product.price}"
              data-variant="${product.variantId || ''}">Add to Cart</button>
          </div>
        </div>`;
    }).join('');
  }
};
