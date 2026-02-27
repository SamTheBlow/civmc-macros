// Set this to true if you want the bot to do "/afk" at the start and at the end.
const markYourselfAsAFK = true

// Set this to true if you want the bot to disconnect at the end.
const disconnectWhenDone = true

// Put here the coords of the starting block (only x and z).
// If your farm has more than one floor, this is where the lodestone must be.
const startCoords = [-3424, -3317]
// Put here the coords of the block where the bot will turn around (only x and z).
const endCoords = [-3585, -3317]

// Put here the number of floors your farm has.
const numberOfFloors = 2

// Feel free to change the key to manually stop the bot.
const abortKey = "tab"

// Will try to refill on shears if you don't have this many on you.
// Might want to make it higher if your farm is longer and/or has more floors.
const minimumShears = 6

// The coords of chests near your starting point that contain shears.
// Once in a while the bot will look through these chests to refill on shears.
const shearsChests = [
    [-3422, -53, -3316], [-3422, -53, -3317], [-3422, -53, -3318],
    [-3422, -52, -3316], [-3422, -52, -3317], [-3422, -52, -3318],
]


// Don't touch anything below

const ABORT_MANUALLY = "Player has pressed the abort key."

p = Player.getPlayer()

// Floor 1 is the lowest floor, then floor 2 is higher up, etc.
currentFloor = 1

currentY = p.getPos().y

botMode = "mainSouth"

// Note: the hotbar consists of slots 36 to 44.
mainSlot = 36

// This counts how long you're taking to recalibrate Z position
recalibrateTimer = 0

isDisconnected = false

// This makes you automatically log back in when you get disconnected
const ticklistener_1 = JsMacros.on("Disconnect", JavaWrapper.methodToJava(e => {
    // Prevent weird things from happening...
    if (isDisconnected) {
        return
    }
    
    Chat.log("[VineBot] Disconnected!")
    isDisconnected = true
    if (disconnectWhenDone && botMode == "terminate")
    {
        return
    }

    Chat.log("[VineBot] Will attempt to log back in...")
    if (World.isWorldLoaded()) {
        Chat.log("[VineBot] The world is already loaded..? Let's wait..?")
        Time.sleep(3000)
        if (World.isWorldLoaded()) {
            Chat.log("[VineBot] Yeah the world is already loaded. Terminating.")
            return
        }
    }
    while (!World.isWorldLoaded()) {
        Time.sleep(3000)
        // Prevent weird things from happening...
        if (!isDisconnected) {
            return
        }
        Chat.log("[VineBot] Connecting...")
        Client.connect("play.civmc.net")
        Chat.log("[VineBot] Tried to connect, let's see if the world loads...")
        Time.sleep(3000)
        if (World.isWorldLoaded()) {
            break
        }
        Chat.log("[VineBot] The world hasn't loaded, let's try again later...")
        Time.sleep(14000)
    }
    Chat.log("[VineBot] Reconnected, we're all good now")
    p = Player.getPlayer()
    isDisconnected = false
    Client.waitTick(10)
    mainLoop()
}))

// Ensure the user starts on the starting point
if (!isOnBlock(startCoords[0], startCoords[1])) {
    botMode = "terminate"
    terminateReason = "not standing on the starting block"
}
else
{
    goAfk()

    // Refill on shears at the very start
    checkRefillShears()
}

mainLoop()

// Main loop
function mainLoop() {
    while (botMode != "terminate")
    {
        Tick()
        Time.sleep(10)

        // Failsafe to terminate if recalibrating fails
        if (recalibrateTimer >= 5) {
            Chat.log("[VineBot] Failed to recalibrate.")
            terminateReason = "Bot is stuck somewhere not on the track"
            botMode = "terminate"
        }

        // Check manual abort
        if (KeyBind.getPressedKeys().contains("key.keyboard." + abortKey)) {
            Chat.log("[VineBot] Player has pressed abort key. Terminating.")
            terminateReason = ABORT_MANUALLY
            botMode = "terminate"
        }
    }
    terminate()
}

// Code that runs at the end whenever the bot is terminated
function terminate() {
    KeyBind.keyBind('key.right', false)
    KeyBind.keyBind("key.forward", false)
    KeyBind.keyBind('key.back', false)
    KeyBind.keyBind("key.attack", false)
    KeyBind.keyBind("key.jump", false)
    KeyBind.keyBind("key.sneak", false)
    KeyBind.keyBind("key.use", false)

    if (terminateReason == ABORT_MANUALLY)
    {
        Chat.log("[VineBot] Bot manually terminated")
    }
    else
    {
        Chat.log("[VineBot] Bot terminated. Reason: " + terminateReason)
    }
    
    World.playSound("entity.ghast.scream", 100, 0)
    
    if (terminateReason != "not standing on the starting block")
    {
        goAfk()
        
        if (disconnectWhenDone && terminateReason != ABORT_MANUALLY)
        {
            Client.disconnect()
        }
    }
}

