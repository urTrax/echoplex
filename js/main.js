document.addEventListener('DOMContentLoaded', () => {
  const nav = document.getElementById('nav');
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');
  const signupForm = document.getElementById('signupForm');
  const confirmation = document.getElementById('signupConfirmation');
  const homePage = document.getElementById('homePage');
  const shopPage = document.getElementById('shopPage');
  const productPage = document.getElementById('productPage');
  const aboutPage = document.getElementById('aboutPage');
  const newsPage = document.getElementById('newsPage');
  const eventsPage = document.getElementById('eventsPage');
  const privacyPage = document.getElementById('privacyPage');
  const termsPage = document.getElementById('termsPage');
  const shippingPage = document.getElementById('shippingPage');
  const shopAllBtn = document.getElementById('shopAllBtn');

  let shopProducts = [];
  let currentProduct = null;

  // Placeholder product data for when Shopify is not connected
  const placeholderProducts = [
    { id: 'surrender-tee-black', title: 'Surrender Tee - Black', price: 30.00, category: 'apparel', description: 'Premium heavyweight cotton tee featuring the Surrender E.P. artwork on the front. Printed on 100% ring-spun cotton for exceptional softness.', variants: [{id:'s',title:'S'},{id:'m',title:'M'},{id:'l',title:'L'},{id:'xl',title:'XL'},{id:'2xl',title:'2XL'},{id:'3xl',title:'3XL'}] },
    { id: 'echoplex-logo-tee-red', title: 'Echøplex Logo Tee - Red', price: 30.00, category: 'apparel', description: 'Classic fit tee with the Echøplex logo in red. Made from 100% ring-spun cotton with double stitching at the neckline and sleeves.', variants: [{id:'s',title:'S'},{id:'m',title:'M'},{id:'l',title:'L'},{id:'xl',title:'XL'},{id:'2xl',title:'2XL'},{id:'3xl',title:'3XL'}] },
    { id: 'symbol-sticker-pack', title: 'Symbol Sticker Pack', price: 5.00, category: 'stickers', description: 'Set of 3 die-cut vinyl stickers featuring the Echøplex symbol. Weather-resistant and UV-coated for lasting durability.', variants: [] },
    { id: 'surrender-die-cut-sticker', title: 'Surrender Die-Cut Sticker', price: 5.00, category: 'stickers', description: 'Premium die-cut vinyl sticker of the Surrender E.P. cover art. Waterproof and scratch-resistant.', variants: [] },
    { id: 'surrender-vinyl', title: 'Surrender - Vinyl', price: 25.00, category: 'music', description: 'Limited edition 12" vinyl pressing of the Surrender E.P. 180g black vinyl with printed inner sleeve.', variants: [] },
    { id: 'surrender-cd', title: 'Surrender - CD', price: 12.00, category: 'music', description: 'Physical CD of the Surrender E.P. in a jewel case with full artwork booklet.', variants: [] },
  ];

  // ---------- Init Shopify Cart ----------
  ShopifyStore.init();

  // ---------- Featured Merch on Homepage ----------
  function renderFeaturedMerch(products) {
    const grid = document.getElementById('featuredMerchGrid');
    if (!grid || !products.length) return;

    grid.innerHTML = products.map(p => `
      <a href="#" class="merch__item" data-product-id="${p.id}">
        <div class="merch__img-wrap">
          ${p.image
            ? `<img src="${p.image}" alt="${p.imageAlt || p.title}" loading="lazy" style="width:100%;height:100%;object-fit:cover;">`
            : `<div class="merch__placeholder"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="40" height="40"><rect x="3" y="3" width="18" height="18" rx="2"/></svg></div>`
          }
        </div>
        <div class="merch__info">
          <h3>${p.title}</h3>
          <p>$${p.price.toFixed(2)}</p>
        </div>
      </a>`).join('');

    grid.querySelectorAll('.merch__item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const id = item.dataset.productId;
        const product = findProductById(id);
        if (product) {
          navigateTo('product', product);
        }
      });
    });
  }

  async function initFeaturedMerch() {
    if (ShopifyStore.isConfigured()) {
      const products = await ShopifyStore.fetchProducts();
      if (products) {
        shopProducts = products;
        renderFeaturedMerch(products.slice(0, 6));
        return;
      }
    }
    renderFeaturedMerch(placeholderProducts);
  }

  initFeaturedMerch();

  // ---------- Nav scroll effect ----------
  window.addEventListener('scroll', () => {
    nav.classList.toggle('nav--scrolled', window.scrollY > 60);
  }, { passive: true });

  // ---------- SPA Page Routing ----------
  function hideAllPages() {
    homePage.style.display = 'none';
    shopPage.style.display = 'none';
    productPage.style.display = 'none';
    aboutPage.style.display = 'none';
    newsPage.style.display = 'none';
    eventsPage.style.display = 'none';
    privacyPage.style.display = 'none';
    termsPage.style.display = 'none';
    shippingPage.style.display = 'none';
  }

  function navigateTo(page, data) {
    document.querySelectorAll('.nav__links a, .mobile-menu__links a').forEach(a => a.classList.remove('active'));

    if (page === 'shop') {
      hideAllPages();
      shopPage.style.display = '';
      document.querySelectorAll('[data-page="shop"]').forEach(a => a.classList.add('active'));
      history.pushState({ page: 'shop' }, '', '#shop');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      initShopPage();
    } else if (page === 'product') {
      hideAllPages();
      productPage.style.display = '';
      document.querySelectorAll('[data-page="shop"]').forEach(a => a.classList.add('active'));
      const slug = data?.id || '';
      history.pushState({ page: 'product', id: slug }, '', '#product/' + slug);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      loadProduct(data);
    } else if (page === 'about') {
      hideAllPages();
      aboutPage.style.display = '';
      document.querySelectorAll('[data-page="about"]').forEach(a => a.classList.add('active'));
      history.pushState({ page: 'about' }, '', '#about');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (page === 'news') {
      hideAllPages();
      newsPage.style.display = '';
      document.querySelectorAll('[data-page="news"]').forEach(a => a.classList.add('active'));
      history.pushState({ page: 'news' }, '', '#news');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      initNewsFeed();
    } else if (page === 'events') {
      hideAllPages();
      eventsPage.style.display = '';
      document.querySelectorAll('[data-page="events"]').forEach(a => a.classList.add('active'));
      history.pushState({ page: 'events' }, '', '#events');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (page === 'privacy' || page === 'terms' || page === 'shipping') {
      hideAllPages();
      const legalPages = { privacy: privacyPage, terms: termsPage, shipping: shippingPage };
      legalPages[page].style.display = '';
      history.pushState({ page }, '', '#' + page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      hideAllPages();
      homePage.style.display = '';
      history.pushState({ page: 'home' }, '', window.location.pathname);
    }
  }

  window.navigateTo = navigateTo;

  window.addEventListener('popstate', (e) => {
    if (e.state && e.state.page === 'shop') {
      navigateTo('shop');
    } else if (e.state && e.state.page === 'product') {
      const prod = findProductById(e.state.id);
      if (prod) navigateTo('product', prod);
      else navigateTo('shop');
    } else if (e.state && e.state.page === 'about') {
      navigateTo('about');
    } else if (e.state && e.state.page === 'news') {
      navigateTo('news');
    } else if (e.state && e.state.page === 'events') {
      navigateTo('events');
    } else if (e.state && ['privacy', 'terms', 'shipping'].includes(e.state.page)) {
      navigateTo(e.state.page);
    } else {
      navigateTo('home');
    }
  });

  // Check initial hash
  const initHash = window.location.hash;
  if (initHash === '#shop') {
    navigateTo('shop');
  } else if (initHash === '#about') {
    navigateTo('about');
  } else if (initHash === '#news') {
    navigateTo('news');
  } else if (initHash === '#events') {
    navigateTo('events');
  } else if (initHash === '#privacy') {
    navigateTo('privacy');
  } else if (initHash === '#terms') {
    navigateTo('terms');
  } else if (initHash === '#shipping') {
    navigateTo('shipping');
  } else if (initHash.startsWith('#product/')) {
    const slug = initHash.replace('#product/', '');
    initShopPage().then(() => {
      const prod = findProductById(slug);
      if (prod) navigateTo('product', prod);
      else navigateTo('shop');
    });
  }

  function findProductById(id) {
    return shopProducts.find(p => p.id === id) || placeholderProducts.find(p => p.id === id);
  }

  // SPA nav links (about, news, shop)
  document.querySelectorAll('[data-page]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      hamburger.classList.remove('active');
      mobileMenu.classList.remove('active');
      document.body.style.overflow = '';
      navigateTo(link.dataset.page);
    });
  });

  // Home navigation (logos)
  document.querySelectorAll('.nav__logo a, .nav__center a').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo('home');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  // Shop All Merch button
  if (shopAllBtn) {
    shopAllBtn.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo('shop');
    });
  }

  // Events page signup button
  const eventsSignupBtn = document.getElementById('eventsSignupBtn');
  if (eventsSignupBtn) {
    eventsSignupBtn.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo('home');
      setTimeout(() => {
        const signup = document.getElementById('signup');
        if (signup) signup.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    });
  }

  // PDP breadcrumb back link
  document.querySelectorAll('.pdp__back').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo('shop');
    });
  });

  // ---------- Hamburger menu ----------
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    mobileMenu.classList.toggle('active');
    document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : '';
  });

  mobileMenu.querySelectorAll('a:not([data-page])').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('active');
      mobileMenu.classList.remove('active');
      document.body.style.overflow = '';
    });
  });

  // ---------- Email signup form ----------
  signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = signupForm.querySelector('input');
    if (input.value) {
      confirmation.classList.add('show');
      input.value = '';
      setTimeout(() => confirmation.classList.remove('show'), 4000);
    }
  });

  // ---------- Scroll reveal ----------
  const revealElements = document.querySelectorAll('.signup, .merch, .merch-lockup');
  revealElements.forEach(el => el.classList.add('reveal'));

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  revealElements.forEach(el => observer.observe(el));

  // ---------- Cart panel ----------
  const cartToggle = document.getElementById('cartToggle');
  const cartPanel = document.getElementById('cartPanel');
  const cartOverlay = document.getElementById('cartOverlay');
  const cartClose = document.getElementById('cartClose');

  function openCart() {
    cartPanel.classList.add('active');
    cartOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeCart() {
    cartPanel.classList.remove('active');
    cartOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  window.openCart = openCart;
  window.closeCart = closeCart;

  cartToggle.addEventListener('click', openCart);
  cartClose.addEventListener('click', closeCart);
  cartOverlay.addEventListener('click', closeCart);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && cartPanel.classList.contains('active')) closeCart();
  });

  const checkoutBtn = document.querySelector('.cart-panel__checkout');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      if (ShopifyStore.isConfigured()) {
        const url = await ShopifyStore.createCheckout();
        if (url) window.location.href = url;
      }
    });
  }

  // ---------- Smooth scroll for anchor links ----------
  document.querySelectorAll('a[href^="#"]:not([data-page])').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      if (href === '#') return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        if (homePage.style.display === 'none') navigateTo('home');
        setTimeout(() => {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 50);
      }
    });
  });

  // ---------- Shop page logic ----------
  let shopInitialized = false;

  async function initShopPage() {
    if (shopInitialized) return;
    shopInitialized = true;

    const configBanner = document.getElementById('shopifyConfig');

    if (ShopifyStore.isConfigured()) {
      if (configBanner) configBanner.classList.add('hidden');
      if (!shopProducts.length) {
        const products = await ShopifyStore.fetchProducts();
        if (products) shopProducts = products;
      }
      if (shopProducts.length) {
        const grid = document.getElementById('shopGrid');
        ShopifyStore.renderProducts(shopProducts, grid);
        bindShopCards();
        bindFilters();
      }
    } else {
      if (!shopProducts.length) shopProducts = placeholderProducts;
      bindShopCards();
      bindFilters();
    }
  }

  function bindShopCards() {
    document.querySelectorAll('.shop-card__add').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const name = btn.dataset.name;
        const price = parseFloat(btn.dataset.price);
        const id = btn.dataset.id || name.toLowerCase().replace(/\s+/g, '-');
        const variantId = btn.dataset.variant || '';

        ShopifyStore.addItem({ id, name, price, variantId });

        btn.textContent = 'Added!';
        btn.disabled = true;
        setTimeout(() => {
          btn.textContent = 'Add to Cart';
          btn.disabled = false;
        }, 1500);
      });
    });

    document.querySelectorAll('.shop-card').forEach(card => {
      card.style.cursor = 'pointer';
      card.addEventListener('click', (e) => {
        if (e.target.closest('.shop-card__add')) return;
        const name = card.querySelector('h3')?.textContent;
        const priceText = card.querySelector('.shop-card__price')?.textContent;
        const price = parseFloat(priceText?.replace('$', '') || 0);
        const id = card.querySelector('.shop-card__add')?.dataset.id || name.toLowerCase().replace(/\s+/g, '-');

        const product = findProductById(id);
        if (product) {
          navigateTo('product', product);
        } else {
          navigateTo('product', {
            id, title: name, price, description: '', variants: [],
            image: null, category: card.dataset.category,
          });
        }
      });
    });
  }

  function bindFilters() {
    document.querySelectorAll('.shop-filter').forEach(filterBtn => {
      filterBtn.addEventListener('click', () => {
        document.querySelectorAll('.shop-filter').forEach(b => b.classList.remove('active'));
        filterBtn.classList.add('active');

        const filter = filterBtn.dataset.filter;
        document.querySelectorAll('.shop-card').forEach(card => {
          if (filter === 'all' || card.dataset.category === filter) {
            card.classList.remove('hidden');
          } else {
            card.classList.add('hidden');
          }
        });
      });
    });
  }

  // ---------- Product Detail Page ----------
  function loadProduct(product) {
    if (!product) return;
    currentProduct = product;

    document.getElementById('pdpTitle').textContent = product.title;
    document.getElementById('pdpBreadcrumbTitle').textContent = product.title;
    document.getElementById('pdpPrice').textContent = '$' + product.price.toFixed(2);

    const imgContainer = document.getElementById('pdpImage');
    if (product.image) {
      imgContainer.innerHTML = `<img src="${product.image}" alt="${product.imageAlt || product.title}" loading="lazy">`;
    } else {
      imgContainer.innerHTML = `<div class="merch__placeholder"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="64" height="64"><rect x="3" y="3" width="18" height="18" rx="2"/></svg></div>`;
    }

    const variantsContainer = document.getElementById('pdpVariants');
    const variantOptions = document.getElementById('pdpVariantOptions');
    const variants = product.variants || [];

    if (variants.length > 1 || (variants.length === 1 && variants[0].title !== 'Default Title')) {
      variantsContainer.style.display = '';
      variantOptions.innerHTML = variants.map((v, i) => `
        <button class="pdp__variant-btn ${i === 0 ? 'active' : ''}" data-variant-id="${v.id}" data-price="${v.price || product.price}">
          ${v.title}
        </button>`).join('');

      variantOptions.querySelectorAll('.pdp__variant-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          variantOptions.querySelectorAll('.pdp__variant-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const varPrice = parseFloat(btn.dataset.price);
          if (varPrice) document.getElementById('pdpPrice').textContent = '$' + varPrice.toFixed(2);
        });
      });
    } else {
      variantsContainer.style.display = 'none';
    }

    const descEl = document.getElementById('pdpDescription');
    if (product.descriptionHtml) {
      descEl.innerHTML = product.descriptionHtml;
    } else if (product.description) {
      descEl.innerHTML = `<p>${product.description}</p>`;
    } else {
      descEl.innerHTML = '';
    }

    const addBtn = document.getElementById('pdpAddToCart');
    const newBtn = addBtn.cloneNode(true);
    addBtn.parentNode.replaceChild(newBtn, addBtn);
    newBtn.id = 'pdpAddToCart';

    newBtn.addEventListener('click', () => {
      const selectedVariant = variantOptions.querySelector('.pdp__variant-btn.active');
      const variantId = selectedVariant?.dataset.variantId || product.variantId || '';
      const variantTitle = selectedVariant?.textContent.trim() || '';
      const price = parseFloat(selectedVariant?.dataset.price || product.price);
      const itemName = variantTitle && variantTitle !== 'Default Title'
        ? `${product.title} - ${variantTitle}`
        : product.title;
      const itemId = variantId || product.id;

      ShopifyStore.addItem({ id: itemId, name: itemName, price, variantId });

      newBtn.textContent = 'Added!';
      newBtn.disabled = true;
      setTimeout(() => {
        newBtn.textContent = 'Add to Cart';
        newBtn.disabled = false;
      }, 1500);
    });
  }

  // ---------- User Profile Panel ----------
  const USER_STORAGE_KEY = 'echoplex_user';
  const userPanel = document.getElementById('userPanel');
  const userOverlay = document.getElementById('userOverlay');
  const userPanelClose = document.getElementById('userPanelClose');
  const userForm = document.getElementById('userForm');
  let pendingCommentInput = null;

  function getUser() {
    try { return JSON.parse(localStorage.getItem(USER_STORAGE_KEY)); } catch { return null; }
  }

  function openUserPanel() {
    userPanel.classList.add('active');
    userOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    const existing = getUser();
    if (existing) {
      document.getElementById('userUsername').value = existing.username || '';
      document.getElementById('userEmail').value = existing.email || '';
    }
  }

  function closeUserPanel() {
    userPanel.classList.remove('active');
    userOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  userPanelClose.addEventListener('click', closeUserPanel);
  userOverlay.addEventListener('click', closeUserPanel);

  userForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('userUsername').value.trim();
    const email = document.getElementById('userEmail').value.trim();
    if (!username || !email) return;

    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify({ username, email }));
    closeUserPanel();

    if (pendingCommentInput) {
      pendingCommentInput.focus();
      pendingCommentInput = null;
    }
  });

  // ---------- News Tabs (mobile) ----------
  document.querySelectorAll('.news-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.news-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const layout = document.querySelector('.news-page__layout');
      if (tab.dataset.tab === 'instagram') {
        layout.classList.add('show-instagram');
      } else {
        layout.classList.remove('show-instagram');
      }
    });
  });

  // ---------- News Feed (event delegation) ----------
  function initNewsFeed() {}

  const newsFeedEl = document.getElementById('newsFeed');
  if (newsFeedEl) {
    // Intercept comment input focus — require user profile
    newsFeedEl.addEventListener('focusin', (e) => {
      const commentInput = e.target.closest('.news-comment__input input');
      if (commentInput && !getUser()) {
        e.preventDefault();
        commentInput.blur();
        pendingCommentInput = commentInput;
        openUserPanel();
      }
    });

    newsFeedEl.addEventListener('click', (e) => {
      // Reaction buttons
      const reactionBtn = e.target.closest('.news-reaction');
      if (reactionBtn) {
        e.preventDefault();
        const countEl = reactionBtn.querySelector('span');
        let count = parseInt(countEl.textContent) || 0;

        if (reactionBtn.dataset.type === 'comment') {
          const post = reactionBtn.closest('.news-post');
          const comments = post.querySelector('.news-comments');
          if (comments) {
            comments.style.display = comments.style.display === 'none' ? '' : 'none';
          }
          return;
        }

        if (reactionBtn.classList.contains('active')) {
          reactionBtn.classList.remove('active');
          countEl.textContent = count - 1;
        } else {
          reactionBtn.classList.add('active');
          countEl.textContent = count + 1;
        }
        return;
      }

      // Reply buttons
      const replyBtn = e.target.closest('.news-comment__input .btn');
      if (replyBtn) {
        e.preventDefault();

        const user = getUser();
        if (!user) {
          pendingCommentInput = replyBtn.parentElement.querySelector('input');
          openUserPanel();
          return;
        }

        const input = replyBtn.parentElement.querySelector('input');
        const text = input.value.trim();
        if (!text) return;

        const commentsContainer = replyBtn.closest('.news-comments');
        const newComment = document.createElement('div');
        newComment.className = 'news-comment';
        newComment.innerHTML = `
          <div class="news-comment__avatar"></div>
          <div class="news-comment__content">
            <span class="news-comment__name">${user.username}</span>
            <p>${text}</p>
          </div>`;

        commentsContainer.insertBefore(newComment, replyBtn.parentElement);
        input.value = '';

        const post = replyBtn.closest('.news-post');
        const commentCount = post.querySelector('.news-reaction[data-type="comment"] span');
        if (commentCount) {
          commentCount.textContent = parseInt(commentCount.textContent) + 1;
        }
      }
    });

    // Enter key to submit comment
    newsFeedEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.target.closest('.news-comment__input input')) {
        e.preventDefault();
        e.target.closest('.news-comment__input').querySelector('.btn').click();
      }
    });
  }
});
