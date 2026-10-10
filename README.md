# Blox ID Vault

A premium, technical reference site for **Roblox animation IDs** and **sound (audio) IDs**.
Static, dependency-free, and ready to deploy on Render (or GitHub Pages / Netlify / Cloudflare Pages).

## What it does

The site is organised into **two main sections**:

1. **Animation IDs** — default character locomotion (R15, R6, and the 2023 R15-migrated set),
   built-in emotes, and popular catalog emotes.
2. **Sound IDs** — audio asset IDs for music, memes, sound effects, ambient loops and UI.

Each section has its own search, category filter chips, sort (featured / name / ID / category),
a favourites filter, and a live count. Every ID has one-click copy.

Also included:

- **ID Extractor** — paste any Roblox link, `rbxassetid://` string, or raw number to pull out the ID.
- **Guide** — copy-paste Luau snippets for animations and audio.
- Favourites saved locally (no account, no backend, no tracking).
- Press `/` anywhere to jump to search.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Page structure (hero, two sections, extractor, guide) |
| `styles.css` | Styling |
| `app.js` | Reusable per-section library component, extractor, favourites |
| `data.js` | The ID data — edit this to add your own IDs |
| `.nojekyll` | Tells GitHub Pages to serve files as-is |

## Deploy on Render

This is a **fully static site** — no build step, no server, no environment variables. So on Render
you create it as a **Static Site**, not a Web Service.

1. Render dashboard → **New +** → **Static Site**.
2. Connect the **`roblox-id-vault`** GitHub repo.
3. Settings:
   - **Branch:** `main`
   - **Build Command:** *leave empty* (there is nothing to build)
   - **Publish Directory:** `.` (the repo root — that's where `index.html` lives)
4. **Create Static Site**. Render serves it at `https://<name>.onrender.com`.

> If Render insists on a build command, you can leave it blank or set it to `echo static`.
> Do **not** deploy it as a Web Service — a Web Service expects a long-running process
> (`npm start`, etc.) and this project has none.

### Also works on

- **GitHub Pages:** Settings → Pages → Deploy from branch → `main` / root.
- **Netlify / Cloudflare Pages / Vercel:** empty build command, publish directory = repo root.

### Run locally

```bash
python3 -m http.server 8080
# visit http://localhost:8080
```

## Adding your own IDs

Open `data.js` and append to the `ANIMATIONS` or `SOUNDS` array:

```js
{ name: "My Dance", id: "1234567890", category: "Catalog Emotes", tags: ["dance", "custom"] },
```

Whatever `category` you use automatically becomes a filter chip in that section. Save and refresh.

## Accuracy notes

- **Animation IDs** for the default characters and built-in/catalog emotes are stable and come from
  Roblox's default `Animate` script and Roblox creator documentation.
- **Sound IDs** point at public audio assets. Since Roblox's **2022 audio privacy update**, uploaded
  audio can be made private, removed, or blocked per-experience, so a valid ID may still be silent in
  a specific game. Treat every sound ID as a candidate and test it in-game.

## Disclaimer

Independent fan tool. Not affiliated with or endorsed by Roblox Corporation. All IDs reference
assets hosted by Roblox; rights belong to their respective owners.

## License

MIT — see `LICENSE`.
