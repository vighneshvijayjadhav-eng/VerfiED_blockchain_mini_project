# VerifiED visual system and execution plan

Routes: dashboard `/`, issuance `/issue`, searchable registry `/registry`, document `/certificates/:id`, public lookup `/verify` and `/verify/:id`.

Desktop: 232px persistent charcoal sidebar, 1120px content maximum, 32px gutters. Mobile: stacked navigation and single-column forms. Spacing uses 4/8/12/16/24/32/48px; surfaces use 16px radii, quiet borders and shallow shadows. At the user's request, the site now uses charcoal #181D1C, white surfaces, emerald #087F5B and light neutral #F5F6F5. Emerald indicates primary actions and success; amber integrity warnings and red revoked states remain distinct. Local system sans-serif for controls; Georgia for editorial headings and certificate display.

Original local SVG campus colonnade fills the right side of the dashboard hero in neutral stone tones under a charcoal overlay. A separate original guilloche engraving appears on public verification and certificate preview. No remote assets or fonts. Asset licensing is recorded in public/assets/LICENSE.md. The downloadable academic PDF retains its existing print design; this refresh covers the website theme.

Reusable components: page heading, status pill, empty state, loading skeleton, error notice, evidence panel, academic field grid, certificate preview, confirmation dialog. Status comes from live chain reads. Integrity is displayed separately from registration/revocation.

Execution: contract and actual-node tests; deployment-scoped API and canonical hashing; styled PDF/QR; React integration; full happy/negative smoke tests, production build, visual inspection; documentation and safe normal Git push.

## Explorer and QR upgrade layout

Preserve the user-selected charcoal/white/emerald palette. Explorer reuses existing cards, forms, status treatments and revocation dialog. Receipt fields wrap long hashes; block/activity rows link to internal inspectors. Public verification uses a three-option segmented control and a restrained dashed upload zone. After an image is loaded, the zone compacts to bring the live result closer to the top of a laptop screen. The original PDF design and canonicalization stay unchanged.
