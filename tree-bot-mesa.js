/*

This bot is designed to run on Fairhill's mesa tree farm.

You need:
- 3 Diamond Axes with E5U3
- 10 Shears
- 18 stacks of Oak Sapling
- Sufficient Food

Start on any row of the farm
It will chop south to north, then west to east
Hold the abort key to terminate

*/

// The key you press to manually stop the bot
const abortKey = "tab";

// Will automatically disconnect you when the bot terminates
const disconnectWhenDone = true;

// The slot in your hotbar you want this bot to use (1-9)
mainSlot = 1;

// Set this to false if you're not using shears (not recommended)
const hasShears = true;

// Don't use axes that don't have this much durability
const minimumAxeDura = 10;

// Change this depending on how fast your axe is
// Recommended values: 2000 for Diamond E4, 1800 for Diamond E5
const chopTime = 2000;

// The coordinates where your farm starts and ends (on 1st floor)
const minX = -4333;
const maxX = -4243;

const minZ = -3038;
const maxZ = -2852;

// The coordinates of the lodestone
const lodestoneX = minX - 4;
const lodestoneZ = maxZ;

// The coordinates of a chests containing saplings.
// The farm is quite large, so the bot needs new saplings on each floor.
const saplingChestX = -4338;
const saplingChestZ = -2852;

// The Z value of the bridge that connects each tree row
// This bridge should be on the south side of the farm
// (rows are north-south, bridges are east-west)
const bridgeZ = -2852;

// The number of blocks to get from one tree row to the next
const distanceBetweenRows = 6;

// The y level of each layer on the farm
const floors = [112, 120, 128, 136];

// The y levels at which your farm grows birch instead of oak
const birch_layers = [];

// Don't touch anything below

const BOT_NAME = "MesaTreeFarmBot";
const ABORT_MANUALLY = "Player has pressed the abort key.";
const OAK_SAP = "minecraft:oak_sapling";

const p = Player.getPlayer();

mainSlot = mainSlot + 35;

// Tracks how long you've been attacking with shears
shearsTime = 0;

botMode = "main";
direction = p.getYaw() > -90 && p.getYaw() < 90 ? "south" : "north";

currentLayer = getCurrentFloor(p.getY());

nextRowX = 0;

isChoppingBirch = false;
sapling = OAK_SAP;
updateSaplingType();

terminatedEarly = true;
if (botMode != "terminate") {
  // Make the bot restock on saplings if it starts at the start of the floor
  if (isOnLodestone()) {
      restockSaplings();
  }

  // Make the bot go to the next row if we're not on a row
  flooredX = Math.floor(p.getX());
  if (p.getX() < getMinX()) {
    nextRowX = getMinX();
    direction =
      Math.abs(p.getZ() - getMinZ()) < Math.abs(p.getZ() - getMaxZ()) ? "south" : "north";
    botMode = "toNextRow";
  } else if ((flooredX - getMinX()) % distanceBetweenRows != 0) {
    nextRowX =
      flooredX -
      ((flooredX - getMinX()) % distanceBetweenRows) +
      distanceBetweenRows;
    direction =
      Math.abs(p.getZ() - getMinZ()) < Math.abs(p.getZ() - getMaxZ()) ? "south" : "north";
    botMode = "toNextRow";
  }

  terminatedEarly = false;
  Chat.say("/ctb");
  Chat.say("/afk");
  main();
} else {
  terminate();
}

