// The key you press to manually stop the bot
const abortKey = "tab";

// Set this to true if you want the bot to disconnect at the end.
const disconnectWhenDone = true;

// The slot your food should be in, in your hotbar. (numbers 1 through 9)
const foodSlot = 1;

// The slot your sword should be in, in your hotbar. (numbers 1 through 9)
const swordSlot = 2;

// Bot will not use a tool that doesn't have at least this much durability.
const minimumToolDura = 10;

// Don't touch anything below

const BOT_NAME = "SpiderEyeBot";
const ABORT_MANUALLY = "Player has pressed the abort key.";

p = Player.getPlayer();

botMode = "main";
terminateReason = "";

// This is needed for the disconnect code...
isDisconnected = false;

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
    p = Player.getPlayer();
    isDisconnected = false;
    Client.waitTick(10);
    mainLoop();
  }),
);

Chat.say("/ctb");
Chat.say("/afk");

mainLoop();

function mainLoop() {
  while (botMode != "terminate") {
    if (isDisconnected) {
      return;
    }

    grabSword();

    KeyBind.keyBind("key.attack", true);
    p.lookAt(-19.7, 24.82); // random values to avoid triggering Vulcan kick
    checkManualAbort();
    Client.waitTick(2);
    KeyBind.keyBind("key.attack", false);
    Client.waitTick(4);

    KeyBind.keyBind("key.attack", true);
    p.lookAt(1.2, 24.6);
    checkManualAbort();
    Client.waitTick(2);
    KeyBind.keyBind("key.attack", false);
    Client.waitTick(4);

    KeyBind.keyBind("key.attack", true);
    p.lookAt(20.78, 25.137);
    checkManualAbort();
    Client.waitTick(2);
    KeyBind.keyBind("key.attack", false);
    Client.waitTick(4);

    eatCheck();
  }

  KeyBind.keyBind("key.forward", false);
  KeyBind.keyBind("key.left", false);
  KeyBind.keyBind("key.attack", false);
  KeyBind.keyBind("key.sneak", false);
  KeyBind.keyBind("key.use", false);

  if (terminateReason == ABORT_MANUALLY) {
    botLog("Bot manually terminated");
  } else {
    botLog("Bot terminated: " + terminateReason);
  }

  Chat.say("/ctb");
  Chat.say("/afk");
  World.playSound("entity.ghast.scream", 100, 0);

  if (disconnectWhenDone && terminateReason != ABORT_MANUALLY) {
    Client.disconnect();
  }
}

function botLog(message) {
  Chat.log("[" + BOT_NAME + "] " + message);
}

function checkManualAbort() {
  if (KeyBind.getPressedKeys().contains("key.keyboard." + abortKey)) {
    botLog("Player has pressed abort key. Terminating.");
    terminateReason = ABORT_MANUALLY;
    botMode = "terminate";
  }
}

function grabSword() {
  grabItem(["minecraft:diamond_sword"], "sword", swordSlot, true);
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
  grabItem(validItems, "valid food", foodSlot);
}

// Warning: if you enable checkForDurability,
// make sure you're definitely only checking for tools, otherwise the script may crash
function grabItem(
  validItems,
  itemDescription,
  hotbarSlot,
  checkForDurability = false,
) {
  inv = Player.openInventory();

  // Search all of inventory (slots 9 to 44)
  // We start from 44 backwards so that we scan the hotbar first
  for (i = 44; i >= 9; i--) {
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
  terminateReason = "Could not find " + itemDescription + " in inventory";
  botMode = "terminate";
}

// Automatically eats when in need
function eatCheck() {
  minFoodLevel = 14;
  if (p.getFoodLevel() >= minFoodLevel) {
    return;
  }
  botLog("Food level low, auto eating");
  grabFood();
  Client.waitTick(5);
  KeyBind.keyBind("key.use", true);
  Client.waitTick(35);
  KeyBind.keyBind("key.use", false);
}