function Tick()
{
    checkFell()
    KeyBind.keyBind("key.sneak", true)
    grabShears()
    face()
    if (botMode == "recalibrateZ")
    {
        KeyBind.keyBind('key.right', false)
        KeyBind.keyBind("key.attack", false)
        recalibrateZ()
        recalibrateTimer++
    }
    if (botMode != "recalibrateZ") // Doing the check again is important here
    {
        KeyBind.keyBind('key.right', true)
        KeyBind.keyBind("key.attack", true)
        checkStatus()
    }
}

function checkFell() {
    if (p.getPos().y < currentY - 0.5)
    {
        terminateReason = "Bot fell"
        botMode = "terminate"
        return
    }
    
    // Failsafe: make sure the bot stays on the same z coordinate
    if (botMode != "recalibrateZ" && !isOnTrack())
    {
        recalibrateTimer = 0
        Chat.log("[VineBot] Failsafe: recalibrating Z position...")
        botMode = "recalibrateZ"
    }
}

// Stuff that happens when you're done doing a row
function checkStatus() {
    // Check if we're at the end of the farm
    if (botMode == "mainSouth" && isOnBlock(endCoords[0], endCoords[1])) {
        // Turn around and do the other side
        botMode = "mainNorth"
        face()
        return
    }
    
    // Check if we're back at the start of the farm
    if (botMode == "mainNorth" && isOnBlock(startCoords[0], startCoords[1]))
    {
        if (currentFloor < numberOfFloors)
        {
            // We haven't reached the top floor yet.
            // Go to next floor.
            yBefore = p.getPos().y
            KeyBind.keyBind("key.jump", true)
            Client.waitTick(5)
            KeyBind.keyBind("key.jump", false)
            yAfter = p.getPos().y
            if (yBefore < yAfter)
            {
                // We made it to the next floor.
                currentFloor++
                currentY = p.getPos().y
            }
            else
            {
                // We didn't make it to the next floor.
                terminateReason = "Failed to go up the elevator"
                botMode = "terminate"
                return
            }
        }
        else
        {
            // We are on the topmost floor.
            // Return all the way to floor 1 and start over from floor 1.
            while (currentFloor > 1)
            {
                KeyBind.keyBind('key.right', false)
                yBefore = p.getPos().y
                KeyBind.keyBind("key.sneak", false)
                Client.waitTick(10)
                KeyBind.keyBind("key.sneak", true)
                Client.waitTick(10)
                yAfter = p.getPos().y
                if (yBefore > yAfter)
                {
                    // We made it to the previous floor.
                    currentFloor--
                }
                else
                {
                    // We didn't make it to the previous floor.
                    terminateReason = "Failed to go down the elevator"
                    botMode = "terminate"
                    return
                }
            }
            currentY = p.getPos().y
            
            // Make sure there's always free space in the inventory
            // Throw away all the vines that are in the inventory
            throwAwayVines()

            checkRefillShears()
        }

        // Turn around
        botMode = "mainSouth"
        face()

        // Eat if needed
        eatCheck()
    }
}


function grabShears() {
    grabItem(["minecraft:shears"], "shears")
}

function grabFood() {
    validItems = ['minecraft:bread',"minecraft:cooked_porkchop","minecraft:cooked_mutton","minecraft:cooked_salmon","minecraft:cooked_beef",
"minecraft:baked_potato","minecraft:melon_slice","minecraft:carrot","minecraft:cooked_chicken","minecraft:cooked_cod",
"minecraft:cooked_rabbit","minecraft:cookie","minecraft:potato","minecraft:pumpkin_pie","minecraft:glow_berries","minecraft:tropical_fish"
,"minecraft:sweet_berries","minecraft:golden_carrot"]
    grabItem(validItems, "valid food")
}

function grabItem(validItems, itemDescription) { 
    inv = Player.openInventory()

    // Search hotbar (slots 36 to 44)
    for (i = 0; i < 9; i++) {
        if (validItems.includes(inv.getSlot(i + 36).getItemId())) {
            inv.setSelectedHotbarSlotIndex(i)
            return
        }
    }

    // Search rest of inventory (slots 9 to 35)
    for (i = 9; i < 36; i++) {
        if (validItems.includes(inv.getSlot(i).getItemId())) {
            inv.setSelectedHotbarSlotIndex(i)
            inv.swap(i, mainSlot)
            return
        }
    }

    // If the code makes it to here, it means we failed to find a valid item
    terminateReason = "Could not find " + itemDescription + " in inventory"
    botMode = "terminate"
}

