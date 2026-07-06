/*

This bot is designed to run on Cane Corp's jungle tree farm.

You need:
- Diamond Axe with E4U3
- (?) Shears (optional but recommended)
- (?) stacks of Jungle Sapling
- Sufficient Food

Start anywhere on the farm.
Feel free to stop the bot and let it resume at any time.
Hold the abort key to terminate.

*/

// Don't touch this...
const util = require("./blow-utils.js");

// --- THINGS YOU CAN CONFIGURE

// Here you can change the abort key (default is Tab)
util.setAbortKey("tab");

util.setAutoReconnect(true);

// If true, the bot will automatically disconnect whenever it stops running.
util.setDisconnectWhenDone(true);

// If true, the bot will mark you as AFK while it's running.
util.setGoAfk(true);

// If true, the bot will disable bypass while it's running.
// (Prevents the bot from breaking reinforced blocks by accident)
util.setDisableBypass(true);

// The bot's name will be used in chat logs.
util.setBotName("CaneCorpTreeBot");

// Set this to true if you want to chop from west to east,
// or set it to false to chop from east to west
const xDirection = false;

// The y level of the farm's bottommost floor
const yFloor1 = 124;

// The number of blocks between each floor
// (e.g. if floor 1 is at y=67 and floor 2 is at y=70, then it's 3)
const yFloorStep = 10;

// The number of floors your farm has
const numberOfFloors = 1;

// The coordinates where the first and last saplings are located
const minX = -3452;
const maxX = -3317;
const minZ = -824;
const maxZ = -654;

// The number of blocks to get from one tree row to the next
const distanceBetweenRows = 5;

// Set this to false if you're not using shears (not recommended)
const hasShears = true;

// The slot in your hotbar where the food will be (number from 1 to 9)
const foodSlot = 1;

// The slot in your hotbar where the axe will be (number from 1 to 9)
const axeSlot = 3;

// The slot in your hotbar where the shears will be (number from 1 to 9)
const shearsSlot = 4;

// The slot in your hotbar where the saplings will be (number from 1 to 9)
const saplingSlot = 5;

// The bot won't use axes that don't have at least this much durability
const minimumToolDura = 10;

// Change this depending on how fast your axe is
// Recommended values: 2000 for Diamond E4, 1800 for Diamond E5
const chopTime = 2400;

// The coordinates of the lodestone where the bot can move between floors
const lodestoneX = maxX + distanceBetweenRows;
const lodestoneZ = minZ;

// The coordinates of the (single) chest containing saplings.
// The bot will restock on saplings at the start of each floor.
// This chest must be reachable from the lodestone's position.
const saplingChestX = lodestoneX + 1;
const saplingChestZ = lodestoneZ;

// --- End of things you can configure
// Don't touch anything below

const JUNGLE_SAP = "minecraft:jungle_sapling";

botMode = "setup";
direction = "south";

currentFloor = util.getCurrentFloor(yFloor1, yFloorStep, numberOfFloors, false);

nextRowPos = 0;

// Tracks how long you've been attacking with shears
shearsTime = 0;

util.setMainLoop(mainLoop);

util.startMainLoop();

