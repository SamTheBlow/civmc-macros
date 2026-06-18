// This is where I put all my variables and functions that I reuse across scripts

// Exposed variables go here
var player = Player.getPlayer();
var isTerminated = false;
//

var abortKey = "tab";
var autoReconnect = false;
var disconnectWhenDone = false;
var applyAfk = false;
var applyBypass = false;

var botName = "UnnamedBot";
var mainLoop = function () {};

const ABORT_MANUALLY = "Player has pressed the abort key.";

var terminateReason = "";

// This is needed for the auto-reconnect code
var isDisconnected = false;
// This prevents afk and bypass from being applied more than once
var isFirstTimeRunning = true;

// This makes you automatically log back in when you get disconnected
const ticklistener_1 = JsMacros.on(
  "Disconnect",
  JavaWrapper.methodToJava((e) => {
    if (!autoReconnect) {
      return;
    }

    botLog("Disconnected!");

    // Prevent recursive shenanigans
    if (isDisconnected) {
      return;
    }

    isDisconnected = true;

    if (disconnectWhenDone && isTerminated) {
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
      if (!isDisconnected) {
        return;
      }
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

    if (!isDisconnected) {
      return;
    }
    botLog("Reconnected, we're all good now");
    player = Player.getPlayer();
    isDisconnected = false;
    Client.waitTick(10);
    startMainLoop();
  }),
);

function setAbortKey(key) {
  abortKey = key;
}

function setAutoReconnect(bool) {
  autoReconnect = bool;
}

function setDisconnectWhenDone(bool) {
  disconnectWhenDone = bool;
}

function setGoAfk(bool) {
  applyAfk = bool;
}

function setDisableBypass(bool) {
  applyBypass = bool;
}

function setBotName(name) {
  botName = name;
}

function setMainLoop(func) {
  mainLoop = func;
}

function startMainLoop() {
  if (isTerminated) {
    terminate(true);
    return;
  }

  if (isFirstTimeRunning) {
    sayAfk();
    sayBypass();
    isFirstTimeRunning = false;
  }

  while (!isTerminated) {
    if (isDisconnected) {
      return;
    }
    mainLoop();
    checkManualAbort();
    Client.waitTick();
  }
  terminate();
}

function stopBot(reason) {
  isTerminated = true;
  terminateReason = reason;
}

// Code that runs at the end whenever the bot is terminated
function terminate(terminatedEarly = false) {
  KeyBind.keyBind("key.right", false);
  KeyBind.keyBind("key.left", false);
  KeyBind.keyBind("key.forward", false);
  KeyBind.keyBind("key.back", false);
  KeyBind.keyBind("key.attack", false);
  KeyBind.keyBind("key.use", false);
  KeyBind.keyBind("key.jump", false);
  KeyBind.keyBind("key.sneak", false);

  if (terminateReason == ABORT_MANUALLY) {
    botLog("Bot manually terminated");
  } else {
    botLog("Bot terminated. Reason: " + terminateReason);
  }

  World.playSound("entity.ghast.scream", 100, 0);

  if (!terminatedEarly) {
    sayAfk();
    sayBypass();

    if (disconnectWhenDone && terminateReason != ABORT_MANUALLY) {
      Client.disconnect();
    }
  }
}

function botLog(message) {
  Chat.log("[" + botName + "] " + message);
}

function checkManualAbort() {
  if (KeyBind.getPressedKeys().contains("key.keyboard." + abortKey)) {
    botLog("Player has pressed abort key. Terminating.");
    isTerminated = true;
    terminateReason = ABORT_MANUALLY;
  }
}

function sayAfk() {
  if (applyAfk) {
    Chat.say("/afk");
  }
}

function sayBypass() {
  if (applyBypass) {
    Chat.say("/bypass");
  }
}

function grabSword(itemSlot, minimumToolDura) {
  grabItem(
    ["minecraft:diamond_sword"],
    "sword",
    itemSlot,
    true,
    minimumToolDura,
  );
}

function grabAxe(itemSlot, minimumToolDura) {
  grabItem(["minecraft:diamond_axe"], "axe", itemSlot, true, minimumToolDura);
}

function grabShears(itemSlot, minimumToolDura = 0) {
  grabItem(["minecraft:shears"], "shears", itemSlot, true, minimumToolDura);
}

function grabFood(foodSlot) {
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
  grabItem(validItems, "valid food", foodSlot);
}

// Warning: if you enable checkForDurability,
// make sure you're definitely only checking for tools,
// otherwise the script may crash
function grabItem(
  validItems,
  itemDescription,
  hotbarSlot,
  checkForDurability = false,
  minimumToolDura = 0,
) {
  var inv = Player.openInventory();

  // Search the hotbar first (slots 36 to 44)
  for (i = 36; i < 45; i++) {
    if (
      validItems.includes(inv.getSlot(i).getItemId()) &&
      (!checkForDurability || inv.getSlot(i).getDurability() >= minimumToolDura)
    ) {
      if (i != 36 + hotbarSlot - 1) {
        inv.swap(i, 36 + hotbarSlot - 1);
      }
      inv.setSelectedHotbarSlotIndex(hotbarSlot - 1);
      return;
    }
  }

  // Search rest of inventory (slots 9 to 35)
  for (i = 9; i < 36; i++) {
    if (
      validItems.includes(inv.getSlot(i).getItemId()) &&
      (!checkForDurability || inv.getSlot(i).getDurability() >= minimumToolDura)
    ) {
      if (i != 36 + hotbarSlot - 1) {
        inv.swap(i, 36 + hotbarSlot - 1);
      }
      inv.setSelectedHotbarSlotIndex(hotbarSlot - 1);
      return;
    }
  }

  // If the code makes it to here, it means we failed to find a valid item
  isTerminated = true;
  terminateReason = "Could not find " + itemDescription + " in inventory";
}

// If isTopToBottom is true, floor 1 is the topmost floor,
// otherwise floor 1 is the bottommost floor.
function getCurrentFloor(yFloor1, yFloorStep, numberOfFloors, isTopToBottom) {
  // Round is important here, e.g. when player is standing on farmland
  playerY = Math.round(player.getY());
  diff = playerY - yFloor1;

  if (isTopToBottom) {
    diff *= -1;
  }

  if (diff < 0 || diff % yFloorStep != 0) {
    isTerminated = true;
    terminateReason =
      "player isn't on the farm (player's y value is: " + playerY + ")";
    return 1;
  }

  output = 1 + diff / yFloorStep;
  if (output > numberOfFloors) {
    isTerminated = true;
    terminateReason =
      "player isn't on the farm (player's y value is: " + playerY + ")";
    return 1;
  }

  return output;
}

// Automatically eats when in need
function eatCheck(foodSlot, minFoodLevel = 14) {
  if (player.getFoodLevel() >= minFoodLevel) {
    return;
  }
  botLog("Food level low, auto eating");
  grabFood(foodSlot);
  Client.waitTick(5);
  KeyBind.keyBind("key.use", true);
  Client.waitTick(35);
  KeyBind.keyBind("key.use", false);
}

// chestCoords should be an array with 3 elements, x y z
function openChest(chestCoords, attempts = 0) {
  // Prevent infinite loop
  if (attempts >= 10) {
    botLog("Failed to open chest after 10 attempts!");
    return;
  }

  player.lookAt(
    chestCoords[0] + 0.5,
    chestCoords[1] + 0.5,
    chestCoords[2] + 0.5,
  );
  KeyBind.keyBind("key.use", true);
  Client.waitTick();
  KeyBind.keyBind("key.use", false);

  // Wait for the chest to open
  Client.waitTick(5);
  inv = Player.openInventory();
  if (inv.getTotalSlots() != 63 && inv.getTotalSlots() != 90) {
    // Try again
    openChest(chestCoords, attempts + 1);
  }
}

// validItems is an array with item IDs
function withdrawAll(validItems, isCompacted, isDoubleChest) {
  inv = Player.openInventory();
  // Search the chest
  for (i = 0; i < (isDoubleChest ? 54 : 27); i++) {
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

// Returns true if your inventory has any of
// given validItems (an array of item IDs), otherwise returns false
// If isCompacted is true, only checks for compacted items.
// If isCompacted is false, only checks for uncompacted items.
// slotRange should be an array with 2 elements:
// the 1st slot to check and the last slot to check
function hasAnyItem(validItems, isCompacted, slotRange) {
  inv = Player.openInventory();
  for (i = slotRange[0]; i <= slotRange[1]; i++) {
    if (
      validItems.includes(inv.getSlot(i).getItemId()) &&
      ((isCompacted &&
        inv.getSlot(i).getLore().length > 0 &&
        inv.getSlot(i).getLore()[0].getString() == "Compacted Item") ||
        (!isCompacted &&
          inv.getSlot(i).getCount() == 64 &&
          (inv.getSlot(i).getLore().length == 0 ||
            inv.getSlot(i).getLore()[0].getString() != "Compacted Item")))
    ) {
      return true;
    }
  }
  return false;
}

// itemsArray is an array of all the items you want dropped from inventory
function dropAll(itemsArray) {
  inv = Player.openInventory();
  for (i = 9; i <= 44; i++) {
    if (itemsArray.includes(inv.getSlot(i).getItemId())) {
      inv.dropSlot(i, true);
      Client.waitTick();
    }
  }
}

// Copy pasted from somewhere, idk, arthirob's scripts maybe
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

// Note: make sure you don't call this more than once per tick
function sprint(alsoJump = false) {
  Player.addInput(Player.createPlayerInput(1.0, 0.0, alsoJump, true));
}

// Note: make sure you don't call this more than once per tick
function jump() {
  Player.addInput(Player.createPlayerInput(0.0, 0.0, true, false));
}

// Copy/pasted from Greltam's utility code ("WASDToLocation")
// keyArray is an array of all the keys
// you want the bot to hold while it's moving
function moveTo(keyArray, xPos, zPos, tolerance = 0.2) {
  //define variables for main loop.
  wKey = false;
  aKey = false;
  sKey = false;
  dKey = false;
  //Cutoff for key activation when multiplying key and destination vectors
  normalTolerance = 0.5;

  //Normalized Vector direction for each movement key
  yaw = player.getYaw() + 180; //idk why + 180 but makes it work
  wRadians = yaw * (Math.PI / 180);
  wVector = [Math.sin(wRadians), Math.cos(wRadians)];
  dRadians = (yaw + 90) * (Math.PI / 180);
  dVector = [Math.sin(dRadians), Math.cos(dRadians)];
  sRadians = (yaw + 180) * (Math.PI / 180);
  sVector = [Math.sin(sRadians), Math.cos(sRadians)];
  aRadians = (yaw + 270) * (Math.PI / 180);
  aVector = [Math.sin(aRadians), Math.cos(aRadians)];

  //Normalized Vector for final destination
  //No idea why I have to flip playerZ and zPos
  destVector = [xPos - player.getX(), player.getZ() - zPos];
  destDivisor = Math.sqrt(
    destVector[0] * destVector[0] + destVector[1] * destVector[1],
  );
  destNormal = [destVector[0] / destDivisor, destVector[1] / destDivisor];

  //bind all keyArrays
  for (let i = 0; i < keyArray.length; i++) {
    KeyBind.keyBind(keyArray[i], true);
  }

  okCounter = 0;

  while (okCounter < 5) {
    if (isTerminated) {
      break;
    }
    //Recalculate Normalized Vector direction for each movement key
    yaw = player.getYaw() + 180;
    wRadians = yaw * (Math.PI / 180);
    wVector[0] = Math.sin(wRadians);
    wVector[1] = Math.cos(wRadians);
    dRadians = (yaw + 90) * (Math.PI / 180);
    dVector[0] = Math.sin(dRadians);
    dVector[1] = Math.cos(dRadians);
    sRadians = (yaw + 180) * (Math.PI / 180);
    sVector[0] = Math.sin(sRadians);
    sVector[1] = Math.cos(sRadians);
    aRadians = (yaw + 270) * (Math.PI / 180);
    aVector[0] = Math.sin(aRadians);
    aVector[1] = Math.cos(aRadians);

    //Recalculate Normalized Vector for final destination
    destVector[0] = xPos - player.getX();
    destVector[1] = player.getZ() - zPos;
    destDivisor = Math.sqrt(
      destVector[0] * destVector[0] + destVector[1] * destVector[1],
    );
    destNormal[0] = destVector[0] / destDivisor;
    destNormal[1] = destVector[1] / destDivisor;

    //Check if the magnitude of WASD vector lines up with Dest vector
    //and activate key
    if (
      wVector[0] * destNormal[0] > normalTolerance ||
      wVector[1] * destNormal[1] > normalTolerance
    ) {
      wKey = true;
    }

    if (
      dVector[0] * destNormal[0] > normalTolerance ||
      dVector[1] * destNormal[1] > normalTolerance
    ) {
      dKey = true;
    }

    if (
      sVector[0] * destNormal[0] > normalTolerance ||
      sVector[1] * destNormal[1] > normalTolerance
    ) {
      sKey = true;
    }

    if (
      aVector[0] * destNormal[0] > normalTolerance ||
      aVector[1] * destNormal[1] > normalTolerance
    ) {
      aKey = true;
    }

    //Bind keys
    KeyBind.keyBind("key.forward", wKey && okCounter == 0);
    KeyBind.keyBind("key.left", aKey && okCounter == 0);
    KeyBind.keyBind("key.back", sKey && okCounter == 0);
    KeyBind.keyBind("key.right", dKey && okCounter == 0);

    //reset keys for next tick
    wKey = false;
    aKey = false;
    sKey = false;
    dKey = false;

    checkManualAbort();
    Client.waitTick();

    if (
      Math.abs(Math.abs(player.getX()) - Math.abs(xPos)) <= tolerance &&
      Math.abs(Math.abs(player.getZ()) - Math.abs(zPos)) <= tolerance
    ) {
      okCounter++;
    } else {
      okCounter = 0;
    }
  }

  //unbind all keyArrays
  for (let i = 0; i < keyArray.length; i++) {
    KeyBind.keyBind(keyArray[i], false);
  }
  KeyBind.keyBind("key.forward", false);
  KeyBind.keyBind("key.left", false);
  KeyBind.keyBind("key.back", false);
  KeyBind.keyBind("key.right", false);
}

// Returns true if you're currently moving.
// Note that this function waits for two ticks each time you use it.
function isMoving() {
  const EPSILON = 0.01;
  x = player.getX();
  z = player.getZ();
  Client.waitTick(2);
  return !(
    Math.abs(x - player.getX()) < EPSILON &&
    Math.abs(z - player.getZ()) < EPSILON
  );
}

// blockX and blockZ should be integers
function isOnBlock(blockX, blockZ) {
  return (
    Math.floor(player.getX()) == blockX && Math.floor(player.getZ()) == blockZ
  );
}

// Terminates the bot if the player isn't inside given range
function checkInsideRange(xMin, xMax, zMin, zMax, message) {
  playerX = Math.floor(player.getX());
  playerZ = Math.floor(player.getZ());
  if (playerX < xMin || playerX > xMax || playerZ < zMin || playerZ > zMax) {
    isTerminated = true;
    terminateReason = message;
  }
}

module.exports = {
  // exposed variables
  player: player,
  isTerminated: isTerminated,
  // exposed functions
  setAbortKey: setAbortKey,
  setAutoReconnect: setAutoReconnect,
  setDisconnectWhenDone: setDisconnectWhenDone,
  setGoAfk: setGoAfk,
  setDisableBypass: setDisableBypass,
  setBotName: setBotName,
  setMainLoop: setMainLoop,
  startMainLoop: startMainLoop,
  stopBot: stopBot,
  botLog: botLog,
  checkManualAbort: checkManualAbort,
  grabSword: grabSword,
  grabAxe: grabAxe,
  grabShears: grabShears,
  grabFood: grabFood,
  grabItem: grabItem,
  getCurrentFloor: getCurrentFloor,
  eatCheck: eatCheck,
  openChest: openChest,
  withdrawAll: withdrawAll,
  hasAnyItem: hasAnyItem,
  dropAll: dropAll,
  lookAt: lookAt,
  sprint: sprint,
  jump: jump,
  moveTo: moveTo,
  isMoving: isMoving,
  isOnBlock: isOnBlock,
  checkInsideRange: checkInsideRange,
};
