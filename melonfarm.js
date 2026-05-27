/*

You will need:
-> Diamond Axes with Silk Touch and Efficiency 5
-> Food

Starting:

Start on any row of the farm, on the north side
It will harvest from north to south, then west to east
Hold the abort key to stop the bot

*/

// The key you press to manually stop the bot
const abortKey = "tab"

// The slot in your hotbar you want this bot to use (1-9)
mainSlot = 1

// Stop using an axe if it reaches this durability
const minimumAxeDura = 10

// The coordinates where your farm starts and ends
const minX = -4592
const maxX = -4465

const minZ = -2944
const maxZ = -2877

// The Z value of the bridge that connects each row
// This bridge should be on the north side of the farm
// (rows are north-south, bridges are west-east)
const bridgeZ = -2945


// Don't touch anything below

const BOT_NAME = "MelonFarmBot"
const ABORT_MANUALLY = "Player has pressed the abort key."

const p = Player.getPlayer()

fellY = p.getY() - 0.5

nextRowX = 0
botMode = "mainSouth"
mainSlot = mainSlot+35

Chat.say("/ctb")
Chat.say("/afk")

main()


function main() {
    centerBot()

    if ((Math.floor(p.getX()) - minX) % 4 != 1) {
        setBridgeBotMode()
    }

    inventoryCheck()

    // Main loop
    while (botMode != "terminate")
    {
        Client.waitTick()
        
        if (botMode == "mainSouth") {
            eatCheck()

            // Walk south while using your axe
            // until you've reached the end of the row
            lookAt(0, 20)
            grabAxe()
            if (botMode == "terminate") {
                break
            }
            KeyBind.keyBind("key.forward", true)
            KeyBind.keyBind("key.attack", p.getZ() < maxZ - 3.5)
            
            if (!isMoving()) {
                breakMelonInFrontOfUs(0, 60)
                if (botMode == "terminate") {
                    break
                }
            }

            checkRowEnd()
        }
        else if (botMode == "mainNorth") {
            // Walk north while using your axe
            // until you've reached the start of the row
            lookAt(180, 20)
            grabAxe()
            if (botMode == "terminate") {
                break
            }
            KeyBind.keyBind("key.forward", true)
            KeyBind.keyBind("key.attack", p.getZ() > minZ + 3.5)

            if (!isMoving()) {
                breakMelonInFrontOfUs(180, 60)
                if (botMode == "terminate") {
                    break
                }
            }

            checkRowStart()
        }
        else if (botMode == "toNextRow") {
            // Sprint jump your way to the next row
            lookAt(-90, 0)
            KeyBind.keyBind("key.forward", true)
            KeyBind.keyBind("key.attack", false)
            sprint(false)

            if (p.getX() >= nextRowX) {
                KeyBind.keyBind("key.forward", false)
                centerBot()
                centerBot()
                botMode = "mainSouth"

                breakMelonInFrontOfUs(0, 15)
            }
        }
        else if (botMode == "backToStart") {
            // HARDCODED for Fairhill's farm
            const lodestoneX = minX - 1

            lookAt(90, 0)
            KeyBind.keyBind("key.forward", true)
            KeyBind.keyBind("key.attack", false)
            sprint(p.getX() > lodestoneX + 4)

            if (!isMoving()) {
                centerBot()
            }

            if (p.getX() < correctedCoord(lodestoneX)) {
                KeyBind.keyBind("key.forward", false)
                KeyBind.keyBind("key.jump", false)

                // Note: don't center the bot here, it would make the bot sneak
                // and go down the lodestone which we don't want

                playerY = p.getY()
                // Use the lodestone to go up
                jump()
                Client.waitTick()
                // Wait for player's position to stabilize
                Client.waitTick(5)
                // Player is still on the same y level?
                // That means we reached the top of the farm
                if (p.getY() == playerY) {
                    terminateReason = "Reached top of the farm"
                    botMode = "terminate"
                }

                fellY = p.getY() - 0.5

                setBridgeBotMode()
            }
        }
        checkFell()
        checkManualAbort()
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
}


function centerBot(coords = [p.getX(), p.getY(), p.getZ()])
{
    const ERROR_MARGIN = 0.075
    x = Math.floor(coords[0]) + 0.5
    y = coords[1]
    z = Math.floor(coords[2]) + 0.5

    KeyBind.keyBind("key.attack", false)
    KeyBind.keyBind("key.forward", true)
    KeyBind.keyBind("key.sneak", true)
    do {
        p.lookAt(x, y, z)
        Client.waitTick()
        checkFell()
        checkManualAbort()
    } while (
        (Math.abs(p.getX() - x) > ERROR_MARGIN || Math.abs(p.getZ() - z) > ERROR_MARGIN)
        && botMode != "terminate"
    )
    KeyBind.keyBind("key.forward", false)
    KeyBind.keyBind("key.sneak", false)
}

function botLog(message) {
    Chat.log("[" + BOT_NAME + "] " + message)
}

function checkFell() {
    if (p.getY() < fellY)
    {
        terminateReason = "Bot fell"
        botMode = "terminate"
    }
}

function checkManualAbort() {
    if (KeyBind.getPressedKeys().contains("key.keyboard." + abortKey)) {
        botLog("Player has pressed abort key. Terminating.")
        terminateReason = ABORT_MANUALLY
        botMode = "terminate"
    }
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
    currYaw = deltaYaw > 180 ? currYaw + 360 : deltaYaw < -180 ? currYaw - 360 : currYaw;

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
    Time.sleep(10)
}

function checkRowStart() {
    z = p.getZ()
    if (z > correctedCoord(minZ))
    {
        return
    }

    // Keep going until we're at the bridge
    while (z > correctedCoord(bridgeZ))
    {
        KeyBind.keyBind("key.forward", true)
        KeyBind.keyBind("key.sneak", true)
        Client.waitTick()
        z = p.getZ()
    }

    // Stop if inventory is full
    inventoryCheck()
    if (botMode == "terminate") {
        return
    }

    centerBot([p.getX(), p.getY(), bridgeZ])
    Client.waitTick()
    // Yup that's right, do it again
    centerBot([p.getX(), p.getY(), bridgeZ])

    setBridgeBotMode()
}

function checkRowEnd() {
    if (p.getZ() < maxZ)
    {
        return
    }

    KeyBind.keyBind("key.forward", false)
    KeyBind.keyBind("key.attack", false)

    breakMelonInFrontOfUs(-90, 60)
    if (botMode == "terminate") {
        return
    }
    
    centerBot([p.getX() + 1, p.getY(), p.getZ()])
    botMode = "mainNorth"

    breakMelonInFrontOfUs(180, 15)
}

// Returns true if you're currently moving.
function isMoving() {
    const EPSILON = 0.00001
    x = p.getX()
    z = p.getZ()
    Client.waitTick(2)
    return Math.abs(x - p.getX()) >= EPSILON || Math.abs(z - p.getZ()) >= EPSILON
}

function grabAxe() {
    grabItem(["minecraft:diamond_axe"], "a diamond axe", true)
}

function grabFood() {
    validItems = ['minecraft:bread',"minecraft:cooked_porkchop","minecraft:cooked_mutton","minecraft:cooked_salmon","minecraft:cooked_beef",
"minecraft:baked_potato","minecraft:melon_slice","minecraft:carrot","minecraft:cooked_chicken","minecraft:cooked_cod",
"minecraft:cooked_rabbit","minecraft:cookie","minecraft:potato","minecraft:pumpkin_pie","minecraft:glow_berries","minecraft:tropical_fish"
,"minecraft:sweet_berries","minecraft:golden_carrot"]
    grabItem(validItems, "valid food")
}

// Warning: if you enable checkForDurability,
// make sure you're definitely only checking for tools, otherwise the script may crash
function grabItem(validItems, itemDescription, checkForDurability = false) { 
    inv = Player.openInventory()

    // Search hotbar (slots 36 to 44)
    for (i = 0; i < 9; i++) {
        if (
            validItems.includes(inv.getSlot(i + 36).getItemId())
            && (!checkForDurability || inv.getSlot(i + 36).getDurability() >= minimumAxeDura)
        ) {
            inv.setSelectedHotbarSlotIndex(i)
            return
        }
    }

    // Search rest of inventory (slots 9 to 35)
    for (i = 9; i < 36; i++) {
        if (
            validItems.includes(inv.getSlot(i).getItemId())
            && (!checkForDurability || inv.getSlot(i).getDurability() >= minimumAxeDura)
        ) {
            inv.swap(i, mainSlot)
            inv.setSelectedHotbarSlotIndex(mainSlot-36)
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
    KeyBind.keyBind("key.forward", false)
    KeyBind.keyBind("key.attack", false)
    botLog("Food level low, auto eating")
    grabFood()
    Client.waitTick(10)
    KeyBind.keyBind("key.use", true)
    Client.waitTick(33)
    KeyBind.keyBind("key.use", false)
}

// Note: make sure you don't call these more than once per tick
function sprint(alsoJump = false) {
    Player.addInput(Player.createPlayerInput(1.0, 0.0, alsoJump, true))
}

function jump() {
    Player.addInput(Player.createPlayerInput(0.0, 0.0, true, false))
}

// Say for example the x coordinate of a block is -67.
// Turns out that actually when standing in the middle of that block,
// the player's x coordinate is -66.5.
// So if given coord is negative, adds 1 to it. Otherwise returns the value unchanged.
function correctedCoord(coord) {
    if (coord < 0) {
        return coord + 1
    }
    return coord
}

function breakMelonInFrontOfUs(lookingAngle, verticalAngle) {
    KeyBind.keyBind("key.attack", false)
    grabAxe()
    if (botMode == "terminate") {
        return
    }
    lookAt(lookingAngle, verticalAngle)
    KeyBind.keyBind("key.sneak", true)
    Client.waitTick()
    KeyBind.keyBind("key.attack", true)
    Client.waitTick()
    KeyBind.keyBind("key.attack", false)
    KeyBind.keyBind("key.sneak", false)
    Client.waitTick()

    // Wait a bit longer just to really make sure we pick up the dropped item :)
    Client.waitTick(5)
}

// Stops the bot if inventory is full
function inventoryCheck() {
    inv = Player.openInventory()
    numberOfEmptySlots = 0
    // Loop over whole inventory
    for (let i = 9; i < 45; i++) {
        if (inv.getSlot(i).isEmpty()) {
            numberOfEmptySlots++
            if (numberOfEmptySlots > 2) {
                inv.close()
                return
            }
        }
    }
    
    // If you made it here, it means the inventory is full
    inv.close()
    botMode = "terminate"
    terminateReason = "Inventory is full"
}

function setBridgeBotMode() {
    // If we're at the end of the farm, go back to the first row
    if (p.getX() > maxX - 3) {
        botMode = "backToStart"
    }
    // otherwise, move across the bridge to get to the next row
    else {
        nextRowX = Math.floor(p.getX()) + ((5 - ((Math.floor(p.getX()) - minX) % 4)) % 4)
        botMode = "toNextRow"
    }
}
