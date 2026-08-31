# Rongmei Hymnal

Rongmei Hymnal is a searchable digital library of Rongmei gospel songbooks, created for worship, learning, and community singing. Each collection keeps its own identity, credits, sources, and rights information.

## Features

- Search across all available songbooks.
- Read songs in a focused, adjustable layout.
- Save favorites and reading history per book.
- Use presentation mode for group singing.
- Install the app and access local collections offline.

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