// Main loop
function main() {
  while (botMode != "terminate") {
    Client.waitTick();

    if (botMode == "main") {
      eatCheck();

      // Run north while using your axe/shears,
      // until you hit a tree (or the end of the farm)
      lookAt(dirAngle(), 0);
      if (!isChoppingBirch && hasShears && shearsTime < 2) {
        grabShears();
        shearsTime++;
      } else {
        grabAxe();
        if (botMode == "terminate") {
          break;
        }
      }
      KeyBind.keyBind("key.forward", true);
      KeyBind.keyBind("key.attack", true);

      if (!isMoving()) {
        chop();
        shearsTime = 0;
      }
      checkRowEnd();
    } else if (botMode == "toNextRow") {
      lookAt(-90, 0);
      if (!isChoppingBirch && hasShears && shearsTime < 2) {
        grabShears();
        shearsTime++;
      } else {
        grabAxe();
        if (botMode == "terminate") {
          break;
        }
      }
      KeyBind.keyBind("key.forward", true);
      KeyBind.keyBind("key.attack", true);
      sprint();

      if (!isMoving()) {
        chopEast();
      }

      if (p.getX() >= nextRowX) {
        KeyBind.keyBind("key.forward", false);
        centerBot();
        botMode = "main";
        shearsTime = 0;
      }
    } else if (botMode == "toNextFloor") {
      // HARDCODED for Fairhill's tree farm
      const hasExtraStep = currentLayer > 2 && Math.floor(p.getZ()) != minZ;
      const objectiveX = hasExtraStep ? getMinX() : lodestoneX;

      lookAt(90, 0);

      // Use shears to break leaves if player gets stuck
      if (!isMoving()) {
        waitTime = 1;
        if (hasShears) {
          grabShears();
          waitTime = 1;
        } else {
          grabFood();
          waitTime = 20;
        }
        KeyBind.keyBind("key.attack", true);
        Client.waitTick(waitTime);
        KeyBind.keyBind("key.attack", false);
      }

      // Walk forward and sprint jump
      KeyBind.keyBind("key.forward", true);
      sprint(p.getX() > objectiveX + 5);

      // Once you reach the objective...
      if (p.getX() <= objectiveX + 1) {
        KeyBind.keyBind("key.forward", false);

        if (hasExtraStep) {
          // do the extra step here
        } else {
          jumpToNextFloor();
        }
      }
    }
    checkFell();
    checkManualAbort();
  }

  Chat.say("/ctb");
  Chat.say("/afk");
  terminate();
}

function terminate() {
  KeyBind.keyBind("key.forward", false);
  KeyBind.keyBind("key.attack", false);
  KeyBind.keyBind("key.sneak", false);
  KeyBind.keyBind("key.use", false);

  if (terminateReason == ABORT_MANUALLY) {
    botLog("Bot manually terminated");
  } else {
    botLog("Bot terminated: " + terminateReason);
  }

  World.playSound("entity.ghast.scream", 100, 0);

  if (
    disconnectWhenDone &&
    terminateReason != ABORT_MANUALLY &&
    !terminatedEarly
  ) {
    Client.disconnect();
  }
}

function centerBot(coords = [p.getX(), p.getY(), p.getZ()]) {
  const ERROR_MARGIN = 0.075;
  x = Math.floor(coords[0]) + 0.5;
  y = coords[1];
  z = Math.floor(coords[2]) + 0.5;

  KeyBind.keyBind("key.attack", false);
  KeyBind.keyBind("key.forward", true);
  KeyBind.keyBind("key.sneak", true);
  do {
    p.lookAt(x, y, z);
    Client.waitTick();
    checkFell();
    checkManualAbort();
  } while (
    (Math.abs(p.getX() - x) > ERROR_MARGIN ||
      Math.abs(p.getZ() - z) > ERROR_MARGIN) &&
    botMode != "terminate"
  );
  KeyBind.keyBind("key.forward", false);
  KeyBind.keyBind("key.sneak", false);
}

function botLog(message) {
  Chat.log("[" + BOT_NAME + "] " + message);
}

function checkFell() {
  if (p.getY() < getCurrentY() - 0.5) {
    terminateReason = "Bot fell";
    botMode = "terminate";
  }
}

function checkManualAbort() {
  if (KeyBind.getPressedKeys().contains("key.keyboard." + abortKey)) {
    botLog("Player has pressed abort key. Terminating.");
    terminateReason = ABORT_MANUALLY;
    botMode = "terminate";
  }
}

// Grabs a new axe when current axe is too close to breaking
// Make sure this is only called when you're holding a tool
function checkDurability() {
  if (
    inv.getSlot(36 + inv.getSelectedHotbarSlotIndex()).getDurability() <
    minimumAxeDura
  ) {
    grabAxe();
  }
}

