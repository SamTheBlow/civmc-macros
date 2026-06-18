// Currently this bot only harvests from north to south, then east to west.
// It expects the water collection to be on the south edge of the farm.

// Don't touch this...
const WHEAT = "minecraft:wheat";
const WHEAT_SEEDS = "minecraft:wheat_seeds";
const BEETROOT = "minecraft:beetroot";
const BEETROOT_SEEDS = "minecraft:beetroot_seeds";
const util = require("./blow-utils.js");

// --- THINGS YOU CAN CONFIGURE

// Here you can change the abort key (default is Tab)
util.setAbortKey("key.keyboard.keypad.3");

// Change the bot's name to whatever you'd like
util.setBotName("BeetrootBot");

util.setAutoReconnect(true);
util.setDisconnectWhenDone(true);
util.setGoAfk(true);
util.setDisableBypass(true);

// The crop you're farming (WHEAT or BEETROOT)
const crop = BEETROOT;

// The slot in your hotbar the bot will use to eat food
// (number from 1 to 9)
const foodSlot = 1;

// The slot in your hotbar the bot will use to harvest faster
// (number from 1 to 9)
const cropSlot = 5;

// The number of floors your farm has
const numberOfFloors = 1;

// The y level of the farm's topmost floor
// (if only one floor, put your farm's y level here)
const yFloor1 = 89;

// The number of blocks between each floor
// (e.g. if floor 1 is at y=67 and floor 2 is at y=64, then it's 3)
// (if farm only has one floor, you can ignore this)
const yFloorStep = 3;

// The coordinates where the first and last blocks of farmland are located
const xMin = 4541;
const xMax = 4639;
const zMin = 8135;
const zMax = 8215;

// The x coordinates where the bot will empty its inventory
const depositCoords = [4553, 4565, 4577, 4589, 4601, 4613, 4625, 4639];

// --- End of things you can configure
// Don't touch anything below

util.setMainLoop(mainLoop);

// The direction the bot walks in: true is north, false is south
directionNorth = Math.abs(xMin - Math.floor(util.player.getX())) % 2 == 1;

currentLayer = util.getCurrentFloor(yFloor1, yFloorStep, numberOfFloors, true);

util.checkInsideRange(xMin, xMax, zMin, zMax, "Player isn't on the farm");

botMode = util.isOnBlock(xMax, zMax) ? "startOfFloorA" : "main";

util.startMainLoop();

function mainLoop() {
  if (botMode == "main") {
    mainMode();
  } else if (botMode == "startOfFloorA") {
    startOfFloorMode("A");
  } else if (botMode == "startOfFloorB") {
    startOfFloorMode("B");
  } else if (botMode == "nearEnd") {
    nearEndMode();
  } else if (botMode == "return") {
    returnMode();
  }
}

// Main mode: the bot harvests the farm one row at a time
function mainMode() {
  KeyBind.keyBind("key.forward", false);

  playerX = Math.floor(util.player.getX());
  playerZ = Math.floor(util.player.getZ());

  // If you've neared the end of the farm, switch bot mode
  if (playerX <= xMin + 3) {
    botMode = "nearEnd";
  }

  // Hold the crop in your hand to harvest faster
  // (seeds if wheat or beetroot)
  holdCrop();

  // Drop inventory into water collection if applicable
  checkDeposit(playerX, playerZ);

  // Reached the end of a row? Move forward a block and change direction
  if (playerZ == zMax && !directionNorth) {
    KeyBind.keyBind("key.use", true);
    util.moveTo([], playerX - 1.0 + 0.5, playerZ + 0.5);
    directionNorth = true;
  }
  if (playerZ == zMin && directionNorth) {
    KeyBind.keyBind("key.use", true);
    util.moveTo([], playerX - 1.0 + 0.5, playerZ + 0.5);
    directionNorth = false;
  }

  // Look at the crops
  util.player.lookAt(90, 22);
  KeyBind.keyBind("key.use", true);
  Client.waitTick();

  KeyBind.keyBind("key.use", false);
  KeyBind.keyBind("key.right", directionNorth);
  KeyBind.keyBind("key.left", !directionNorth);
}

