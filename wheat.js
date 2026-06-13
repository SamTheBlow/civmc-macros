// Don't touch this...
const util = require("./blow-utils.js");

// --- THINGS YOU CAN CONFIGURE

// Here you can change the abort key (default is Tab)
util.setAbortKey("tab");

// The y level of the farm's topmost floor
const yFloor1 = 90;

// The number of blocks between each floor
// (e.g. if floor 1 is at y=67 and floor 2 is at y=64, then it's 3)
const yFloorStep = 3;

// The coordinates where the first and last blocks of wheat are located
const xMin = -3552;
const xMax = -3481;
const zMin = -3432;
const zMax = -3376;

// The x coordinates where the bot will be able to drop its wheat seeds
const seedDepositCoords = [-3492, -3504, -3516, -3528, -3540, -3552];

// --- End of things you can configure
// Don't touch anything below

const WHEAT = "minecraft:wheat";
const WHEAT_SEEDS = "minecraft:wheat_seeds";

util.setBotName("WheatBot");
util.setMainLoop(mainLoop);

currentLayer = util.getCurrentFloor(yFloor1, yFloorStep, true);

// The direction the bot walks in: true is north, false is south
directionNorth = true;

util.startMainLoop();

function mainLoop() {
  playerX = Math.floor(util.player.getX());
  playerZ = Math.floor(util.player.getZ());

  // Drop wheat into the wheat collection system
  if (playerZ == zMax && util.hasAnyItem([WHEAT], false, [9, 44])) {
    // Walk to center of block
    util.moveTo([], playerX + 0.5, playerZ + 0.5, 0.2);
    // Look at collection system
    util.player.lookAt(0, 0);
    Client.waitTick();
    // Drop all wheat
    util.dropAll([WHEAT]);
  }

  // Drop wheat seeds into the seed collection system
  if (
    seedDepositCoords.includes(playerX) &&
    playerZ == zMax &&
    util.hasAnyItem([WHEAT_SEEDS], false, [9, 44])
  ) {
    // Walk to center of block, to south edge of block
    util.moveTo([], playerX + 0.5, playerZ + 1.17, 0.1);
    // Look at seed collection system
    util.player.lookAt(0, -50);
    Client.waitTick();
    // Drop all wheat seeds
    util.dropAll([WHEAT_SEEDS]);
  }

  // Reached the end of a row? Move forward a block and change direction
  if (playerZ == zMax && !directionNorth) {
    util.moveTo([], playerX - 0.5, playerZ + 0.5);
    directionNorth = true;
  }
  if (playerZ == zMin && directionNorth) {
    util.moveTo([], playerX - 0.5, playerZ + 0.5);
    directionNorth = false;
  }

  // Look at the wheat
  util.player.lookAt(90, 38);
  KeyBind.keyBind("key.use", true);
  Client.waitTick();

  KeyBind.keyBind("key.use", false);
  KeyBind.keyBind("key.right", directionNorth);
  KeyBind.keyBind("key.left", !directionNorth);
}
