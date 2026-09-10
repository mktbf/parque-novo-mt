# PNMT rendering assets

All selected asset files are unmodified 1K source downloads from Poly Haven, licensed CC0 1.0 Universal. Asset reuse, redistribution, and commercial use are permitted; attribution is appreciated. License: https://polyhaven.com/license

## Environment

- Qwantani Noon (Pure Sky): https://polyhaven.com/a/qwantani_noon_puresky
- Authors: Greg Zaal (photography), Jarod Guest (processing).
- File: `qwantani_noon_puresky_1k.hdr`
- Clear midday sky-only HDR environment; useful for bright park daylight without a built skyline. This is an artistic lighting choice, not a PNMT location capture.
- Use as an equirectangular environment; no material repeat scale.

## Asphalt

- Clean Asphalt: https://polyhaven.com/a/clean_asphalt
- Author: Dimitrios Savva.
- Albedo: `clean_asphalt_diff_1k.jpg`
- Roughness: `clean_asphalt_rough_1k.jpg`
- OpenGL normal: `clean_asphalt_nor_gl_1k.jpg`
- Source width: 2.1 m. Start with one full texture tile per 2.1 m in each horizontal direction.

## Grass / earth

- Leafy Grass: https://polyhaven.com/a/leafy_grass
- Author: Charlotte Baglioni.
- Albedo: `leafy_grass_diff_1k.jpg`
- Roughness: `leafy_grass_rough_1k.jpg`
- OpenGL normal: `leafy_grass_nor_gl_1k.jpg`
- Source width: 2 m. Start with one full texture tile per 2 m in each horizontal direction.

## Repeat and verification

For an unwrapped rectangular surface W meters by H meters with UVs spanning 0 to 1, repeat counts are (W / tile_width_m, H / tile_width_m). Keep all three maps on a material at the same repeat count. These are physical starting scales; avoid enlarging grass blades into large patches for distant views.

Six JPEG maps are 1024 by 1024 pixels. The HDR is 1024 by 512. All seven asset downloads passed MD5 checks against the official Poly Haven API manifests. Total original asset payload is 6,377,521 bytes (6.08 MiB).

`asset-catalog.json` contains exact local paths, source URLs, byte sizes, source MD5 hashes, authors, and repeat widths. The individual `*-files.json` files are source download manifests. Source API documentation: https://polyhaven.com/our-api

Only local assets need to ship with the app; no live Poly Haven API dependency is needed.
