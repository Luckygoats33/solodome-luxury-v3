/* SoloDome Shopping Cart — shared across all versions */
(function(){
'use strict';

const PRODUCTS={
  classic:{name:'SoloDome Classic',price:5999,img:'assets/v2-elements/classic.jpg',desc:'Four-speaker binaural sound. Compact, sculptural, and complete.'},
  deluxe:{name:'SoloDome Deluxe',price:7999,img:'assets/v2-elements/deluxe.jpg',desc:'Expanded acoustic chamber with vibroacoustic platform.'},
  auditory:{name:'SoloDome Auditory',price:14999,img:'assets/v2-elements/13-signature-aurora.jpg',desc:'Custom DSP audio profiling for hearing considerations.'}
};

let cart=JSON.parse(localStorage.getItem('sd-cart')||'[]');
let view='cart'; // cart | checkout | confirm

// --- BUILD DOM ---
function buildCartUI(){
  // Toast
  const toast=document.createElement('div');toast.className='sd-toast';toast.id='sdToast';
  document.body.appendChild(toast);

  // Overlay
  const overlay=document.createElement('div');overlay.className='sd-cart-overlay';overlay.id='sdOverlay';
  overlay.addEventListener('click',closeCart);
  document.body.appendChild(overlay);

  // Drawer
  const drawer=document.createElement('div');drawer.className='sd-cart-drawer';drawer.id='sdDrawer';
  document.body.appendChild(drawer);

  renderCart();
  injectCartIcon();
  wireProducts();
  updateBadge();
}

// --- INJECT CART ICON into header ---
function injectCartIcon(){
  const hdr=document.querySelector('header');
  if(!hdr)return;
  const navRight=hdr.querySelector('.nav-right,.nav-cta-wrap')||hdr;
  const btn=document.createElement('button');
  btn.className='sd-cart-icon';
  btn.id='sdCartBtn';
  btn.setAttribute('aria-label','Open cart');
  btn.innerHTML='<svg viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg><span class="sd-badge" id="sdBadge">0</span>';
  btn.addEventListener('click',openCart);

  // Try to insert in .nav-right or after the last nav element
  const existingCta=hdr.querySelector('.nav-cta');
  if(existingCta){
    existingCta.parentElement.insertBefore(btn,existingCta.nextSibling);
  } else if(navRight!==hdr){
    navRight.appendChild(btn);
  } else {
    hdr.appendChild(btn);
  }
}

// --- WIRE PRODUCTS ---
function wireProducts(){
  // Find all elements with data-product attribute
  document.querySelectorAll('[data-product]').forEach(el=>{
    el.style.cursor='pointer';
    el.addEventListener('click',e=>{
      e.preventDefault();
      e.stopPropagation();
      const key=el.dataset.product;
      if(PRODUCTS[key])addToCart(key);
    });
  });
}

// --- CART OPERATIONS ---
function addToCart(key){
  const existing=cart.find(i=>i.key===key);
  if(existing){existing.qty++}
  else{cart.push({key,qty:1})}
  saveCart();
  updateBadge();
  showToast(PRODUCTS[key].name+' added to cart');
  openCart();
}

function removeFromCart(key){
  cart=cart.filter(i=>i.key!==key);
  saveCart();updateBadge();renderCart();
}

function updateQty(key,delta){
  const item=cart.find(i=>i.key===key);
  if(!item)return;
  item.qty=Math.max(1,item.qty+delta);
  saveCart();renderCart();
}

function getTotal(){
  return cart.reduce((s,i)=>s+(PRODUCTS[i.key]?.price||0)*i.qty,0);
}

function saveCart(){localStorage.setItem('sd-cart',JSON.stringify(cart))}

function updateBadge(){
  const badge=document.getElementById('sdBadge');
  if(!badge)return;
  const count=cart.reduce((s,i)=>s+i.qty,0);
  badge.textContent=count;
  badge.classList.toggle('vis',count>0);
}

// --- OPEN / CLOSE ---
function openCart(){
  view='cart';renderCart();
  document.getElementById('sdOverlay')?.classList.add('open');
  document.getElementById('sdDrawer')?.classList.add('open');
  document.body.style.overflow='hidden';
}

function closeCart(){
  document.getElementById('sdOverlay')?.classList.remove('open');
  document.getElementById('sdDrawer')?.classList.remove('open');
  document.body.style.overflow='';
}

// --- TOAST ---
function showToast(msg){
  const t=document.getElementById('sdToast');
  if(!t)return;
  t.textContent=msg;t.classList.add('vis');
  setTimeout(()=>t.classList.remove('vis'),2500);
}

// --- RENDER ---
function renderCart(){
  const drawer=document.getElementById('sdDrawer');
  if(!drawer)return;

  if(view==='checkout'){renderCheckout(drawer);return}
  if(view==='confirm'){renderConfirm(drawer);return}

  let html='<div class="sd-cart-header"><h2>Your Cart</h2><button class="sd-cart-close" id="sdClose"><svg viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg></button></div>';

  if(cart.length===0){
    html+='<div class="sd-cart-items"><div class="sd-cart-empty"><svg viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg><p>Your cart is empty.<br>Add a SoloDome to get started.</p></div></div>';
  } else {
    html+='<div class="sd-cart-items">';
    cart.forEach(item=>{
      const p=PRODUCTS[item.key];
      if(!p)return;
      html+='<div class="sd-cart-item">';
      html+='<div class="sd-cart-item-img"><img src="'+p.img+'" alt="'+p.name+'"></div>';
      html+='<div class="sd-cart-item-info">';
      html+='<div class="sd-cart-item-name">'+p.name+'</div>';
      html+='<div class="sd-cart-item-price">$'+p.price.toLocaleString()+'</div>';
      html+='<div class="sd-cart-item-controls">';
      html+='<div class="sd-cart-qty"><button data-qty-key="'+item.key+'" data-qty-d="-1">−</button><span>'+item.qty+'</span><button data-qty-key="'+item.key+'" data-qty-d="1">+</button></div>';
      html+='<button class="sd-cart-remove" data-rm="'+item.key+'">Remove</button>';
      html+='</div></div></div>';
    });
    html+='</div>';
    html+='<div class="sd-cart-footer">';
    html+='<div class="sd-cart-subtotal"><span>Subtotal</span><strong>$'+getTotal().toLocaleString()+'</strong></div>';
    html+='<button class="sd-cart-checkout-btn" id="sdCheckoutBtn">Proceed to Checkout</button>';
    html+='</div>';
  }

  drawer.innerHTML=html;

  // Wire events
  drawer.querySelector('#sdClose')?.addEventListener('click',closeCart);
  drawer.querySelectorAll('[data-qty-key]').forEach(b=>{
    b.addEventListener('click',()=>updateQty(b.dataset.qtyKey,+b.dataset.qtyD));
  });
  drawer.querySelectorAll('[data-rm]').forEach(b=>{
    b.addEventListener('click',()=>removeFromCart(b.dataset.rm));
  });
  drawer.querySelector('#sdCheckoutBtn')?.addEventListener('click',()=>{view='checkout';renderCart()});
}

function renderCheckout(drawer){
  let html='<div class="sd-cart-header"><h2>Checkout</h2><button class="sd-cart-close" id="sdClose"><svg viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg></button></div>';
  html+='<div class="sd-cart-form">';
  html+='<button class="sd-cart-back" id="sdBack">← Back to cart</button>';

  // Order summary
  html+='<div style="padding:16px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:12px;margin-bottom:20px">';
  cart.forEach(item=>{
    const p=PRODUCTS[item.key];
    if(!p)return;
    html+='<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;font-size:14px"><span>'+p.name+(item.qty>1?' × '+item.qty:'')+'</span><span style="color:#c4b5fd;font-weight:600">$'+(p.price*item.qty).toLocaleString()+'</span></div>';
  });
  html+='<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0 0;margin-top:10px;border-top:1px solid rgba(255,255,255,.08);font-weight:700"><span>Total</span><span style="color:#fde68a;font-size:18px">$'+getTotal().toLocaleString()+'</span></div>';
  html+='</div>';

  html+='<label for="sdName">Full Name</label><input type="text" id="sdName" placeholder="Josh Chaney" required>';
  html+='<label for="sdEmail">Email</label><input type="email" id="sdEmail" placeholder="you@email.com" required>';
  html+='<label for="sdPhone">Phone</label><input type="tel" id="sdPhone" placeholder="(555) 000-0000">';
  html+='<label for="sdNotes">Notes (optional)</label><textarea id="sdNotes" placeholder="Model preferences, color choices, questions..."></textarea>';
  html+='</div>';

  html+='<div class="sd-cart-footer">';
  html+='<button class="sd-cart-checkout-btn" id="sdPlaceOrder">Place Order Request</button>';
  html+='<p style="text-align:center;font-size:11px;color:rgba(240,240,245,.35);margin-top:12px;line-height:1.5">Every SoloDome is handcrafted to order.<br>Our team will contact you within 24 hours to confirm details.</p>';
  html+='</div>';

  drawer.innerHTML=html;
  drawer.querySelector('#sdClose')?.addEventListener('click',closeCart);
  drawer.querySelector('#sdBack')?.addEventListener('click',()=>{view='cart';renderCart()});
  drawer.querySelector('#sdPlaceOrder')?.addEventListener('click',()=>{
    const name=document.getElementById('sdName')?.value?.trim();
    const email=document.getElementById('sdEmail')?.value?.trim();
    if(!name||!email){showToast('Please fill in name and email');return}
    cart=[];saveCart();updateBadge();
    view='confirm';renderCart();
  });
}

function renderConfirm(drawer){
  let html='<div class="sd-cart-header"><h2>Order Placed</h2><button class="sd-cart-close" id="sdClose"><svg viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg></button></div>';
  html+='<div class="sd-cart-confirm">';
  html+='<svg viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>';
  html+='<h3>Thank you.</h3>';
  html+='<p>Your order request has been received. Our team will reach out within 24 hours to confirm your SoloDome configuration and arrange delivery.</p>';
  html+='</div>';

  drawer.innerHTML=html;
  drawer.querySelector('#sdClose')?.addEventListener('click',()=>{view='cart';closeCart()});
}

// --- INIT ---
if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',buildCartUI)}
else{buildCartUI()}

// Expose for manual add-to-cart calls
window.sdCart={add:addToCart,open:openCart,close:closeCart};
})();