function chop() {
  KeyBind.keyBind("key.forward", false);

  grabAxe();
  if (botMode == "terminate") {
    return;
  }

  centerBot();

  // Chop the log that's on the ground
  KeyBind.keyBind("key.attack", true);
  lookAt(dirAngle() - 10, 40);
  Client.waitTick(9);
  lookAt(dirAngle(), 0);

  // Move to where the tree was
  targetFeetZ = Math.floor(p.getZ()) + 0.5;
  feetZGoal = targetFeetZ - 1;
  if (direction != "north") {
    feetZGoal = targetFeetZ + 1;
  }
  attemptwalk = 0;
  while (
    ((direction == "south" && targetFeetZ < feetZGoal) ||
      (direction == "north" && targetFeetZ > feetZGoal)) &&
    botMode != "terminate"
  ) {
    KeyBind.keyBind("key.forward", true);
    Time.sleep(5);
    targetFeetZ = Math.floor(p.getZ()) + 0.5;
    KeyBind.keyBind("key.forward", false);
    attemptwalk++;
    if (attemptwalk > 50) {
      chop();
      return;
    }
    checkFell();
    checkManualAbort();
  }

  checkDurability();
  if (botMode == "terminate") {
    return;
  }

  // Chop wood above you
  lookAt(dirAngle(), -90);
  Time.sleep(chopTime);

  // Place a sapling
  lookAt(dirAngle(), 90);
  KeyBind.keyBind("key.attack", false);
  grabSapling();
  p.interact();
  Client.waitTick();
  p.interact();
  Client.waitTick();
  p.interact();
  Client.waitTick();
  p.interact();
  lookAt(dirAngle(), 0);
}

function chopEast() {
  KeyBind.keyBind("key.forward", false);

  grabAxe();
  if (botMode == "terminate") {
    return;
  }
  centerBot();

  // Chop the log that's on the ground
  KeyBind.keyBind("key.attack", true);
  lookAt(-100, 40);
  Client.waitTick(8);
  lookAt(-90, 0);

  // Move to where the tree was
  currentX = p.getX();
  attempts = 0;
  while (currentX < nextRowX && botMode != "terminate") {
    KeyBind.keyBind("key.forward", true);
    Time.sleep(5);
    currentX = p.getX();
    KeyBind.keyBind("key.forward", false);
    attempts++;
    if (attempts > 50) {
      chopEast();
      return;
    }
    checkFell();
    checkManualAbort();
  }

  checkDurability();
  if (botMode == "terminate") {
    return;
  }

  // Chop wood above you
  lookAt(0, -90);
  Time.sleep(chopTime);

  // Place a sapling
  lookAt(0, 90);
  KeyBind.keyBind("key.attack", false);
  grabSapling();
  p.interact();
  Client.waitTick();
  p.interact();
  Client.waitTick();
  p.interact();
  Client.waitTick();
  p.interact();
  lookAt(-90, 0);
  Client.waitTick();
}

function lookAt(yaw, pitch, frac = 0.3) {
  const lerp = (a, b, f) => {
    return Math.fround(a + f * (b - a));
  };

  const round = (n, d) => {
    const pwr = Math.pow(10, d);
    return Math.round((n + Number.EPSILON) * pwr) / pwr;
  };

  yaw = round(yaw, 1);
  pitch = round(pitch, 1);

  // the "plyr" variable isn't needed if you have one defined already and change the instances of "plyr" here to that variable
  const plyr = Player.getPlayer();
  const plyrRaw = plyr.getRaw();

  let currYaw = plyr.getYaw();
  let currPitch = plyr.getPitch();

  const deltaYaw = yaw - currYaw;
  currYaw =
    deltaYaw > 180 ? currYaw + 360 : deltaYaw < -180 ? currYaw - 360 : currYaw;

  while (round(currYaw, 1) !== yaw || round(currPitch, 1) !== pitch) {
    currYaw = lerp(currYaw, yaw, frac);
    currPitch = lerp(currPitch, pitch, frac);

    // support forge and fabric, raw methods to set yaw and pitch
    try {
      plyrRaw.method_36456(currYaw);
      plyrRaw.method_36457(currPitch);
    } catch {
      plyrRaw.m_146922_(currYaw);
      plyrRaw.m_146926_(currPitch);
    }

    Time.sleep(5);
  }
  Time.sleep(10);
}

