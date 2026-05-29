// Bot to passively farm vines.
// The farm is expected to go from east to west, starting on the east side.
// You'll need plenty of shears, and a small amount of food.

// Feel free to change the key to manually stop the bot.
const abortKey = "tab";

// Set this to true if you want the bot to do "/afk" at the start and at the end.
const markYourselfAsAFK = true;

// Set this to true if you want the bot to disconnect at the end.
const disconnectWhenDone = true;

// Put here the coords of the starting block (only x and z).
// If your farm has more than one floor, this is where the lodestone must be.
const startCoords = [-3424, -3317];
// Put here the coords of the block where the bot will turn around (only x and z).
const endCoords = [-3585, -3317];

// Put here the y level of each floor your farm has, from lowest to highest y level.
const floors = [-53, -43];

// Will try to refill on shears if you don't have this many on you.
// Might want to make it higher if your farm is longer and/or has more floors.
const minimumShears = 6;

// The coords of chests near your starting point that contain shears.
// Once in a while the bot will look through these chests to refill on shears.
const shearsChests = [
  [-3422, -53, -3316],
  [-3422, -53, -3317],
  [-3422, -53, -3318],
  [-3422, -52, -3316],
  [-3422, -52, -3317],
  [-3422, -52, -3318],
];

// Don't touch anything below

const BOT_NAME = "VineBot";
const ABORT_MANUALLY = "Player has pressed the abort key.";
const SHEARS = "minecraft:shears";
const numberOfFloors = floors.length;

p = Player.getPlayer();

currentY = p.getPos().y;

// Floor 1 is the lowest floor, then floor 2 is higher up, etc.
currentFloor = 1;

botMode = "main";
botFacingSouth = p.getYaw() > -90 && p.getYaw() < 90;

// Note: the hotbar consists of slots 36 to 44.
mainSlot = 36;

// This counts how long you're taking to recalibrate Z position
recalibrateTimer = 0;

// This is needed for the disconnect code...
isDisconnected = false;

// This is needed to make the bot stop for one tick on every block
// This is to optimize bot yield
lastStopX = Math.floor(p.getPos().x);
// This is needed to make the bot walk forward a little bit on the glass pane
// This is to optimize bot yield
walkForward = false;

// This makes you automatically log back in when you get disconnected
const ticklistener_1 = JsMacros.on(
  "Disconnect",
  JavaWrapper.methodToJava((e) => {
    botLog("Disconnected!");

    // Prevent recursive shenanigans
    if (isDisconnected) {
      return;
    }

    isDisconnected = true;

    if (disconnectWhenDone && botMode == "terminate") {
      return;
    }

    botLog("Will attempt to log back in...");
    if (World.isWorldLoaded()) {
      botLog("The world is already loaded..? Let's wait..?");
      Time.sleep(3000);
      if (World.isWorldLoaded()) {
        botLog("Yeah the world is already loaded. Terminating.");
        isDisconnected = false;
        return;
      }
    }
    while (!World.isWorldLoaded()) {
      Time.sleep(3000);
      botLog("Connecting...");
      Client.connect("play.civmc.net");
      botLog("Tried to connect, let's see if the world loads...");
      Time.sleep(3000);
      if (World.isWorldLoaded()) {
        break;
      }
      botLog("The world hasn't loaded, let's try again later...");
      Time.sleep(14000);
    }
    botLog("Reconnected, we're all good now");
    p = Player.getPlayer();
    isDisconnected = false;
    Client.waitTick(10);
    mainLoop();
  }),
);

// Ensure the user is on the farm
if (
  p.getPos().x > startCoords[0] + 1 ||
  p.getPos().x < endCoords[0] ||
  p.getPos().z > startCoords[1] + 1 ||
  p.getPos().z < startCoords[1]
) {
  botMode = "terminate";
  terminateReason = "not standing inside the farm";
} else {
  currentFloor = getCurrentFloor();
  goAfk();
}

mainLoop();

// Main loop
function mainLoop() {
  // In case you start on a lodestone,
  // ensure you start on the correct floor
  if (botMode != "terminate" && standingOnLodestone()) {
    KeyBind.keyBind("key.sneak", true);
    Client.waitTick(5);
    goToCurrentFloor();
    if (currentFloor == 1 && isOnBlock(startCoords[0], startCoords[1])) {
      checkRefillShears();
    }
  }

  while (botMode != "terminate") {
    KeyBind.keyBind("key.sneak", true);
    grabShears();
    face();

    if (botMode == "recalibrateZ") {
      KeyBind.keyBind("key.forward", false);
      KeyBind.keyBind("key.right", false);
      KeyBind.keyBind("key.attack", false);
      recalibrateZ();
    }
    if (botMode == "main") // Doing the check again is important here
    {
      // Makes the player move forward a little bit to ensure they always
      // target a block (the wall if not vines).
      // When there's nothing to hit, there's a cooldown before
      // the bot can attack again and that is UNOPTIMAL!
      KeyBind.keyBind(
        "key.forward",
        (p.getPos().z -
          (startCoords[1] + 0.5 + (botFacingSouth ? 0.1 : -0.1))) *
          (botFacingSouth ? 1 : -1) <
          0,
      );

      // Makes the player stop moving right for one tick, on each block passed
      // (this optimizes vines yield)
      if (
        (p.getPos().x - (lastStopX + (botFacingSouth ? -0.5 : 1.5))) *
          (botFacingSouth ? 1 : -1) <
        0
      ) {
        KeyBind.keyBind("key.right", false);
        lastStopX = Math.floor(p.getPos().x);
      } else {
        KeyBind.keyBind("key.right", true);
      }

      KeyBind.keyBind("key.attack", true);

      checkEndOfRow();
    }

    checkWrongZ();
    checkFell();
    checkManualAbort();
    Client.waitTick();
  }
  terminate();
}

