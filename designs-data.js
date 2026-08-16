// ═══════════════════════════════════════
// SHARED DESIGNS DATA — used by all pages
// ═══════════════════════════════════════

// ── GLOBAL ERROR GUARD ──
// Catches any uncaught JS error on any page so one crash never breaks the UI.
window.onerror = function(msg, src, line, col, err) {
  console.warn('[TNC] JS error caught:', msg, '— at', src, line + ':' + col);
  return true; // prevents the error from propagating and halting other scripts
};
window.addEventListener('unhandledrejection', function(e) {
  console.warn('[TNC] Unhandled promise rejection:', e.reason);
  e.preventDefault();
});

// ── SAFE DOM HELPERS ──
// Use $id() instead of getElementById() — never throws if element is missing.
function $id(id) {
  return document.getElementById(id) || null;
}

// Safe setter — sets textContent only if the element exists.
function $setText(id, text) {
  var el = $id(id);
  if (el) el.textContent = text;
}

// Safe event listener — attaches only if element exists.
function $on(id, event, handler) {
  var el = $id(id);
  if (el) el.addEventListener(event, handler);
}

// ── IMAGE PATH ENCODER ──
// Encodes image paths so filenames with spaces/special chars work on all servers.
// Works on both file:// (local) and https:// (live server).
function encodeImgPath(p) {
  if (!p) return '';
  return p.split('/').map(function(seg, i) {
    if (i === 0) return seg; // keep the folder prefix (e.g. 'Images') as-is
    try { seg = decodeURIComponent(seg); } catch(e) {} // avoid double-encoding
    return encodeURIComponent(seg).replace(/%2F/g, '/');
  }).join('/');
}

// ── SAFE IMAGE LOADER ──
// Sets an image src safely with a fallback placeholder if it fails to load.
function safeSetImg(imgEl, src) {
  if (!imgEl) return;
  var placeholder = imgEl.parentElement ? imgEl.parentElement.querySelector('[data-img-placeholder]') : null;
  imgEl.onload = null;
  imgEl.onerror = null;
  imgEl.onload = function() {
    imgEl.style.display = 'block';
    imgEl.style.opacity = '1';
    if (placeholder) placeholder.style.display = 'none';
  };
  imgEl.onerror = function() {
    imgEl.style.display = 'none';
    if (placeholder) placeholder.style.display = 'flex';
    console.warn('[TNC] Image failed to load:', src);
  };
  imgEl.style.opacity = '0';
  imgEl.src = encodeImgPath(src);
  // If already cached, onload won't fire — handle synchronously
  if (imgEl.complete && imgEl.naturalWidth > 0) {
    imgEl.style.display = 'block';
    imgEl.style.opacity = '1';
    if (placeholder) placeholder.style.display = 'none';
  }
}

const catLabels = {
  chrome:'Chrome', french:'French', gloss:'Gloss', bridal:'Bridal',
  floral:'Floral', polka:'Polka', cateye:'Cat Eye', festive:'Festive',
  babyshower:'Baby Shower', pressOn:'Press-On', manicure:'Manicure'
};

const catCovers = {
  chrome:     { img:'Images/chrome/Chrome1.jpeg',           sub:'Mirror · Aurora' },
  french:     { img:'Images/french/French nails.jpg',        sub:'Classic · Tip' },
  gloss:      { img:'Images/Gloss1.JPG',                     sub:'High Shine · Sheer' },
  bridal:     { img:'Images/Bridal/bridal1.jpg',             sub:'Pearl · Lace' },
  floral:     { img:'Images/Floral/floral4.jpeg',            sub:'Hand-Painted' },
  polka:      { img:'Images/Polka/Polka1.JPG',               sub:'Dots · Gloss' },
  cateye:     { img:'Images/CatEye/Cateye.jpg',              sub:'Magnetic · Velvet' },
  festive:    { img:'Images/Festive/Mahashivrati.jpeg',      sub:'Festive · Vibrant' },
  babyshower: { img:'Images/babyshower/Babby shower.JPG',    sub:'Soft · Pastel' },
  pressOn:    { img:'Images/Pree-on-nails (1).JPG',          sub:'Custom · Ready-to-wear' },
  manicure:   { img:'Images/classic-manicure.jpg',           sub:'Gel · Classic' },
};

const DESIGNS = [];

// ═══════════════════════════════════════
// SUPABASE — shared product database
// ═══════════════════════════════════════
// Products added/edited in the admin dashboard are stored in a real
// Supabase (Postgres) database, not localStorage — so they show up
// for every visitor, on any device/browser, immediately.
const SUPABASE_URL = 'https://tggzcajcmjyfubdxfldw.supabase.co';
const SUPABASE_KEY = 'sb_publishable_XtRBmgvzgVbS9OiXTFZV6w_h97QYq-n';

// window.supabase is provided by the supabase-js CDN script tag,
// which must be included on every page BEFORE this file.
const sb = (typeof window !== 'undefined' && window.supabase)
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

// Map admin dashboard category names to catLabels keys used across the site
const CAT_MAP = {
  'Bridal':'bridal','bridal':'bridal',
  'Festive':'festive','festive':'festive',
  'Chrome':'chrome','chrome':'chrome',
  'Floral':'floral','floral':'floral',
  'Minimal':'gloss','Gloss':'gloss','gloss':'gloss',
  'French':'french','french':'french',
  'CatEye':'cateye','cateye':'cateye',
  'Polka':'polka','polka':'polka',
  'BabyShower':'babyshower','babyshower':'babyshower',
  'PressOn':'pressOn','pressOn':'pressOn',
  'Manicure':'manicure','manicure':'manicure',
};

