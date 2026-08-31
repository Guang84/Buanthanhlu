# Rongmei Hymnal

Rongmei Hymnal is a searchable digital library of Rongmei gospel songbooks, created for worship, learning, and community singing. Each collection keeps its own identity, credits, sources, and rights information.
- *Link* : https://guang84.github.io/RongmeiHymnal/
## Upgraded offline-first version

The current release is an installable Progressive Web App (PWA) designed for phones, tablets, and computers. It adds explicit full-library downloads, persistent device storage where the browser permits it, installation-ready PNG icons, storage and download status, and light and dark presentation modes. The home-page brand now uses the application icon.

## Features

- Search across all available songbooks.
- Browse 1,271 songs in three collections: Buanthanhlu, Hymdaihlu, and a 36-song public-domain English VBS songbook.

## Hymdaihlu import

The Hymdaihlu collection contains 930 songs extracted from the supplied `hymnal_1_2_3.db` SQLite database. Run `python3 tools/extract_hymdaihlu.py` to regenerate its formatted JSON. The importer uses `RongmeiIndexes.Title` rather than the English `Hymns.Title`, retains alternate Rongmei index entries for search, removes fixed-width padding, converts HTML breaks and entities, repairs known legacy punctuation encoding, and preserves musical metadata. Type-1 catalog numbers follow Rongmei `PageNo`; the duplicate source record is isolated at 730, followed by type-2 songs at 731–930.
- Read songs in a focused, adjustable layout.
- Save favorites and reading history per book.
- Use large-screen presentation mode in either light or dark theme; exit with the on-screen control or `Escape`.
- Install the app on a phone or computer.
- Download or update the complete library for offline reading and search.
- Keep favorites, history, and reading preferences in on-device storage.

## Install and offline use

Serve the site over HTTPS in production. Open it in a supported mobile browser, use **Install app** (or the browser's Add to Home Screen command), then choose **Download for offline**. The app requests persistent browser storage when available and shows download progress, status, and current storage usage. Downloaded library data can be refreshed or removed from the home page.

The app shell remains cached for reliable startup. **Download for offline** separately saves registered local songbook metadata and song data. Browser storage remains managed by the operating system, so available quota and persistence support vary by device. Cross-origin song sources require CORS and are not guaranteed to be available offline.

Whenever the app opens online or reconnects, it immediately checks for a newer app version and refreshes songbooks, song data, metadata, and covers from the source. Changed library content is saved into the offline download and the page reloads automatically; unchanged content does not trigger a reload.

## VBS Songs

The English **VBS Songs** collection contains 36 classic children’s hymns, traditional spirituals, and adult congregational hymns selected for Vacation Bible School, Sunday school, and mixed-age worship. The edition avoids modern copyrighted VBS lyrics and arrangements. Individual records include public-domain or traditional-text verification notes; recordings and modern arrangements may still carry separate rights.

## Run locally

```sh
python3 -m http.server 8000
```

Open <http://localhost:8000>.

## Validation

```sh
python3 tools/build_book_index.py
python3 tools/validator/validate.py
```

## Documentation

See [Project Documentation](docs/PROJECT_DOCUMENTATION.md) for the architecture, songbook data format, publishing workflow, validation rules, and offline behavior.

## Rights

The MIT License applies to the project software, interface, tools, and documentation only. Song lyrics, editions, arrangements, cover art, and other content remain subject to their respective owners' rights. See [LICENSE](LICENSE) and the [Usage Policy](policy.html).
