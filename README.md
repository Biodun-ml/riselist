# Riselist website

Static marketing site for **Riselist** (getriselist.com): hand-checked shortlists of rising TikTok creators for brands.

- Plain HTML, CSS and vanilla JavaScript. No build step, no tracking, no cookies.
- Published automatically to GitHub Pages on every push to `main` (see `.github/workflows/pages.yml`).
- Custom domain is set in `CNAME`.

## Pages

| File | What it is |
| --- | --- |
| `index.html` | Home page: story, live demo (sample data), pricing, booking |
| `creators.html` | For creators: what we hold, how to claim, correct or remove it |
| `privacy.html`, `terms.html`, `outreach-rules.html`, `cookies.html` | Policies |
| `404.html` | Not-found page |

`assets/creators.json` is **synthetic sample data** used only by the home-page demo. No real creators.

## Working locally

```
python3 -m http.server 8088
```
then open http://localhost:8088/.
