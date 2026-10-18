# Jordan & Kirsty — how to set up and look after the website

Written for someone who doesn't write code. Follow the steps in order.
Steps 1 and 2 take about twenty minutes between them. Step 3 needs a
coffee break while the internet catches up.

---

## What's in this folder

| File / folder | What it is |
|---|---|
| `index.html` | The page itself — all the words live here |
| `styles.css` | All the colours, fonts and spacing |
| `main.js` | The countdown, the menu, and the RSVP form |
| `images/` | **Your photos go here** |
| `fonts/` | The Source Serif 4 font, stored locally so the page loads fast |
| `google-sheet-script.gs` | The script you'll paste into Google (Step 1) |
| `vercel.json` | Tells the web host how to serve the site |
| `Jordan & Kirsty Wedding Site/` | The original design handoff — kept for reference |

---

## Step 1 — Set up the RSVP spreadsheet

This gives you a spreadsheet of replies and sends every guest a
confirmation email. It's free and there's no limit on replies.

**1.1 — Make the spreadsheet**

Go to [sheets.new](https://sheets.new) to create a blank spreadsheet.
Name it something like *Wedding RSVPs*. You don't need to add any
columns — the script creates them for you.

**1.2 — Open the script editor**

In that spreadsheet, click **Extensions → Apps Script**. A new tab opens
with a code editor and a few lines of placeholder code in it.

**1.3 — Paste in the script**

Select all the placeholder code and delete it. Then open
`google-sheet-script.gs` from this folder, copy everything in it, and
paste it into the empty editor.

**1.4 — Set your two options**

Near the top of what you just pasted you'll see:

```javascript
const GUEST_CODE = 'finally';
const NOTIFY_EMAILS = '';
```

- `GUEST_CODE` is the code guests type to unlock the form. It's already
  set to `finally`. If you change it here, you must also change it in
  `main.js` — see *Changing the guest code* below.
- `NOTIFY_EMAILS` is where you get a "someone just replied" email.
  Put your address between the quotes, like
  `const NOTIFY_EMAILS = 'prkey94@gmail.com';`
  Leave it empty if you'd rather not be emailed every time.

Click the **save icon** (💾).

**1.5 — Give the script permission (a one-off)**

At the top of the editor there's a dropdown listing the functions.
Choose **sendTestReply**, then click **Run**.

Google will ask for permission. This bit looks alarming but is normal —
you're granting *your own* script access to *your own* spreadsheet:

1. **Review permissions**
2. Choose your Google account
3. You'll see *"Google hasn't verified this app"* → click **Advanced**
4. Click **Go to Untitled project (unsafe)**
5. Click **Allow**

> It says "unsafe" because the script isn't published in Google's app
> store. You wrote it (well, I did) and it only touches this one
> spreadsheet. It's fine.

Now check two things:
- Go back to the spreadsheet — there should be an **RSVPs** tab with a
  row for "Test Guest"
- Check your inbox — you should have a confirmation email

Delete the Test Guest row once you're happy.

**1.6 — Publish it so the website can reach it**

Back in the Apps Script editor, click **Deploy → New deployment**.

- Click the **gear icon** next to "Select type" and choose **Web app**
- **Description:** `RSVP`
- **Execute as:** `Me`
- **Who has access:** `Anyone` ← this matters. Not "Anyone with a Google
  account" — guests won't be signed into Google. "Anyone" means anyone
  who knows the URL, and the URL is a long random string that only your
  website knows.
- Click **Deploy**

Copy the **Web app URL**. It ends in `/exec` and looks like:

```
https://script.google.com/macros/s/AKfycby.......................────/exec
```

**Quick check:** paste that URL into a browser. You should see
`{"ok":true,"message":"Jordan & Kirsty RSVP endpoint is live."}`

**1.7 — Tell the website about it**

Open `main.js` in this folder. The very first setting is:

```javascript
rsvpEndpoint: '',
```

Paste your URL between the quotes:

```javascript
rsvpEndpoint: 'https://script.google.com/macros/s/AKfycby....../exec',
```

Save the file. The RSVP form now works.

> **If you ever edit the script again**, your changes don't go live until
> you redeploy: **Deploy → Manage deployments → ✏️ edit icon →
> Version: New version → Deploy**. The URL stays the same.

---

## Step 2 — Put the site on the internet

Two ways. Pick one.

### Option A — The quick way (one command)

In a terminal, from this folder:

```bash
npx vercel --prod
```

It'll ask you to log in the first time, then ask a few questions —
pressing Enter for the defaults is fine. When it finishes it prints a
URL like `jkwedding.vercel.app`. That's your site, live.

To publish changes later, run the same command again.

### Option B — Connect it to GitHub (publishes automatically)

Slightly more setup, but after this every change you save and push goes
live on its own.

1. Create a new **private** repository at
   [github.com/new](https://github.com/new) — call it `jkwedding`.
2. In a terminal from this folder:
   ```bash
   git remote add origin https://github.com/YOUR-USERNAME/jkwedding.git
   git push -u origin main
   ```
3. Go to [vercel.com/new](https://vercel.com/new), sign in with GitHub,
   and import the `jkwedding` repository.
4. Leave every setting as it is — Vercel will spot it's a plain website
   and needs no build step. Click **Deploy**.

From then on, any change you push goes live in about thirty seconds.

---

## Step 3 — Connect jordanandkirsty.com

You'll need the domain registered first (the place you bought it from is
your "registrar" — GoDaddy, Namecheap, 123-reg and so on).

1. In Vercel, open your project → **Settings** → **Domains**
2. Type `jordanandkirsty.com` and click **Add**
3. Vercel shows you the DNS records it wants. It's usually:
   - an **A** record for `@` pointing at an IP address
   - a **CNAME** record for `www` pointing at a Vercel address

   **Use exactly what Vercel shows you on screen** — these values change
   from time to time, so don't copy them from here or anywhere else.
4. Log in to your registrar, find **DNS settings** (sometimes "Manage
   DNS" or "Advanced DNS"), and add those two records.
5. Go back to Vercel and wait. It checks automatically.

It usually works within an hour, but DNS can take up to 48 hours to
settle worldwide. Vercel sets up the padlock (HTTPS) on its own once the
domain is verified — nothing to do there.

---

## Adding your photos

Put your pictures in the `images/` folder with these exact names:

```
hero.jpg
gallery-1.jpg   gallery-2.jpg   gallery-3.jpg   gallery-4.jpg
gallery-5.jpg   gallery-6.jpg   gallery-7.jpg   gallery-8.jpg
```

They appear on the site straight away — nothing to edit. Until a photo
is there, that slot shows a striped placeholder, so you can add them a
few at a time without the site ever looking broken.

`images/README.md` lists which caption goes with which file.

**Shrink them first.** Photos from a phone are often 5–10MB each, which
would make the site slow on a hotel wifi connection. From a terminal in
this folder:

```bash
mogrify -resize 1600x1600\> -quality 82 images/*.jpg
```

That resizes anything bigger than 1600px and compresses it — usually
taking a 6MB photo down to around 300KB with no visible difference.
(You have ImageMagick installed already, so this will just work.)

> Back your originals up somewhere first — this changes the files in
> place.

---

## Changing things later

### Times, venues, dates and wording

All the words live in `index.html`. Open it in any text editor and search
for the bit you want to change. I've left comments marking the things
you said you'd fill in later:

| Search for this | What it changes |
|---|---|
| `EDIT: wedding date` | The date at the top of the page |
| `EDIT: venue` | The venue at the top of the page |
| `EDIT: day 1` | Welcome drinks — date, time, venue, dress |
| `EDIT: day 2` | The wedding day |
| `EDIT: day 3` | Recovery brunch |
| `EDIT: RSVP deadline` | The deadline (it appears twice) |
| `EDIT: paste the airport directions link` | "Directions from the airport →" |
| `EDIT: paste the hotel booking link` | "Book at the hotel →" |

For the two links, replace the `#` between the quotes:

```html
<a href="#" data-needs-link="hotel booking">Book at the hotel →</a>
```
becomes
```html
<a href="https://the-real-link-here.com">Book at the hotel →</a>
```

### The countdown

If the ceremony time changes, open `main.js` and edit:

```javascript
countdownTargetUTC: Date.UTC(2028, 4, 31, 12, 0, 0),
```

The numbers are: year, month, day, hour, minute, second — in **UTC**,
which is 2 hours behind Crete. So 3pm in Crete is 12:00 UTC. Months
count from zero, so `4` means May.

### The guest code

It's currently `finally`. To change it you must update two places or the
form will stop working:

1. In a terminal, turn your new code into a fingerprint:
   ```bash
   printf '%s' "yournewcode" | sha256sum
   ```
2. Copy the long string it prints into `main.js` → `guestCodeHash`
3. Put the plain new code into the Apps Script → `GUEST_CODE`
4. Redeploy the Apps Script (see the note at the end of Step 1)

Guests who already unlocked the site on their phone stay unlocked.

### Letting Google find the site

By default the site is hidden from search engines, which is usually what
you want for a wedding. If you'd rather it were findable, delete this
line near the top of `index.html`:

```html
<meta name="robots" content="noindex, nofollow">
```

---

## Seeing and exporting the replies

Open your *Wedding RSVPs* spreadsheet. One row per guest:

| Submitted | Last updated | Name | Email | Attending | Arriving | Leaving | Staying at hotel | Booking reference | Dietary requirements |

If a guest replies twice, their original row is **updated** rather than a
second one added — so the sheet always shows one row per person.
"Submitted" keeps their first reply date; "Last updated" shows the
latest.

**To export** — in the spreadsheet: **File → Download → Comma Separated
Values (.csv)**. That opens in Excel or Numbers and is the format most
hotels and caterers ask for.

**For the hotel**, they usually just want names and booking references.
Download the CSV and delete the columns they don't need, or use
**Data → Create a filter** to show only guests with a booking reference.

---

## If something goes wrong

**The form says "isn't connected yet"**
You haven't done Step 1.7 — `rsvpEndpoint` in `main.js` is still empty.

**The form says "Something went wrong sending that"**
1. Paste your `/exec` URL into a browser. If you don't see
   `{"ok":true...}`, the deployment isn't live — redo Step 1.6.
2. Check **Who has access** is set to **Anyone**, not "Anyone with a
   Google account". This is the most common mistake.

**Guests say the code doesn't work**
Check `GUEST_CODE` in the Apps Script matches the code on the
invitations. Capital letters and spaces don't matter — `Finally` and
`  finally  ` both work.

**Replies arrive but no confirmation emails**
Gmail allows 100 emails a day from a script. If you're under that, open
the Apps Script editor and click **Executions** in the left sidebar to
see the error.

**A photo isn't showing**
Check the file name matches exactly, including `.jpg` and all lower
case. `Hero.JPG` won't work; `hero.jpg` will.

**I changed something and the live site looks the same**
If you used Option A, run `npx vercel --prod` again. If you used Option
B, commit and push your change. Then do a hard refresh in your browser
(Ctrl+Shift+R).
