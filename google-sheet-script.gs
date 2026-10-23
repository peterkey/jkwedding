/**
 * Jordan & Kirsty — RSVP handler
 * ---------------------------------------------------------------
 * This runs inside your Google Sheet. It does three things when a
 * guest sends their reply:
 *
 *   1. Checks the guest code
 *   2. Writes (or updates) their rows in the sheet, one row per
 *      person, so a couple or family replying together get a row each
 *   3. Emails them a confirmation, and emails you a heads-up
 *
 * Setup instructions are in SETUP.md.
 */


// ===============================================================
//  SETTINGS — change these two, then save.
// ===============================================================

/** Must match the code on your invitations (and the one in main.js). */
const GUEST_CODE = 'finally';

/** Where the "someone just replied" notifications go.
 *  Use a comma between addresses for more than one.
 *  Leave as '' to switch these off. */
const NOTIFY_EMAILS = '';


// ===============================================================
//  Below here you shouldn't need to change anything.
// ===============================================================

const SHEET_NAME = 'RSVPs';

const HEADERS = [
  'Submitted', 'Last updated', 'Name', 'Coming', 'Dietary requirements',
  'Arriving', 'Leaving', 'Staying at hotel', 'Booking reference', 'Replied by', 'Email',
];

/** The most extra people one reply can include (matches the website). */
const MAX_PARTY = 8;


/**
 * Visiting the web app URL in a browser runs this.
 * It's here so you can check the script is live.
 */
function doGet() {
  return jsonResponse({ ok: true, message: 'Jordan & Kirsty RSVP endpoint is live.' });
}


/**
 * The website posts the guest's reply here.
 */
function doPost(e) {
  // Only one write at a time, so two guests replying at once
  // can't overwrite each other.
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const data = JSON.parse(e.postData.contents);

    // --- the guest code is checked here, not just in the browser ---
    if (String(data.code || '').trim().toLowerCase() !== GUEST_CODE.toLowerCase()) {
      return jsonResponse({ ok: false, error: 'bad_code' });
    }

    if (!data.name || !data.email) {
      return jsonResponse({ ok: false, error: 'missing_name_or_email' });
    }

    data.party = cleanParty(data.party);

    const isUpdate = saveReply(data);

    // If the email fails we still keep the reply — better a missing
    // confirmation than a lost RSVP.
    try {
      sendConfirmation(data);
    } catch (mailError) {
      console.error('Confirmation email failed: ' + mailError);
    }

    try {
      notifyCouple(data, isUpdate);
    } catch (mailError) {
      console.error('Notification email failed: ' + mailError);
    }

    return jsonResponse({ ok: true, updated: isUpdate });

  } catch (error) {
    console.error(error);
    return jsonResponse({ ok: false, error: String(error) });
  } finally {
    lock.releaseLock();
  }
}


/**
 * Tidies the list of extra people sent by the website: drops blank
 * names, trims everything and caps the size of the group.
 */
function cleanParty(party) {
  if (!Array.isArray(party)) return [];

  return party.slice(0, MAX_PARTY)
    .map(function (guest) {
      guest = guest || {};
      const attending = !!guest.attending;
      return {
        name: String(guest.name || '').trim().slice(0, 200),
        attending: attending,
        dietary: attending ? String(guest.dietary || '').trim().slice(0, 500) : '',
      };
    })
    .filter(function (guest) { return guest.name; });
}


/** Everyone in the reply: the person who filled it in, then the rest. */
function everyone(data) {
  return [{ name: data.name, attending: !!data.attending, dietary: data.attending ? (data.dietary || '') : '' }]
    .concat(data.party);
}


/** True if at least one person in the reply is coming. */
function anyoneComing(data) {
  return everyone(data).some(function (person) { return person.attending; });
}


/**
 * Writes the reply to the sheet, one row per person.
 * If this email has replied before, that whole group's rows are
 * replaced, so changing a reply never leaves stale rows behind.
 *
 * @return {boolean} true if an existing reply was updated
 */
function saveReply(data) {
  const sheet = getSheet();
  const now = new Date();
  const existingRows = findRowsByEmail(sheet, data.email);

  // Keep the original "Submitted" date when a reply is changed.
  const submitted = existingRows.length
    ? sheet.getRange(existingRows[0], 1).getValue()
    : now;

  const rows = everyone(data).map(function (person) {
    const coming = person.attending;
    return [
      submitted,                                         // Submitted
      now,                                               // Last updated
      person.name,
      coming ? 'Yes' : 'No',
      person.dietary,
      coming ? (data.arrivalDate || '') : '',
      coming ? (data.departureDate || '') : '',
      coming ? (data.stayingAtHotel ? 'Yes' : 'Elsewhere') : '',
      coming && data.stayingAtHotel ? (data.hotelBookingRef || '') : '',
      data.name,                                         // Replied by
      data.email,
    ];
  });

  // Delete from the bottom up so the row numbers stay correct.
  existingRows.slice().reverse().forEach(function (rowNumber) {
    sheet.deleteRow(rowNumber);
  });

  sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, HEADERS.length).setValues(rows);
  return existingRows.length > 0;
}


