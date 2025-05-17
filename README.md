# Mini Colony Simulator

Mini Colony Simulator is a lightweight browser game that depicts a small community trying to survive and expand. All graphics are rendered using emoji characters.

## Game Mechanics

- The world is a grid of grass and farmland tiles.
- Farmland tiles may appear on empty grass and have a small chance each tick to regrow crops after being harvested.
- Villagers search for farmland with crops, harvest a single unit of food, then carry it back to the nearest house.
- Harvested farmland turns back into grass.
- Houses store deposited food. Each house provides housing for five villagers.
- When the population has reached the current housing capacity and at least 20 food is available, a villager on a grass tile will build a new house.
- Houses with stored food periodically spend one food to spawn an additional villager if housing space is available.
- Villagers slowly lose hunger and age over time. They eat stored food when hungry and die if their hunger runs out or they surpass their lifespan.
- Hovering over a villager or house reveals a tooltip with its name and status.
- Food, population and house counts are shown beneath the canvas and update continuously.

## How to Play

1. Open `index.html` in a modern web browser.
2. Watch as the villagers move around and expand their colony.
3. Use the **Pause** button to pause or resume the simulation.
4. Use **Add Villager** to introduce a new villager manually.

Keep this README up to date with any future changes to game behavior.
