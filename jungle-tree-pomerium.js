/*

This bot is designed to run on Pomerium's jungle tree farm.

You need:
- Diamond Axe with E4U3
- (?) Shears (optional but recommended)
- (?) stacks of Jungle Sapling
- Sufficient Food

Start anywhere on the farm.
Feel free to stop the bot and let it resume at any time.
It will chop west to east, then south to north.
Hold the abort key to terminate.

*/

// Don't touch this...
const util = require("./blow-utils.js");

// --- THINGS YOU CAN CONFIGURE

// Here you can change the abort key (default is Tab)
util.setAbortKey("tab");

// If true, the bot will automatically disconnect whenever it stops running.
util.setDisconnectWhenDone(true);

// If true, the bot will mark you as AFK while it's running.
util.setGoAfk(true);

// If true, the bot will disable bypass while it's running.
// (Prevents the bot from breaking reinforced blocks by accident)
util.setDisableBypass(true);

// The bot's name will be used in chat logs.
util.setBotName("PomeriumJungleTreeBot");

// The y level of the farm's bottommost floor
const yFloor1 = 96;

// The number of blocks between each floor
// (e.g. if floor 1 is at y=67 and floor 2 is at y=70, then it's 3)
const yFloorStep = 10;

// The number of floors your farm has
const numberOfFloors = 1;

// The coordinates where the first and last saplings are located
const minX = -8419;
const maxX = -8294;
const minZ = 151;
const maxZ = 216;

// The number of blocks to get from one tree row to the next
const distanceBetweenRows = 5;

// Set this to false if you're not using shears (not recommended)
const hasShears = false;

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
const chopTime = 2000;

// The coordinates of the lodestone where the bot can move between floors
const lodestoneX = minX;
const lodestoneZ = maxZ + 4;

// The coordinates of the (single) chest containing saplings.
// The bot will restock on saplings at the start of each floor.
// This chest must be reachable from the lodestone's position.
const saplingChestX = lodestoneX;
const saplingChestZ = lodestoneZ + 1;

// --- End of things you can configure
// Don't touch anything below

const JUNGLE_SAP = "minecraft:jungle_sapling";

botMode = "setup";
direction = "east";

currentFloor = util.getCurrentFloor(yFloor1, yFloorStep, false);

nextRowPos = 0;

// Tracks how long you've been attacking with shears
shearsTime = 0;

util.setMainLoop(mainLoop);

util.startMainLoop();

function mainLoop() {
  if (botMode == "setup") {
    botMode = "main";
    direction =
      util.player.getYaw() >= 0 && util.player.getYaw() <= 180
        ? "west"
        : "east";

    // Make the bot restock on saplings if it starts at the start of the floor
    if (util.isOnBlock(lodestoneX, lodestoneZ)) {
      restockSaplings();
    }

    // Make the bot go to the next row if we're not on a row
    flooredZ = Math.floor(util.player.getZ());
    if (flooredZ > maxZ) {
      nextRowPos = maxZ;
      botMode = "toNextRow";
      direction = "north";
    } else if ((maxZ - flooredZ) % distanceBetweenRows != 0) {
      nextRowPos =
        flooredZ -
        ((maxZ - flooredZ) % distanceBetweenRows) +
        distanceBetweenRows;
      botMode = "toNextRow";
      direction = "north";
    }
  } else if (botMode == "main" || botMode == "toNextRow") {
    util.eatCheck(foodSlot);

    // Walk forward while using your tool
    util.lookAt(dirAngle(), 0);
    if (hasShears && shearsTime < 2) {
      util.grabShears(shearsSlot);
      shearsTime++;
    } else {
      util.grabAxe(axeSlot);
    }
    if (util.isTerminated) {
      return;
    }
    KeyBind.keyBind("key.forward", true);
    KeyBind.keyBind("key.attack", true);

    if (!util.isMoving()) {
      chop();
      shearTime = 0;
    }

    if (botMode == "main") {
      checkRowEnd();
    } else if (
      botMode == "toNextRow" &&
      Math.floor(util.player.getZ()) <= nextRowPos
    ) {
      KeyBind.keyBind("key.forward", false);
      centerBot();
      botMode = "main";
      setMainDirection();
      util.botLog(direction);
      shearsTime = 0;
    }
  } else if (botMode == "toNextFloor") {
    util.lookAt(dirAngle(), 0);

    // Edge case where a tree grew in your way
    if (!util.isMoving()) {
      chop();
    }

    // Walk forward and sprint jump
    KeyBind.keyBind("key.forward", true);
    util.sprint(util.player.getZ() < lodestoneZ - 5);

    // Once you reach the lodestone...
    if (util.player.getZ() >= lodestoneZ - 1) {
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
  if (direction == "west" && Math.floor(util.player.getX()) > minX) {
    return;
  }
  if (direction == "east" && Math.floor(util.player.getX()) < maxX) {
    return;
  }

  dropWood();

  centerBot();

  shearsTime = 0;

  // If we're at the end of the farm, go back to the first row
  if (util.player.getZ() <= minZ) {
    botMode = "toNextFloor";
    direction = "south";
  }
  // otherwise, move across the bridge to get to the next row
  else {
    nextRowPos = Math.floor(util.player.getZ()) - distanceBetweenRows;
    botMode = "toNextRow";
    direction = "north";
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

  util.grabAxe(axeSlot);
  if (util.isTerminated) {
    return;
  }

  centerBot();

  // Chop the log that's on the ground
  KeyBind.keyBind("key.attack", true);
  util.lookAt(dirAngle() - 10, 40);
  Client.waitTick(9);
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
    ((direction == "south" && blockCenterPos[1] < feetGoalPos[1]) ||
      (direction == "north" && blockCenterPos[1] > feetGoalPos[1]) ||
      (direction == "east" && blockCenterPos[0] < feetGoalPos[0]) ||
      (direction == "west" && blockCenterPos[0] > feetGoalPos[0])) &&
    !util.isTerminated
  ) {
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

  // Place a sapling
  util.lookAt(dirAngle(), 90);
  KeyBind.keyBind("key.attack", false);
  grabSapling();
  util.player.interact();
  Client.waitTick();
  util.player.interact();
  Client.waitTick();
  util.player.interact();
  Client.waitTick();
  util.player.interact();
  util.lookAt(dirAngle(), 0);
}

// Drops all relevant items into the water collection.
function dropWood() {
  KeyBind.keyBind("key.attack", false);
  KeyBind.keyBind("key.forward", false);

  angle = -(dirAngle() - 160);
  // Edge case: if we're on the last row of the farm,
  // drop items the other way instead
  if (util.player.getZ() <= minZ) {
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

  nextRowPos = maxZ;

  botMode = "toNextRow";
  direction = "north";
  shearsTime = 0;
}

function setMainDirection() {
  util.botLog(
    Math.abs(util.player.getX() - minX) +
      "; " +
      Math.abs(util.player.getX() - maxX),
  );
  direction =
    Math.abs(util.player.getX() - minX) < Math.abs(util.player.getX() - maxX)
      ? "east"
      : "west";
}

function getCurrentY() {
  return yFloor1 + (currentFloor - 1) * yFloorStep;
}

function restockSaplings() {
  util.openChest([saplingChestX, getCurrentY(), saplingChestZ]);
  util.withdrawAll([JUNGLE_SAP], false, false);
}

function grabSapling() {
  util.grabItem([JUNGLE_SAP], "saplings", saplingSlot);
}
