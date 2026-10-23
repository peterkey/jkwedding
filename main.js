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
  rsvpEndpoint: 'https://script.google.com/macros/s/AKfycby6mffbg6XAj4HWxjCQ3LgMYgReFIbmycgbqCUwg0k8CXhYzG3x_IYQirCfn-fKJoqr/exec',

  // 2. The guest code, stored as a fingerprint rather than the word itself,
  //    so nobody can read it by viewing the page source.
  //    Current code: "finally"
  //    To change it, run this in a terminal and paste the result here:
  //      printf '%s' "yournewcode" | sha256sum
  //    Then change GUEST_CODE in the Apps Script to match.
  guestCodeHash: '205c3e16c66ff0b845700155d0394219f64e9eb6ed9db9f7758382bb4106eb11',

  // 3. The moment you're counting down to.
  //    3:30pm in Crete on 31 May 2028 is 12:30 UTC.
  //    Months count from 0, so 4 = May.
  countdownTargetUTC: Date.UTC(2028, 4, 31, 12, 30, 0),

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


/* ---------- Scroll reveal -----------------------------------
   Blocks marked data-reveal fade up once as they enter the view.
   Neighbouring blocks stagger by 90ms. Skipped entirely when the
   visitor has asked for reduced motion. */

function setupReveal() {
  const blocks = $$('[data-reveal]');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window) || !Element.prototype.animate) return;

  document.documentElement.classList.add('reveal-ready');

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      observer.unobserve(el);

      const siblings = Array.from(el.parentElement.children).filter(x => x.hasAttribute('data-reveal'));
      el.animate(
        [{ opacity: 0, transform: 'translateY(18px)' }, { opacity: 1, transform: 'none' }],
        { duration: 900, delay: Math.max(0, siblings.indexOf(el)) * 90,
          easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'backwards' }
      );
      el.classList.add('is-revealed');
    });
  }, { rootMargin: '0px 0px -8% 0px' });

  blocks.forEach(el => observer.observe(el));
}


/* ---------- Travel tips: Crete time and exchange rate -------
   The time comes from the visitor's own clock, so it always works.
   The rate is fetched from Frankfurter (free European Central Bank
   rates, no account needed). If that fails, the line stays hidden
   and the tip reads exactly as it did before. */

function setupCreteTime() {
  const el = $('#crete-time');
  if (!el) return;

  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Athens', hour: 'numeric', minute: '2-digit', hour12: true,
  });

  const tick = () => {
    const time = fmt.format(new Date()).replace(/\s/g, '').toLowerCase();
    el.textContent = `It’s ${time} in Crete right now.`;
  };

  tick();
  el.hidden = false;
  setInterval(tick, 10000);
}

async function setupExchangeRate() {
  const el = $('#exchange-rate');
  if (!el) return;

  try {
    const res = await fetch('https://api.frankfurter.dev/v2/rates?base=GBP&quotes=EUR');
    if (!res.ok) throw new Error(res.status);
    const [{ rate, date }] = await res.json();
    if (!(rate > 0)) throw new Error('no rate');

    const day = new Date(date + 'T12:00:00Z')
      .toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });

    el.innerHTML = '';
    el.append(
      `Today £1 is about €${rate.toFixed(2)}, so £100 gets you roughly €${Math.round(rate * 100)}. `,
      Object.assign(document.createElement('span'), { className: 'note__source', textContent: `ECB rate, ${day}` }),
    );
    el.hidden = false;
  } catch (err) {
    console.warn('Exchange rate unavailable:', err);
  }
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

/* The code the guest typed. Held in memory only, never saved, so
   refreshing the page closes the form again. */
