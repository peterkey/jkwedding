/* ============================================================
   Jordan & Kirsty — wedding site
   ------------------------------------------------------------
   EVERYTHING YOU NEED TO CHANGE IS IN THE BLOCK BELOW.
   Nothing further down needs touching. See SETUP.md.
   ============================================================ */

const CONFIG = {

  // 1. Paste the web app URL you get from Google Apps Script here.
  //    It looks like: https://script.google.com/macros/s/AKfy..../exec
  //    Until this is filled in, the form will say it isn't connected.
  rsvpEndpoint: '',

  // 2. The guest code, stored as a fingerprint rather than the word itself,
  //    so nobody can read it by viewing the page source.
  //    Current code: "finally"
  //    To change it, run this in a terminal and paste the result here:
  //      printf '%s' "yournewcode" | sha256sum
  //    Then change GUEST_CODE in the Apps Script to match.
  guestCodeHash: '205c3e16c66ff0b845700155d0394219f64e9eb6ed9db9f7758382bb4106eb11',

  // 3. The moment you're counting down to.
  //    3pm in Crete on 31 May 2028 is 12:00 UTC.
  //    Months count from 0, so 4 = May.
  countdownTargetUTC: Date.UTC(2028, 4, 31, 12, 0, 0),

};

/* ============================================================
   Below here is the machinery. You shouldn't need to edit it.
   ============================================================ */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));


/* ---------- Photos -----------------------------------------
   Every photo slot starts as a striped placeholder with its caption.
   When a real photo loads, it fades in over the top and the caption
   disappears. A missing photo needs no handling at all — the slot
   just stays as the placeholder.

   So: drop a correctly named file into /images and it appears.
   Add them a few at a time; the page never looks broken. */

function setupPhotos() {
  $$('.photo').forEach(figure => {
    const img = $('img', figure);
    if (!img) return;

    const fill = () => figure.classList.add('is-filled');

    // Already loaded before this script ran?
    if (img.complete && img.naturalWidth > 0) fill();
    img.addEventListener('load', fill);
  });
}


/* ---------- Countdown --------------------------------------- */

function setupCountdown() {
  const root = $('#countdown');
  if (!root) return;

  const cells = {
    d: $('[data-cd="d"]', root),
    h: $('[data-cd="h"]', root),
    m: $('[data-cd="m"]', root),
    s: $('[data-cd="s"]', root),
  };
  const pad = n => String(n).padStart(2, '0');

  function tick() {
    const ms = Math.max(0, CONFIG.countdownTargetUTC - Date.now());
    cells.d.textContent = Math.floor(ms / 864e5);
    cells.h.textContent = pad(Math.floor(ms / 36e5) % 24);
    cells.m.textContent = pad(Math.floor(ms / 6e4) % 60);
    cells.s.textContent = pad(Math.floor(ms / 1e3) % 60);
  }

  tick();
  setInterval(tick, 1000);
}


/* ---------- Mobile menu -------------------------------------- */

function setupMenu() {
  const menu = $('#menu');
  const openBtn = $('#menu-open');
  const closeBtn = $('#menu-close');
  if (!menu || !openBtn) return;

  const open = () => {
    menu.hidden = false;
    openBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    $('a', menu)?.focus();
  };

  const close = () => {
    menu.hidden = true;
    openBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };

  openBtn.addEventListener('click', open);
  closeBtn.addEventListener('click', close);
  $$('a', menu).forEach(link => link.addEventListener('click', close));

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !menu.hidden) {
      close();
      openBtn.focus();
    }
  });

  // If the window grows to desktop width while the menu is open, tidy up.
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 760 && !menu.hidden) close();
  });
}


/* ---------- Guest code gate ---------------------------------
   The code is checked here so guests get an instant answer, and
   checked again by the Apps Script before anything is written,
   so the real gate is on the server. */

const UNLOCK_KEY = 'jk-rsvp-unlocked';

