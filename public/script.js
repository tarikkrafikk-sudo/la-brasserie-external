  document.getElementById('year').textContent = new Date().getFullYear();

  const mobileBtn = document.getElementById('mobileMenuBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  mobileBtn.addEventListener('click', () => mobileMenu.classList.toggle('hidden'));
  document.querySelectorAll('.mobile-link').forEach(l => l.addEventListener('click', () => mobileMenu.classList.add('hidden')));

  // Lightbox (Galerie + photos des plats du menu)
  const galleryItems = Array.from(document.querySelectorAll('.gallery-item'));
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxCaption = document.getElementById('lightboxCaption');
  const lightboxClose = document.getElementById('lightboxClose');
  const lightboxPrev = document.getElementById('lightboxPrev');
  const lightboxNext = document.getElementById('lightboxNext');
  let currentGallery = [];
  let currentImageIndex = 0;

  function showImage(index) {
    if (!currentGallery.length) return;
    currentImageIndex = (index + currentGallery.length) % currentGallery.length;
    const item = currentGallery[currentImageIndex];
    lightboxImg.src = item.full;
    lightboxImg.alt = item.alt;
    lightboxCaption.textContent = item.alt;
  }

  function openLightboxWithGallery(gallery, index) {
    currentGallery = gallery;
    showImage(index);
    lightbox.classList.remove('hidden');
    lightbox.classList.add('flex');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.add('hidden');
    lightbox.classList.remove('flex');
    document.body.style.overflow = '';
  }

  const galleryGroup = galleryItems.map(item => {
    const img = item.querySelector('img');
    return { full: img.src.replace(/w=600/, 'w=1600'), alt: img.alt };
  });

  galleryItems.forEach((item, index) => {
    item.addEventListener('click', () => openLightboxWithGallery(galleryGroup, index));
  });

  lightboxClose.addEventListener('click', closeLightbox);
  lightboxPrev.addEventListener('click', () => showImage(currentImageIndex - 1));
  lightboxNext.addEventListener('click', () => showImage(currentImageIndex + 1));

  // Fermer en cliquant sur le fond noir (pas sur l'image ni les boutons)
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  // Navigation et fermeture au clavier (lightbox)
  document.addEventListener('keydown', (e) => {
    if (lightbox.classList.contains('hidden')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') showImage(currentImageIndex - 1);
    if (e.key === 'ArrowRight') showImage(currentImageIndex + 1);
  });

  // Carrousels d'images du menu
  function updateCarousel(carousel) {
    const track = carousel.querySelector('.carousel-track');
    const dots = carousel.querySelectorAll('.carousel-dot');
    const index = parseInt(carousel.dataset.index || '0', 10);
    track.style.transform = `translateX(-${index * 100}%)`;
    dots.forEach((d, i) => {
      d.classList.toggle('bg-brand', i === index);
      d.classList.toggle('bg-white/40', i !== index);
    });
  }

  document.querySelectorAll('.carousel').forEach(carousel => {
    carousel.dataset.index = '0';
    const slides = carousel.querySelectorAll('.carousel-track img');
    const prevBtn = carousel.querySelector('.carousel-prev');
    const nextBtn = carousel.querySelector('.carousel-next');

    prevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = (parseInt(carousel.dataset.index, 10) - 1 + slides.length) % slides.length;
      carousel.dataset.index = idx;
      updateCarousel(carousel);
    });

    nextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = (parseInt(carousel.dataset.index, 10) + 1) % slides.length;
      carousel.dataset.index = idx;
      updateCarousel(carousel);
    });

    // Cliquer sur la photo d'un plat l'ouvre en grand (même galerie que ce plat : ses 3 photos)
    const dishGroup = Array.from(slides).map(img => ({ full: img.src.replace(/w=600/, 'w=1600'), alt: img.alt }));
    carousel.querySelector('.carousel-track').addEventListener('click', () => {
      const activeIndex = parseInt(carousel.dataset.index || '0', 10);
      openLightboxWithGallery(dishGroup, activeIndex);
    });
  });

  // Formulaire de réservation (démo - ne pas envoyer réellement)
  const reservationForm = document.querySelector('#contact form');
  const formSuccess = document.getElementById('formSuccess');
  if (reservationForm) {
    reservationForm.addEventListener('submit', (e) => {
      e.preventDefault();
      formSuccess.classList.remove('hidden');
      setTimeout(() => { reservationForm.reset(); }, 300);
    });
  }

  // ==================== Recherche + Filtres du Menu ====================
  const searchInput = document.getElementById('menuSearch');
  const filterButtons = Array.from(document.querySelectorAll('.filter-btn'));
  const categoryBlocks = Array.from(document.querySelectorAll('.category-block'));
  const noResultsEl = document.getElementById('noResults');
  let activeFilter = 'all';

  function normalizeText(str) {
    return (str || '')
      .toString()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .trim();
  }

  function applyMenuFilters() {
    const query = normalizeText(searchInput ? searchInput.value : '');
    let totalVisible = 0;

    categoryBlocks.forEach(block => {
      const blockCategory = block.dataset.category;
      const categoryMatches = activeFilter === 'all' || activeFilter === blockCategory;
      let visibleInBlock = 0;

      block.querySelectorAll('.menu-card').forEach(card => {
        const name = normalizeText(card.dataset.name);
        const searchMatches = query === '' || name.includes(query);
        const visible = categoryMatches && searchMatches;
        card.style.display = visible ? '' : 'none';
        if (visible) visibleInBlock++;
      });

      block.style.display = visibleInBlock > 0 ? '' : 'none';
      totalVisible += visibleInBlock;
    });

    if (noResultsEl) noResultsEl.classList.toggle('hidden', totalVisible > 0);
  }

  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      activeFilter = btn.dataset.filter;
      filterButtons.forEach(b => b.classList.toggle('is-active', b === btn));
      applyMenuFilters();
    });
  });

  if (searchInput) {
    searchInput.addEventListener('input', applyMenuFilters);
  }

  // ==================== Panier ====================
  const CART_STORAGE_KEY = 'labrasserie_cart';
  // Numéro WhatsApp du restaurant (format international, sans + ni espaces).
  // MODIFIER ICI si le numéro WhatsApp Business diffère du téléphone fixe ci-dessus.
  const WHATSAPP_NUMBER = '212522568987';

  function loadCart() {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveCart(cartData) {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartData));
    } catch (e) { /* stockage indisponible : on continue sans persister */ }
  }

  let cart = loadCart();

  const cartBtn = document.getElementById('cartBtn');
  const cartCountEl = document.getElementById('cartCount');
  const cartOverlay = document.getElementById('cartOverlay');
  const cartDrawer = document.getElementById('cartDrawer');
  const cartClose = document.getElementById('cartClose');
  const cartItemsEl = document.getElementById('cartItems');
  const cartEmptyMsg = document.getElementById('cartEmptyMsg');
  const cartTotalEl = document.getElementById('cartTotal');
  const cartClearBtn = document.getElementById('cartClear');
  const cartWhatsappLink = document.getElementById('cartWhatsapp');
  const toastEl = document.getElementById('toast');
  const toastMsgEl = document.getElementById('toastMsg');
  let toastTimer = null;

  function showToast(message) {
    if (!toastEl) return;
    toastMsgEl.textContent = message;
    toastEl.classList.remove('opacity-0', 'translate-y-24');
    toastEl.classList.add('opacity-100', 'translate-y-0');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastEl.classList.add('opacity-0', 'translate-y-24');
      toastEl.classList.remove('opacity-100', 'translate-y-0');
    }, 2200);
  }

  function renderCart() {
    cartItemsEl.querySelectorAll('.cart-row').forEach(row => row.remove());
    cartEmptyMsg.classList.toggle('hidden', cart.length > 0);

    let total = 0;
    let count = 0;

    cart.forEach((item, idx) => {
      total += item.price * item.qty;
      count += item.qty;

      const row = document.createElement('div');
      row.className = 'cart-row flex items-center gap-3';
      row.innerHTML = `
        <div class="flex-1 min-w-0">
          <p class="text-sm font-semibold truncate">${item.name}</p>
          <p class="text-xs text-gray-400">${item.price} MAD</p>
        </div>
        <div class="flex items-center gap-2">
          <button type="button" class="qty-minus w-7 h-7 rounded-full bg-inputbg border border-line text-ivory hover:border-brand flex items-center justify-center text-sm" aria-label="Diminuer la quantité">−</button>
          <span class="text-sm w-5 text-center">${item.qty}</span>
          <button type="button" class="qty-plus w-7 h-7 rounded-full bg-inputbg border border-line text-ivory hover:border-brand flex items-center justify-center text-sm" aria-label="Augmenter la quantité">+</button>
        </div>
        <button type="button" class="cart-remove text-gray-500 hover:text-brand transition-colors" aria-label="Retirer du panier">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3m-9 0h10" /></svg>
        </button>
      `;

      row.querySelector('.qty-minus').addEventListener('click', () => changeQty(idx, -1));
      row.querySelector('.qty-plus').addEventListener('click', () => changeQty(idx, 1));
      row.querySelector('.cart-remove').addEventListener('click', () => removeFromCart(idx));

      cartItemsEl.appendChild(row);
    });

    cartTotalEl.textContent = total + ' MAD';
    cartCountEl.textContent = count;
    cartCountEl.classList.toggle('hidden', count === 0);

    if (cartWhatsappLink) {
      const lines = cart.map(i => `- ${i.name} x${i.qty} (${i.price * i.qty} MAD)`).join('\n');
      const msgText = cart.length
        ? `Bonjour, je souhaite commander :\n${lines}\n\nTotal : ${total} MAD`
        : 'Bonjour, je souhaite passer une commande.';
      cartWhatsappLink.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msgText)}`;
    }

    saveCart(cart);
  }

  function addToCart(name, price) {
    const existing = cart.find(i => i.name === name);
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({ name, price, qty: 1 });
    }
    renderCart();
    showToast(`✓ ${name} ajouté au panier`);
  }

  function changeQty(index, delta) {
    const item = cart[index];
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) cart.splice(index, 1);
    renderCart();
  }

  function removeFromCart(index) {
    cart.splice(index, 1);
    renderCart();
  }

  document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.dataset.name;
      const price = parseFloat(btn.dataset.price);
      addToCart(name, price);
    });
  });

  function openCart() {
    cartOverlay.classList.remove('hidden');
    cartDrawer.classList.remove('translate-x-full');
    document.body.style.overflow = 'hidden';
  }

  function closeCart() {
    cartOverlay.classList.add('hidden');
    cartDrawer.classList.add('translate-x-full');
    document.body.style.overflow = '';
  }

  if (cartBtn) cartBtn.addEventListener('click', openCart);
  if (cartClose) cartClose.addEventListener('click', closeCart);
  if (cartOverlay) cartOverlay.addEventListener('click', closeCart);
  if (cartClearBtn) cartClearBtn.addEventListener('click', () => { cart = []; renderCart(); });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && cartDrawer && !cartDrawer.classList.contains('translate-x-full')) {
      closeCart();
    }
  });

  renderCart();

  // ==================== Vidéos (lazy loading + lecture au survol) ====================
  const videoCards = document.querySelectorAll('.video-card');

  if ('IntersectionObserver' in window) {
    const videoObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const video = entry.target.querySelector('video[data-src]');
          if (video && !video.getAttribute('src')) {
            video.src = video.dataset.src;
          }
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '200px' });

    videoCards.forEach(card => videoObserver.observe(card));
  } else {
    videoCards.forEach(card => {
      const video = card.querySelector('video[data-src]');
      if (video) video.src = video.dataset.src;
    });
  }

  videoCards.forEach(card => {
    const video = card.querySelector('video');
    if (!video) return;

    function playPreview() {
      if (!video.getAttribute('src') && video.dataset.src) video.src = video.dataset.src;
      video.currentTime = 0;
      video.play().catch(() => {});
      card.classList.add('is-playing');
    }

    function stopPreview() {
      video.pause();
      video.currentTime = 0;
      card.classList.remove('is-playing');
    }

    // Survol (ordinateur uniquement) : petit aperçu muet directement dans la carte
    card.addEventListener('mouseenter', playPreview);
    card.addEventListener('mouseleave', stopPreview);

    // Clic (ordinateur et mobile) : ouvre le lecteur vidéo en grand, avec le son
    card.addEventListener('click', () => {
      stopPreview();
      const src = video.getAttribute('src') || video.dataset.src;
      const title = card.querySelector('h5') ? card.querySelector('h5').textContent : '';
      openVideoLightbox(src, title);
    });
  });

  // ==================== Lecteur vidéo en grand ====================
  const videoLightbox = document.getElementById('videoLightbox');
  const videoLightboxPlayer = document.getElementById('videoLightboxPlayer');
  const videoLightboxCaption = document.getElementById('videoLightboxCaption');
  const videoLightboxClose = document.getElementById('videoLightboxClose');

  function openVideoLightbox(src, caption) {
    if (!src) return;
    videoLightboxPlayer.src = src;
    videoLightboxPlayer.muted = false;
    videoLightboxCaption.textContent = caption || '';
    videoLightbox.classList.remove('hidden');
    videoLightbox.classList.add('flex');
    document.body.style.overflow = 'hidden';
    videoLightboxPlayer.currentTime = 0;
    videoLightboxPlayer.play().catch(() => {});
  }

  function closeVideoLightbox() {
    videoLightboxPlayer.pause();
    videoLightboxPlayer.removeAttribute('src');
    videoLightboxPlayer.load();
    videoLightbox.classList.add('hidden');
    videoLightbox.classList.remove('flex');
    document.body.style.overflow = '';
  }

  if (videoLightboxClose) videoLightboxClose.addEventListener('click', closeVideoLightbox);
  if (videoLightbox) {
    videoLightbox.addEventListener('click', (e) => {
      if (e.target === videoLightbox) closeVideoLightbox();
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && videoLightbox && !videoLightbox.classList.contains('hidden')) {
      closeVideoLightbox();
    }
  });