// Drops all relevant items into the water collection.
function dropWood() {
  KeyBind.keyBind("key.attack", false);
  KeyBind.keyBind("key.forward", false);

  angle = -(dirAngle() - 160);
  // Edge case: if we're on the easternmost row of the farm, drop items west instead
  if (p.getX() >= getMaxX()) {
    angle = -angle;
  }
  lookAt(angle, 45);
  Client.waitTick();

  const RELEVANT_ITEMS = [
    "minecraft:oak_log",
    "minecraft:oak_leaves",
    "minecraft:apple",
    "minecraft:birch_log",
    "minecraft:birch_leaves",
    "minecraft:stick",
  ];
  inv = Player.openInventory();
  // Loop over whole inventory
  for (let i = 9; i < 45; i++) {
    if (RELEVANT_ITEMS.includes(inv.getSlot(i).getItemId())) {
      inv.dropSlot(i, true);
      Client.waitTick();
    }
  }
  inv.close();
  Client.waitTick();
}

function checkRowEnd() {
  if (direction == "north" && p.getZ() > getMinZ()) {
    return;
  }
  if (direction == "south" && p.getZ() < getMaxZ()) {
    return;
  }

  dropWood();
  switchDirection();

  centerBot([p.getX(), p.getY(), p.getZ()]);
  Client.waitTick();
  // Yup that's right, do it again
  centerBot([p.getX(), p.getY(), p.getZ()]);

  shearsTime = 0;

  // If we're at the end of the farm, go back to the first row
  if (p.getX() >= getMaxX()) {
    botMode = "toNextFloor";
  }
  // otherwise, move across the bridge to get to the next row
  else {
    nextRowX = Math.floor(p.getX() + distanceBetweenRows);
    botMode = "toNextRow";
  }
}

// Returns true if you're currently moving.
function isMoving() {
  const EPSILON = 0.01;
  x = p.getX();
  z = p.getZ();
  Client.waitTick(2);
  return !(
    Math.abs(x - p.getX()) < EPSILON && Math.abs(z - p.getZ()) < EPSILON
  );
}

function grabShears() {
  grabItem(["minecraft:shears"], "shears");
}

function grabAxe() {
  grabItem(["minecraft:diamond_axe"], "a diamond axe", true);
}

function grabSapling() {
  grabItem([sapling], "saplings");
}

function grabFood() {
  validItems = [
    "minecraft:bread",
    "minecraft:cooked_porkchop",
    "minecraft:cooked_mutton",
    "minecraft:cooked_salmon",
    "minecraft:cooked_beef",
    "minecraft:baked_potato",
    "minecraft:melon_slice",
    "minecraft:carrot",
    "minecraft:cooked_chicken",
    "minecraft:cooked_cod",
    "minecraft:cooked_rabbit",
    "minecraft:cookie",
    "minecraft:potato",
    "minecraft:pumpkin_pie",
    "minecraft:glow_berries",
    "minecraft:tropical_fish",
    "minecraft:sweet_berries",
    "minecraft:golden_carrot",
  ];
  grabItem(validItems, "valid food");
}

// Warning: if you enable checkForDurability,
// make sure you're definitely only checking for tools, otherwise the script may crash
function grabItem(validItems, itemDescription, checkForDurability = false) {
  inv = Player.openInventory();

  // Search hotbar (slots 36 to 44)
  for (i = 0; i < 9; i++) {
    if (
      validItems.includes(inv.getSlot(i + 36).getItemId()) &&
      (!checkForDurability ||
        inv.getSlot(i + 36).getDurability() >= minimumAxeDura)
    ) {
      inv.setSelectedHotbarSlotIndex(i);
      return;
    }
  }

  // Search rest of inventory (slots 9 to 35)
  for (i = 9; i < 36; i++) {
    if (
      validItems.includes(inv.getSlot(i).getItemId()) &&
      (!checkForDurability || inv.getSlot(i).getDurability() >= minimumAxeDura)
    ) {
      inv.swap(i, mainSlot);
      inv.setSelectedHotbarSlotIndex(mainSlot - 36);
      return;
    }
  }

  // If the code makes it to here, it means we failed to find a valid item
  terminateReason = "Could not find " + itemDescription + " in inventory";
  botMode = "terminate";
}

// Automatically eats when in need
function eatCheck() {
  minFoodLevel = 14;
  if (p.getFoodLevel() >= minFoodLevel) {
    return;
  }
  KeyBind.keyBind("key.forward", false);
  KeyBind.keyBind("key.attack", false);
  botLog("Food level low, auto eating");
  grabFood();
  Client.waitTick(10);
  KeyBind.keyBind("key.use", true);
  Client.waitTick(33);
  KeyBind.keyBind("key.use", false);
}

