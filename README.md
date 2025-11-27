# Ultimate 3D Bohr Model Simulation — Demo

This is a small demo showing a 3D Bohr-style atom viewer using Three.js. It includes a minimal periodic table UI and controls to change speed, toggle shells, and scale the nucleus.

Run locally:

1. From the project root start a simple HTTP server (browsers block module imports from file://):

```powershell
# using Python (Windows PowerShell)
python -m http.server 8000

# or with Node (http-server)
npx http-server -c-1 . -p 8000
```

2. Open `http://localhost:8000` in your browser.

Notes:
- This is a demo scaffold implementing core features: nucleus cluster, shells, electrons moving, element selection, and UI toggles.
- It is intentionally minimal; you can extend features: orbital clouds, emission animations, VR, etc.

Browser compatibility note:
- Some browsers do not support ES module JSON import assertions of the form `import data from './data.json' assert { type: 'json' }`.
- Using that syntax in an unsupported browser causes: `Uncaught SyntaxError: Unexpected identifier 'assert'`.
- This demo instead uses a small runtime loader (`src/data.js`) that fetches `data/elements.json` with `fetch()` for broader compatibility.
Compatibility/fallbacks:
- This project prefers modern ES module import workflows (import maps, bare specifiers like `three`). The page includes an `importmap` mapping `three` to a CDN.
- If the browser doesn't support import maps or bare module specifiers, the app falls back to loading UMD builds of THREE and OrbitControls and dynamically imports a legacy `src/atom.legacy.js` module that uses the global THREE object.
- To ensure best results, use a modern browser (recent Chrome, Edge, or Firefox). The fallback allows older browsers to still run the demo without import maps.

Files of interest:
- `index.html` — main UI
- `styles.css` — UI styles
- `src/atom.js` — Three.js atom viewer
- `src/main.js` — app wiring and UI bindings
- `data/elements.json` — element metadata (first 20 elements included)

If you'd like, I can:
- Add keyboard navigation: left/right arrows and n/p for next/prev, and `r` for random element. The UI already includes these keys in the demo (if the periodic table is loaded).
	- Wrap-around: next/prev loops from last to first.
	- Press Enter inside the `Atomic #` input to load the corresponding element.
	- Use the `Back` button to toggle show/hide of the periodic table while exploring elements.

Which feature should I add next?