// Automatically eats when in need
function eatCheck() {
    minFoodLevel = 14
    if (p.getFoodLevel() >= minFoodLevel) {
        return
    }
    KeyBind.keyBind('key.right', false)
    KeyBind.keyBind("key.attack", false)
    Chat.log("[VineBot] Food level low, auto eating")
    grabFood()
    Client.waitTick(10)
    KeyBind.key("key.mouse.right",true)
    Client.waitTick(33)
    KeyBind.key("key.mouse.right",false)
    KeyBind.keyBind('key.right', true)
    KeyBind.keyBind("key.attack", true)
    grabShears()
}

function face() {
    if (botMode == "mainSouth")
    {
        p.lookAt(0,0)
        Time.sleep(400)
    }
    else if (botMode == "mainNorth")
    {
        p.lookAt(180,0)
        Time.sleep(400)
    }
    else if (botMode == "recalibrateZ")
    {
        p.lookAt(0,0)
        Time.sleep(400)    
    }
}

function goAfk() {
    if (markYourselfAsAFK)
    {
        Chat.say("/afk")
    }
}

// Returns true if player is inside given coords
function isOnBlock(x, z) {
    return (
           p.getPos().x > x && p.getPos().x < x+1.0
        && p.getPos().z > z && p.getPos().z < z+1.0
    )
}

// Returns true if the player's Z coordinate is the expected value
function isOnTrack() {
    return p.getPos().z > startCoords[1]+0.2 && p.getPos().z < startCoords[1]+0.8
}

// Looks at the center of given block coords
function lookAtCenter(x, y, z) {
    p.lookAt(x+0.5, y+0.5, z+0.5)
}

// Returns the number of given item in your inventory
function numberInInventory(itemToCount) {
    inv = Player.openInventory()
    number = inv.findItem(itemToCount).length
    inv.close()
    return number
}

// Checks if we need to refill on shears. If so, does it
function checkRefillShears() {
    KeyBind.keyBind('key.right', false)
    KeyBind.keyBind("key.attack", false)
    KeyBind.keyBind("key.sneak", false)

    // Wait for the player to unsneak
    // Otherwise they might not look at the right chest
    Time.sleep(500)

    numberOfShears = numberInInventory("minecraft:shears")
    
    if (numberOfShears >= minimumShears) {
        return
    }

    // Grab shears from nearby chests until we have enough
    for (i=0; i<shearsChests.length; i++) {
        // Look at chest
        lookAtCenter(shearsChests[i][0], shearsChests[i][1], shearsChests[i][2])
        Client.waitTick()
        // Open chest
        p.interact()
        Client.waitTick(5)
        // Take shears until inventory is full or chest is empty
        inv = Player.openInventory()
        shearsSlots = inv.findItem("minecraft:shears")
        containerSlots = inv.getSlots('container')
        for (shearsSlot of shearsSlots) {
            if (!(shearsSlot in containerSlots))
            {
                continue
            }
            inv.quick(shearsSlot)
            Client.waitTick()
        }
        inv.close()
        Client.waitTick()
        numberOfShears = numberInInventory("minecraft:shears")
        if (numberOfShears >= minimumShears) {
            break
        }
    }
}

// Throws away all vines from the inventory.
// Expects you to be standing on the starting block.
function throwAwayVines() {
    // Face towards the water collection
    p.lookAt(60,0)
    Client.waitTick()

    inv = Player.openInventory()
    vinesSlots = inv.findItem("minecraft:vine")
    for (vinesSlot of vinesSlots) {
        inv.dropSlot(vinesSlot, true)
        Client.waitTick()
    }
    inv.close()
    Client.waitTick()
}

// Failsafe for when the z coordinate is wrong.
// Attempts to get back on the track by moving forwards/backwards.
function recalibrateZ() {
    if (p.getPos().z < startCoords[1]+0.5)
    {
        KeyBind.keyBind('key.forward', true)
        KeyBind.keyBind('key.back', false)
    }
    else
    {
        KeyBind.keyBind('key.forward', false)
        KeyBind.keyBind('key.back', true)
    }
    
    // Go back to normal once we're back on track
    if (isOnTrack())
    {
        Chat.log("[VineBot] Finished recalibrating Z position, we're all good now")
        KeyBind.keyBind('key.forward', false)
        KeyBind.keyBind('key.back', false)
        botMode = "mainSouth"
    }
}
