# Sentinel CAPTCHA Demo Websites

This workspace contains six static demo websites, each with a contact form using a matching CAPTCHA or bot-protection widget.

## Sites

| Folder | Provider | Shape | Notes |
| --- | --- | --- | --- |
| `recaptcha-horizon/` | Google reCAPTCHA v2 | 3 pages | Uses Google's public v2 test site key. |
| `hcaptcha-studio/` | hCaptcha | SPA | Uses hCaptcha's documented always-pass test sitekey. |
| `turnstile-clinic/` | Cloudflare Turnstile | 3 pages | Uses Cloudflare's visible always-pass test sitekey. |
| `friendlycaptcha-agency/` | Friendly Captcha | SPA | Uses the official `frc-captcha` widget pattern with a sitekey placeholder. |
| `arkose-bank/` | Arkose Labs | 2 pages | Uses the Client API setup pattern with a public-key placeholder. |
| `altcha-lab/` | ALTCHA | 2 pages | Uses the `altcha-widget` web component with a challenge endpoint placeholder. |
| `passive-guard/` | Passive Guard simulation | SPA | Local behavior scoring demo that mimics passive bot detection feedback. |

Open `index.html` in a browser to browse the demos.

Open `submissions.html` to view submitted form payloads saved locally in your browser. The viewer uses `localStorage`, so it is meant for testing only.

## PHP ALTCHA Server

Run the PHP built-in server from the project root to serve the static files and the ALTCHA challenge API from the same origin:

```sh
php -S 127.0.0.1:5500 router.php
```

Then open `http://127.0.0.1:5500/altcha-lab/contact.html`. The ALTCHA widget requests `GET /api/altcha/challenge`.

## Production Setup

The front-end widgets only create response tokens. A production form must send the token to your own server and verify it before sending email, opening a support ticket, or storing the message.

- reCAPTCHA: replace `6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI`, then verify `g-recaptcha-response` server-side with Google.
- hCaptcha: replace `10000000-ffff-ffff-ffff-000000000001`, then verify `h-captcha-response` server-side with hCaptcha.
- Cloudflare Turnstile: replace `1x00000000000000000000AA`, then verify `cf-turnstile-response` with Turnstile Siteverify.
- Friendly Captcha: replace `YOUR-FRIENDLY-CAPTCHA-SITEKEY`, then verify the solution with Friendly Captcha's siteverify endpoint.
- Arkose Labs: replace `YOUR-ARKOSE-PUBLIC-KEY` in the client script URL and verify the Arkose session token server-side.
- ALTCHA: implement `/api/altcha/challenge` or replace it with your real challenge URL, then verify the submitted ALTCHA payload server-side.
- Passive Guard: use the local score only as a demo signal. A real passive system needs signed server challenges, rate limits, replay protection, and risk decisions on the backend.

## References

- Google reCAPTCHA v2 docs and test key: https://developers.google.com/recaptcha/docs/display
- hCaptcha developer guide and test key: https://docs.hcaptcha.com/
- Cloudflare Turnstile test keys: https://developers.cloudflare.com/turnstile/troubleshooting/testing/
- Friendly Captcha widget SDK: https://developer.friendlycaptcha.com/docs/v1/sdk/
- Arkose Labs quickstart: https://developer.arkoselabs.com/docs/arkose-labs-platform-quickstart
- ALTCHA widget integration: https://altcha.org/docs/v2/widget-integration/