// The bot just started the current floor
// and needs to properly harvest the first rows
function startOfFloorMode(mode) {
  playerX = Math.floor(util.player.getX());
  playerZ = Math.floor(util.player.getZ());

  // Maneuver to do on the very first block
  if (mode == "A" && playerZ == zMax && playerX == xMax) {
    util.player.lookAt(180, 60);
    KeyBind.keyBind("key.use", true);
    Client.waitTick(5);
    util.player.lookAt(180, 22);
    KeyBind.keyBind("key.use", false);
    util.moveTo(["key.use"], xMax + 0.5, zMax - 1.0 + 0.5);
  }
  // Maneuver to do at the end of the first row
  if (mode == "A" && playerZ == zMin && playerX == xMax) {
    KeyBind.keyBind("key.use", true);
    KeyBind.keyBind("key.forward", false);
    util.player.lookAt(90, 60);
    Client.waitTick(5);
    util.player.lookAt(90, 20);
    Client.waitTick(5);
    util.player.lookAt(80, 20);
    Client.waitTick(5);
    util.player.lookAt(70, 20);
    Client.waitTick(5);
    util.player.lookAt(60, 20);
    Client.waitTick(5);
    util.player.lookAt(50, 20);
    Client.waitTick(5);
    botMode = "startOfFloorB";
    return;
  }
  // When we get back to the start, we can switch to main mode
  if (mode == "B" && playerZ == zMax && playerX == xMax) {
    KeyBind.keyBind("key.forward", false);
    KeyBind.keyBind("key.left", false);
    botMode = "main";
    directionNorth = true;
    return;
  }

  // Hold the crop in your hand to harvest faster
  // (seeds if wheat or beetroot)
  holdCrop();

  // Look at the crops
  util.player.lookAt(mode == "A" ? 180 : 45, 22);
  KeyBind.keyBind("key.use", true);
  Client.waitTick();

  KeyBind.keyBind("key.use", false);
  KeyBind.keyBind("key.forward", true);
  if (mode == "B") {
    KeyBind.keyBind("key.left", true);
  }
}

// The bot finished interacting with all the crops
// and just needs to collect all the dropped items
function nearEndMode() {
  playerX = Math.floor(util.player.getX());
  playerZ = Math.floor(util.player.getZ());

  KeyBind.keyBind("key.right", false);
  KeyBind.keyBind("key.left", false);
  KeyBind.keyBind("key.forward", false);

  // Drop inventory into water collection if applicable
  checkDeposit(playerX, playerZ);

  // Finished the final row? We're done, let's go back to the farm entrance
  if (playerX == xMin && playerZ == zMax) {
    botMode = "return";
    return;
  }

  // Reached the end of a row? Move forward a block and change direction
  if (playerZ == zMax && !directionNorth) {
    util.moveTo([], playerX - 1.0 + 0.5, playerZ + 0.5);
    directionNorth = true;
  }
  if (playerZ == zMin && directionNorth) {
    util.moveTo([], playerX - 1.0 + 0.5, playerZ + 0.5);
    directionNorth = false;
  }

  util.eatCheck(foodSlot);
  KeyBind.keyBind("key.forward", true);
  util.player.lookAt(directionNorth ? 180 : 0, 0);
  util.sprint(true);
}

