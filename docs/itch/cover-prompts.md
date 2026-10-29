# Cover-image prompts (ChatGPT image generation)

One prompt per game, written from what is actually in each build (0.6.0 / 0.4.0 / 0.5.0):
nothing on a cover shows a feature, enemy or place the game doesn't have. Each style is the
game's own, not the portfolio's Prism look (no prism band, no film grain, no Fraunces).

**How to use**

- Paste the whole block. Attach 1–2 screenshots from `public/media/<game>/` with the line
  *"Use the attached screenshot only as a reference for the characters and setting, not for
  the style or camera"* — it keeps the characters accurate.
- ChatGPT outputs 1536×1024 at most in landscape; itch wants **630×500**. Every prompt keeps
  the important parts in the middle 80 % so the crop to 630×500 loses only the edges.
- If the title comes out misspelled, ask for the same image **with no text** and set the title
  yourself — or reply "same image, fix the title spelling to: …".
- Pixel-art covers: if the result looks like smooth "fake" pixels, reply *"make the pixels
  larger and hard-edged, no anti-aliasing, reduce the palette to 24 colours"*.
- **itch AI disclosure:** Push Comes to Shove and Cinderhold currently answer *graphics: no*.
  An AI-generated cover changes that to *yes* on those pages (Horde Hours already says yes).

---

## Horde Hours

Reference: `public/media/horde-hours/fireball.webp`, `arena.webp`

```text
Create the cover key art for an indie video game called "HORDE HOURS": a 3D top-down survivors-like where one small hero must survive ten minutes of night against an ever-growing horde while their weapons fire on their own.

FORMAT: landscape 1536x1024. It will be cropped to 630x500, so keep the hero, the title and the main action inside the central 80% of the width; the far left and right edges should only hold horde and fog.

SCENE: a high three-quarter top-down view over an endless meadow of thick, tufted, stylized grass at night. In the exact centre stands one small chibi-proportioned hero: a cartoon boy with a big head, short brown hair and a plain white T-shirt, simple toy-like 3D proportions. He stands in a circle of warm amber lamplight that travels with him. From every direction the horde closes in out of blue ground fog: squat red slime monsters with glowing eyes, small bats circling and diving, stylized skeletons winding up to throw spinning bones, slow green-skinned zombies shuffling forward, and among them a few larger gold-tinted elite versions. Far back, half-hidden in the fog, a giant zombie boss looms with a red glow, about to charge. The hero's automatic weapons are mid-flight: a fireball bursting on a slime in a comic orange explosion, a jagged electric-blue lightning strike from the sky, a spinning thrown axe, and a pulsing translucent energy ring around the hero's feet. Small glowing emerald experience gems lie scattered in the grass, a few streaking toward the hero.

MOOD: cheeky, frantic, "one more run" energy. Dangerous but fun, never grim horror. The feeling of being completely surrounded and loving it.

STYLE: polished stylized 3D game key art. Clean, toy-like low-poly forms with soft hand-painted textures, chunky readable silhouettes, a slight tilt-shift depth of field. Not photorealistic, not anime, not pixel art.

LIGHT AND PALETTE: cool night. Deep navy and blue-teal moonlight, soft long shadows, fog closing the distance, a dark solid sky. A strong warm counter-light from the hero's lamp (amber and gold) and the fireball (orange). Accents: electric-blue lightning, emerald gems, gold elites, the boss's red glow. High contrast between the warm centre and the cold dark around it.

TITLE: "HORDE HOURS" at the top, in a tall, narrow, condensed bold sans-serif, warm off-white with a faint orange glow. The O in HOURS may double as a simple stopwatch face with its hand near the top. Spell it exactly: HORDE HOURS. No other text, no logos, no UI, no HUD, no health bars.

AVOID: blood, gore, realistic violence, photorealism, daylight, blue sky, sun, guns, sci-fi, rainbow gradients, film grain, extra text, watermarks, signatures.
```

---

## Push Comes to Shove

Reference: `public/media/push-comes-to-shove/enemy-turn.webp`, `deploy.webp`