// Merge a Supabase product row into the DESIGNS array used to render
// the collection grid on index.html / collection.html / wishlist.html.
function mergeDbProductIntoDesigns(p) {
  var cat = CAT_MAP[p.category] || (p.category || '').toLowerCase();
  if (!catLabels[cat]) {
    catLabels[cat] = p.category;
    if (!catCovers[cat] && p.img) catCovers[cat] = { img: p.img, sub: p.category };
  }
  var exists = DESIGNS.some(function(d) { return d._dbId === p.id; });
  if (exists) return;
  DESIGNS.push({
    title:  p.title,
    cat:    cat,
    price:  p.discounted || p.original || 999,
    size:   'XS · S · M · L · XL · Free Size',
    design: p.category,
    desc:   p.description || 'Handcrafted press-on nail set.',
    photos: (Array.isArray(p.photos) && p.photos.length > 0)
              ? p.photos
              : (p.img ? [p.img] : ['Images/Bridal/bridal1.jpg']),
    video:  null,
    featured: !!p.featured,
    views:  p.views || 0,
    _dbId:  p.id
  });
}

// ── CATEGORIES ──
// Resolves once categories from the database have been merged into
// catLabels / catCovers (mutated IN PLACE — never reassigned — so
// every page that already reads these two objects picks up admin
// edits automatically, with no changes needed on those pages).
window.CATEGORIES_READY = (async function loadCategoriesFromDb() {
  if (!sb) return;
  try {
    var res = await sb.from('categories').select('*').order('sort_order', { ascending: true });
    if (res.error) { console.warn('[TNC] Could not load categories from database:', res.error.message); return; }
    var rows = res.data || [];
    // Only once the admin has saved at least one category to the
    // database do we treat it as the source of truth — until then,
    // the hardcoded defaults above keep the site looking normal.
    if (rows.length > 0) {
      Object.keys(catLabels).forEach(function(k) { delete catLabels[k]; });
      Object.keys(catCovers).forEach(function(k) { delete catCovers[k]; });
      rows.forEach(function(c) {
        catLabels[c.key] = c.label;
        catCovers[c.key] = { img: c.cover_img || '', sub: c.subtitle || '' };
      });
    }
  } catch (e) {
    console.warn('[TNC] Could not load categories from database:', e);
  }
})();

// ── PUBLIC-FACING FETCH ──
// Resolves once published products from the database have been merged
// into DESIGNS. Every page that renders the collection grid should
// `await window.DESIGNS_READY` before its first render call.
window.DESIGNS_READY = (async function loadPublishedProducts() {
  if (!sb) { console.warn('[TNC] Supabase client not available (check script include order)'); return; }
  try {
    await window.CATEGORIES_READY; // make sure catLabels/catCovers reflect the db first
    var res = await sb.from('products').select('*').eq('status', 'published').order('created_at', { ascending: false });
    if (res.error) { console.warn('[TNC] Could not load products from database:', res.error.message); return; }
    (res.data || []).forEach(mergeDbProductIntoDesigns);
  } catch (e) {
    console.warn('[TNC] Could not load products from database:', e);
  }
})();

// ── ADMIN DASHBOARD HELPERS ──
// Exposed on window so admin-dashboard.html can manage the full
// catalog (including drafts) without duplicating the Supabase client.
window.sbFetchAllProducts = async function() {
  if (!sb) return [];
  var res = await sb.from('products').select('*').order('created_at', { ascending: false });
  if (res.error) { console.warn('[TNC] Fetch products failed:', res.error.message); return []; }
  return res.data || [];
};

window.sbInsertProduct = async function(data) {
  var res = await sb.from('products').insert([data]).select().single();
  if (res.error) throw res.error;
  return res.data;
};

window.sbUpdateProduct = async function(id, data) {
  var res = await sb.from('products').update(data).eq('id', id).select().single();
  if (res.error) throw res.error;
  return res.data;
};

window.sbDeleteProduct = async function(id) {
  var res = await sb.from('products').delete().eq('id', id);
  if (res.error) throw res.error;
};

// ── ORDERS (admin dashboard + real customer checkouts) ──
// Every order — whether typed in by the admin from a WhatsApp/Instagram
// chat, or logged automatically when a signed-in customer completes the
// order modal on the site — lives in this one real `orders` table, so
// the dashboard's Orders page, Recent Orders, revenue/order charts and
// KPIs, and each customer's order history all reflect the same data.
window.sbFetchOrders = async function() {
  if (!sb) return [];
  var res = await sb.from('orders').select('*').order('created_at', { ascending: false });
  if (res.error) { console.warn('[TNC] Fetch orders failed:', res.error.message); return []; }
  return res.data || [];
};

window.sbInsertOrder = async function(data) {
  if (!sb) throw new Error('Database unavailable — please try again shortly.');
  var res = await sb.from('orders').insert([data]).select().single();
  if (res.error) throw res.error;
  return res.data;
};

window.sbUpdateOrder = async function(id, data) {
  var res = await sb.from('orders').update(data).eq('id', id).select().single();
  if (res.error) throw res.error;
  return res.data;
};

window.sbDeleteOrder = async function(id) {
  var res = await sb.from('orders').delete().eq('id', id);
  if (res.error) throw res.error;
};

