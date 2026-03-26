/* Bot Requirements:

Sufficient Diamond Axes
Sufficient Shears (optional, if enabled)
Sufficient Saplings
Sufficient Food

Starting:

Start on any row of the farm, on the north side
It will chop north to south, then east to west
Hold the abort key to terminate

Recommended to type /ctb prior to starting to avoid any bugs breaking blocks in the farm

*/

// The key you press to manually stop the bot
const abortKey = "tab"

// The slot in your hotbar you want this bot to use (1-9)
mainSlot = 1

// Set this to false if you're not using shears
const hasShears = true

// Stop the bot if your axe reaches this durability
const minimumAxeDurability = 10

// The coordinates where your farm starts and ends
const minX = -3710
const maxX = -3644

const minZ = -3429
const maxZ = -3315

// The Z value of the bridge that connects each tree row
// This bridge should be on the north side of the farm
// (rows are north-south, bridges are east-west)
const bridgeZ = -3429

// The number of blocks to get from one tree row to the next
const distanceBetweenRows = 6


// Don't touch anything below

const BOT_NAME = "TreeFarmBot"
const ABORT_MANUALLY = "Player has pressed the abort key."

const p = Player.getPlayer()

fellY = p.getY() - 0.5

isChoppingBirch = false
sapling = "minecraft:oak_sapling"

nextRowX = 0
botMode = "mainSouth"
mainSlot = mainSlot+35

// Tracks how long you've been attacking with shears
shearsTime = 0

main()