Back in the game's own pixel art, but showing its world rather than the floating board
(owner's choice, 2026-10-27): the flooded fields, pools and rock ridges the five levels are
built from, with the squad and the raiders in it.

```text
Create the cover art for an indie turn-based tactics game called "PUSH COMES TO SHOVE": a small fantasy tactics game where a squad of human soldiers holds its ground against goblin and orc raiders, and the whole point is shoving enemies into water, into rocks and into each other.

FORMAT: landscape 1536x1024. It will be cropped to 630x500, so keep the moment of impact, the two sides and the title inside the central 80% of the width; the far left and right edges should only hold landscape.

SCENE: a wide view over the game's world from a high three-quarter isometric angle: flooded lowland fields of short grass and packed orange-brown earth, cut by ponds and broad pools of dark blue water, narrow dry paths between them, and a ridge of grey boulders with a gap in it. No board, no grid, no floating platform: it is a real stretch of land that runs out of frame on every side. In the foreground, the human squad holds the gap in the rock ridge: soldiers in grey plate armour with swords, a hooded archer drawing a bow, and an elf ranger in purple aiming a long shot. Coming across the wet fields from the far side is the raider warband: green goblins with bows and axes, a hulking red orc brute with a heavy weapon, and a blue-skinned goblin archer. At the centre, a frozen moment of impact at the water's edge: a soldier has just struck with his sword, and a goblin is flying backward off the path, about to drop into a pool, the first splash rising, a puff of dust and a few amber sparks where the blow landed. Behind him, a second goblin stumbles into the orc brute, both knocked off balance.

MOOD: tense and cerebral, but with a satisfying punch. A battle of positions on dangerous ground: every pool and rock is a weapon. Readable at a glance, every unit a clear silhouette.

STYLE: crisp, detailed fantasy pixel art. Low-resolution sprites and terrain scaled up with hard-edged square pixels, no anti-aliasing, a limited palette, dark outlines around the characters. A polished pixel-art illustration of a strategy game world, not a 3D render, not painterly.

LIGHT AND PALETTE: warm, low late-afternoon light from one side with long pixel shadows; the far edge of the fields fades into a darker, cooler haze. Earthy oranges, browns and muted greens for the land, grey for the boulders, steel grey for the humans, goblin green, orc red, cool blue water with small pixel highlights. Amber is reserved for the impact sparks, with a small white flash at the point of the hit.

TITLE: "PUSH COMES TO SHOVE" in a chunky, blocky pixel font, cream-white with a dark outline, set on a bronze riveted metal plate like an old game-UI panel, at the top of the image over the far fields. Spell it exactly: PUSH COMES TO SHOVE. No other text, no UI panels, no numbers, no grid lines or tile highlights.

AVOID: realism, 3D render, smooth gradients, blurry or mixed-size pixels, a floating board or diorama, blood, gore, castles, villages, rainbow gradients, film grain, extra text, watermarks, signatures.
```

---

## Cinderhold

Reference: `public/media/cinderhold/floor3-boss.webp`, `floor2-locks.webp`

```text
Create the cover art for an indie 2D dungeon crawler called "CINDERHOLD": a top-down action game where a lone knight fights down three dark dungeon floors, reads the red warning mark every enemy shows before it strikes, dodges through it, and finally faces Cinderclaw, the crimson guardian who seals the last exit.

FORMAT: landscape 1536x1024. It will be cropped to 630x500, so keep the knight, the boss and the title inside the central 80% of the width.

SCENE: a top-down view, tilted slightly, into the guardian's chamber at the bottom of the dungeon. Cool blue-grey stone brick walls and a dark, worn floor. Wall sconces with flickering flames throw small pools of warm orange light; everything else falls into near-black. At the bottom of the frame, a small knight in steel armour with a sword, seen from above and behind, mid-dodge: a short dash leaving a faint afterimage trail. Filling the upper middle, Cinderclaw: a hulking crimson creature with huge claws, several times the knight's size, raising both claws for a slam. On the floor between them, a glowing translucent red rectangle marks exactly where the slam will land, and the knight is dashing out of it. Behind the boss, set into the wall, a sealed exit glows faintly teal. Embers and ash drift upward. Scattered rubble and bones on the floor, a few coins glinting near the walls.

MOOD: claustrophobic, smoky, ominous but fair. The held breath just before the hit. Classic dark-fantasy dungeon.

STYLE: authentic retro pixel art in a 16x16-tile dungeon look. Chunky sprites, a limited palette of about 32 colours, crisp hard pixel edges, no anti-aliasing, light falloff done with pixel dithering rather than smooth gradients. A polished pixel-art key illustration at a large pixel scale where every art pixel is clearly visible. Not 3D, not painterly, not high-resolution illustration.

LIGHT AND PALETTE: dominant cold slate blue and charcoal, cut by warm firelight from the sconces and a deep, angry red glow from the boss and the floor warning mark. A small teal accent from the exit. Embers in orange and yellow.

TITLE: "CINDERHOLD" across the top in a blocky, square pixel font, ember-orange fading to warm white, with a dark outline, the letters glowing as if heated, a few embers rising off them. Spell it exactly: CINDERHOLD. No other text, no HUD, no health bars.

AVOID: blood, gore, realism, 3D render, soft blur, painterly brushwork, high-resolution detail mixed with pixels, daylight, rainbow gradients, film grain, extra text, watermarks, signatures.
```
