# SoloDome Luxury Website V3

This build includes the SoloDome-branded multi-page website, a temporary drag-controlled 360° product viewer created from the supplied rotation video, and a complete front-end cart and checkout flow.

## Open the site

1. Extract the entire ZIP archive.
2. Keep all HTML files, `styles.css`, `script.js`, and the `assets` directory together.
3. Open `index.html` for the homepage.
4. Open `classic.html#product-viewer` to test the product viewer.

For final deployment, serve the directory through a web server rather than opening files directly from a ZIP archive.

## Interactive product viewer

The current viewer is a temporary video-scrub implementation based on:

- `assets/360/solodome-rotation.mp4`
- `assets/360/solodome-video-poster.webp`
- Static fallback frames in `assets/360/`

### Current controls

- Horizontal drag: move forward or backward through the rotation.
- Mouse wheel: zoom.
- Pinch: zoom on touch devices.
- Two-finger movement: pan while zoomed.
- Pan button: enables mouse-drag panning on desktop.
- Double-click or double-tap: toggle inspection zoom.
- Arrow keys: rotate.
- Plus/minus or up/down keys: zoom.
- R: reset.
- F: fullscreen.
- Escape: exit fullscreen through the browser.

The video is encoded as browser-compatible H.264 with frequent keyframes to make manual seeking more responsive. It begins with a slow preview rotation and stops immediately after interaction.

### Replacing the temporary video

Replace `assets/360/solodome-rotation.mp4` with another MP4 using the same filename, or update the `data-src` value in `classic.html`.

Recommended video requirements:

- H.264 MP4
- Constant frame rate
- 24–30 fps
- Frequent keyframes, approximately every 10–15 frames
- Stable camera position
- Product centered throughout
- One clean, continuous 360° rotation
- No dissolves or shape-changing AI artifacts

### Upgrading to a real GLB model

The viewer container is marked with `data-product-viewer`. Replace the `<video data-viewer-video>` element with a Three.js, React Three Fiber, Babylon.js, or `<model-viewer>` canvas while retaining:

- `.viewer-stage`
- `.viewer-toolbar`
- `data-viewer-reset`
- `data-viewer-fullscreen`
- `data-viewer-zoom-in`
- `data-viewer-zoom-out`
- The static gallery fallback

A production GLB should include separate material zones for the shell, upholstery, speakers, controls, and base. Compress geometry with Draco or Meshopt and use KTX2/WebP textures.

## Commerce flow

The build includes:

- Product Add to Cart buttons
- Configurator Add to Cart
- Persistent cart count using local storage
- Cart quantities and removal
- Delivery selection
- Contact and shipping forms
- Card and financing UI
- Order confirmation page

The current checkout is a front-end prototype. It does **not** transmit or authorize payment. Before launch, connect the checkout submission to Shopify Checkout, Shopify Payments, Stripe Checkout, or another PCI-compliant payment processor. Never send raw card details through custom email, analytics, or a general-purpose form endpoint.

## Main pages

- `index.html`
- `collection.html`
- `classic.html`
- `deluxe.html`
- `auditory.html`
- `technology.html`
- `experiences.html`
- `craftsmanship.html`
- `configure.html`
- `cart.html`
- `checkout.html`
- `order-confirmation.html`
- `about.html`
- `faq.html`
- `contact.html`

## Production checklist

- Connect Shopify products and variants.
- Replace local-storage cart with Shopify Cart API.
- Redirect payment to hosted Shopify Checkout.
- Connect forms to the CRM.
- Add privacy, terms, shipping, return, warranty, and accessibility pages.
- Replace inferred or placeholder testimonials with verified content.
- Test the final hosted build on current iPhone Safari, Android Chrome, desktop Chrome, Safari, Firefox, and Edge.
- Run Lighthouse and real-device performance tests after CDN deployment.
