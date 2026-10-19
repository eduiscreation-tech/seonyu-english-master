# Seonyu English Master — public app shell

This repository contains **only the generic learning application**. It does not include book scans, copyrighted textbook paragraphs, model sentences, Korean translations, or student learning records.

## Deploy with GitHub Pages

1. Create a **new public repository** for the app. Do not reuse a repository that contains unrelated work.
2. Upload these public files at repository root: `index.html`, `app.js`, `bootstrap.js`, `style.css`, `manifest.webmanifest`, `icon.svg`, `sw.js`, `.nojekyll`.
3. GitHub → **Settings → Pages** → **Build and deployment** → **Deploy from a branch** → branch `main`, folder `/ (root)` → Save.
4. Once published, open `https://<github-username>.github.io/<repo-name>/` on both devices. GitHub Pages site is **public**; the default GitHub Pages setup does not provide password protection.
5. On **each device**, import the personal JSON file provided separately and *never* commit/upload that JSON to GitHub or share it via public links. It is stored in your browser's localStorage.
6. If you used an older `file://`/`content://` app, export the old learning-record backup from that app's Settings, then import it on the HTTPS site. Browser origins do not share localStorage.

## Privacy and limitations

- Imported textbook-based learning data stays only on the local browser; no app backend or server sync is present.
- The student can use the same URL on Android and Windows, but **progress is not automatically synchronized** between devices. Use Settings → backup/restore to move records manually.
- Browser data can be cleared; back up regularly. Android speech voice quality and speech recognition must be tested on a physical tablet.
- Add your own licensed or original study material before making this site available to other people. Do not upload private learning data to the repository.
- Updating the public application code won't delete imported personal lesson data unless the user clears browser storage or changes the site origin.