/** Finds every row number belonging to an email address (top to bottom). */
function findRowsByEmail(sheet, email) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  const emailColumn = HEADERS.indexOf('Email') + 1;
  const values = sheet.getRange(2, emailColumn, lastRow - 1, 1).getValues();
  const target = String(email).trim().toLowerCase();
  const found = [];

  for (let i = 0; i < values.length; i++) {
    if (String(values[i][0]).trim().toLowerCase() === target) {
      found.push(i + 2); // +2 because we started at row 2
    }
  }
  return found;
}


/** Gets the RSVPs sheet, creating and formatting it the first time. */
function getSheet() {
  const book = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = book.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = book.insertSheet(SHEET_NAME);
  }

  const lastRow = sheet.getLastRow();
  const current = lastRow ? sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0] : [];
  const headersMatch = HEADERS.every(function (h, i) { return current[i] === h; });

  if (!headersMatch) {
    // Columns changed when replies became one row per person. A tab with
    // no replies yet is simply re-labelled; one holding real replies is
    // left alone rather than risk mixing up its columns.
    if (lastRow > 1) {
      throw new Error('The ' + SHEET_NAME + ' tab uses an older column layout. ' +
        'Rename it (e.g. "RSVPs old") and the script will create a fresh one.');
    }
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold');
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, HEADERS.length);
  }

  return sheet;
}


/** The email the guest receives. */
function sendConfirmation(data) {
  const firstName = String(data.name).trim().split(/\s+/)[0];
  const coming = anyoneComing(data);

  const subject = coming
    ? 'Thank you — see you in Crete!'
    : 'Thank you for letting us know';

  const intro = coming
    ? `Thank you, ${escapeHtml(firstName)}. Your reply is with us and we can’t wait to see you in Crete.`
    : `Thank you, ${escapeHtml(firstName)}. We’re sorry you can’t make it, but thank you for letting us know. We’ll raise a glass to you on the day.`;

  // One line per person, e.g. "Jordan Nelson: Coming · Vegetarian"
  const rows = everyone(data).map(function (person) {
    const answer = person.attending ? 'Coming' : 'Can’t make it';
    return [person.name, person.dietary ? answer + ' · ' + person.dietary : answer];
  });

  if (coming) {
    if (data.arrivalDate)   rows.push(['Arriving in Crete', data.arrivalDate]);
    if (data.departureDate) rows.push(['Leaving', data.departureDate]);
    rows.push(['Staying at the hotel', data.stayingAtHotel ? 'Yes, booked' : 'Somewhere else']);
    if (data.hotelBookingRef) rows.push(['Booking reference', data.hotelBookingRef]);
  }

  const summaryRows = rows.map(function (pair) {
    return '<tr>' +
      '<td style="padding:8px 16px 8px 0;color:#4b6188;font-size:13px;letter-spacing:.08em;' +
      'text-transform:uppercase;vertical-align:top;white-space:nowrap">' + escapeHtml(pair[0]) + '</td>' +
      '<td style="padding:8px 0;color:#1b2c4f;font-size:16px;vertical-align:top">' + escapeHtml(pair[1]) + '</td>' +
      '</tr>';
  }).join('');

  const closing = coming
    ? 'We’ll be in touch nearer the time with transfer details and final timings. Start practising your dance moves.'
    : 'We’ll share plenty of photos afterwards.';

  const html =
    '<div style="margin:0;padding:32px 20px;background:#f8f5ee;' +
    'font-family:Georgia,\'Times New Roman\',serif;color:#1b2c4f">' +
      '<div style="max-width:520px;margin:0 auto">' +

        '<div style="font-size:30px;font-weight:300;letter-spacing:-.05em;margin-bottom:32px">' +
          'J<span style="font-style:italic;color:#24508f">&amp;</span>K' +
        '</div>' +

        '<div style="font-size:34px;line-height:1.15;font-weight:300;letter-spacing:-.03em;margin-bottom:20px">' +
          (coming
            ? 'See you in Crete<span style="font-style:italic;color:#24508f">!</span>'
            : 'We’ll miss you<span style="font-style:italic;color:#24508f">.</span>') +
        '</div>' +

        '<p style="font-size:17px;line-height:1.65;margin:0 0 28px">' + intro + '</p>' +

        '<div style="background:#efebe1;padding:24px 28px;margin-bottom:28px">' +
          '<div style="font-size:13px;letter-spacing:.18em;text-transform:uppercase;' +
          'color:#4b6188;margin-bottom:12px">Your reply</div>' +
          '<table style="border-collapse:collapse;width:100%">' + summaryRows + '</table>' +
        '</div>' +

        '<p style="font-size:17px;line-height:1.65;margin:0 0 28px">' + closing + '</p>' +

        '<p style="font-size:15px;line-height:1.6;color:#46557a;margin:0 0 32px">' +
          'Changed your mind, or spotted a mistake? Just fill the form in again on the ' +
          'website with this same email address and we’ll update your reply.' +
        '</p>' +

        '<div style="border-top:1px solid #c6cedb;padding-top:20px;' +
        'font-size:14px;color:#56627d;line-height:1.6">' +
          'Jordan &amp; Kirsty<br>' +
          'Wednesday 31 May 2028 · Atlantica Caldera Palace, Lyttos Beach, Crete' +
        '</div>' +

      '</div>' +
    '</div>';

  const plain =
    intro.replace(/<[^>]*>/g, '') + '\n\n' +
    rows.map(function (p) { return p[0] + ': ' + p[1]; }).join('\n') + '\n\n' +
    closing + '\n\n' +
    'Jordan & Kirsty\nWednesday 31 May 2028 · Atlantica Caldera Palace, Lyttos Beach, Crete';

  MailApp.sendEmail({
    to: data.email,
    subject: subject,
    body: plain,
    htmlBody: html,
    name: 'Jordan & Kirsty',
  });
}