// Best-effort: log a real row in `orders` the moment a signed-in
// customer actually continues to WhatsApp/Instagram to place an order,
// so the admin dashboard shows real customer activity instead of only
// orders the admin typed in by hand. Never blocks or breaks the
// WhatsApp/Instagram handoff if it fails (e.g. offline) — it's a
// nice-to-have record, not the order itself (the real order still
// happens over WhatsApp/Instagram).
async function _tncLogOrderToDb(opts, channel) {
  try {
    if (!sb) return;
    var user = await window.sbGetCurrentUser();
    var qty = opts.qty || 1;
    var price = opts.price || 0;
    await window.sbInsertOrder({
      customer_id: user ? user.id : null,
      customer_name: (user && (user.user_metadata && user.user_metadata.name)) || (user && user.email ? user.email.split('@')[0] : 'Guest'),
      channel: channel === 'wa' ? 'WhatsApp' : channel === 'ig' ? 'Instagram' : 'Other',
      items: [{ title: opts.title, img: opts.img || '', price: price }],
      amount: price * qty,
      payment_status: 'unpaid',
      status: 'pending',
      notes: [opts.design, opts.size ? ('Size ' + opts.size) : ''].filter(Boolean).join(' · '),
    });
  } catch (e) {
    console.warn('[TNC] Could not log order to dashboard:', e);
  }
}

// ── CATEGORY MANAGEMENT (admin dashboard) ──
window.sbFetchCategories = async function() {
  if (!sb) return [];
  var res = await sb.from('categories').select('*').order('sort_order', { ascending: true });
  if (res.error) { console.warn('[TNC] Fetch categories failed:', res.error.message); return []; }
  return res.data || [];
};

window.sbInsertCategory = async function(data) {
  var res = await sb.from('categories').insert([data]).select().single();
  if (res.error) throw res.error;
  return res.data;
};

window.sbUpdateCategory = async function(id, data) {
  var res = await sb.from('categories').update(data).eq('id', id).select().single();
  if (res.error) throw res.error;
  return res.data;
};

window.sbDeleteCategory = async function(id) {
  var res = await sb.from('categories').delete().eq('id', id);
  if (res.error) throw res.error;
};

// Uploads a File to the 'product-images' storage bucket and returns
// its public URL, for use as a product's `img` field.
window.sbUploadImage = async function(file) {
  var ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  var path = 'products/' + Date.now() + '-' + Math.random().toString(36).slice(2) + '.' + ext;
  var res = await sb.storage.from('product-images').upload(path, file);
  if (res.error) throw res.error;
  var pub = sb.storage.from('product-images').getPublicUrl(path);
  return pub.data.publicUrl;
};

// ═══════════════════════════════════════
// STORE SETTINGS + TEAM (shared across every admin/device)
// ═══════════════════════════════════════
// The store logo, owner profile photo, store info and team invites all
// used to live only in the browser's localStorage, which is why an
// invite link generated on one device never worked when opened on
// someone else's phone/laptop — there was nothing shared to check it
// against. These live in Supabase instead so every device sees the
// same data.

// Reuses the same public 'product-images' bucket as products, just
// under a 'branding/' subfolder, so no new bucket/policy setup is needed.
window.sbUploadBrandImage = async function(file, folder) {
  var ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  var path = (folder || 'branding') + '/' + Date.now() + '-' + Math.random().toString(36).slice(2) + '.' + ext;
  var res = await sb.storage.from('product-images').upload(path, file);
  if (res.error) throw res.error;
  var pub = sb.storage.from('product-images').getPublicUrl(path);
  return pub.data.publicUrl;
};

window.sbGetStoreSettings = async function() {
  if (!sb) return null;
  var res = await sb.from('store_settings').select('*').eq('id', 1).single();
  if (res.error) { console.warn('[TNC] Could not load store settings:', res.error.message); return null; }
  return res.data;
};

window.sbSaveStoreSettings = async function(data) {
  var res = await sb.from('store_settings').update(data).eq('id', 1).select().single();
  if (res.error) throw res.error;
  return res.data;
};

window.sbFetchInvites = async function() {
  if (!sb) return [];
  var res = await sb.from('team_invites').select('*').order('created_at', { ascending: false });
  if (res.error) { console.warn('[TNC] Fetch invites failed:', res.error.message); return []; }
  return res.data || [];
};

window.sbCreateInvite = async function(data) {
  var res = await sb.from('team_invites').insert([data]).select().single();
  if (res.error) throw res.error;
  return res.data;
};

window.sbMarkInviteUsed = async function(token) {
  var res = await sb.from('team_invites').update({ used: true }).eq('token', token).select().single();
  if (res.error) throw res.error;
  return res.data;
};

window.sbFetchTeamMembers = async function() {
  if (!sb) return [];
  var res = await sb.from('team_members').select('*').order('created_at', { ascending: true });
  if (res.error) { console.warn('[TNC] Fetch team members failed:', res.error.message); return []; }
  return res.data || [];
};

window.sbAddTeamMember = async function(data) {
  var res = await sb.from('team_members').insert([data]).select().single();
  if (res.error) throw res.error;
  return res.data;
};

window.sbRemoveTeamMember = async function(id) {
  var res = await sb.from('team_members').delete().eq('id', id);
  if (res.error) throw res.error;
};

window.sbUpdateTeamMemberRole = async function(id, role) {
  var res = await sb.from('team_members').update({ role: role }).eq('id', id).select().single();
  if (res.error) throw res.error;
  return res.data;
};