let guestCode = '';

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

  const unlock = code => {
    guestCode = code;
    gate.hidden = true;
    form.hidden = false;
  };

  gateForm.addEventListener('submit', async e => {
    e.preventDefault();
    const entered = input.value.trim().toLowerCase();
    if (!entered) return;

    // crypto.subtle only exists over https (or localhost). If the page
    // was opened straight off the disk we can't check the code here, so
    // we let it through and let the Apps Script be the judge instead.
    if (!window.crypto?.subtle) {
      unlock(entered);
      return;
    }

    if (await sha256(entered) === CONFIG.guestCodeHash) {
      error.hidden = true;
      unlock(entered);
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
  const dietaryField = $('#dietary-field');
  const success = $('#rsvp-success');
  const status = $('#form-status');
  const submitBtn = $('#submit');

  /* -- the rest of the party --
     Each "+ Add someone" copies the template: a name, their own
     yes/no and their own dietary box. Travel dates and the hotel
     are shared by the whole group. */

  const partyList = $('#party-list');
  const partyAdd = $('#party-add');
  const template = $('#party-member-template');
  const MAX_PARTY = 8;
  let partyCounter = 0;

  const partyMembers = () => $$('.party-member', partyList);

  const readParty = () => partyMembers()
    .map(member => ({
      name: $('[data-field="name"]', member).value.trim(),
      attending: $('[data-field="yes"]', member).checked,
      dietary: $('[data-field="dietary"]', member).value.trim(),
    }))
    .filter(guest => guest.name); // a row left blank is simply ignored

  function addPartyMember() {
    const member = template.content.firstElementChild.cloneNode(true);
    const n = ++partyCounter;

    // Give every input a unique id and point its label at it,
    // and give each person's yes/no its own radio group.
    $$('[data-field]', member).forEach(input => {
      input.id = `party-${n}-${input.dataset.field}`;
      if (input.type === 'radio') input.name = `party-${n}-attending`;
    });
    $$('[data-for]', member).forEach(label => {
      label.htmlFor = `party-${n}-${label.dataset.for}`;
    });

    $$('input[type="radio"]', member).forEach(r => r.addEventListener('change', syncVisibility));
    $('.party-member__remove', member).addEventListener('click', () => {
      member.remove();
      syncVisibility();
      partyAdd.focus();
    });

    partyList.append(member);
    syncVisibility();
    $('[data-field="name"]', member).focus();
  }

  partyAdd.addEventListener('click', addPartyMember);

  /* -- conditional fields -- */

  const isAttending = () => $('#att-yes').checked;
  const isStaying = () => $('#stay-yes').checked;
  const anyoneComing = () => isAttending() || readParty().some(g => g.attending);

  function syncVisibility() {
    // Dates and hotel matter if anyone in the group is coming, even if
    // the person filling in the form can't make it themselves.
    attendingFields.hidden = !anyoneComing();
    hotelRefField.hidden = !isStaying();
    dietaryField.hidden = !isAttending();

    partyMembers().forEach(member => {
      $('[data-role="dietary-field"]', member).hidden = !$('[data-field="yes"]', member).checked;
    });
    partyAdd.hidden = partyMembers().length >= MAX_PARTY;
  }

  $$('input[name="attending"]').forEach(r => r.addEventListener('change', syncVisibility));
  $$('input[name="stayingAtHotel"]').forEach(r => r.addEventListener('change', syncVisibility));
  // A name typed or cleared can change whether anyone else is coming
  partyList.addEventListener('input', syncVisibility);
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
    const party = readParty().map(g => ({ ...g, dietary: g.attending ? g.dietary : '' }));
    const travelling = attending || party.some(g => g.attending);
    const staying = isStaying();

    const payload = {
      code: guestCode,
      name: nameInput.value.trim(),
      email: emailInput.value.trim(),
      attending,
      party,
      arrivalDate: travelling ? $('#arrival').value : '',
      departureDate: travelling ? $('#departure').value : '',
      stayingAtHotel: travelling ? staying : false,
      hotelBookingRef: travelling && staying ? $('#hotelRef').value.trim() : '',
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

  function showSuccess({ name, attending, party }) {
    const first = name.trim().split(/\s+/)[0] || '';
    const coming = (attending ? 1 : 0) + party.filter(g => g.attending).length;
    const total = 1 + party.length;

    $('#success-title').textContent = coming
      ? `Thank you, ${first}. See you in Crete!`
      : `We’ll miss you, ${first}.`;

    const whose = total === 1 ? 'Your reply'
      : total === 2 ? 'Your reply for both of you'
      : `Your reply for all ${total} of you`;
    $('#success-body').textContent = coming
      ? `${whose} is with us. We can’t wait to celebrate with you. Start practising your dance moves.`
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
setupReveal();
setupCountdown();
setupCreteTime();
setupExchangeRate();
setupMenu();
setupGate();
setupRsvp();
