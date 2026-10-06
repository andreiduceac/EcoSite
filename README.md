# EcoSite

Preliminary renewable-energy site analysis using React, TypeScript, Vite, Tailwind, MapLibre GL JS, Terra Draw, Turf, Recharts and Vitest.

## Phase log

1. Scaffold + map: strict TypeScript build passes. Five geometry tests pass. MapLibre raster basemaps, Terra Draw polygon editing, Turf area/perimeter/centroid and validation. Submit-only Nominatim search with request spacing; no autocomplete.
2. Data layer: NASA climatology and daily endpoints returned HTTP 200 for 47.65 N, 26.25 E on 2026-10-06. Raw responses saved unchanged in `src/data`. Daily WD50M values were all invalid negative angles; these are rejected rather than repaired. Hourly endpoint verified and used as a fallback. Every service validates responses and returns typed errors.

Public app: https://ecosite.andreiduceac2111.chatgpt.site

Source repository: https://github.com/andreiduceac/EcoSite

## Setup

```sh
npm install
cp .env.example .env
npm run dev
npm test
npm run build
```

`VITE_MAPTILER_KEY` is an optional browser-safe key for satellite tiles. Restrict it to your domain. No NASA key is needed. `VITE_GOOGLE_MAPS_API_KEY` is reserved for a future MapProvider implementation; this release does not implement Google Maps. All sources are public browser-accessible services, with no secret keys and no Express proxy required.

## Recorded assumptions and decisions

- Standalone static app, publicly published with Sites after user authorization. Browser analysis state is session-local; no accounts or server database.
- Metric units, English and Romanian interfaces, Romania default view, northern-hemisphere orientation for Romania.
- Basemaps are geographic context, never suitability evidence. OSM for streets, Esri World Imagery fallback for satellite, OpenTopoMap for terrain. Visible attribution retained. Optional MapTiler satellite key is preferred for sustained use. Google documentation checked 2026-10-06: Drawing deprecated August 2025 and scheduled to be unavailable in May 2026. No dependency on it.
- Search is explicit submit, limited to five results and paced at least 1.1 seconds between requests. This deliberately meets Nominatim's prohibition on heavy autocomplete. Coordinates bypass the geocoder. No keystroke network searches or debounce are needed in submit-only mode.
- Geometry is user-drawn, hence its metrics are ESTIMATED (Turf calculations on unverified boundaries). NASA source products carry the requested MEASURED badge, meaning API-provided, including modeled gridded products; they are not on-site sensor observations.
- Antimeridian-crossing polygons are rejected with a split-boundary instruction. This avoids misleading area, centroid and bounding-box requests. Polygons with holes can be analyzed by pure geometry routines, but the draw UI creates a single exterior ring.
- NASA climatology represents 2001–2020, not the current year's forecast. Common non-leap-year month lengths are used for annual integration (365 days). NASA meteorology is about 0.5° × 0.625°, solar products can be coarser (~1°). All climate outputs are labeled “Regional estimate for the site centroid”.
- Coordinates are rounded to four decimals for API cache keys. Successful responses are cached for 24 hours in memory and browser session storage. Rate limits use capped exponential backoff and Retry-After (maximum 10 seconds, two retries). Other failures are shown and can be retried, never replaced with demo values.
- Demo Mode is isolated: fixed illustrative Suceava field boundary centered exactly on the captured coordinates. Boundary coordinates are a drawing example, not a cadastral survey. Demo climate is cached sample, captured 2026-10-06; demo elevation and OSM are not fetched and remain Not assessed. The DEMO DATA banner persists on the demo dashboard. No demo/live mixing.
- Daily wind requested for 2022–2024. Daily invalid directions cause rejection, then one-hourly-calendar-year requests are tried. Fewer successful years may be used, with the actual periods disclosed. If none succeeds, monthly direction is displayed, never a fabricated rose.

## Verified endpoint references

