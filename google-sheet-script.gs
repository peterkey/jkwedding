/**
 * Jordan & Kirsty — RSVP handler
 * ---------------------------------------------------------------
 * This runs inside your Google Sheet. It does three things when a
 * guest sends their reply:
 *
 *   1. Checks the guest code
 *   2. Writes (or updates) their row in the sheet
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
  'Submitted', 'Last updated', 'Name', 'Email', 'Attending',
  'Arriving', 'Leaving', 'Staying at hotel', 'Booking reference', 'Dietary requirements',
];


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
 * Writes the reply to the sheet.
 * If this email has replied before, their existing row is updated
 * rather than a second row being added.
 *
 * @return {boolean} true if an existing reply was updated
 */
function saveReply(data) {
  const sheet = getSheet();
  const now = new Date();

  const row = [
    now,                                    // Submitted
    now,                                    // Last updated
    data.name,
    data.email,
    data.attending ? 'Yes' : 'No',
    data.attending ? (data.arrivalDate || '') : '',
    data.attending ? (data.departureDate || '') : '',
    data.attending ? (data.stayingAtHotel ? 'Yes' : 'Elsewhere') : '',
    data.attending && data.stayingAtHotel ? (data.hotelBookingRef || '') : '',
    data.attending ? (data.dietary || '') : '',
  ];

  const existingRow = findRowByEmail(sheet, data.email);

  if (existingRow) {
    // Keep the original "Submitted" date, update everything else.
    const originalSubmitted = sheet.getRange(existingRow, 1).getValue();
    row[0] = originalSubmitted;
    sheet.getRange(existingRow, 1, 1, row.length).setValues([row]);
    return true;
  }

  sheet.appendRow(row);
  return false;
}


/** Finds the row number for an email address, or null. */
function findRowByEmail(sheet, email) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return null;

  const emailColumn = HEADERS.indexOf('Email') + 1;
  const values = sheet.getRange(2, emailColumn, lastRow - 1, 1).getValues();
  const target = String(email).trim().toLowerCase();

  for (let i = 0; i < values.length; i++) {
    if (String(values[i][0]).trim().toLowerCase() === target) {
      return i + 2; // +2 because we started at row 2
    }
  }
  return null;
}


/** Gets the RSVPs sheet, creating and formatting it the first time. */
function getSheet() {
  const book = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = book.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = book.insertSheet(SHEET_NAME);
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, HEADERS.length);
  }

  return sheet;
}


/** The email the guest receives. */
function sendConfirmation(data) {
  const firstName = String(data.name).trim().split(/\s+/)[0];

  const subject = data.attending
    ? 'Thank you — see you in Crete!'
    : 'Thank you for letting us know';

  const intro = data.attending
    ? `Thank you, ${escapeHtml(firstName)}. Your reply is with us and we can’t wait to see you in Crete.`
    : `Thank you, ${escapeHtml(firstName)}. We’re sorry you can’t make it, but thank you for letting us know. We’ll raise a glass to you on the day.`;

  const rows = [];
  rows.push(['Name', data.name]);
  rows.push(['Coming?', data.attending ? 'Wouldn’t miss it' : 'Sadly can’t']);

  if (data.attending) {
    if (data.arrivalDate)   rows.push(['Arriving in Crete', data.arrivalDate]);
    if (data.departureDate) rows.push(['Leaving', data.departureDate]);
    rows.push(['Staying at the hotel', data.stayingAtHotel ? 'Yes, booked' : 'Somewhere else']);
    if (data.hotelBookingRef) rows.push(['Booking reference', data.hotelBookingRef]);
    if (data.dietary)         rows.push(['Dietary requirements', data.dietary]);
  }

  const summaryRows = rows.map(function (pair) {
    return '<tr>' +
      '<td style="padding:8px 16px 8px 0;color:#7d6643;font-size:13px;letter-spacing:.08em;' +
      'text-transform:uppercase;vertical-align:top;white-space:nowrap">' + escapeHtml(pair[0]) + '</td>' +
      '<td style="padding:8px 0;color:#2b2623;font-size:16px;vertical-align:top">' + escapeHtml(pair[1]) + '</td>' +
      '</tr>';
  }).join('');

  const closing = data.attending
    ? 'We’ll be in touch nearer the time with transfer details and final timings. Start practising your dance moves.'
    : 'We’ll share plenty of photos afterwards.';

  const html =
    '<div style="margin:0;padding:32px 20px;background:#fbf9f5;' +
    'font-family:Georgia,\'Times New Roman\',serif;color:#2b2623">' +
      '<div style="max-width:520px;margin:0 auto">' +

        '<div style="font-size:30px;font-weight:300;letter-spacing:-.05em;margin-bottom:32px">' +
          'J<span style="font-style:italic;color:#9c5f63">&amp;</span>K' +
        '</div>' +

        '<div style="font-size:34px;line-height:1.15;font-weight:300;letter-spacing:-.03em;margin-bottom:20px">' +
          (data.attending
            ? 'See you in Crete<span style="font-style:italic;color:#9c5f63">!</span>'
            : 'We’ll miss you<span style="font-style:italic;color:#9c5f63">.</span>') +
        '</div>' +

        '<p style="font-size:17px;line-height:1.65;margin:0 0 28px">' + intro + '</p>' +

        '<div style="background:#efe5d3;padding:24px 28px;margin-bottom:28px">' +
          '<div style="font-size:13px;letter-spacing:.18em;text-transform:uppercase;' +
          'color:#7d6643;margin-bottom:12px">Your reply</div>' +
          '<table style="border-collapse:collapse;width:100%">' + summaryRows + '</table>' +
        '</div>' +

        '<p style="font-size:17px;line-height:1.65;margin:0 0 28px">' + closing + '</p>' +

        '<p style="font-size:15px;line-height:1.6;color:#5e5348;margin:0 0 32px">' +
          'Changed your mind, or spotted a mistake? Just fill the form in again on the ' +
          'website with this same email address and we’ll update your reply.' +
        '</p>' +

        '<div style="border-top:1px solid #d9c6a3;padding-top:20px;' +
        'font-size:14px;color:#6b625b;line-height:1.6">' +
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

  const verdict = data.attending ? 'is coming' : 'can’t make it';
  const subject = (isUpdate ? 'RSVP updated: ' : 'New RSVP: ') + data.name + ' ' + verdict;

  const lines = [
    'Name: ' + data.name,
    'Email: ' + data.email,
    'Attending: ' + (data.attending ? 'Yes' : 'No'),
  ];

  if (data.attending) {
    lines.push('Arriving: ' + (data.arrivalDate || '—'));
    lines.push('Leaving: ' + (data.departureDate || '—'));
    lines.push('Staying at hotel: ' + (data.stayingAtHotel ? 'Yes' : 'Elsewhere'));
    if (data.hotelBookingRef) lines.push('Booking reference: ' + data.hotelBookingRef);
    if (data.dietary)         lines.push('Dietary: ' + data.dietary);
  }

  lines.push('');
  lines.push(isUpdate ? 'This replaced an earlier reply from the same email address.' : '');
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
      }),
    },
  });

  Logger.log('Done. Check the RSVPs tab, and check ' + you + ' for the confirmation email.');
  Logger.log('Delete the "Test Guest" row when you are happy it works.');
}
