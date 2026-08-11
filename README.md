# Wake & Study Stopwatch — GitHub Pages PWA

## Upload this folder to your GitHub repository

Keep this exact structure:

    Stopwatch.html
    manifest.webmanifest
    sw.js
    icons/
      icon-192.png
      icon-512.png

## Important

The main HTML file is intentionally named `Stopwatch.html`.

Do not rename it to `index.html`.

The PWA manifest already points to:

    ./Stopwatch.html

## GitHub Pages

1. Upload all files/folders from this ZIP to the repository.
2. Commit the changes.
3. Enable GitHub Pages for the repository if it is not already enabled.
4. Open the GitHub Pages HTTPS address.
5. Android: Chrome menu → Install app / Add to Home screen.
6. iPhone/iPad: Safari Share → Add to Home Screen.

## If you later replace Stopwatch.html

Keep the filename exactly:

    Stopwatch.html

The manifest and service worker do not need to be renamed.

## PWA files

- manifest.webmanifest = install/app metadata
- sw.js = offline cache/service worker
- icons/ = app icons