- Google Drawing status: https://developers.google.com/maps/documentation/javascript/drawinglayer
- NASA climatology: https://power.larc.nasa.gov/api/temporal/climatology/point
- NASA daily/hourly: https://power.larc.nasa.gov/api/temporal/daily/point and https://power.larc.nasa.gov/api/temporal/hourly/point (community RE). Daily docs allow 20 parameters per point; app requests only 2 for history and 7 for climatology. Hourly is split by calendar year to bound response size.
- NASA daily docs: https://power.larc.nasa.gov/docs/services/api/temporal/daily/
- Open-Meteo elevation: https://api.open-meteo.com/v1/elevation?latitude=47.65,47.651&longitude=26.25,26.251 returned elevations 377 and 380 m.
- Nominatim: https://nominatim.openstreetmap.org/search?q=Suceava&format=jsonv2&limit=5 returned real results.
- OSM tiles: https://tile.openstreetmap.org; policy https://operations.osmfoundation.org/policies/tiles/
- Esri service: https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer?f=pjson returned service metadata and required attribution. Terms reference https://goto.arcgisonline.com/maps/World_Imagery (public evaluation prototype, no tile scraping or offline cache).
- OpenTopoMap tile verified: https://a.tile.opentopomap.org/8/146/89.png ; attribution and CC-BY-SA https://opentopomap.org/about

## Disclaimer

EcoSite provides preliminary estimates based on publicly available data. It is for educational and planning purposes and is not professional engineering advice.

## Remaining phase log

3. Analysis: solar, wind, scoring and recommendation implemented as pure functions. Tests use hand-checked constant monthly resources, known Gamma values, power-curve bounds, and explicit weighted arithmetic.
4. Terrain + OSM: elevation sampled inside the boundary, relation segments joined into closed OSM polygons, overlap unions avoid double counting. Every failing service is excluded independently. A real Overpass road-geometry POST returned HTTP 200; subsequent combined queries sometimes returned 406/504 from the public service, and are not represented as successful assessments.
5. Dashboard: overview, solar, wind, environment, methodology tabs; only the specified Recharts charts; computed SVG tilt; actual score arithmetic; assumptions recalculate immediately. Suitability overlay is an actual raster generated from calculated slope cells, clipped to the boundary and rendered with nearest resampling. It never uses climate data to paint a spatial gradient.
6. Landing, responsive layouts, dark mode and error boundary implemented. Live-rendered landing preview uses the isolated cached sample and a DEMO DATA chip.

## Algorithms and planning assumptions

All planning constants are in `src/config`. Display controls limit inputs to sensible planning ranges; these are UI assumptions, not certified technology limits. Chart axes, step numbers, calendar dates, grid-resolution metadata and rubric bounds are labels; the data badges apply to the associated numerical result or chart as a whole.

### Solar

