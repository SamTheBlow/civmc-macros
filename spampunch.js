// The key you press to manually stop the bot
const abortKey = "tab"

// Set this to true if you want the bot to disconnect at the end.
const disconnectWhenDone = true

// The slot your sword is in, in your hotbar. (numbers 1 through 9)
const swordSlot = 2


// Don't touch anything below

const BOT_NAME = "SpamPunchBot"
const ABORT_MANUALLY = "Player has pressed the abort key."

p = Player.getPlayer()

botMode = "main"
terminateReason = ""

// This is needed for the disconnect code...
isDisconnected = false

// This makes you automatically log back in when you get disconnected
const ticklistener_1 = JsMacros.on("Disconnect", JavaWrapper.methodToJava(e => {
    botLog("Disconnected!")

    // Prevent recursive shenanigans
    if (isDisconnected) {
        return
    }

    isDisconnected = true

    if (disconnectWhenDone && botMode == "terminate")
    {
        return
    }

    botLog("Will attempt to log back in...")
    if (World.isWorldLoaded()) {
        botLog("The world is already loaded..? Let's wait..?")
        Time.sleep(3000)
        if (World.isWorldLoaded()) {
            botLog("Yeah the world is already loaded. Terminating.")
            isDisconnected = false
            return
        }
    }
    while (!World.isWorldLoaded()) {
        if (!isDisconnected) {
            return
        }
        Time.sleep(3000)
        botLog("Connecting...")
        Client.connect("play.civmc.net")
        botLog("Tried to connect, let's see if the world loads...")
        Time.sleep(3000)
        if (World.isWorldLoaded()) {
            break
        }
        botLog("The world hasn't loaded, let's try again later...")
        Time.sleep(14000)
    }

    if (!isDisconnected) {
        return
    }
    botLog("Reconnected, we're all good now")
    p = Player.getPlayer()
    isDisconnected = false
    Client.waitTick(10)
    mainLoop()
}))

Chat.say("/ctb")
Chat.say("/afk")

mainLoop()

function mainLoop() {
    while (botMode != "terminate") {
        if (isDisconnected) {
            return
        }

        // Equip the sword, and make sure the sword doesn't break
        inv = Player.openInventory()
        inv.setSelectedHotbarSlotIndex(swordSlot - 1)
        dura = inv.getSlot(swordSlot + 35).getDurability()
        inv.close()
        Client.waitTick()
        if (dura <= 10) {
            botMode = "terminate"
            terminateReason = "Sword about to break"
            break
        }

        KeyBind.keyBind("key.attack", true)
        p.lookAt(-10, 20.0)
        checkManualAbort()
        Client.waitTick(2)
        KeyBind.keyBind("key.attack", false)
        Client.waitTick(4)
        KeyBind.keyBind("key.attack", true)
        p.lookAt(10, 20.0)
        checkManualAbort()
        Client.waitTick(2)
        KeyBind.keyBind("key.attack", false)
        Client.waitTick(4)
        KeyBind.keyBind("key.attack", true)
        p.lookAt(-10, 35.0)
        checkManualAbort()
        Client.waitTick(2)
        KeyBind.keyBind("key.attack", false)
        Client.waitTick(4)
        KeyBind.keyBind("key.attack", true)
        p.lookAt(10, 35.0)
        checkManualAbort()
        Client.waitTick(2)
        KeyBind.keyBind("key.attack", false)
        Client.waitTick(4)
        
    }

    KeyBind.keyBind("key.forward", false)
    KeyBind.keyBind("key.attack", false)
    KeyBind.keyBind("key.sneak", false)
    KeyBind.keyBind("key.use", false)

    if (terminateReason == ABORT_MANUALLY)
    {
        botLog("Bot manually terminated")
    }
    else
    {
        botLog("Bot terminated: " + terminateReason)
    }

    Chat.say("/ctb")
    Chat.say("/afk")
    World.playSound("entity.ghast.scream", 100, 0)

    if (disconnectWhenDone && terminateReason != ABORT_MANUALLY)
    {
        Client.disconnect()
    }
}

function botLog(message) {
    Chat.log("[" + BOT_NAME + "] " + message)
}

function checkManualAbort() {
    if (KeyBind.getPressedKeys().contains("key.keyboard." + abortKey)) {
        botLog("Player has pressed abort key. Terminating.")
        terminateReason = ABORT_MANUALLY
        botMode = "terminate"
    }
}
