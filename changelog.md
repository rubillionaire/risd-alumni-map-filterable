# Changelog

## 1.0.0 - 2014-08-09

### Added

- Type into the text input field to filter markers by `Title` and/or `Industry Sector`.
- Click the read out below the text input field to zoom to the extents of the points remaining on the map.
- Updating `location.hash` to reflect map position, and current filter query string.

### Deprecated

- Nothing.

### Removed

- L.Hash was removed in favor of the current `src/hash.js` function. Its is basically the same thing as L.Hash, but includes the 4th hash parameter, the query string currently being used.

### Fixed

- Nothing.