/** The heads-up email you receive. */
function notifyCouple(data, isUpdate) {
  if (!NOTIFY_EMAILS) return;

  const people = everyone(data);
  const comingCount = people.filter(function (p) { return p.attending; }).length;

  // "Kirsty Williams is coming" or "Kirsty Williams + 2 (3 coming)"
  const verdict = people.length === 1
    ? (comingCount ? ' is coming' : ' can’t make it')
    : ' + ' + (people.length - 1) + ' (' + comingCount + ' coming)';
  const subject = (isUpdate ? 'RSVP updated: ' : 'New RSVP: ') + data.name + verdict;

  const lines = ['Email: ' + data.email, ''];

  people.forEach(function (person) {
    lines.push(person.name + ': ' + (person.attending ? 'Yes' : 'No') +
      (person.dietary ? ' (dietary: ' + person.dietary + ')' : ''));
  });

  if (comingCount) {
    lines.push('');
    lines.push('Arriving: ' + (data.arrivalDate || '—'));
    lines.push('Leaving: ' + (data.departureDate || '—'));
    lines.push('Staying at hotel: ' + (data.stayingAtHotel ? 'Yes' : 'Elsewhere'));
    if (data.hotelBookingRef) lines.push('Booking reference: ' + data.hotelBookingRef);
  }

  lines.push('');
  lines.push(isUpdate ? 'This replaced an earlier reply (and its rows) from the same email address.' : '');
  lines.push(SpreadsheetApp.getActiveSpreadsheet().getUrl());

  MailApp.sendEmail({
    to: NOTIFY_EMAILS,
    subject: subject,
    body: lines.join('\n'),
    name: 'Wedding RSVPs',
  });
}


/** Stops text in a reply from breaking the email's HTML. */
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}


function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}


// ===============================================================
//  Run this once from the Apps Script editor to check everything
//  works. It adds a fake reply and emails it to you.
// ===============================================================
function sendTestReply() {
  const you = Session.getActiveUser().getEmail();

  doPost({
    postData: {
      contents: JSON.stringify({
        code: GUEST_CODE,
        name: 'Test Guest',
        email: you,
        attending: true,
        arrivalDate: '2028-05-29',
        departureDate: '2028-06-02',
        stayingAtHotel: true,
        hotelBookingRef: 'TEST-12345',
        dietary: 'A weakness for Percy Pigs.',
        party: [
          { name: 'Test Partner', attending: true, dietary: 'Vegetarian' },
          { name: 'Test Plus Two', attending: false, dietary: '' },
        ],
      }),
    },
  });

  Logger.log('Done. Check the RSVPs tab, and check ' + you + ' for the confirmation email.');
  Logger.log('Delete the three "Test" rows when you are happy it works.');
}