function main() {
    centerBot()
    saplingTypeCheck()

    if (p.getX() >= correctedCoord(maxX)) {
        nextRowX = correctedCoord(maxX)
        botMode = "toNextRow"
    }

    // Main loop
    while (botMode != "terminate")
    {
        Client.waitTick()
        
        if (botMode == "mainSouth") {
            eatCheck()

            // Run south while using your axe/shears,
            // until you hit a tree (or the end of the farm)
            lookAt(0, 0)
            if (!isChoppingBirch && hasShears && shearsTime < 2) {
                grabShears()
                shearsTime++;
            }
            else {
                grabAxe()
                if (botMode == "terminate") {
                    break
                }
            }
            KeyBind.keyBind("key.forward", true)
            KeyBind.keyBind("key.attack", true)

            if (!isMoving())
            {
                chopSouth()
                shearsTime = 0
            }
            checkRowEnd()
        }
        else if (botMode == "mainNorth") {
            // Run back to the start
            lookAt(180, 0)
            KeyBind.keyBind("key.forward", true)
            KeyBind.keyBind("key.attack", false)
            sprint(p.getZ() > minZ + 5)

            checkRowStart()
        }
        else if (botMode == "toNextRow") {
            lookAt(90, 0)
            if (!isChoppingBirch && hasShears && shearsTime < 2) {
                grabShears()
                shearsTime++;
            }
            else {
                grabAxe()
                if (botMode == "terminate") {
                    break
                }
            }
            KeyBind.keyBind("key.forward", true)
            KeyBind.keyBind("key.attack", true)
            sprint()

            if (!isMoving())
            {
                chopWest()
            }

            if (p.getX() <= nextRowX) {
                KeyBind.keyBind("key.forward", false)
                centerBot()
                botMode = "mainSouth"
                shearsTime = 0
            }
        }
        else if (botMode == "backToStart") {
            // HARDCODED for Fairhill's tree farm
            const lodestoneX = maxX + 4

            lookAt(-90, 0)
            KeyBind.keyBind("key.forward", true)
            KeyBind.keyBind("key.attack", false)
            sprint(p.getX() < lodestoneX - 5)

            if (p.getX() >= lodestoneX) {
                KeyBind.keyBind("key.forward", false)

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

                saplingTypeCheck()
                fellY = p.getY() - 0.5

                nextRowX = correctedCoord(maxX)
                botMode = "toNextRow"
                shearsTime = 0
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

// Only works when you're holding a tool
function checkDurability() {
    if (inv.getSlot(36 + inv.getSelectedHotbarSlotIndex()).getDurability() < minimumAxeDurability) {
        terminateReason = "Axe is about to break"
        botMode = "terminate"
    }
}

function chopSouth()
{
    KeyBind.keyBind("key.forward", false)

    grabAxe()
    if (botMode == "terminate") {
        return
    }
    
    centerBot()

    // Chop the log that's on the ground
    KeyBind.keyBind("key.attack", true)
    lookAt(10, 40)
    Client.waitTick(8)
    lookAt(0, 0)

    // Move to where the tree was
    targetFeetZ = Math.floor(p.getZ()) + 0.5
    feetZGoal = targetFeetZ + 1
    attemptwalk = 0
    while (targetFeetZ < feetZGoal && botMode != "terminate")
    {
        KeyBind.keyBind("key.forward", true)
        Time.sleep(5)
        targetFeetZ = Math.floor(p.getZ()) + 0.5
        KeyBind.keyBind("key.forward", false)
        attemptwalk++
        if (attemptwalk > 600)
        {
            feetZGoal = targetFeetZ
            attemptwalk = 0
        }
        checkFell()
        checkManualAbort()
    }

    checkDurability()
    if (botMode == "terminate") {
        return
    }

    // Chop wood above you
    lookAt(0, -90)
    Time.sleep(1800)

    // Place a sapling
    lookAt(0, 90)
    KeyBind.keyBind("key.attack", false)
    grabSapling()
    KeyBind.keyBind("key.use", true)
    Client.waitTick(2)
    KeyBind.keyBind("key.use", false)
    lookAt(0, 0)
    Client.waitTick()
}

function chopWest() {
    KeyBind.keyBind("key.forward", false)

    grabAxe()
    if (botMode == "terminate") {
        return
    }
    centerBot()

    // Chop the log that's on the ground
    KeyBind.keyBind("key.attack", true)
    lookAt(100, 40)
    Client.waitTick(8)
    lookAt(90, 0)

    // Move to where the tree was
    currentX = p.getX()
    attempts = 0
    while (currentX > nextRowX && botMode != "terminate")
    {
        KeyBind.keyBind("key.forward", true)
        Time.sleep(5)
        currentX = p.getX()
        KeyBind.keyBind("key.forward", false)
        attempts++
        if (attempts > 400)
        {
            break
        }
        checkFell()
        checkManualAbort()
    }

    checkDurability()
    if (botMode == "terminate") {
        return
    }

    // Chop wood above you
    lookAt(0, -90)
    Time.sleep(1800)

    // Place a sapling
    lookAt(0, 90)
    KeyBind.keyBind("key.attack", false)
    grabSapling()
    KeyBind.keyBind("key.use", true)
    Client.waitTick(2)
    KeyBind.keyBind("key.use", false)
    lookAt(90, 0)
    Client.waitTick()
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

// Drops all relevant items into the water collection.
function dropWood() {
    KeyBind.keyBind("key.attack", false)
    KeyBind.keyBind("key.forward", false)
    lookAt(120, 0)
    Client.waitTick()

    const RELEVANT_ITEMS = [
        "minecraft:oak_log",
        "minecraft:oak_leaves",
        "minecraft:apple",
        "minecraft:birch_log",
        "minecraft:birch_leaves",
        "minecraft:stick",
    ]
    inv = Player.openInventory()
    // Loop over whole inventory
    for (let i = 9; i < 45; i++) {
        if (RELEVANT_ITEMS.includes(inv.getSlot(i).getItemId())) {
            inv.dropSlot(i, true)
            Client.waitTick()
        }
    }
    inv.close()
    Client.waitTick()
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

    centerBot([p.getX(), p.getY(), bridgeZ])
    Client.waitTick()
    // Yup that's right, do it again
    centerBot([p.getX(), p.getY(), bridgeZ])

    // If we're at the end of the farm, go back to the first row
    if (p.getX() <= correctedCoord(minX)) {
        botMode = "backToStart"
    }
    // otherwise, move across the bridge to get to the next row
    else {
        nextRowX = Math.sign(p.getX()) * (Math.floor(Math.abs(p.getX())) + distanceBetweenRows)
        botMode = "toNextRow"
        shearsTime = 0
    }
}

function checkRowEnd() {
    if (p.getZ() < maxZ)
    {
        return
    }
    dropWood()
    botMode = "mainNorth"
}

// Returns true if you're currently moving.
function isMoving() {
    x = p.getX()
    z = p.getZ()
    Client.waitTick(2)
    return !(x == p.getX() && z == p.getZ())
}

// Grabs axe instead if user does not have shears.
function grabShears() {
    grabItem(["minecraft:shears"], "shears")
}

function grabAxe() {
    grabItem(["minecraft:diamond_axe"], "a diamond axe")
    checkDurability()
}

function grabSapling() {
    grabItem([sapling], "saplings")
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

function saplingTypeCheck() {
    // HARD CODED for Fairhill's tree farm
    if (p.getY() == 108) {
        botLog("Birch layer! Using birch saplings.")
        isChoppingBirch = true
        sapling = "minecraft:birch_sapling"
    }
    else {
        isChoppingBirch = false
        sapling = "minecraft:oak_sapling"
    }
}
