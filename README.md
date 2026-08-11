# Wake & Study Stopwatch — PWA

## GitHub upload structure

Upload these items to the repository root:

    index.html
    manifest.webmanifest
    sw.js
    icons/
      icon-192.png
      icon-512.png

The main file is now **index.html**.

The existing stopwatch HTML/design and timer logic are retained; only the PWA manifest/service-worker connection was added.

## GitHub Pages

Enable GitHub Pages for the repository and open the HTTPS Pages URL.

Android:
Chrome → menu → Install app / Add to Home screen

iPhone/iPad:
Safari → Share → Add to Home Screen

The PWA requires HTTPS for service-worker installation (GitHub Pages provides HTTPS).
