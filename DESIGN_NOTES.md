# VerifiED visual system and execution plan

Routes: dashboard `/`, issuance `/issue`, searchable registry `/registry`, document `/certificates/:id`, public lookup `/verify` and `/verify/:id`.

Desktop: 232px persistent navy sidebar, 1120px content maximum, 32px gutters. Mobile: stacked navigation and single-column forms. Spacing uses 4/8/12/16/24/32/48px; surfaces use 16px radii, quiet borders and shallow shadows. Navy #10233F, cobalt #3568D4, pale stone #F5F7FB, teal success, amber integrity warnings, red revoked. Local system sans-serif for controls; Georgia for editorial headings and certificate display.

Original local SVG campus colonnade fills the right side of the dashboard hero under a navy overlay. A separate original guilloche engraving appears on public verification and certificate preview. No remote assets or fonts. Asset licensing is recorded in public/assets/LICENSE.md.

Reusable components: page heading, status pill, empty state, loading skeleton, error notice, evidence panel, academic field grid, certificate preview, confirmation dialog. Status comes from live chain reads. Integrity is displayed separately from registration/revocation.

Execution: contract and actual-node tests; deployment-scoped API and canonical hashing; styled PDF/QR; React integration; full happy/negative smoke tests, production build, visual inspection; documentation and safe normal Git push.