async function sha256(text) {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function setupGate() {
  const gate = $('#gate');
  const form = $('#rsvp-form');
  const gateForm = $('#gate-form');
  const input = $('#gate-input');
  const error = $('#gate-error');
  if (!gate || !form) return;

  const unlock = () => {
    gate.hidden = true;
    form.hidden = false;
  };

  // Already unlocked on this device?
  if (localStorage.getItem(UNLOCK_KEY)) {
    unlock();
    return;
  }

  // crypto.subtle only exists over https (or localhost). If the page is
  // opened straight off the disk we skip the on-page check and let the
  // Apps Script do the gatekeeping instead.
  if (!window.crypto?.subtle) {
    unlock();
    return;
  }

  gateForm.addEventListener('submit', async e => {
    e.preventDefault();
    const entered = input.value.trim().toLowerCase();
    if (!entered) return;

    if (await sha256(entered) === CONFIG.guestCodeHash) {
      try { localStorage.setItem(UNLOCK_KEY, entered); } catch { /* private browsing */ }
      error.hidden = true;
      unlock();
      $('#name')?.focus();
    } else {
      error.hidden = false;
      input.classList.add('is-invalid');
      input.focus();
      input.select();
    }
  });

  input.addEventListener('input', () => {
    error.hidden = true;
    input.classList.remove('is-invalid');
  });
}


/* ---------- RSVP form ---------------------------------------- */

function setupRsvp() {
  const form = $('#rsvp-form');
  if (!form) return;

  const attendingFields = $('#attending-fields');
  const hotelRefField = $('#hotel-ref-field');
  const success = $('#rsvp-success');
  const status = $('#form-status');
  const submitBtn = $('#submit');

  /* -- conditional fields -- */

  const isAttending = () => $('#att-yes').checked;
  const isStaying = () => $('#stay-yes').checked;

  const syncVisibility = () => {
    attendingFields.hidden = !isAttending();
    hotelRefField.hidden = !isStaying();
  };

  $$('input[name="attending"]').forEach(r => r.addEventListener('change', syncVisibility));
  $$('input[name="stayingAtHotel"]').forEach(r => r.addEventListener('change', syncVisibility));
  syncVisibility();

  /* -- validation -- */

  const showError = (input, errorEl) => {
    input.classList.add('is-invalid');
    errorEl.hidden = false;
  };

  const clearError = (input, errorEl) => {
    input.classList.remove('is-invalid');
    errorEl.hidden = true;
  };

  const nameInput = $('#name');
  const nameError = $('#name-error');
  const emailInput = $('#email');
  const emailError = $('#email-error');

  nameInput.addEventListener('input', () => clearError(nameInput, nameError));
  emailInput.addEventListener('input', () => clearError(emailInput, emailError));

  const looksLikeEmail = value => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);

  function validate() {
    let firstBad = null;

    if (!nameInput.value.trim()) {
      showError(nameInput, nameError);
      firstBad = firstBad || nameInput;
    }
    if (!looksLikeEmail(emailInput.value.trim())) {
      showError(emailInput, emailError);
      firstBad = firstBad || emailInput;
    }

    if (firstBad) firstBad.focus();
    return !firstBad;
  }

  /* -- submit -- */

  form.addEventListener('submit', async e => {
    e.preventDefault();
    status.hidden = true;

    if (!validate()) return;

    if (!CONFIG.rsvpEndpoint) {
      status.hidden = false;
      status.textContent = 'The RSVP form isn’t connected yet — see step 1 of SETUP.md.';
      return;
    }

    const attending = isAttending();
    const staying = isStaying();

    const payload = {
      code: localStorage.getItem(UNLOCK_KEY) || $('#gate-input')?.value.trim().toLowerCase() || '',
      name: nameInput.value.trim(),
      email: emailInput.value.trim(),
      attending,
      arrivalDate: attending ? $('#arrival').value : '',
      departureDate: attending ? $('#departure').value : '',
      stayingAtHotel: attending ? staying : false,
      hotelBookingRef: attending && staying ? $('#hotelRef').value.trim() : '',
      dietary: attending ? $('#dietary').value.trim() : '',
    };

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';

    try {
      // Sent as text/plain so the browser treats it as a simple request.
      // Apps Script reads the JSON out of the body either way.
      const res = await fetch(CONFIG.rsvpEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
        redirect: 'follow',
      });

      const result = await res.json();

      if (result.ok) {
        showSuccess(payload);
      } else if (result.error === 'bad_code') {
        status.hidden = false;
        status.textContent = 'That guest code wasn’t recognised. Have another look at your invitation.';
      } else {
        throw new Error(result.error || 'unknown');
      }

    } catch (err) {
      console.error('RSVP submission failed:', err);
      status.hidden = false;
      status.textContent = 'Something went wrong sending that. Please try again, or email us directly.';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send our reply';
    }
  });

  /* -- success state -- */

  function showSuccess({ name, attending }) {
    const first = name.trim().split(/\s+/)[0] || '';

    $('#success-title').textContent = attending
      ? `Thank you, ${first}. See you in Crete!`
      : `We’ll miss you, ${first}.`;

    $('#success-body').textContent = attending
      ? 'Your reply is with us. We’ll be in touch nearer the time with transfer details and final timings. Start practising your dance moves.'
      : 'Thank you for letting us know. We’ll raise a glass to you on the day, and we’ll share plenty of photos afterwards.';

    form.hidden = true;
    success.hidden = false;
  }

  // "Change my reply" — the form still holds everything they typed.
  $('#edit-reply').addEventListener('click', () => {
    success.hidden = true;
    form.hidden = false;
    status.hidden = true;
    nameInput.focus();
  });
}


/* ---------- go ------------------------------------------------ */

setupPhotos();
setupCountdown();
setupMenu();
setupGate();
setupRsvp();
