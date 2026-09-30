<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Project rules

- READ `HANDOFF.md` at the repo root before any work — it carries the full project context, what is done, and what "أكمل" (continue) means. If the user says "أكمل", continue the remaining product videos listed there, 3 per batch.

- Web fonts are self-hosted in `public/fonts/` and loaded via `/fonts/fonts.css` in `src/routes/__root.tsx` — no external font requests.

- Product catalog data lives in src/lib/products-data.ts and renders via src/components/products-catalog.tsx as an in-app view (no bot/quote workflow) — keeps the info-only catalog isolated from sales flows.

- Product intro videos are real `<video>` files registered in src/lib/product-video.ts and played by src/components/product-video.tsx — never substitute slideshows or CSS-animated stills.

- Product specs, compatibility and images come only from the bundled catalogs or the manufacturer's official sources — never guess, never reuse a similar model's image.

- The products catalog is information-only: no pricing, ordering, sales or quote flows may be linked into it.

- Preserve all product videos at their original 1080p quality without compression or transcoding; the planned installed app bundles the complete media set because customers must install and use it offline.

- Except for solar panels, every showroom product must sit on the standard white podium at its catalog-documented physical proportions; regenerate video from the corrected still so scale remains consistent.