// The bot goes back to the start and goes to the next floor (if applicable)
function returnMode() {
  KeyBind.keyBind("key.right", false);
  KeyBind.keyBind("key.left", false);
  KeyBind.keyBind("key.forward", false);

  // Go to the corner (aligned with lodestone)
  util.eatCheck(foodSlot);
  util.player.lookAt(xMax + 0.5, util.player.getY(), zMax - 1.0 + 0.5);
  util.moveTo(["key.sprint", "key.jump"], xMax + 0.5, zMax - 1.0 + 0.5, 0.2);
  if (util.isTerminated) {
    return;
  }

  // Go on the lodestone
  util.moveTo([], xMax + 2.0 + 0.5, zMax - 1.0 + 0.5);
  if (util.isTerminated) {
    return;
  }

  // If we're on the last floor then we're done
  if (currentLayer == numberOfFloors) {
    util.stopBot("Finished harvesting!");
    return;
  }

  // Go down the lodestone
  recursionCounter = 0;
  while (!util.isTerminated) {
    KeyBind.keyBind("key.sneak", true);
    Client.waitTick();
    KeyBind.keyBind("key.sneak", false);

    // Wait for player's y position to stabilize
    Client.waitTick(10);

    floorCheck = util.getCurrentFloor(
      yFloor1,
      yFloorStep,
      numberOfFloors,
      true,
    );
    if (util.isTerminated) {
      break;
    }

    if (floorCheck != currentLayer) {
      currentLayer = floorCheck;

      // Go on the farm in a straight line
      util.moveTo([], xMax + 0.5, zMax - 1.0 + 0.5);
      if (util.isTerminated) {
        return;
      }

      // Go in the corner of the farm
      util.moveTo([], xMax + 0.5, zMax + 0.5);
      if (util.isTerminated) {
        return;
      }

      // Start harvesting
      util.botLog("Starting floor " + currentLayer + "!");
      botMode = "startOfFloorA";
      break;
    }

    // Prevent infinite loop
    recursionCounter++;
    if (recursionCounter > 10) {
      util.stopBot("Failed to go down the lodestone 10 times");
      break;
    }

    util.checkManualAbort();
  }
}

function holdCrop() {
  inv = Player.openInventory();
  inv.setSelectedHotbarSlotIndex(cropSlot - 1);
  search = inv.findItem(getHoldCrop());
  if (search.length > 0 && search[0] != 35 + cropSlot) {
    inv.swap(search[0], 35 + cropSlot);
  }
}

function checkDeposit(playerX, playerZ) {
  // Drop crop and crop seeds into collection system
  if (depositCoords.includes(playerX) && playerZ == zMax) {
    // Drop crop
    if (util.hasAnyItem([crop], false, [9, 44])) {
      // Walk to crop collection system
      util.moveTo([], playerX + 0.5 + 2.0, playerZ + 0.5, 0.2);
      // Look at crop collection system
      // Slightly angled up as to not accidentally get stuck looking at a sign menu
      util.player.lookAt(0, -10);
      Client.waitTick();
      // Drop all crop
      util.dropAll([crop]);
      // Walk back to where we were
      util.moveTo([], playerX + 0.5, playerZ + 0.5, 0.2);
    }

    // Drop seeds if applicable
    if (hasSeeds() && util.hasAnyItem([getSeeds()], false, [9, 44])) {
      // Walk to center of block
      util.moveTo([], playerX + 0.5, playerZ + 0.5, 0.2);
      // Look at seed collection system
      // Slightly angled up as to not accidentally get stuck looking at a sign menu
      util.player.lookAt(0, -10);
      Client.waitTick();
      // Drop all seeds
      util.dropAll([getSeeds()]);
    }
  }
}

// Returns true for wheat and beetroot, otherwise false
function hasSeeds() {
  return crop == WHEAT || crop == BEETROOT;
}

// Returns the minecraft ID of the seeds for the crop you're farming
function getSeeds() {
  if (crop == BEETROOT) {
    return BEETROOT_SEEDS;
  }
  return WHEAT_SEEDS;
}

// Returns the item to hold in your hand for faster harvest
function getHoldCrop() {
  if (hasSeeds()) {
    return getSeeds();
  }
  return crop;
}
