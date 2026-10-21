# STYLE SWAP

Japanese buildless browser calculator. Enter male height and weight to display an image-based cup equivalent and fictional B/W/H dimensions for a 160 cm woman.

- `dist/index.html`, `style.css`, `app.mjs`: interface and client interactions.
- `dist/model.mjs`: both reference-image mappings and the documented creative model.
- `node --test tests/model.test.mjs`: boundary, weight, range and validation checks.
- `python3 -m http.server 4173 --directory dist --bind 127.0.0.1`: local preview.

The source images only supply height-to-cup correspondences. B/W/H values are fictional estimates, not measured or statistically inferred equivalents. At BMI 22, the creative baseline is underbust 72 / waist 64 / hip 90 cm, scaled by sqrt(BMI/22). Bust adds the selected cup difference to underbust. Image 2 ranges are preserved. Inputs are processed in the browser; no input storage or analytics are included.
