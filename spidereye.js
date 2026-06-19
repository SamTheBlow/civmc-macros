const util = require("./blow-utils.js");

util.setBotName("SpiderEyeBot");

// The key you press to manually stop the bot
util.setAbortKey("tab");

// Set this to true if you want the bot to disconnect at the end.
util.setDisconnectWhenDone(true);

util.setAutoReconnect(true);
util.setGoAfk(true);
util.setDisableBypass(true);

// The slot your food should be in, in your hotbar. (numbers 1 through 9)
const foodSlot = 1;

// The slot your sword should be in, in your hotbar. (numbers 1 through 9)
const swordSlot = 2;

// Bot will not use a tool that doesn't have at least this much durability.
const minimumToolDura = 10;


// Don't touch anything below

util.setMainLoop(mainLoop);
util.startMainLoop();

function mainLoop() {
    util.grabSword(swordSlot, minimumToolDura);
    
    KeyBind.keyBind("key.attack", true);
    util.lookAt(-19.7, 24.82); // random values to avoid triggering Vulcan kick
    util.checkManualAbort();
    Client.waitTick(2);
    KeyBind.keyBind("key.attack", false);
    Client.waitTick(4);
    
    KeyBind.keyBind("key.attack", true);
    util.lookAt(1.2, 24.6);
    util.checkManualAbort();
    Client.waitTick(2);
    KeyBind.keyBind("key.attack", false);
    Client.waitTick(4);
    
    KeyBind.keyBind("key.attack", true);
    util.lookAt(20.78, 25.137);
    util.checkManualAbort();
    Client.waitTick(2);
    KeyBind.keyBind("key.attack", false);
    Client.waitTick(4);
    
    util.eatCheck(foodSlot);
}
