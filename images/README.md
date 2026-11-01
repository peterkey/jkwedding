# Your photos go here

Drop your pictures into this folder using these exact names. The website
picks them up automatically — there's no code to change.

| File name       | Where it appears on the site |
|-----------------|------------------------------|
| `hero.jpg`      | The big arch photo at the top |
| `gallery-1.jpg` | How we met |
| `gallery-2.jpg` | First holiday |
| `gallery-3.jpg` | The proposal |
| `gallery-4.jpg` | Friends |
| `gallery-5.jpg` | Family |
| `gallery-6.jpg` | A favourite |
| `gallery-7.jpg` | Home |
| `gallery-8.jpg` | Just because |
| `gallery-9.jpg` … `gallery-13.jpg` | More gallery photos |

Until a file is here, that slot shows a striped placeholder with its caption.
So you can add photos a few at a time — the site never looks broken.

**A few tips**

- `hero.jpg` is tall and thin (portrait). Aim for roughly 3:4 — taller than wide.
- The gallery is a masonry layout, so photos keep their own shape and are
  never cropped. Any orientation works.
- To add more than 13, copy a `<figure class="masonry__item">` in
  `index.html` and set its `width`/`height` to the photo's pixel size.
- Straight off your phone is fine. See "Adding your photos" in `SETUP.md`
  for a one-line command that shrinks them so the site stays fast.

`shell.png` and `wave.png` are the scallop shell and wave flourish from the
save-the-date card. They're part of the design, so leave them in place.
