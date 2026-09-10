# Survey Reader

A standalone, dependency-free static reader for mobile survey itineraries. It is designed to be deployed at:

`https://walkcat.net/tools/survey-reader/`

The planner compresses and AES-encrypts each calculated route, then stores only the ciphertext in the self-hosted route gateway for 30 days. Shared URLs use `/tools/survey-reader/{route-id}#key=…`; the reader downloads the encrypted route and decrypts it locally. Legacy `#route=` links remain supported.

## Local preview

The parent survey planner serves this exact folder at:

`http://127.0.0.1:5050/survey-reader/`

Opening the reader without a route is expected to show the missing-route screen. Generate a link from a feasible route in the planner to preview real data.

You can also serve this directory with any static HTTP server. ES modules do not run reliably when the HTML file is opened directly with a `file://` URL.

## GitHub Pages deployment

Create a repository named `survey-reader` under the `wolketich` GitHub account, then make this directory the repository root. Push to `main` and enable GitHub Pages with **GitHub Actions** as the source. The included workflow publishes the static files.

All paths are relative, so the app works under the `/survey-reader/` project path without a build step.

## Data and privacy

The gateway does not receive readable customer data. The random AES key stays in the URL fragment, which browsers do not send to the gateway or the website server. Anyone with the complete link can still read and forward the route, so it must be shared only with the intended surveyor.

Navigation and phone buttons open the phone's external maps and calling applications.

Completed surveys are saved only in that browser's local storage. They do not update the office planner.

## Compatibility contract

`route-codec.mjs` is the single shared format module. The standalone reader imports it locally, while the planner imports the same file from its local `/survey-reader/` mount. Payload version `1` is identified by tokens beginning with `v1.`.

Run the standalone checks with:

```bash
npm run check
```
