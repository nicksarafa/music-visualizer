# Radiant Intimacy

Radiant Intimacy is a generative painting movement built on one conviction: music should not decorate a canvas, it should reveal a spatial law. Every phrase begins as a small event at the center and earns its journey outward. Silence leaves paper. A note opens a route. A section becomes a field. The system values emergence over spectacle, using simple rules that compound into forms which feel discovered rather than imposed.

The composition is driven by seeded geometry, harmonic relationships, and controlled irregularity. Pitch fixes the color family through the circle of fifths. Event number and pitch determine the large-scale route, while carefully bounded randomness frays edges and prevents repeated marks from feeling stamped. Symmetry is allowed to evolve, break, and return. The same movement remains recognizable across sessions, but its painting is never mechanically identical.

Sound becomes a family of forces. Impact changes reach and material weight. Harmonic richness adds secondary bodies. Tonal travel alters direction. Breath gives a phrase room to cross the frame. Pitch clarity decides whether a mark resolves as one voice or a soft mixture. These measurements form an expression score, not a judgment of the music. A quiet, spacious chord can carry as much visual consequence as a loud attack.

Paint travels rather than teleports. A transient wavefront expands across the entire viewport, a tapered gesture grows from the origin, and faint traveling stains show where the color passed before the primary bloom arrives. The algorithm is tuned to preserve unpainted space even as it reaches every edge. Complexity appears through nested cycles, reflections, and branches, then subsides so the next musical idea has somewhere to live.

The result should feel meticulously crafted and emotionally legible at room scale. Material skins change the physical answer, from soak-stain and cyanotype to impasto and stipple, while the movement remains an independent compositional system. This separation is the core craft decision: one song can become many paintings without losing the truth of its harmony, and every combination should feel like a complete work rather than a filter.

## Fourteen movements

| movement | spatial law | visual character |
|---|---|---|
| liquid bloom | local pressure, viscosity, cohesion, and paired vortices | droplets push one another into soft braided currents |
| sacred rose | pitch-indexed six-, eight-, ten-, or twelvefold star-rosettes | luminous compass-and-straightedge order that constructs itself |
| living sand | discrete collisions, gravity, and slope-limited settling | a central fountain becoming colored strata and time |
| vitruvian grove | space-seeking branch tips with recursive splitting | wood growing weightlessly toward every open region |
| radiant heart | golden-angle rays with scored reach | clear release from a central pulse |
| golden garden | phyllotaxis | a bloom that grows note by note |
| orphic rose | three-lobed rose curve | folded rhythm and chromatic symmetry |
| velvet fan | mirrored angular sweep | theatrical opening with controlled drama |
| jazz ribbon | lissajous phrasing | loose handwriting across the field |
| color tide | nested elliptical wavefronts | slow atmosphere and broad color |
| cathedral | tiered bilateral branching | a luminous structure rising from one point |
| constellation | seeded distant anchors | a musical sky map with irregular order |
| afterimage | opposing wave paths | memory and counterpoint |
| slow orbit | expanding spiral | a patient system assembling itself |

The matter systems translate simulation research into restrained Canvas 2D marks. Liquid uses a compact particle neighborhood inspired by SPH pressure, viscosity, and surface tension. Sacred Rose builds regular star polygons and nested rosettes rather than applying decorative kaleidoscope effects. Living Sand keeps grains discrete, lets them collide, and rolls them down over-steep local slopes. Vitruvian Grove follows the space-colonization idea that branches advance into available space, with gravity deliberately removed so the musical center remains the only root.

## Expression score

The engine calculates five normalized signals for every painted event:

- impact, 30 percent: immediate acoustic energy
- harmonic richness, 20 percent: number and spacing of strong pitch classes
- tonal travel, 18 percent: movement around the circle of fifths
- breath, 14 percent: space since the previous visual event
- clarity and dynamic motion, 18 percent: pitch focus plus energy change

The combined value controls reach, brush mass, gesture width, echo count, and wave opacity. Individual component values remain available through PIG.score() for testing.
