# acewebsites

Static site for ACE Websites.

## Local preview

Open `index.html` in a browser, or run:

```
python3 -m http.server 8000
```

## GitHub Pages

1. Push to `main`.
2. Repo → Settings → Pages → Source: `Deploy from a branch` → Branch: `main` / `/ (root)`.
3. Site appears at `https://the-guy-who-codes-ace.github.io/acewebsites/`.

## Adding a showcase entry

In `index.html`, replace a card in the `#work` section:

```html
<article class="showcase-item">
  <div class="thumb"><img src="images/project.jpg" alt="Project name"></div>
  <div class="meta">
    <h3>Project name</h3>
    <p class="muted">One-line description · 2026</p>
  </div>
</article>
```

Add `object-fit: cover; width: 100%; display: block;` to `.thumb img` in `styles.css` if using screenshots.