- Annual horizontal resource `H = Σ monthly daily irradiation × days in month`. Partial months do not receive substitute values; a complete year is required for resource scoring. Temperature may be absent while resource scoring remains available; production is then Not assessed.
- `tilt = 0.76 × |latitude| + 3.1°`, facing the equator. Source: Charles R. Landau, [Optimum Tilt of Solar Panels](https://www.solarpaneltilt.com/), fixed-tilt section, verified 2026-10-06. That correlation is validated for 25–50° latitude. The requested expression is retained at other latitudes with an explicit extrapolation warning. No tilt gain is applied to energy.
- Usable area = gross hectares × usable fraction. Default 70% usable land, 21% module efficiency, ground coverage ratio 0.4, 450 W modules and 14% system losses. Density = `10,000 × efficiency × GCR` kWp per usable hectare, assuming 1 kW/m² STC irradiance. Panel wattage changes module count only; the integer module count is floored and the capacity remains continuous conceptual capacity.
- Temperature derate = irradiation-weighted `max(T2M − 25°C, 0) × 0.004/°C`. `PR = max(0, 1 − system losses − temperature derate)`. Monthly ambient T2M is a deliberately simple proxy; cell temperatures can be higher and this model can overestimate yield. Cell thermal, spectral, snow, shading, availability and degradation models are excluded.
- `E = capacity kWp × H × PR` kWh/year. GWh = kWh/1,000,000. Yield per hectare uses gross selected area, not usable area. H is horizontal irradiation interpreted as peak-sun-hours at 1 kW/m² STC.
- Solar score = clamped linear map of H from 900–2,000 to 0–100, less `min(10, max(0, (max/min monthly irradiation − 2) × 1.5))`. A zero minimum gets the maximum seasonal penalty. Resource scores are ESTIMATED because thresholds are planning assumptions, even though intermediate resource integration is CALCULATED.
- UI ranges: efficiency 10–30%, module 200–700 W, usable land 10–100%, GCR 0.1–0.8, losses 0–40%.

### Wind

- Climatology mean at 50 m is weighted by calendar days. Extrapolation: `v_h = v_50 × (h/50)^α`. Defaults: hub 100 m and shear 0.14. Terrain roughness and atmospheric stability are not fitted. Wind score = clamped linear map of mean hub speed from 4–8 m/s to 0–100.
- A rose needs at least 100 valid speed/direction pairs. The saved field sample uses 26,304 real hourly observations from 2022–2024; daily directions were invalid. Direction bins have 22.5° widths centered on compass sectors. Frequency is observation count / total; prevailing is highest frequency, energy-weighted prevailing is the largest sum of speed³, an energy-density proxy.
- Weibull fit uses the empirical moment approximation `k ≈ (σ/μ)^−1.086`, clamped 1–5, `c = μ / Γ(1 + 1/k)`. Gamma uses a Lanczos approximation. This fit is approximate rather than maximum likelihood; data aggregations and temporal correlations can bias yield.
- CF integrates a normalized generic curve over fitted Weibull probability bins of 0.1 m/s. Cut-in 3 m/s, cubic increase to rated at 12 m/s, rated to cut-out 25 m/s; zero outside. Hourly distribution uses the history period's hub-height speeds; mean-speed suitability uses the 2001–2020 climatology. Their periods differ and are disclosed. Rated capacity is an independent conceptual assumption, not a manufacturer-certified power curve.
- If history is absent, mean-speed-band CF estimates are 5%, 12%, 20%, 28%, 36%, 44% for <4, <5, <6, <7, <8, ≥8 m/s respectively. No directional rose or layout is fabricated.
- Default rotor 100 m, rated turbine 3 MW, setback 100 m. Lattice spacing 5D crosswind × 8D downwind is rotated to the most frequent wind sector. Candidate centers are inside a Turf inward buffer. Rotor radius, individual building/ecological setbacks, access roads, wake losses, slope exclusion, economics and optimization are not modeled. The lattice starts at the southwest bounding-box corner and therefore is illustrative, not a packing maximum. Turbines are not proposed below wind score 50 or area 25 ha. If the buffer empties or spacing admits no center, count is zero. With missing direction, layout and annual wind generation are Not assessed.
- Annual conceptual wind generation = count × rated MW × 8,760 h × CF / 1,000 GWh. Leap years are ignored for this conceptual yearly output.
- UI ranges: hub 50–200 m, shear 0.05–0.4, rotor 50–200 m, capacity 0.5–10 MW, setback 0–500 m.

### Terrain, constraints and infrastructure

- Open-Meteo [elevation documentation](https://open-meteo.com/en/docs/elevation-api) verifies Copernicus GLO-90 (~90 m native resolution) and a maximum 100 coordinate pairs per batch. At most a 9×9 lattice is used with uniform meter spacing `max(90, max bounding-box dimension / 8)`. Only points inside the polygon are requested. Narrow/very small boundaries can have insufficient neighboring samples and remain Not assessed.
- Finite differences use measured horizontal neighbor distances and elevation differences; one-sided differences are used at edges. Slope = atan(hypot(dz/dx, dz/dy)); downhill aspect from the gradient. Slope cells are clipped to the polygon. Mean slope and aspect favor are weighted by assessed cell area; percentage under 10° refers to assessed cell area. Actual boundary coverage is disclosed. Unassessed gaps stay transparent on the raster. Raster export pixel density is a rendering detail, not improved measurement resolution.
- Flat slopes below 1° have neutral favorable aspect. Otherwise aspect favor is `(1 + cos(aspect − equator-facing bearing))/2`. Terrain score = 80% of linear slope suitability (0°→100, 30°→0) + 20% aspect favor. Mean elevation averages the API samples.
- OSM query uses a bounding box around a 5 km Turf buffer; buildings use the site bounding box to limit response size. Public Overpass queries use a 25 s server timeout and 45 s client timeout. Roads exclude footways, paths, steps, pedestrian ways, cycleways and bridleways. Power line, minor_line and substation tags are queried. Relations are reconstructed from geometry segments and holes; incomplete constraints exclude the environmental score. Overpass timeout remarks invalidate the whole response, rather than treating partial results as complete.
- Environmental base 100, protected intersection (including touching) −75 and hard flag, water overlap fraction ×50, forest overlap fraction ×30; annual precipitation above 1,500 mm −10. Buildings are disclosed but no bespoke building penalty/setback is assumed. OSM overlap categories are unioned before area calculation. A successful empty mapping means “No mapped overlap found”, never legal clearance. Missing precipitation omits its penalty with the missing metric disclosed.
- Infrastructure distances are straight-line distances from centroid to nearest mapped feature geometry. Thresholds: road 5 km, power line 10 km, substation 15 km. Each proximity score is `clamp((1 − distance/threshold) ×100)`. Their available scores are averaged equally. Features absent in the 5 km buffer remain Not assessed and are excluded, not assumed to be at zero distance or guaranteed absent in reality. Line/substation capacity is unknown.
- ESA WorldCover/CORINE point sampling and Natura 2000 were not integrated: no suitably verified, browser-friendly unauthenticated service was adopted. UI states Not assessed, and only mapped OSM forests/water/protected areas are evaluated. No exhaustive biodiversity or land-use classification is claimed. PVGIS is optional and omitted.

### Overall and recommendation

- Default weights: solar 40, wind 25, environment 15, terrain 10, infrastructure 10. For available weights sum W, applied weight_i = weight_i / W. Score = Σ score_i × applied weight_i. No components means Not assessed. Rounded display arithmetic may differ in its last digit; calculation uses full precision.
- LOW_SUITABILITY if overall <40 or any hard environmental flag. SOLAR_PLUS_WIND if both resource scores ≥60 and gap ≤15. Otherwise the higher available resource score wins (ties choose solar). If only one resource is available, its recommendation is explicitly provisional; if neither is available no technology is chosen. Reasons and “Why not” text are generated from actual metrics.

## Fixture provenance and isolation

- The **actual demo field** is centered on 47.665 N, 26.205 E west of Suceava; it was visually checked in the satellite view. An illustrative rectangular boundary extends ±0.0015° latitude and ±0.0025° longitude. It is not a surveyed parcel and can include non-field features.
- `field-climate.json` and `field-hourly-2022/2023/2024.json` are raw NASA responses fetched for exactly that field centroid on 2026-10-06. They are serialized without editing API values. Dates are capture metadata, not invented climate numbers.
- `suceava-climate.json`, `suceava-daily.json`, and original hourly captures retain endpoint verification for the brief's explicit 47.65 N, 26.25 E test coordinate. `npm run verify:data -- --cached` prints the real captured climatology at that coordinate; `npm run verify:data` requests it again live, and `--capture` intentionally refreshes only that verification fixture.
- No live API services are called by the demo pipeline. Basemap tiles are live visual context only; the demo banner says “No live analysis sources”. Live mode never imports fixture results for analysis, even if a source is offline. Switching modes clears the selected site and prior assessment; source results are also keyed to the exact polygon to avoid stale results after edits.
- API MEASURED means source-provided, including modeled/climatological products. User boundary calculations, technology output and threshold scores are ESTIMATED. Intermediate API transformations and wind-direction frequencies are CALCULATED.

## Map provider and licensing

The `MapProvider` interface encapsulates drawing, geometry updates, centering, turbine markers, slope raster and basemap switching. No Google implementation is bundled; its key is only reserved for a future adapter.

Esri World Imagery is used as a no-key **noncommercial educational prototype** fallback, keeping its attribution. [Esri terms §2.2](https://www.esri.com/en-us/legal/terms/web-site-service) permits attributed noncommercial internal/external use; commercial use requires the appropriate license. No tile downloading, scraping or redistribution is implemented. Configuring MapTiler with an appropriate satellite-plan browser key is supported; no MapTiler endpoint could be live-tested without a supplied key. OpenStreetMap and OpenTopoMap attribution remains visible. Open-Meteo and Copernicus attribution appears on the terrain panel. Geocoder requests follow submit-only use; no speculative queries.

## Architecture

- UI never calls `fetch`. Services own requests, typed result parsing, cache and backoff.
- Pure `analysis/` functions consume typed inputs and never perform I/O. UI controls trigger new evaluations of stored raw inputs, rather than fetching again.
- `useAnalysis` executes climate/history → elevation → OSM → scoring and marks each real stage complete/unavailable. Demo steps use fixture loading and exclusions rather than simulated timers.
- Routes: `/` landing, `/analyze` live selection, `/analyze?demo=1` isolated sample.
- All TypeScript is strict with no `any`. Service JSON is `unknown` until guarded. Browser rendering has a top-level error boundary. Theme preference is stored locally, no tracking/analytics.
- Client code is split into map, drawing, geometry, chart and lazy fixture chunks. MapLibre and unmodified multiyear fixtures are substantial downloads; the bundle warning threshold reflects their verified size, not tiny invented fixtures.
- `scripts/browser-check.cjs` and `browser-failures.cjs` are session QA scripts using this environment's preinstalled Chromium/Playwright paths. They are not required for end-user setup or `npm test`; for other environments supply your own Playwright/browser installation.

## Final verification

Completed `npm install`, `npx tsc --noEmit`, `npm test` (26 passing unit tests), `npm run build`, and `npm run dev` (Vite served successfully on port 5173). Builds passed at every completed phase. Browser QA used the installed Chromium in desktop, mobile and dark modes; no page errors or horizontal mobile overflow were observed. Verified draw/edit/delete, valid/invalid coordinate search, real Nominatim submit search (HTTP 200), solar input recalculation, the 16-sector cached rose, actual score arithmetic, and clearing demo results when switching to live mode. Simulated failures of all analysis sources produced five missing components, a Not assessed overall score, individual reasons and no fixture substitution. Unit tests verified 429 backoff and typed network failures.

Live NASA verification printed Suceava January irradiation 1.1878 kWh/m²/day, annual average daily irradiation 3.5309 kWh/m²/day, annual WS50M 4.57 m/s, annual T2M 9.05°C. In this managed proxy environment the command is `NODE_USE_ENV_PROXY=1 npm run verify:data` with Node 24; plain Node fetch does not inherit the proxy by default. Browser services and Python fixture captures successfully used the configured network path. `--cached` works without networking.

Known deviations/verification limits: submit-only search replaces autocomplete/debounce to respect Nominatim policy; Google is an interface extension point, not a shipped adapter; WorldCover/CORINE, Natura 2000 and optional PVGIS are Not assessed/not integrated; no keyed MapTiler test was possible. Public Overpass availability is intermittent (verified road-geometry success and subsequent overloaded errors), so environmental and infrastructure assessments may be excluded in a live run. Demo terrain/OSM were deliberately left unavailable, not invented. The Sites source helper is not installed in this selected execution environment; source synchronization and the deployment archive are prepared directly from the same Git commit instead.

A final **live browser service check** at the field centroid returned NASA climate successfully and 20 real elevation samples at 90 m spacing. Calculated mean slope was 5.5879°, with 94.2235% assessed boundary coverage. Overpass returned HTTP 504 in that run, which became a typed network error rather than fabricated environmental/infrastructure results. NASA hourly documentation permits 15 parameters per point; this app requests two and voluntarily bounds requests to one calendar year each (no unverified temporal-size limit is asserted). Static publication includes a standard SPA `_redirects` file for direct route links.

## Languages and GitHub source publication

- English is the default. The header language selector supports English and Română, with the choice remembered in local browser storage (`ecosite-language`). No browser language inference or network translation is used. Switching preserves the boundary, results, chart data and adjustable assumptions.
- The shared `src/i18n` layer translates visible interface copy, data badges, validation and service errors, generated recommendations, chart labels, source notes and the disclaimer. Original scientific parameter identifiers, brand names, legal map attribution and unknown external API details are retained.
- Numbers use `en-GB` or `ro-RO` presentation conventions. Number input controls preserve browser-native parsing. Analysis functions, request parameters, raw NASA fixtures, units and machine-readable provenance types are unchanged. Dynamic recommendations translate at the presentation boundary and retain their actual numerical values.
- GitHub publication assumes a public personal repository named `ecosite` under the authenticated account, matching the user's request to publish the source. Local secrets, dependencies, build output and deployment credentials are excluded. GitHub source publication does not by itself enable GitHub Pages; the live application remains on Sites.

Multilingual verification: 30 unit tests passed, including Romanian generated recommendations, missing-data messages and locale formatting. Strict TypeScript and production build passed. Browser checks verified switching without resetting production assumptions, all dashboard tabs, the 16 translated compass sectors, remembered language after reload, translated coordinate validation, dark mode, and 390 px mobile layouts with no page errors or horizontal overflow.

To clone the public source:

```sh
git clone https://github.com/andreiduceac/EcoSite.git
cd EcoSite
npm install
npm run dev
```