// Code that runs at the end whenever the bot is terminated
function terminate() {
  KeyBind.keyBind("key.right", false);
  KeyBind.keyBind("key.forward", false);
  KeyBind.keyBind("key.back", false);
  KeyBind.keyBind("key.attack", false);
  KeyBind.keyBind("key.jump", false);
  KeyBind.keyBind("key.sneak", false);
  KeyBind.keyBind("key.use", false);

  if (terminateReason == ABORT_MANUALLY) {
    botLog("Bot manually terminated");
  } else {
    botLog("Bot terminated. Reason: " + terminateReason);
  }

  World.playSound("entity.ghast.scream", 100, 0);

  if (terminateReason != "not standing on the starting block") {
    goAfk();

    if (disconnectWhenDone && terminateReason != ABORT_MANUALLY) {
      Client.disconnect();
    }
  }
}

function botLog(message) {
  Chat.log("[" + BOT_NAME + "] " + message);
}

function checkFell() {
  if (p.getPos().y < currentY - 0.5) {
    terminateReason = "Bot fell";
    botMode = "terminate";
  }
}

// This is a failsafe to make sure the bot stays on the correct z coordinate
function checkWrongZ() {
  if (botMode != "recalibrateZ" && !isOnTrack()) {
    recalibrateTimer = 0;
    botLog("Failsafe: recalibrating Z position...");
    botMode = "recalibrateZ";
  }
}

function checkManualAbort() {
  if (KeyBind.getPressedKeys().contains("key.keyboard." + abortKey)) {
    botLog("Player has pressed abort key. Terminating.");
    terminateReason = ABORT_MANUALLY;
    botMode = "terminate";
  }
}

function checkEndOfRow() {
  // Check if we're at the end of the farm
  if (botFacingSouth && isOnBlock(endCoords[0], endCoords[1])) {
    // Turn around and do the other side
    botFacingSouth = false;
    return;
  }

  // Check if we're back at the start of the farm
  if (!botFacingSouth && isOnBlock(startCoords[0], startCoords[1])) {
    KeyBind.keyBind("key.right", false);
    KeyBind.keyBind("key.attack", false);

    if (currentFloor < numberOfFloors) {
      // We haven't reached the top floor yet.
      // Go to next floor.
      currentFloor++;
      goToCurrentFloor();
    } else {
      // We are on the topmost floor.
      // Return all the way to floor 1 and start over from floor 1.
      currentFloor = 1;
      goToCurrentFloor();

      // Make sure there's always free space in the inventory
      // Throw away all the vines that are in the inventory
      throwAwayVines();

      checkRefillShears();
    }

    botFacingSouth = true;
    eatCheck();
  }
}