function mainLoop() {
  playerX = Math.floor(util.player.getX());
  playerZ = Math.floor(util.player.getZ());

  if (botMode == "setup") {
    botMode = "main";
    direction =
      util.player.getYaw() >= -90 && util.player.getYaw() <= 90
        ? "south"
        : "north";

    // Make the bot restock on saplings if it starts at the start of the floor
    if (util.isOnBlock(lodestoneX, lodestoneZ)) {
      restockSaplings();
    }

    // Make the bot go to the next row if we're not on a row
    if (isBeforeStartOfFarm(playerX)) {
      nextRowPos = getStartOfFarm();
      botMode = "toNextRow";
      direction = getXDirectionString();
    } else if (
      Math.abs(playerX - getStartOfFarm()) % distanceBetweenRows !=
      0
    ) {
      nextRowPos = getNextRowPos(playerX);
      botMode = "toNextRow";
      direction = getXDirectionString();
    }
  } else if (botMode == "main" || botMode == "toNextRow") {
    util.eatCheck(foodSlot);

    // Walk forward while using your tool
    util.lookAt(dirAngle(), 0);
    if (hasShears && shearsTime < 3) {
      util.grabShears(shearsSlot);
    } else {
      util.grabAxe(axeSlot, minimumToolDura);
    }
    shearsTime++;
    if (shearsTime >= 10) {
      shearsTime = 0;
    }
    if (util.isTerminated) {
      return;
    }
    KeyBind.keyBind("key.forward", true);
    KeyBind.keyBind("key.attack", true);

    if (isInFrontOfTree(playerX, playerZ) && !util.isMoving()) {
      chop();
      shearsTime = 0;
    }
    // Code to automatically plant saplings on the whole farm
    /* else if (
      shearsTime > 5 &&
      Math.abs(playerZ - minZ) % distanceBetweenRows == 0
    ) {
      util.moveTo([], playerX + 0.5, playerZ + 0.5);
      plantSapling();
      shearsTime = 0;
      } */

    if (botMode == "main") {
      checkRowEnd();
    } else if (botMode == "toNextRow" && hasReachedNextRow(playerX)) {
      KeyBind.keyBind("key.forward", false);

      // Center yourself properly
      util.moveTo([], nextRowPos + 0.5, playerZ + 0.5);

      botMode = "main";
      setMainDirection();
      shearsTime = 0;
    }
  } else if (botMode == "toNextFloor") {
    util.lookAt(dirAngle(), 0);

    // Walk forward and sprint jump
    KeyBind.keyBind("key.forward", true);
    util.sprint(Math.abs(playerX - lodestoneX) > 5);

    // Edge case where a tree grew in your way
    if (!util.isMoving()) {
      chop();
    }

    // Once you reach the lodestone...
    if (hasReachedLodestone(playerX)) {
      KeyBind.keyBind("key.forward", false);
      jumpToNextFloor();
    }
  }

  checkFell();
}

function checkFell() {
  if (util.player.getY() < getCurrentY() - 0.5) {
    util.stopBot("Bot fell");
  }
}

function checkRowEnd() {
  playerX = Math.floor(util.player.getX());
  playerZ = Math.floor(util.player.getZ());

  if (direction == "north" && playerZ > minZ) {
    return;
  }
  if (direction == "south" && playerZ < maxZ) {
    return;
  }

  dropWood();

  centerBot();

  shearsTime = 0;

  // If we're at the end of the farm, go back to the first row
  if (isAtEndOfFarm(playerX)) {
    botMode = "toNextFloor";
    direction = getXDirectionString(true);
  }
  // otherwise, move across the bridge to get to the next row
  else {
    nextRowPos = getNextRowPos(playerX);
    botMode = "toNextRow";
    direction = getXDirectionString();
  }
}

function centerBot() {
  util.moveTo(
    [],
    Math.floor(util.player.getX()) + 0.5,
    Math.floor(util.player.getZ()) + 0.5,
  );
}

function dirAngle() {
  if (direction == "west") {
    return 90;
  } else if (direction == "east") {
    return -90;
  } else if (direction == "north") {
    return 180;
  } else if (direction == "south") {
    return 0;
  }
  return 0;
}

function chop() {
  KeyBind.keyBind("key.forward", false);

  util.grabAxe(axeSlot, minimumToolDura);
  if (util.isTerminated) {
    return;
  }

  centerBot();

  // Chop the log that's on the ground
  util.lookAt(dirAngle() - 10, 40);
  // This wait time here is important otherwise sometimes the bot
  // can swing the axe too early and ends up taking too long to break the log
  Client.waitTick();
  KeyBind.keyBind("key.attack", true);
  Client.waitTick(10);
  util.lookAt(dirAngle(), 0);

  // Move to where the tree was
  blockCenterPos = [
    Math.floor(util.player.getX()) + 0.5,
    Math.floor(util.player.getZ()) + 0.5,
  ];
  feetGoalPos = [0, 0];
  if (direction == "east") {
    feetGoalPos = [blockCenterPos[0] + 1, blockCenterPos[1]];
  } else if (direction == "west") {
    feetGoalPos = [blockCenterPos[0] - 1, blockCenterPos[1]];
  } else if (direction == "north") {
    feetGoalPos = [blockCenterPos[0], blockCenterPos[1] - 1];
  } else if (direction == "south") {
    feetGoalPos = [blockCenterPos[0], blockCenterPos[1] + 1];
  }
  attemptwalk = 0;
  while (
    (direction == "south" && blockCenterPos[1] < feetGoalPos[1]) ||
    (direction == "north" && blockCenterPos[1] > feetGoalPos[1]) ||
    (direction == "east" && blockCenterPos[0] < feetGoalPos[0]) ||
    (direction == "west" && blockCenterPos[0] > feetGoalPos[0])
  ) {
    if (util.isTerminated) {
      return;
    }

    KeyBind.keyBind("key.forward", true);
    Client.waitTick();
    blockCenterPos = [
      Math.floor(util.player.getX()) + 0.5,
      Math.floor(util.player.getZ()) + 0.5,
    ];
    KeyBind.keyBind("key.forward", false);
    attemptwalk++;
    if (attemptwalk > 50) {
      chop();
      return;
    }
    checkFell();
    util.checkManualAbort();
  }

  // Chop wood above you
  util.lookAt(dirAngle(), -90);
  Time.sleep(chopTime);

  plantSapling();
}

