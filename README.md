# STYLE SWAP

Japanese buildless browser calculator. Enter male height and weight to display an image-based cup equivalent and fictional B/W/H dimensions for a 160 cm woman.

- `dist/index.html`, `style.css`, `app.mjs`: interface and client interactions.
- `dist/model.mjs`: both reference-image mappings and the documented creative model.
- `node --test tests/*.test.mjs`: boundary, weight, range and validation checks.
- `python3 -m http.server 4173 --directory dist --bind 127.0.0.1`: local preview.

The source images only supply height-to-cup correspondences. B/W/H values are fictional estimates. The user-defined reference male weight is height minus 110 kg. At that weight the fictional 160 cm female baseline is underbust 72 / waist 64 / hip 90 cm. Let d = abs(weight - referenceWeight) / referenceWeight and p = d / (1 + d). Below reference, U/W/H = 72-16p / 64+36p / 90-24p; above reference, U/W/H = 72+40p / 64+64p / 90+40p. Both sides progressively increase waist-to-hip ratio as deviation grows. This is a creative rule, not a health or attractiveness assessment. Cup depends only on height; BMI is informational. Inputs are processed in the browser; no input storage or analytics are included.

## Celebrity references

Thirty-two adult female talents have public B/W/H records, local portraits and separate photo/measurement source links. Thirty actresses, models and gravure talents are registered. Result candidates always include the nearest 15 registered people: 5 featured and 10 additional references. The complete catalog is a separate, initially collapsed section. Two comedians appear in a clearly separate section. Historical values are explicitly labeled. `dist/celebrities.mjs` keeps the candidate data; `dist/assets/portraits/sources.json` records original photo URLs. Cup sizes are displayed only with their own public-source URL and historical context; unavailable values are explicitly marked unverified. No cup sizes are inferred. The comparison prioritizes candidates within the close-match limits, then sorts by the largest B/W/H absolute gap and uses mean gap as a tie-breaker and includes out-of-threshold people as explicitly labeled approximate references. Bust ranges use distance to the interval. A candidate is marked close only if mean difference <= 3 cm and each difference <= 5 cm; otherwise the UI calls it a comparison reference and explains the gap. Every card displays individual B/W/H gaps and the largest gap. The page states how many people actually meet the close-match limits; the full catalog is independent of result matches. These examples do not imply matching appearance or present-day measurements.

## Page flow

`index.html` and `app.mjs` contain the input form. Submitting valid input displays a one-second loading overlay, then navigates to `result.html`. `result.mjs` renders the dimensions and photo comparisons. The three inputs travel in a URL fragment (not a server query), with no storage or third-party submission. Return links preserve all inputs and the selected reference table. Browser Back resets the loading overlay. Reloading the result preserves it; opening the result without valid inputs shows a recovery link. `navigation.mjs` validates both routes.