function grabShears() {
  grabItem([SHEARS], "shears");
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

function grabItem(validItems, itemDescription) {
  inv = Player.openInventory();

  // Search hotbar (slots 36 to 44)
  for (i = 0; i < 9; i++) {
    if (validItems.includes(inv.getSlot(i + 36).getItemId())) {
      inv.setSelectedHotbarSlotIndex(i);
      return;
    }
  }

  // Search rest of inventory (slots 9 to 35)
  for (i = 9; i < 36; i++) {
    if (validItems.includes(inv.getSlot(i).getItemId())) {
      inv.setSelectedHotbarSlotIndex(i);
      inv.swap(i, mainSlot);
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
  KeyBind.keyBind("key.right", false);
  KeyBind.keyBind("key.attack", false);
  botLog("Food level low, auto eating");
  grabFood();
  Client.waitTick(5);
  KeyBind.keyBind("key.use", true);
  Client.waitTick(35);
  KeyBind.keyBind("key.use", false);
}

function face() {
  p.lookAt(botFacingSouth ? 0 : 180, 0);
  Client.waitTick();
}

function goAfk() {
  if (markYourselfAsAFK) {
    Chat.say("/afk");
  }
}

// Returns true if player is inside given coords
function isOnBlock(x, z) {
  return (
    p.getPos().x > x &&
    p.getPos().x < x + 1.0 &&
    p.getPos().z > z &&
    p.getPos().z < z + 1.0
  );
}

// Returns true if the player's Z coordinate is the expected value
function isOnTrack() {
  return (
    p.getPos().z > startCoords[1] + 0.2 && p.getPos().z < startCoords[1] + 0.8
  );
}

// Looks at the center of given block coords
function lookAtCenter(x, y, z) {
  p.lookAt(x + 0.5, y + 0.5, z + 0.5);
}

// Returns the number of given item in your inventory
function numberInInventory(itemToCount) {
  inv = Player.openInventory();
  number = inv.findItem(itemToCount).length;
  inv.close();
  Client.waitTick();
  return number;
}

// Checks if we need to refill on shears. If so, does it
function checkRefillShears() {
  numberOfShears = numberInInventory(SHEARS);
  if (numberOfShears >= minimumShears) {
    return;
  }

  KeyBind.keyBind("key.right", false);
  KeyBind.keyBind("key.attack", false);
  KeyBind.keyBind("key.sneak", false);

  // Wait for the player to unsneak
  // Otherwise they might not look at the right chest
  Client.waitTick(5);

  // Grab shears from nearby chests until we have enough
  for (i = 0; i < shearsChests.length; i++) {
    openChest(shearsChests[i]);
    // Take shears until inventory is full or chest is empty
    inv = Player.openInventory();
    shearsSlots = inv.findItem(SHEARS);
    containerSlots = inv.getSlots("container");
    for (shearsSlot of shearsSlots) {
      if (!(shearsSlot in containerSlots)) {
        continue;
      }
      inv.quick(shearsSlot);
      Client.waitTick();
    }
    inv.close();
    Client.waitTick();
    numberOfShears = numberInInventory(SHEARS);
    if (numberOfShears >= minimumShears) {
      break;
    }
  }
}

// Throws away all vines from the inventory.
// Expects you to be standing on the starting block.
function throwAwayVines() {
  inv = Player.openInventory();

  vinesSlots = inv.findItem("minecraft:vine");

  if (vinesSlots.length > 0) {
    // Face towards the water collection
    p.lookAt(60, 0);
    Client.waitTick();
  }

  for (vinesSlot of vinesSlots) {
    inv.dropSlot(vinesSlot, true);
    Client.waitTick();
  }

  inv.close();
  Client.waitTick();
}

// Failsafe for when the z coordinate is wrong.
// Attempts to get back on the track by moving forwards/backwards.
function recalibrateZ() {
  goForward =
    (p.getPos().z - (startCoords[1] + 0.5)) * (botFacingSouth ? 1 : -1) < 0;
  KeyBind.keyBind("key.forward", goForward);
  KeyBind.keyBind("key.back", !goForward);

  // Go back to normal once we're back on track
  if (isOnTrack()) {
    botLog("Finished recalibrating Z position, we're all good now");
    KeyBind.keyBind("key.forward", false);
    KeyBind.keyBind("key.back", false);
    botMode = "main";
    return;
  }

  // Failsafe: terminate if recalibrating fails
  recalibrateTimer++;
  if (recalibrateTimer >= 10) {
    botLog("Failed to recalibrate.");
    terminateReason = "Bot is stuck somewhere not on the track";
    botMode = "terminate";
  }
}

function getCurrentFloor() {
  floorFound = floors.indexOf(currentY);
  if (floorFound == -1) {
    botLog(
      "couldn't find what floor we're on. Player's y value is " + currentY,
    );
    return 1;
  }
  return floorFound + 1;
}

function standingOnLodestone() {
  // We put the end coords here anyway
  // even though we never use that lodestone just for the edge case
  // where we reconnect while standing on the lodestone
  return (
    isOnBlock(startCoords[0], startCoords[1]) ||
    isOnBlock(endCoords[0], endCoords[1])
  );
}

function goToCurrentFloor() {
  targetY = floors[currentFloor - 1];
  currentY = p.getPos().y;

  if (currentY == targetY) {
    botLog("already on the correct floor!");
  } else if (currentY < targetY) {
    // Go up to next floor
    while (currentY < targetY) {
      botLog("going up a floor...");
      yBefore = currentY;
      KeyBind.keyBind("key.jump", true);
      Client.waitTick(5);
      KeyBind.keyBind("key.jump", false);
      // Wait a bit for the teleportation to finish
      Client.waitTick(5);
      currentY = p.getPos().y;
    }
    botLog("went up to the correct floor!");
  } else {
    // Go down to previous floor
    while (currentY > targetY) {
      botLog("going down a floor...");
      KeyBind.keyBind("key.right", false);
      yBefore = currentY;
      KeyBind.keyBind("key.sneak", false);
      Client.waitTick(5);
      KeyBind.keyBind("key.sneak", true);
      Client.waitTick(5);
      currentY = p.getPos().y;
    }
    botLog("went down to the correct floor!");
  }
}

// chestCoords should be an array with 3 elements, x y z
function openChest(chestCoords, attempts = 0) {
  // Prevent infinite loop
  if (attempts >= 10) {
    return;
  }

  lookAtCenter(chestCoords[0], chestCoords[1], chestCoords[2]);
  KeyBind.keyBind("key.use", true);
  Client.waitTick();
  KeyBind.keyBind("key.use", false);

  // Wait for the chest to open
  Client.waitTick(5);
  inv = Player.openInventory();
  if (!inv || inv.getTotalSlots() != 90) {
    inv.close();
    Client.waitTick();
    // Try again
    openChest(chestCoords, attempts + 1);
  }
}