// Places a sapling
function plantSapling() {
  KeyBind.keyBind("key.attack", false);
  util.lookAt(dirAngle(), 90);
  grabSapling();
  Client.waitTick();
  KeyBind.keyBind("key.use", true);
  Client.waitTick(3);
  KeyBind.keyBind("key.use", false);
  util.lookAt(dirAngle(), 0);
  Client.waitTick();
}

// Drops all relevant items into the water collection.
function dropWood() {
  KeyBind.keyBind("key.attack", false);
  KeyBind.keyBind("key.forward", false);

  angle = -(dirAngle() - 160);
  // Edge case: if we're on the last row of the farm,
  // drop items the other way instead
  if (isAtEndOfFarm(Math.floor(util.player.getX()))) {
    angle = -angle;
  }
  util.lookAt(angle, 45);
  Client.waitTick();

  util.dropAll([
    "minecraft:jungle_log",
    "minecraft:jungle_leaves",
    "minecraft:apple",
    "minecraft:stick",
  ]);
}

function jumpToNextFloor() {
  if ((currentFloor = numberOfFloors)) {
    util.stopBot("Finished chopping all floors!");
    return;
  }

  playerY = util.player.getY();
  // Use the lodestone to go up
  util.jump();
  Client.waitTick();
  // Wait for player's position to stabilize
  Client.waitTick(5);

  currentFloor++;

  restockSaplings();

  nextRowPos = getStartOfFarm();

  botMode = "toNextRow";
  direction = getXDirectionString();
  shearsTime = 0;
}

function setMainDirection() {
  direction =
    Math.abs(util.player.getZ() - minZ) < Math.abs(util.player.getZ() - maxZ)
      ? "south"
      : "north";
}

function getCurrentY() {
  return yFloor1 + (currentFloor - 1) * yFloorStep;
}

function restockSaplings() {
  util.openChest([saplingChestX, getCurrentY(), saplingChestZ]);
  util.withdrawAll([JUNGLE_SAP], false, false);

  // Close inventory
  inv = Player.openInventory();
  inv.close();
  Client.waitTick();
}

function grabSapling() {
  util.grabItem([JUNGLE_SAP], "saplings", saplingSlot);
}

function isBeforeStartOfFarm(playerX) {
  return xDirection ? playerX < minX : playerX > maxX;
}

function isAtEndOfFarm(playerX) {
  return xDirection ? playerX >= maxX : playerX <= minX;
}

function getStartOfFarm() {
  return xDirection ? minX : maxX;
}

function getEndOfFarm() {
  return xDirection ? maxX : minX;
}

// Returns "east" if going from west to east, otherwise "west".
// The output is reversed if oppositeDirection is set to true
function getXDirectionString(oppositeDirection = false) {
  if (oppositeDirection) {
    return xDirection ? "west" : "east";
  }
  return xDirection ? "east" : "west";
}

function getNextRowPos() {
  return xDirection
    ? playerX -
        (Math.abs(playerX - minX) % distanceBetweenRows) +
        distanceBetweenRows
    : playerX +
        (Math.abs(playerX - maxX) % distanceBetweenRows) -
        distanceBetweenRows;
}

function hasReachedNextRow(playerX) {
  return xDirection ? playerX >= nextRowPos : playerX <= nextRowPos;
}

function hasReachedLodestone(playerX) {
  return xDirection ? playerX <= lodestoneX : playerX >= lodestoneX;
}

function isInFrontOfTree(playerX, playerZ) {
  if (
    direction == "north" &&
    Math.abs(playerZ - minZ) % distanceBetweenRows == 1
  ) {
    return true;
  } else if (
    direction == "south" &&
    Math.abs(playerZ - minZ) % distanceBetweenRows == distanceBetweenRows - 1
  ) {
    return true;
  } else if (
    direction == "west" &&
    Math.abs(playerX - minX) % distanceBetweenRows == 1
  ) {
    return true;
  } else if (
    direction == "east" &&
    Math.abs(playerX - minX) % distanceBetweenRows == distanceBetweenRows - 1
  ) {
    return true;
  }
  return false;
}
