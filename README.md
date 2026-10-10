# Blox ID Vault

A tiny, dependency-free website that helps Roblox players and developers **find, copy and use
animation IDs and sound (audio) IDs**.

- 🔎 Search the whole library by name, ID or tag
- 📋 One-click copy on every ID
- ⭐ Save favourites locally (no account, no backend)
- 🔗 **ID Extractor** — paste any Roblox link / `rbxassetid://` string and pull the ID out
- 📚 Includes default character animations (R15 + R6), the 2023 "R15 migrated" set, default
  emotes, popular catalog emotes, and a curated set of music, meme and sound-effect audio IDs
- 🌙 Dark, responsive, mobile-friendly
- 🚫 No build step, no frameworks, no tracking

## What's inside

| File | Purpose |
| --- | --- |
| `index.html` | The page |
| `styles.css` | Styling |
| `app.js` | Search, filtering, copy, favourites, extractor |
| `data.js` | The ID library (edit this to add your own) |
| `.nojekyll` | Tells GitHub Pages to serve files as-is |

## Deploy it

### GitHub Pages (free, 2 minutes)

1. Push this repo to GitHub (already done if you're reading this from the repo).
2. Go to **Settings → Pages**.
3. Under **Build and deployment → Source**, choose **Deploy from a branch**.
4. Pick branch **`main`** and folder **`/ (root)`**, then **Save**.
5. Wait ~1 minute. Your site is live at `https://<your-username>.github.io/<repo-name>/`.

### Netlify / Cloudflare Pages / Vercel

Because it's a static site, just connect the repo and set:

- **Build command:** *(leave empty)*
- **Publish / output directory:** `/` (the repo root)

### Run it locally

Open `index.html` directly in a browser, or serve the folder:

```bash
python3 -m http.server 8080
# then visit http://localhost:8080
```

## Adding your own IDs

Open `data.js` and add an entry to the `ANIMATIONS` or `SOUNDS` array:

```js
{ name: "My Dance", id: "1234567890", category: "Catalog Emotes", tags: ["dance", "custom"] },
```

The category you use automatically becomes a filter chip. Save and refresh — that's it.

## A note on accuracy

- **Animation IDs** for the default characters and the built-in/catalog emotes are stable and
  come from Roblox's own default `Animate` script and Roblox creator documentation.
- **Sound IDs** point at public audio assets. Since Roblox's **2022 audio privacy update**,
  uploaded audio can be made private, removed, or blocked per-experience, so a valid ID may
  still be silent in a specific game. Treat every sound ID as a candidate and test it in-game.
  If one doesn't play, it's almost always a permissions/moderation issue, not a typo.

## Disclaimer

Independent fan tool. Not affiliated with or endorsed by Roblox Corporation. All IDs reference
assets hosted by Roblox; rights belong to their respective owners.

## License

MIT — see `LICENSE`.
