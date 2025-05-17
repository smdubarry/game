# Mini Colony Simulator

Mini Colony Simulator is a lightweight browser game that depicts a small community trying to survive and expand. Most graphics are rendered using emojis, while the terrain is drawn using simple colors.

## Game Mechanics

- The world is procedurally generated with grass, water, forests, mountains and ore deposits. Grass and farmland tiles are drawn with darker colors.
- Villagers convert grass tiles into farmland as they walk over them. Farmland has a small chance each tick to regrow crops after being harvested. Grown crops show a random food emoji.
- The colony begins with only a single house; farmland must be created by villagers.
- Villagers search for farmland with crops, harvest a single unit of food, then carry it back to the nearest house. Harvested farmland remains farmland.
- Houses store deposited food. Each house provides housing for five villagers and is given a procedurally generated name.
- When the population has reached the current housing capacity and at least 20 food is available, a villager on a grass tile will build a new house.
- Houses with stored food periodically spend one food to spawn an additional villager if housing space is available. Villagers are represented by a variety of sports-themed emojis.
- Villagers slowly lose hunger and age over time. They eat stored food when hungry and die if their hunger runs out or they surpass their lifespan. Villagers can share the same grid space.
- Hovering over any tile shows a tooltip listing everything on that space. The
  tooltip updates continuously even when the mouse stays still.
- Food, population and house counts are shown beneath the canvas and update continuously.
- A scrolling log beneath the counts records notable events with the most recent entry at the top.

## How to Play

1. Open `index.html` in a modern web browser.
2. Watch as the villagers move around and expand their colony.
3. Use the **Pause** button to pause or resume the simulation.
4. Use **Add Villager** to introduce a new villager manually.

Keep this README up to date with any future changes to game behavior.
