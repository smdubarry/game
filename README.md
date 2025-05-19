# Mini Colony Simulator

Mini Colony Simulator is a lightweight browser game that depicts a small community trying to survive and expand. Most graphics are rendered using emojis, while the terrain is drawn using simple colors.

## Game Mechanics

- The world is procedurally generated with grass, water, forests, mountains and ore deposits using roaming walkers for more natural looking terrain. Grass and farmland tiles are drawn with darker colors. Forest tiles show a tree emoji.
- Farmland has a small chance each tick to regrow crops after being harvested. Grown crops show a random food emoji.
- Villagers harvest crops from farmland and carry the food back to the nearest house.
- Villager movement now uses pathfinding to avoid water so they won't get stuck while walking to their destinations.
- The game map scales to your browser, covering 95% of its width and 60% of its height when the world is generated.
- The colony begins with a single house placed at a random location and the first villager starts on that house.
- Villagers always wait in place when they have no task and never wander randomly.
- Houses store deposited food and each provides housing for five villagers with a procedurally generated name.
- Villagers no longer chop wood or build additional houses on their own.
- Houses with stored food periodically spend one food to spawn an additional villager if housing space is available. Villagers are represented by a variety of sports-themed emojis.
- Villagers lose 1 health each tick and die if it reaches zero. When their health falls below 90 they go to the nearest house with stored food to eat and regain full health.
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
