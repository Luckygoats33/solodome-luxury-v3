(() => {
  'use strict';
  const $ = (selector, parent = document) => parent.querySelector(selector);
  const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];
  const money = value => Number(value || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Navigation and page behavior */
  const header = $('[data-header]');
  const updateHeader = () => header?.classList.toggle('is-scrolled', scrollY > 18);
  addEventListener('scroll', updateHeader, { passive: true });
  updateHeader();

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    }), { threshold: 0.1, rootMargin: '0px 0px -4%' });
    $$('.reveal').forEach(element => observer.observe(element));
  } else {
    $$('.reveal').forEach(element => element.classList.add('is-visible'));
  }

  const menu = $('[data-mobile-menu]');
  const menuButton = $('[data-menu-button]');
  const setMenu = open => {
    menu?.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-open', open);
    menu?.setAttribute('aria-hidden', String(!open));
    menuButton?.setAttribute('aria-expanded', String(open));
  };
  menuButton?.addEventListener('click', () => setMenu(!menu?.classList.contains('is-open')));
  $('[data-menu-close]')?.addEventListener('click', () => setMenu(false));
  $$('a', menu || document.createElement('div')).forEach(link => link.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      setMenu(false);
      const lightbox = $('[data-lightbox-modal]');
      lightbox?.classList.remove('is-open');
      lightbox?.setAttribute('aria-hidden', 'true');
    }
  });

  $$('[data-parallax]').forEach(element => {
    addEventListener('scroll', () => {
      if (reducedMotion) return;
      const rect = element.getBoundingClientRect();
      const y = Math.max(-8, Math.min(8, ((rect.top + rect.height / 2 - innerHeight / 2) / innerHeight) * -8));
      element.style.setProperty('--parallax-y', `${y}%`);
    }, { passive: true });
  });

  /* Home engineering tabs */
  const metrics = {
    sound: ['20–20k', 'Hz frequency response'],
    signal: ['0.02%', 'THD+N at 1 watt'],
    connection: ['4 ways', 'to connect your source']
  };
  $$('[data-tech-tab]').forEach(button => button.addEventListener('click', () => {
    const key = button.dataset.techTab;
    $$('[data-tech-tab]').forEach(item => item.setAttribute('aria-selected', String(item === button)));
    $$('[data-tech-image]').forEach(image => image.classList.toggle('is-active', image.dataset.techImage === key));
    const metric = $('[data-tech-metric]');
    if (metric && metrics[key]) metric.innerHTML = `<strong>${metrics[key][0]}</strong><span>${metrics[key][1]}</span>`;
  }));

  /* Decorative sound field */
  const canvas = $('[data-sound-canvas]');
  if (canvas && !reducedMotion) {
    const context = canvas.getContext('2d');
    let animationFrame;
    const resize = () => {
      const density = devicePixelRatio || 1;
      canvas.width = innerWidth * density;
      canvas.height = innerHeight * density;
      context.setTransform(density, 0, 0, density, 0, 0);
    };
    const draw = time => {
      context.clearRect(0, 0, innerWidth, innerHeight);
      context.lineWidth = 0.65;
      const centerY = innerHeight * 0.58;
      for (let line = 0; line < 4; line += 1) {
        context.beginPath();
        for (let x = 0; x <= innerWidth; x += 8) {
          const amplitude = 10 + line * 7;
          const y = centerY + (line - 1.5) * 28 + Math.sin(x * 0.009 + time * 0.0007 + line) * amplitude * Math.sin(Math.PI * x / innerWidth);
          if (x) context.lineTo(x, y); else context.moveTo(x, y);
        }
        context.strokeStyle = `rgba(210,186,131,${0.13 - line * 0.015})`;
        context.stroke();
      }
      animationFrame = requestAnimationFrame(draw);
    };
    resize();
    addEventListener('resize', resize);
    animationFrame = requestAnimationFrame(draw);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) cancelAnimationFrame(animationFrame);
      else animationFrame = requestAnimationFrame(draw);
    });
  }

  /* Lightbox and gallery fallback */
  $$('[data-lightbox]').forEach(button => button.addEventListener('click', () => {
    const modal = $('[data-lightbox-modal]');
    const image = $('img', modal || document.createElement('div'));
    if (!modal || !image) return;
    image.src = button.dataset.lightbox;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
  }));
  $('[data-lightbox-close]')?.addEventListener('click', () => {
    const modal = $('[data-lightbox-modal]');
    modal?.classList.remove('is-open');
    modal?.setAttribute('aria-hidden', 'true');
  });
  $('[data-lightbox-modal]')?.addEventListener('click', event => {
    if (event.target === event.currentTarget) $('[data-lightbox-close]')?.click();
  });

  /* Cart storage */
  const CART_KEY = 'solodome-cart-v3';
  const ORDER_KEY = 'solodome-last-order-v3';
  const getCart = () => {
    try {
      const value = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
      return Array.isArray(value) ? value : [];
    } catch (_) { return []; }
  };
  const saveCart = cart => {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (_) {}
    updateCartCount();
  };
  const updateCartCount = () => {
    const count = getCart().reduce((total, item) => total + Number(item.quantity || 1), 0);
    $$('[data-cart-count]').forEach(element => { element.textContent = String(count); });
  };
  const showToast = message => {
    const toast = $('[data-cart-toast]');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove('is-visible'), 2600);
  };
  const addItem = item => {
    const cart = getCart();
    const existing = cart.find(entry => entry.id === item.id && JSON.stringify(entry.options || {}) === JSON.stringify(item.options || {}));
    if (existing) existing.quantity += Number(item.quantity || 1);
    else cart.push({ ...item, quantity: Number(item.quantity || 1) });
    saveCart(cart);
    showToast(`${item.name} was added to your cart.`);
  };
  updateCartCount();

  $$('[data-add-to-cart]').forEach(button => button.addEventListener('click', () => {
    addItem({
      id: button.dataset.productId,
      name: button.dataset.productName,
      price: Number(button.dataset.productPrice),
      image: button.dataset.productImage,
      options: { Configuration: 'Standard specification' }
    });
  }));

  /* Configurator */
  const configurator = $('[data-configurator]');
  if (configurator) {
    const image = $('[data-config-image]', configurator);
    const modelLabel = $('[data-config-model-label]', configurator);
    const colorLabel = $('[data-config-color-label]', configurator);
    const totalElement = $('[data-config-total]', configurator);
    const backdrop = $('.config-backdrop', configurator);
    const addButton = $('[data-config-add]', configurator);
    const state = {
      model: 'classic', modelName: 'SoloDome Classic', base: 5999, image: 'assets/classic.png',
      exterior: 'Porcelain', exteriorColor: '#eeeae0', interior: 'Ivory',
      connection: 0, connectionLabel: 'Standard 3.5mm', dsp: 0
    };
    const update = () => {
      const total = state.base + Number(state.connection) + Number(state.dsp);
      totalElement.textContent = money(total);
      modelLabel.textContent = state.modelName.replace('SoloDome ', '');
      colorLabel.textContent = `${state.exterior} exterior · ${state.interior} interior`;
      backdrop.style.background = `radial-gradient(circle at 50% 40%,rgba(255,255,255,.72),transparent 48%),linear-gradient(145deg,${state.exteriorColor},#c8bca9)`;
      if (image) image.src = state.image;
    };
    const selectModel = button => {
      $$('[data-model]', configurator).forEach(item => item.classList.toggle('is-active', item === button));
      state.model = button.dataset.model;
      state.modelName = `SoloDome ${state.model[0].toUpperCase()}${state.model.slice(1)}`;
      state.base = Number(button.dataset.price);
      state.image = button.dataset.image;
      update();
    };
    $$('[data-model]', configurator).forEach(button => button.addEventListener('click', () => selectModel(button)));
    const requestedModel = new URLSearchParams(location.search).get('model');
    if (requestedModel) {
      const button = $(`[data-model="${requestedModel}"]`, configurator);
      if (button) selectModel(button);
    }
    $$('[data-exterior-swatches] button', configurator).forEach(button => button.addEventListener('click', () => {
      $$('[data-exterior-swatches] button', configurator).forEach(item => item.classList.toggle('is-active', item === button));
      state.exterior = button.dataset.name;
      state.exteriorColor = button.dataset.color;
      update();
    }));
    $$('[data-interior-options] button', configurator).forEach(button => button.addEventListener('click', () => {
      $$('[data-interior-options] button', configurator).forEach(item => item.classList.toggle('is-active', item === button));
      state.interior = button.dataset.name;
      update();
    }));
    $$('input[name="connection"]', configurator).forEach(input => input.addEventListener('change', () => {
      if (!input.checked) return;
      state.connection = Number(input.value);
      state.connectionLabel = input.dataset.label;
      update();
    }));
    $('input[name="dsp"]', configurator)?.addEventListener('change', event => {
      state.dsp = event.target.checked ? 399 : 0;
      update();
    });
    addButton?.addEventListener('click', () => {
      const total = state.base + Number(state.connection) + Number(state.dsp);
      addItem({
        id: `${state.model}-configured-${Date.now()}`,
        name: state.modelName,
        price: total,
        image: state.image,
        options: {
          Exterior: state.exterior,
          Interior: state.interior,
          Connection: state.connectionLabel,
          'Custom DSP': state.dsp ? 'Included' : 'Not selected'
        }
      });
      setTimeout(() => { location.href = 'cart.html'; }, 500);
    });
    update();
  }

  /* Interactive video-scrub 360° viewer */
  const viewer = $('[data-product-viewer]');
  if (viewer) {
    const stage = $('[data-viewer-stage]', viewer);
    const video = $('[data-viewer-video]', viewer);
    const source = $('source[data-src]', video);
    const angleElement = $('[data-viewer-angle]', viewer);
    const instruction = $('[data-viewer-instruction]', viewer);
    const detail = $('[data-viewer-detail]', viewer);
    const pointers = new Map();
    let duration = 15;
    let scale = 1;
    let panX = 0;
    let panY = 0;
    let panMode = false;
    let interacted = false;
    let dragging = false;
    let dragStart = null;
    let pinchStart = null;
    let lastTap = 0;

    const wrapTime = value => {
      if (!duration) return 0;
      return ((value % duration) + duration) % duration;
    };
    const applyTransform = () => {
      stage.style.setProperty('--viewer-scale', scale.toFixed(3));
      stage.style.setProperty('--pan-x', `${panX}px`);
      stage.style.setProperty('--pan-y', `${panY}px`);
    };
    const updateAngle = () => {
      const angle = duration ? Math.round((video.currentTime / duration) * 360) % 360 : 0;
      angleElement.textContent = `${String(angle).padStart(3, '0')}°`;
      const front = angle < 65 || angle > 300;
      const sideBack = angle > 65 && angle < 300;
      $('.hotspot-interior', viewer)?.classList.toggle('is-visible', front);
      $('.hotspot-base', viewer)?.classList.toggle('is-visible', front);
      $('.hotspot-shell', viewer)?.classList.toggle('is-visible', sideBack);
    };
    const setTime = value => {
      video.pause();
      video.currentTime = wrapTime(value);
      updateAngle();
    };
    const setInteracted = () => {
      if (interacted) return;
      interacted = true;
      stage.classList.add('has-interacted');
      video.pause();
    };
    const setZoom = next => {
      scale = Math.max(1, Math.min(2.6, next));
      if (scale === 1) { panX = 0; panY = 0; }
      applyTransform();
    };
    const reset = () => {
      setInteracted();
      scale = 1; panX = 0; panY = 0; panMode = false;
      $('[data-viewer-pan]', viewer)?.setAttribute('aria-pressed', 'false');
      stage.classList.remove('is-pan-mode');
      applyTransform();
      setTime(0);
      detail.innerHTML = '<span>01</span><div><b>Direct control</b><p>The displayed angle follows your drag distance and stops the moment you release.</p></div>';
    };
    const loadViewer = () => {
      if (!source || source.src) return;
      source.src = source.dataset.src;
      video.load();
    };
    const viewerObserver = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        loadViewer();
        viewerObserver.disconnect();
      }
    }, { rootMargin: '300px' }) : null;
    if (viewerObserver) viewerObserver.observe(stage); else loadViewer();

    video.addEventListener('loadedmetadata', () => {
      duration = Number.isFinite(video.duration) ? video.duration : 15;
      video.loop = true;
      video.playbackRate = 0.35;
      updateAngle();
    });
    video.addEventListener('loadeddata', () => {
      stage.classList.add('is-ready');
      if (!reducedMotion && !interacted) video.play().catch(() => {});
    });
    video.addEventListener('timeupdate', updateAngle);
    video.addEventListener('error', () => {
      stage.classList.add('is-ready');
      $('[data-viewer-loader]', viewer)?.remove();
      showToast('The interactive video could not load. The static product gallery remains available below.');
    });

    const pointerDistance = values => Math.hypot(values[0].x - values[1].x, values[0].y - values[1].y);
    const pointerCenter = values => ({ x: (values[0].x + values[1].x) / 2, y: (values[0].y + values[1].y) / 2 });
    stage.addEventListener('pointerdown', event => {
      loadViewer();
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      stage.setPointerCapture?.(event.pointerId);
      setInteracted();
      stage.classList.add('is-dragging');
      dragging = true;
      const values = [...pointers.values()];
      if (values.length === 1) {
        dragStart = { x: event.clientX, y: event.clientY, time: video.currentTime, panX, panY, committed: false };
      } else if (values.length === 2) {
        pinchStart = { distance: pointerDistance(values), center: pointerCenter(values), scale, panX, panY };
      }
    });
    stage.addEventListener('pointermove', event => {
      if (!pointers.has(event.pointerId)) return;
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      const values = [...pointers.values()];
      if (values.length >= 2 && pinchStart) {
        if (event.cancelable) event.preventDefault();
        const distance = pointerDistance(values);
        const center = pointerCenter(values);
        setZoom(pinchStart.scale * (distance / Math.max(1, pinchStart.distance)));
        panX = pinchStart.panX + center.x - pinchStart.center.x;
        panY = pinchStart.panY + center.y - pinchStart.center.y;
        applyTransform();
        return;
      }
      if (!dragStart || values.length !== 1) return;
      const dx = event.clientX - dragStart.x;
      const dy = event.clientY - dragStart.y;
      if (!dragStart.committed) {
        if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return;
        if (!panMode && Math.abs(dy) > Math.abs(dx) * 1.25) return;
        dragStart.committed = true;
      }
      if (event.cancelable) event.preventDefault();
      if (panMode && scale > 1) {
        panX = dragStart.panX + dx;
        panY = dragStart.panY + dy;
        applyTransform();
      } else {
        setTime(dragStart.time + (dx / Math.max(1, stage.clientWidth)) * duration * 1.2);
      }
    });
    const endPointer = event => {
      pointers.delete(event.pointerId);
      if (pointers.size < 2) pinchStart = null;
      if (!pointers.size) {
        dragging = false;
        dragStart = null;
        stage.classList.remove('is-dragging');
      }
    };
    stage.addEventListener('pointerup', endPointer);
    stage.addEventListener('pointercancel', endPointer);
    stage.addEventListener('wheel', event => {
      if (event.cancelable) event.preventDefault();
      setInteracted();
      setZoom(scale + (event.deltaY < 0 ? 0.13 : -0.13));
    }, { passive: false });
    stage.addEventListener('dblclick', event => {
      event.preventDefault();
      setInteracted();
      setZoom(scale > 1.25 ? 1 : 1.8);
    });
    stage.addEventListener('pointerup', event => {
      const now = Date.now();
      if (event.pointerType === 'touch' && now - lastTap < 320) setZoom(scale > 1.25 ? 1 : 1.8);
      lastTap = now;
    });
    stage.addEventListener('keydown', event => {
      const step = duration / 72;
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '+', '=', '-', '_', 'r', 'R', 'f', 'F'].includes(event.key)) event.preventDefault();
      setInteracted();
      if (event.key === 'ArrowLeft') setTime(video.currentTime - step);
      if (event.key === 'ArrowRight') setTime(video.currentTime + step);
      if (event.key === 'ArrowUp' || event.key === '+' || event.key === '=') setZoom(scale + 0.15);
      if (event.key === 'ArrowDown' || event.key === '-' || event.key === '_') setZoom(scale - 0.15);
      if (event.key.toLowerCase() === 'r') reset();
      if (event.key.toLowerCase() === 'f') $('[data-viewer-fullscreen]', viewer)?.click();
    });
    $('[data-viewer-zoom-in]', viewer)?.addEventListener('click', () => { setInteracted(); setZoom(scale + 0.2); });
    $('[data-viewer-zoom-out]', viewer)?.addEventListener('click', () => { setInteracted(); setZoom(scale - 0.2); });
    $('[data-viewer-reset]', viewer)?.addEventListener('click', reset);
    $('[data-viewer-pan]', viewer)?.addEventListener('click', event => {
      setInteracted();
      panMode = !panMode;
      event.currentTarget.setAttribute('aria-pressed', String(panMode));
      stage.classList.toggle('is-pan-mode', panMode);
      if (panMode && scale === 1) setZoom(1.45);
    });
    $('[data-viewer-fullscreen]', viewer)?.addEventListener('click', async () => {
      setInteracted();
      try {
        if (!document.fullscreenElement) await stage.requestFullscreen();
        else await document.exitFullscreen();
      } catch (_) { showToast('Fullscreen is not available in this browser view.'); }
    });
    const hotspotData = {
      interior: { time: 0.4, zoom: 1.55, x: 0, y: 45, number: '02', title: 'Acoustic interior', text: 'Upholstered surfaces surround the listening position with comfort while helping create a controlled personal sound field.' },
      shell: { time: 7.2, zoom: 1.55, x: -60, y: 0, number: '03', title: 'Sculpted exterior shell', text: 'The architectural enclosure gives SoloDome its visual identity and establishes the geometry around the listener.' },
      base: { time: 0.3, zoom: 1.75, x: 0, y: -125, number: '04', title: 'Swivel pedestal', text: 'The weighted pedestal supports the sculptural body while allowing the listener to turn naturally within the room.' }
    };
    $$('[data-viewer-hotspot]', viewer).forEach(button => button.addEventListener('click', event => {
      event.stopPropagation();
      setInteracted();
      const data = hotspotData[button.dataset.viewerHotspot];
      setTime(data.time);
      scale = data.zoom; panX = data.x; panY = data.y; applyTransform();
      detail.innerHTML = `<span>${data.number}</span><div><b>${data.title}</b><p>${data.text}</p></div>`;
    }));
    applyTransform();
  }

  /* Cart page */
  const cartPage = $('[data-cart-page]');
  const renderCart = () => {
    if (!cartPage) return;
    const cart = getCart();
    const container = $('[data-cart-items]', cartPage);
    const layout = $('.cart-layout', cartPage);
    const empty = $('[data-empty-cart]', cartPage);
    if (!cart.length) {
      layout.hidden = true;
      empty.hidden = false;
      return;
    }
    layout.hidden = false;
    empty.hidden = true;
    container.innerHTML = cart.map((item, index) => {
      const options = Object.entries(item.options || {}).map(([key, value]) => `${key}: ${value}`).join(' · ');
      return `<article class="cart-item"><div class="cart-item-image"><img src="${item.image}" alt="${item.name}"></div><div><p class="kicker">Made to order</p><h2>${item.name}</h2><p class="cart-item-options">${options}</p><div class="cart-item-actions"><button type="button" data-cart-remove="${index}">Remove</button><a href="configure.html?model=${item.id.includes('deluxe') ? 'deluxe' : 'classic'}">Edit configuration</a></div></div><div class="cart-item-price"><b>${money(item.price * item.quantity)}</b><div class="qty-control"><button type="button" data-cart-qty="${index}" data-delta="-1" aria-label="Decrease quantity">−</button><span>${item.quantity}</span><button type="button" data-cart-qty="${index}" data-delta="1" aria-label="Increase quantity">+</button></div></div></article>`;
    }).join('');
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shipping = cart.length ? 349 : 0;
    $('[data-cart-subtotal]', cartPage).textContent = money(subtotal);
    $('[data-cart-shipping]', cartPage).textContent = money(shipping);
    $('[data-cart-total]', cartPage).textContent = money(subtotal + shipping);
    $$('[data-cart-remove]', cartPage).forEach(button => button.addEventListener('click', () => {
      const next = getCart();
      next.splice(Number(button.dataset.cartRemove), 1);
      saveCart(next); renderCart();
    }));
    $$('[data-cart-qty]', cartPage).forEach(button => button.addEventListener('click', () => {
      const next = getCart();
      const index = Number(button.dataset.cartQty);
      next[index].quantity = Math.max(1, next[index].quantity + Number(button.dataset.delta));
      saveCart(next); renderCart();
    }));
  };
  renderCart();

  /* Checkout */
  const checkoutPage = $('[data-checkout-page]');
  if (checkoutPage) {
    const cart = getCart();
    if (!cart.length) {
      location.replace('cart.html');
    } else {
      const itemContainer = $('[data-checkout-items]', checkoutPage);
      itemContainer.innerHTML = cart.map(item => `<article class="checkout-mini"><img src="${item.image}" alt="${item.name}"><div><b>${item.name}</b><small>Quantity ${item.quantity}</small></div><strong>${money(item.price * item.quantity)}</strong></article>`).join('');
      const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const updateTotals = () => {
        const shipping = Number($('input[name="delivery"]:checked', checkoutPage)?.value || 0);
        $('[data-checkout-subtotal]', checkoutPage).textContent = money(subtotal);
        $('[data-checkout-shipping]', checkoutPage).textContent = money(shipping);
        $('[data-checkout-total]', checkoutPage).textContent = money(subtotal + shipping);
      };
      $$('input[name="delivery"]', checkoutPage).forEach(input => input.addEventListener('change', updateTotals));
      updateTotals();
      const paymentInputs = $$('input[name="paymentType"]', checkoutPage);
      const cardInputs = $$('.card-fields input', checkoutPage);
      paymentInputs.forEach(input => input.addEventListener('change', () => {
        const card = $('input[name="paymentType"]:checked', checkoutPage)?.value === 'card';
        $('.card-fields', checkoutPage).hidden = !card;
        cardInputs.forEach(field => { field.required = card; });
      }));
      const cardNumber = $('input[name="card"]', checkoutPage);
      cardNumber?.addEventListener('input', () => {
        cardNumber.value = cardNumber.value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
      });
      $('[data-checkout-form]', checkoutPage)?.addEventListener('submit', event => {
        event.preventDefault();
        const form = event.currentTarget;
        if (!form.reportValidity()) return;
        const formData = Object.fromEntries(new FormData(form).entries());
        const shipping = Number(formData.delivery || 0);
        const number = `SD-${String(Date.now()).slice(-8)}`;
        const order = { number, date: new Date().toISOString(), items: cart, subtotal, shipping, total: subtotal + shipping, customer: { email: formData.email, firstName: formData.firstName, lastName: formData.lastName } };
        try { localStorage.setItem(ORDER_KEY, JSON.stringify(order)); localStorage.removeItem(CART_KEY); } catch (_) {}
        location.href = 'order-confirmation.html';
      });
    }
  }

  const confirmation = $('[data-confirmation]');
  if (confirmation) {
    let order;
    try { order = JSON.parse(localStorage.getItem(ORDER_KEY) || 'null'); } catch (_) {}
    if (order?.number) $('[data-order-number]', confirmation).textContent = order.number;
    updateCartCount();
  }

  /* Contact form prototype confirmation */
  $$('form.contact-form').forEach(form => form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    form.innerHTML = '<div class="form-confirmation"><p class="kicker">Inquiry prepared</p><h2>Thank you.</h2><p>Your SoloDome inquiry has been captured in this prototype. Connect the form to your CRM or email service before launch.</p></div>';
  }));
})();
