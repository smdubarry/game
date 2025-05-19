# Mini Colony Simulator

Mini Colony Simulator is a lightweight browser game that depicts a small community trying to survive and expand. Most graphics are rendered using emojis, while the terrain is drawn using simple colors.

## Game Mechanics

- The world is procedurally generated with grass, water, forests, mountains and ore deposits using roaming walkers for more natural looking terrain. Grass and farmland tiles are drawn with darker colors. Forest tiles show a tree emoji.
- Villagers create new farmland when stored food is low or there are fewer than two fields per villager. They will travel to the nearest grass tile and convert it into farmland. Farmland has a small chance each tick to regrow crops after being harvested. Grown crops show a random food emoji.
- When multiple villagers are preparing new fields, the game counts how many grass tiles are already targeted so others continue their tasks once the need is met.
- Trees in forests can be chopped for wood. An empty forest tile regrows its tree after 1000 ticks.
- The game map scales to your browser, covering 95% of its width and 60% of its height when the world is generated.
- The colony begins with a single house placed at a random location and the first villager starts on that house. Farmland must be created by villagers.
- Villagers search for farmland with crops, harvest a single unit of food, then carry it back to the nearest house. Harvested farmland remains farmland.
- Villager movement now uses pathfinding to avoid water so they won't get stuck while walking to their destinations.
- Villagers always wait in place when they have no task and never wander randomly.
- Houses store deposited food and wood. Each house provides housing for five villagers and is given a procedurally generated name.
- When the population has reached the current housing capacity, villagers who have just eaten will chop trees if fewer than 10 wood are currently being gathered (including wood being carried or targeted). When at least 10 wood is stored and no other villager is preparing a house, the eater will head to the nearest field and build a new house there.
- Houses with stored food periodically spend one food to spawn an additional villager if housing space is available. Villagers are represented by a variety of sports-themed emojis.
- Villagers lose 1 health each tick and die if it reaches zero. They no longer die of old age. When their health falls below 90 they go to the nearest house to eat and regain full health. If no food is stored, they instead convert the nearest grass tile to farmland.
- Hovering over any tile shows a tooltip listing everything on that space. The
  tooltip updates continuously even when the mouse stays still.
- Food, wood, population, death, house and farmland counts plus the current tick are shown beneath the canvas and update continuously.
- A scrolling log beneath the counts records notable events with the most recent entry at the top. Log entries include tick counts and omit food harvest and deposit messages.

## How to Play

1. Open `index.html` in a modern web browser.
2. Watch as the villagers move around and expand their colony.
3. Use the **Pause** button to pause or resume the simulation.
4. Use **Add Villager** to introduce a new villager manually at a random house even if all housing is occupied.

Keep this README up to date with any future changes to game behavior.