// Note: make sure you don't call these more than once per tick
function sprint(alsoJump = false) {
  Player.addInput(Player.createPlayerInput(1.0, 0.0, alsoJump, true));
}

function jump() {
  Player.addInput(Player.createPlayerInput(0.0, 0.0, true, false));
}

// Say for example the x coordinate of a block is -67.
// Turns out that actually when standing in the middle of that block,
// the player's x coordinate is -66.5.
// So if given coord is negative, adds 1 to it. Otherwise returns the value unchanged.
function correctedCoord(coord) {
  if (coord < 0) {
    return coord + 1;
  }
  return coord;
}

function updateSaplingType() {
  if (birch_layers.includes(getCurrentY())) {
    isChoppingBirch = true;
    sapling = "minecraft:birch_sapling";
  } else {
    isChoppingBirch = false;
    sapling = OAK_SAP;
  }
}

function switchDirection() {
  if (direction == "north") {
    direction = "south";
  } else {
    direction = "north";
  }
}

function dirAngle() {
  if (direction == "north") {
    return 180;
  }
  return 0;
}

function getMinZ() {
  if (currentLayer == 3 || currentLayer == 4) {
    return minZ + 3 + 1;
  }
  return minZ + 1;
}

function getMaxZ() {
  if (currentLayer == 3 || currentLayer == 4) {
    return maxZ - 3;
  }
  return maxZ;
}

function getMinX() {
  if (currentLayer == 2 || currentLayer == 4) {
    return minX + 3;
  }
  return minX;
}

function getMaxX() {
  if (currentLayer == 2 || currentLayer == 4) {
    return maxX - 3;
  }
  return maxX;
}

function getCurrentFloor() {
  playerY = p.getY();
  floorFound = floors.indexOf(playerY);
  if (floorFound == -1) {
    botMode = "terminate";
    terminateReason =
      "player isn't on the farm (player's y value is: " + playerY + ")";
    return 1;
  }
  return floorFound + 1;
}

function getCurrentY() {
  return floors[currentLayer - 1];
}

// chestCoords should be an array with 3 elements, x y z
function openChest(chestCoords, attempts = 0) {
  // Prevent infinite loop
  if (attempts >= 10) {
    botLog("Failed to open chest after 10 attempts!");
    return;
  }

  p.lookAt(chestCoords[0] + 0.5, chestCoords[1] + 0.5, chestCoords[2] + 0.5);
  KeyBind.keyBind("key.use", true);
  Client.waitTick();
  KeyBind.keyBind("key.use", false);

  // Wait for the chest to open
  Client.waitTick(5);
  inv = Player.openInventory();
  if (inv.getTotalSlots() != 63) {
    // Try again
    openChest(chestCoords, attempts + 1);
  }
}

// validItems is an array with item IDs
function withdrawAll(validItems, isCompacted, inv) {
  // Search the chest (slots 0 to 26)
  for (i = 0; i <= 26; i++) {
    if (
      validItems.includes(inv.getSlot(i).getItemId()) &&
      ((isCompacted &&
        inv.getSlot(i).getLore().length > 0 &&
        inv.getSlot(i).getLore()[0].getString() == "Compacted Item") ||
        (!isCompacted &&
          (inv.getSlot(i).getLore().length == 0 ||
            inv.getSlot(i).getLore()[0].getString() != "Compacted Item")))
    ) {
      inv.quick(i);
    }
  }
}

function restockSaplings() {
  openChest([saplingChestX, getCurrentY(), saplingChestZ]);
  inv = Player.openInventory();
  withdrawAll([OAK_SAP], false, inv);
  inv.close();
  Client.waitTick();
}

function jumpToNextFloor() {
  if (currentLayer == 4) {
    botMode = "terminate"
    terminateReason = "Finished the final floor!"
  }

  playerY = p.getY();
  // Use the lodestone to go up
  jump();
  Client.waitTick();
  // Wait for player's position to stabilize
  Client.waitTick(5);

  currentLayer++;
  updateSaplingType();

  restockSaplings();

  nextRowX = getMinX();

  botMode = "toNextRow";
  shearsTime = 0;
}

function isOnLodestone() {
    return Math.floor(p.getX()) == lodestoneX && Math.floor(p.getZ()) == lodestoneZ
}