// ═══════════════════════════════════════
// REELS — homepage "In Motion" section
// Each reel has: title, subtitle, video_url, poster_url, sort_order, visible
// ═══════════════════════════════════════
window.sbFetchReels = async function() {
  if (!sb) return [];
  var res = await sb.from('reels').select('*').order('sort_order', { ascending: true });
  if (res.error) { console.warn('[TNC] Fetch reels failed:', res.error.message); return []; }
  return res.data || [];
};

window.sbInsertReel = async function(data) {
  var res = await sb.from('reels').insert([data]).select().single();
  if (res.error) throw res.error;
  return res.data;
};

window.sbUpdateReel = async function(id, data) {
  var res = await sb.from('reels').update(data).eq('id', id).select().single();
  if (res.error) throw res.error;
  return res.data;
};

window.sbDeleteReel = async function(id) {
  var res = await sb.from('reels').delete().eq('id', id);
  if (res.error) throw res.error;
};

// Uploads a video file to the 'product-images' bucket under a 'reels/' subfolder.
window.sbUploadVideo = async function(file) {
  var ext = (file.name.split('.').pop() || 'mp4').toLowerCase();
  var path = 'reels/' + Date.now() + '-' + Math.random().toString(36).slice(2) + '.' + ext;
  var res = await sb.storage.from('product-images').upload(path, file);
  if (res.error) throw res.error;
  var pub = sb.storage.from('product-images').getPublicUrl(path);
  return pub.data.publicUrl;
};

// ═══════════════════════════════════════
// SHARED ORDER MODAL — used by index.html, collection.html
// and premium_product_page.html whenever someone taps
// "Order via WhatsApp" / "Order via Instagram DM".
//
// Neither WhatsApp's click-to-chat links nor Instagram's DM links can
// auto-attach a photo, so instead we show the chosen design's photo
// right in this confirmation step, build one order message that
// includes a direct link to that photo, and either hand it to
// WhatsApp (which pre-fills the message box) or copy it to the
// clipboard for Instagram (which offers no pre-fill at all) so the
// photo and order details reach the shop either way.
// ═══════════════════════════════════════

var SITE_BASE_URL = 'https://thenailsclub.in/';

// Turns a relative design photo path into a full, shareable URL.
function absoluteImgUrl(p) {
  if (!p) return '';
  if (/^https?:\/\//i.test(p)) return p;
  return SITE_BASE_URL + encodeImgPath(p);
}

function tncEscHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function(c) {
    return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
  });
}

// Builds the order message text shared by WhatsApp and Instagram,
// including a direct link to the product photo.
function buildOrderMessage(o) {
  o = o || {};
  var qty = o.qty || 1;
  var total = (o.price || 0) * qty;
  var lines = [
    'Hi The Nails Club! 💅 I\'d like to order the *' + (o.title || 'nail set') + '*' + (o.design ? ' (' + o.design + ')' : '') + ' design.',
    'Size: ' + (o.size || 'Free Size'),
    'Qty: ' + qty,
    'Total: ₹' + total.toLocaleString('en-IN')
  ];
  lines.push('Please confirm availability. Thank you!');
  return lines.join('\n');
}

var _tncOrderModalStylesInjected = false;
function _injectOrderModalStyles() {
  if (_tncOrderModalStylesInjected) return;
  _tncOrderModalStylesInjected = true;
  var style = document.createElement('style');
  style.textContent =
    '#tnc-order-modal-overlay{position:fixed;inset:0;z-index:9999;background:rgba(20,18,18,0.72);' +
    'backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:20px;' +
    'opacity:0;transition:opacity .2s ease;}' +
    '#tnc-order-modal-overlay.open{opacity:1;}' +
    '.tnc-om-card{background:#fff;border-radius:20px;max-width:400px;width:100%;max-height:92vh;' +
    'overflow-y:auto;position:relative;transform:translateY(14px);transition:transform .22s ease;' +
    'box-shadow:0 20px 60px rgba(0,0,0,0.3);}' +
    '#tnc-order-modal-overlay.open .tnc-om-card{transform:translateY(0);}' +
    '.tnc-om-close{position:absolute;top:12px;right:12px;z-index:5;background:rgba(50,44,44,0.85);' +
    'color:#fff;border:none;border-radius:50%;width:30px;height:30px;cursor:pointer;font-size:14px;' +
    'line-height:1;display:flex;align-items:center;justify-content:center;}' +
    '.tnc-om-img-wrap{width:100%;aspect-ratio:4/3;background:#F0EBE6;overflow:hidden;border-radius:20px 20px 0 0;}' +
    '.tnc-om-img-wrap img{width:100%;height:100%;object-fit:cover;display:block;}' +
    '.tnc-om-body{padding:20px 22px 24px;}' +
    '.tnc-om-eyebrow{font-family:"DM Sans","Inter",sans-serif;font-size:9px;letter-spacing:0.2em;' +
    'text-transform:uppercase;color:rgba(50,44,44,0.4);margin:0 0 6px;}' +
    '.tnc-om-title{font-family:"Cormorant Garamond",Georgia,serif;font-size:24px;font-weight:500;' +
    'color:#322C2C;margin:0 0 4px;line-height:1.15;}' +
    '.tnc-om-meta{font-family:"DM Sans","Inter",sans-serif;font-size:12px;color:#BC1423;' +
    'font-weight:600;margin:0 0 14px;}' +
    '.tnc-om-msg{width:100%;box-sizing:border-box;font-family:"DM Sans","Inter",sans-serif;' +
    'font-size:12px;line-height:1.6;color:#322C2C;background:#F7F4F1;border:1px solid rgba(50,44,44,0.1);' +
    'border-radius:12px;padding:12px 14px;resize:none;height:118px;margin-bottom:14px;}' +
    '.tnc-om-actions{display:flex;flex-direction:column;gap:8px;}' +
    '.tnc-om-btn{display:flex;align-items:center;justify-content:center;gap:8px;border:none;' +
    'border-radius:12px;padding:13px 16px;font-family:"DM Sans","Inter",sans-serif;font-size:11px;' +
    'letter-spacing:0.14em;text-transform:uppercase;font-weight:600;cursor:pointer;}' +
    '.tnc-om-wa{background:#25D366;color:#fff;}' +
    '.tnc-om-ig{background:#BC1423;color:#fff;}' +
    '.tnc-om-copy{background:transparent;color:#322C2C;border:1.5px solid rgba(50,44,44,0.2);}' +
    '.tnc-om-hint{font-family:"DM Sans","Inter",sans-serif;font-size:10.5px;color:rgba(50,44,44,0.5);' +
    'text-align:center;margin:12px 0 0;min-height:14px;}' +
    '.tnc-om-agree{display:flex;align-items:flex-start;gap:8px;margin:2px 0 14px;cursor:pointer;' +
    'user-select:none;}' +
    '.tnc-om-agree input{margin-top:2px;width:15px;height:15px;flex-shrink:0;accent-color:#BC1423;' +
    'cursor:pointer;}' +
    '.tnc-om-agree span{font-family:"DM Sans","Inter",sans-serif;font-size:11.5px;line-height:1.5;' +
    'color:rgba(50,44,44,0.7);}' +
    '.tnc-om-agree a{color:#BC1423;text-decoration:underline;}' +
    '.tnc-om-btn:disabled{opacity:0.45;cursor:not-allowed;}';
  document.head.appendChild(style);
}

