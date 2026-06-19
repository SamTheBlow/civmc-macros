// Currently this bot only harvests from north to south, then east to west.

// Don't touch this...
const WHEAT_SEEDS = "minecraft:wheat_seeds";
const BEETROOT_SEEDS = "minecraft:beetroot_seeds";
const util = require("./blow-utils.js");

// --- THINGS YOU CAN CONFIGURE

// Here you can change the abort key (default is Tab)
util.setAbortKey("tab");

// Change the bot's name to whatever you'd like
util.setBotName("PlanterBot");

util.setAutoReconnect(true);
util.setDisconnectWhenDone(false);
util.setGoAfk(true);
util.setDisableBypass(true);

// The seeds you're planting (WHEAT_SEEDS or BEETROOT_SEEDS)
const seeds = WHEAT_SEEDS;

// The id of your hoe of choice
const hoe = "minecraft:stone_hoe";

// The slot in your hotbar the bot will use to eat food
// (number from 1 to 9)
const foodSlot = 1;

// The slot in your hotbar the bot will use for the hoe
// (number from 1 to 9)
const hoeSlot = 5;

// The slot in your hotbar the bot will use to swap seeds
// (number from 1 to 9)
const seedsSlot = 6;

// The coordinates where the first and last blocks of farmland are located
const xMin = -3552;
const xMax = -3481;
const zMin = -3432;
const zMax = -3376;

// --- End of things you can configure
// Don't touch anything below

util.setMainLoop(mainLoop);

// The direction the bot walks in: true is north, false is south
directionNorth = Math.abs(xMin - Math.floor(util.player.getX())) % 2 == 1;

util.checkInsideRange(xMin, xMax, zMin, zMax, "Player isn't on the farm");

util.startMainLoop();

function mainLoop() {
  playerX = Math.floor(util.player.getX());
  playerZ = Math.floor(util.player.getZ());

  // If you've reached the end of the farm, we're done
  if (playerX == xMin && playerZ == zMax) {
    util.stopBot("Finished this floor!");
    return;
  }

  // Put seeds in offhand slot
  inv = Player.openInventory();
  util.grabItem([seeds], "seeds", seedsSlot);
  inv.swap(35 + seedsSlot, 45);

  // Look at the ground
  KeyBind.keyBind("key.forward", true);
  for (imogus = 0; imogus < 6; imogus++) {
    if (imogus == 2) {
      KeyBind.keyBind("key.forward", false);
    }

    // Grab hoe
    util.grabItem([hoe], "hoe", hoeSlot);

    util.player.lookAt(directionNorth ? 180 : 0, 90);
    util.player.interact();
    Client.waitTick(2);
  }

  // Reached the end of a row? Move forward a block and change direction
  if (playerZ == zMax && !directionNorth) {
    KeyBind.keyBind("key.use", true);
    util.moveTo([], playerX - 1.0 + 0.5, playerZ + 0.5);
    directionNorth = true;
  } else if (playerZ == zMin && directionNorth) {
    KeyBind.keyBind("key.use", true);
    util.moveTo([], playerX - 1.0 + 0.5, playerZ + 0.5);
    directionNorth = false;
  }
}
