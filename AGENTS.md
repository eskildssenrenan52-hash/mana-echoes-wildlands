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

## Game architecture
- Preserve the imported browser Canvas RPG engine and original catalog; settlement mechanics live in a separate module so combat and quests remain compatible.
- Keep the original browser save key with backward-compatible settlement and terrain fields; this single-player game has no accounts or external database.
- Use deterministic world generation for the expanded biome network so saved terrain coordinates remain stable.
- Match the source game's indexed-access compiler behavior while keeping strict typing enabled; its fixed sprite palettes and tile arrays assume indexed values exist.
- Render sourced world sprites through the browser-only WorldArt module with asset pointers and preserve their CC BY-SA attribution in the public game credits.
- Keep legacy generation and treasure coordinates in the original region; generate frontier terrain in lightweight sectors from a separate browser-safe catalog so larger worlds retain save compatibility and fast startup.
- Size the Canvas camera from its screen bounds and keep controls as accessible overlays; this fills different screen proportions without stretching pixel-art geometry.
- Generate frontier enemies near exploration rather than allocating a world-wide population; this preserves original quest enemies and bounds combat workload.