var _tncOrderModalOpts = null;

function _tncDispatchDateLabel() {
  var d = new Date();
  d.setDate(d.getDate() + 3);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// opts: { title, cat, design, size, qty, price, img, waNumber, igLink }
// Requires an account before opening — see requireLogin() below.
function openOrderModal(opts) {
  requireLogin(function() { _openOrderModalDirect(opts); });
}

function _openOrderModalDirect(opts) {
  closeOrderModal();
  _injectOrderModalStyles();

  var text = buildOrderMessage({
    title: opts.title, design: opts.design, size: opts.size,
    qty: opts.qty || 1, price: opts.price, productUrl: opts.productUrl
  });
  _tncOrderModalOpts = {
    text: text,
    waNumber: opts.waNumber || '919913091744',
    igLink: opts.igLink || 'https://ig.me/m/theenaiilsclub',
    orderOpts: opts // kept so a real order row can be logged if the customer continues
  };

  var overlay = document.createElement('div');
  overlay.id = 'tnc-order-modal-overlay';
  overlay.innerHTML =
    '<div class="tnc-om-card">' +
      '<button class="tnc-om-close" type="button" onclick="closeOrderModal()">&#10005;</button>' +
      '<div class="tnc-om-img-wrap"><img src="' + encodeImgPath(opts.img) + '" alt="' + tncEscHtml(opts.title) + '" onerror="this.style.display=\'none\'"></div>' +
      '<div class="tnc-om-body">' +
        '<p class="tnc-om-eyebrow">Confirm your order</p>' +
        '<h3 class="tnc-om-title">' + tncEscHtml(opts.title) + '</h3>' +
        '<p class="tnc-om-meta">' + tncEscHtml(opts.cat || '') + (opts.size ? ' · Size ' + tncEscHtml(opts.size) : '') + ' · ₹' + ((opts.price || 0) * (opts.qty || 1)).toLocaleString('en-IN') + '</p>' +
        '<textarea class="tnc-om-msg" readonly>' + tncEscHtml(text) + '</textarea>' +
        '<p class="tnc-om-meta" style="margin-top:-4px;">Dispatched by ' + _tncDispatchDateLabel() + '</p>' +
        '<label class="tnc-om-agree">' +
          '<input type="checkbox" id="tnc-om-agree-cb" onchange="_tncOmToggleAgree(this.checked)">' +
          '<span>I agree to the <a href="return-policy.html" target="_blank">Return &amp; Refund Policy</a> before placing this order.</span>' +
        '</label>' +
        '<div class="tnc-om-actions">' +
          '<button class="tnc-om-btn tnc-om-wa" type="button" id="tnc-om-wa-btn" disabled onclick="continueOrderModal(\'wa\')">Continue to WhatsApp</button>' +
          '<button class="tnc-om-btn tnc-om-ig" type="button" id="tnc-om-ig-btn" disabled onclick="continueOrderModal(\'ig\')">Continue to Instagram DM</button>' +
          '<button class="tnc-om-btn tnc-om-copy" type="button" onclick="continueOrderModal(\'copy\')">Copy message</button>' +
        '</div>' +
        '<p class="tnc-om-hint" id="tnc-om-hint">This photo &amp; order message go with you — WhatsApp pre-fills it, Instagram needs it pasted in.</p>' +
      '</div>' +
    '</div>';
  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';
  requestAnimationFrame(function() { overlay.classList.add('open'); });
}

function closeOrderModal() {
  var el = document.getElementById('tnc-order-modal-overlay');
  if (el) el.remove();
  document.body.style.overflow = '';
}

function _tncOmToggleAgree(checked) {
  var waBtn = document.getElementById('tnc-om-wa-btn');
  var igBtn = document.getElementById('tnc-om-ig-btn');
  if (waBtn) waBtn.disabled = !checked;
  if (igBtn) igBtn.disabled = !checked;
}

async function continueOrderModal(channel) {
  var opts = _tncOrderModalOpts;
  if (!opts) return;
  var hint = document.getElementById('tnc-om-hint');
  var agreeCb = document.getElementById('tnc-om-agree-cb');
  if ((channel === 'wa' || channel === 'ig') && agreeCb && !agreeCb.checked) {
    if (hint) hint.textContent = 'Please agree to the Return & Refund Policy to continue.';
    return;
  }
  if (channel === 'wa') {
    _tncLogOrderToDb(opts.orderOpts, 'wa'); // fire-and-forget — records the real order for the dashboard
    window.open('https://wa.me/' + opts.waNumber + '?text=' + encodeURIComponent(opts.text), '_blank');
    closeOrderModal();
    return;
  }
  if (channel === 'ig' || channel === 'copy') {
    try {
      await navigator.clipboard.writeText(opts.text);
      if (hint) hint.textContent = channel === 'ig' ? 'Message copied — paste it into the Instagram chat.' : 'Message copied to clipboard.';
    } catch (e) {
      if (hint) hint.textContent = 'Could not auto-copy — select the message above and copy it manually.';
    }
    if (channel === 'ig') {
      _tncLogOrderToDb(opts.orderOpts, 'ig'); // fire-and-forget — records the real order for the dashboard
      window.open(opts.igLink, '_blank');
      closeOrderModal();
    }
  }
}

window.openOrderModal = openOrderModal;
window.closeOrderModal = closeOrderModal;
window.continueOrderModal = continueOrderModal;
window._tncOmToggleAgree = _tncOmToggleAgree;
window.absoluteImgUrl = absoluteImgUrl;
window.buildOrderMessage = buildOrderMessage;

// ═══════════════════════════════════════
// CUSTOMER ACCOUNTS — real Supabase Auth
// ═══════════════════════════════════════
// Replaces the old localStorage-only 'tnc_users' system. An account
// created on any device now works when signing in from any other
// device/browser, because the password check happens on Supabase's
// server — not by reading tnc_users out of the current browser.

window.sbSignUp = async function(name, email, password) {
  if (!sb) throw new Error('Sign up is temporarily unavailable — please try again shortly.');
  var res = await sb.auth.signUp({ email: email, password: password, options: { data: { name: name } } });
  if (res.error) throw res.error;
  var user = res.data.user;
  // Save the public profile row so the admin dashboard's Customers
  // page (and returning visits) can see this signup.
  if (user) {
    try { await sb.from('customers').upsert({ id: user.id, name: name, email: email }); }
    catch (e) { console.warn('[TNC] Could not save customer profile:', e); }
  }
  return res.data; // { user, session } — session is null if email confirmation is required
};

window.sbSignIn = async function(email, password) {
  if (!sb) throw new Error('Sign in is temporarily unavailable — please try again shortly.');
  var res = await sb.auth.signInWithPassword({ email: email, password: password });
  if (res.error) throw res.error;
  return res.data;
};

window.sbSignOut = async function() {
  if (!sb) return;
  await sb.auth.signOut();
};

window.sbGetCurrentUser = async function() {
  if (!sb) return null;
  var res = await sb.auth.getUser();
  return (res.data && res.data.user) || null;
};

// Admin dashboard helper — real signups instead of the old mock array.
window.sbFetchCustomers = async function() {
  if (!sb) return [];
  var res = await sb.from('customers').select('*').order('created_at', { ascending: false });
  if (res.error) { console.warn('[TNC] Fetch customers failed:', res.error.message); return []; }
  return res.data || [];
};

// ═══════════════════════════════════════
// SHARED LOGIN MODAL + LOGIN GATE — used by index.html,
// collection.html and premium_product_page.html. Injected into the
// page on first use, the same way the order modal is, so it works
// even on pages that ship no auth markup of their own (previously
// only index.html had a working modal at all).
// ═══════════════════════════════════════

var _tncAuthMode = 'login';
var _tncAuthOnSuccess = null;
var _tncAuthModalInjected = false;

function _injectAuthModal() {
  if (_tncAuthModalInjected) return;
  _tncAuthModalInjected = true;
  var wrap = document.createElement('div');
  wrap.innerHTML =
    '<div id="tnc-auth-modal" style="display:none;position:fixed;inset:0;z-index:10001;background:rgba(20,18,18,0.65);backdrop-filter:blur(6px);align-items:center;justify-content:center;padding:16px;">' +
      '<div style="background:#fff;border-radius:24px;width:100%;max-width:440px;position:relative;overflow:hidden;box-shadow:0 24px 80px rgba(0,0,0,0.22);">' +
        '<div style="height:4px;background:linear-gradient(90deg,#BC1423,#C6A35B,#BC1423);"></div>' +
        '<button onclick="closeAuthModal()" style="position:absolute;top:14px;right:14px;background:rgba(50,44,44,0.08);border:none;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;cursor:pointer;">' +
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#322C2C" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
        '</button>' +
        '<div style="padding:32px 32px 28px;">' +
          '<div style="display:flex;gap:0;border-bottom:1.5px solid rgba(50,44,44,0.1);margin-bottom:24px;">' +
            '<button id="tnc-tab-login" onclick="switchAuthTab(\'login\')" style="flex:1;padding:10px 0;font-family:\'DM Sans\',sans-serif;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;border:none;background:none;cursor:pointer;color:#BC1423;border-bottom:2px solid #BC1423;margin-bottom:-1.5px;font-weight:500;">Sign In</button>' +
            '<button id="tnc-tab-signup" onclick="switchAuthTab(\'signup\')" style="flex:1;padding:10px 0;font-family:\'DM Sans\',sans-serif;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;border:none;background:none;cursor:pointer;color:rgba(50,44,44,0.4);border-bottom:2px solid transparent;">Create Account</button>' +
          '</div>' +
          '<div style="text-align:center;margin-bottom:22px;">' +
            '<h3 id="tnc-auth-modal-title" style="font-family:\'Cormorant Garamond\',serif;font-size:26px;font-weight:400;color:#322C2C;">Welcome Back</h3>' +
            '<p id="tnc-auth-modal-sub" style="font-family:\'DM Sans\',sans-serif;font-size:12px;color:rgba(50,44,44,0.45);margin-top:4px;">Sign in to your Nails Club account</p>' +
          '</div>' +
          '<div style="display:flex;flex-direction:column;gap:12px;">' +
            '<div id="tnc-auth-name-field" style="display:none;">' +
              '<input id="tnc-auth-name" type="text" placeholder="Your Name" style="width:100%;padding:12px 14px;border:1.5px solid rgba(50,44,44,0.15);border-radius:10px;font-family:\'DM Sans\',sans-serif;font-size:13px;color:#322C2C;outline:none;box-sizing:border-box;">' +
            '</div>' +
            '<input id="tnc-auth-email" type="email" placeholder="Email Address" style="width:100%;padding:12px 14px;border:1.5px solid rgba(50,44,44,0.15);border-radius:10px;font-family:\'DM Sans\',sans-serif;font-size:13px;color:#322C2C;outline:none;box-sizing:border-box;" onkeydown="if(event.key===\'Enter\')authSubmit()">' +
            '<input id="tnc-auth-password" type="password" placeholder="Password" style="width:100%;padding:12px 14px;border:1.5px solid rgba(50,44,44,0.15);border-radius:10px;font-family:\'DM Sans\',sans-serif;font-size:13px;color:#322C2C;outline:none;box-sizing:border-box;" onkeydown="if(event.key===\'Enter\')authSubmit()">' +
            '<p id="tnc-auth-error" style="display:none;font-family:\'DM Sans\',sans-serif;font-size:11px;color:#BC1423;text-align:center;"></p>' +
            '<button onclick="authSubmit()" id="tnc-auth-submit-btn" style="width:100%;padding:13px;background:#BC1423;color:#fff;border:none;border-radius:10px;font-family:\'DM Sans\',sans-serif;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;cursor:pointer;font-weight:500;">Sign In</button>' +
          '</div>' +
          '<p style="font-family:\'DM Sans\',sans-serif;font-size:11px;color:rgba(50,44,44,0.35);text-align:center;margin-top:14px;">' +
            '<span id="tnc-auth-switch-text">Don\'t have an account?</span>' +
            '<button id="tnc-auth-switch-btn" onclick="switchAuthTab(\'signup\')" style="background:none;border:none;color:#BC1423;cursor:pointer;font-family:\'DM Sans\',sans-serif;font-size:11px;text-decoration:underline;margin-left:4px;">Create one</button>' +
          '</p>' +
          '<p id="tnc-auth-gate-note" style="display:none;font-family:\'DM Sans\',sans-serif;font-size:10px;color:rgba(50,44,44,0.4);text-align:center;margin-top:16px;">Please sign in to place your order — this helps us keep track of it and reach you if we need to.</p>' +
        '</div>' +
      '</div>' +
    '</div>';
  document.body.appendChild(wrap.firstElementChild);
  $on('tnc-auth-modal', 'click', function(e) { if (e.target === document.getElementById('tnc-auth-modal')) closeAuthModal(); });
}

function openAuthModal(mode, onSuccess) {
  _injectAuthModal();
  _tncAuthOnSuccess = onSuccess || null;
  var note = $id('tnc-auth-gate-note');
  if (note) note.style.display = onSuccess ? 'block' : 'none';
  switchAuthTab(mode || 'login');
  var modal = $id('tnc-auth-modal');
  if (modal) modal.style.display = 'flex';
  var errEl = $id('tnc-auth-error'); if (errEl) errEl.style.display = 'none';
  ['tnc-auth-email', 'tnc-auth-password', 'tnc-auth-name'].forEach(function(id) {
    var el = $id(id); if (el) el.value = '';
  });
}

function closeAuthModal() {
  var el = $id('tnc-auth-modal');
  if (el) el.style.display = 'none';
  _tncAuthOnSuccess = null;
}

function switchAuthTab(mode) {
  _tncAuthMode = mode;
  var isLogin = mode === 'login';
  var t1 = $id('tnc-tab-login'), t2 = $id('tnc-tab-signup');
  if (t1) { t1.style.color = isLogin ? '#BC1423' : 'rgba(50,44,44,0.4)'; t1.style.borderBottomColor = isLogin ? '#BC1423' : 'transparent'; }
  if (t2) { t2.style.color = !isLogin ? '#BC1423' : 'rgba(50,44,44,0.4)'; t2.style.borderBottomColor = !isLogin ? '#BC1423' : 'transparent'; }
  $setText('tnc-auth-modal-title', isLogin ? 'Welcome Back' : 'Create Account');
  $setText('tnc-auth-modal-sub', isLogin ? 'Sign in to your Nails Club account' : 'Join The Nails Club family');
  var nf = $id('tnc-auth-name-field'); if (nf) nf.style.display = isLogin ? 'none' : 'block';
  $setText('tnc-auth-submit-btn', isLogin ? 'Sign In' : 'Create Account');
  $setText('tnc-auth-switch-text', isLogin ? "Don't have an account?" : 'Already have an account?');
  var swBtn = $id('tnc-auth-switch-btn');
  if (swBtn) { swBtn.textContent = isLogin ? 'Create one' : 'Sign in'; swBtn.onclick = function() { switchAuthTab(isLogin ? 'signup' : 'login'); }; }
  var err = $id('tnc-auth-error'); if (err) err.style.display = 'none';
}

function showAuthError(msg) {
  var el = $id('tnc-auth-error');
  if (el) { el.textContent = msg; el.style.display = 'block'; }
  var btn = $id('tnc-auth-submit-btn');
  if (btn) { btn.textContent = _tncAuthMode === 'login' ? 'Sign In' : 'Create Account'; btn.disabled = false; }
}

async function authSubmit() {
  var email = ($id('tnc-auth-email') && $id('tnc-auth-email').value.trim()) || '';
  var password = ($id('tnc-auth-password') && $id('tnc-auth-password').value) || '';
  var name = ($id('tnc-auth-name') && $id('tnc-auth-name').value.trim()) || '';
  if (!email || !email.includes('@')) { showAuthError('Please enter a valid email address.'); return; }
  if (!password || password.length < 6) { showAuthError('Password must be at least 6 characters.'); return; }
  if (_tncAuthMode === 'signup' && !name) { showAuthError('Please enter your name.'); return; }

  var btn = $id('tnc-auth-submit-btn');
  if (btn) { btn.textContent = _tncAuthMode === 'login' ? 'Signing in...' : 'Creating account...'; btn.disabled = true; }

  try {
    if (_tncAuthMode === 'signup') {
      var res = await window.sbSignUp(name, email, password);
      if (!res.session) {
        // The Supabase project has email confirmation turned on —
        // the account exists but can't sign in until the
        // confirmation link is clicked.
        showAuthError('Account created — check your email to confirm, then sign in.');
        switchAuthTab('login');
        if (btn) { btn.textContent = 'Sign In'; btn.disabled = false; }
        return;
      }
    } else {
      await window.sbSignIn(email, password);
    }
    await _tncAuthLoginSuccess();
  } catch (e) {
    showAuthError((e && e.message) || 'Something went wrong. Please try again.');
  }
}

async function _tncAuthLoginSuccess() {
  closeAuthModal();
  await updateAuthUI();
  var cb = _tncAuthOnSuccess;
  _tncAuthOnSuccess = null;
  if (cb) cb();
}

async function authLogout() {
  await window.sbSignOut();
  var dd = $id('user-dropdown'); if (dd) dd.style.display = 'none';
  await updateAuthUI();
}

function toggleUserDropdown() {
  var dd = $id('user-dropdown');
  if (dd) dd.style.display = dd.style.display === 'none' ? 'block' : 'none';
}
document.addEventListener('click', function(e) {
  var btn = $id('auth-avatar-btn');
  var dd = $id('user-dropdown');
  if (dd && btn && !btn.contains(e.target) && !dd.contains(e.target)) dd.style.display = 'none';
});

// Updates whichever header auth elements exist on the current page.
// index.html / collection.html have them; premium_product_page.html
// does not, so every $id() lookup here is a safe no-op there.
async function updateAuthUI() {
  var user = await window.sbGetCurrentUser();
  var statusEl = $id('auth-status');
  var loginBtn = $id('auth-login-btn');
  var nameEl = $id('auth-user-name');
  var emailEl = $id('auth-user-email');
  var avatarEl = $id('auth-avatar');
  var ddName = $id('dd-name');
  var ddEmail = $id('dd-email');
  if (user) {
    var displayName = (user.user_metadata && user.user_metadata.name) || (user.email ? user.email.split('@')[0] : 'Account');
    var initial = displayName.charAt(0).toUpperCase();
    if (statusEl) statusEl.style.display = 'flex';
    if (nameEl) nameEl.textContent = displayName;
    if (emailEl) emailEl.textContent = user.email || '';
    if (avatarEl) avatarEl.textContent = initial;
    if (ddName) ddName.textContent = displayName;
    if (ddEmail) ddEmail.textContent = user.email || '';
    if (loginBtn) loginBtn.style.display = 'none';
  } else {
    if (statusEl) statusEl.style.display = 'none';
    if (loginBtn) loginBtn.style.display = '';
  }
  return user;
}

// Gate: runs `action` immediately if signed in, otherwise opens the
// sign-in modal first and runs `action` right after a successful
// login/signup. This is what makes an account required before an
// order can be placed (see openOrderModal above).
async function requireLogin(action) {
  var user = await window.sbGetCurrentUser();
  if (user) { action(); return; }
  openAuthModal('login', action);
}

window.openAuthModal = openAuthModal;
window.closeAuthModal = closeAuthModal;
window.switchAuthTab = switchAuthTab;
window.authSubmit = authSubmit;
window.authLogout = authLogout;
window.toggleUserDropdown = toggleUserDropdown;
window.updateAuthUI = updateAuthUI;
window.requireLogin = requireLogin;

document.addEventListener('DOMContentLoaded', function() { updateAuthUI(); });
if (sb) {
  sb.auth.onAuthStateChange(function() { updateAuthUI(); });
}
