// You should only do one CS at a time, with three "output" double chests on the smelter
// Note: your smelter factory must have the "autodetect recipe" setting enabled


// The key you press to manually stop the bot
const abortKey = "tab"

// Note: all of these need to be reachable by the bot without moving
const compactorChestPos = [-3364, 80, -3298]
const compactorTablePos = [-3366, 80, -3298]
const compactorFurnacePos = [-3367, 80, -3298]
const smelterInChestPos = [-3365, 81, -3294]
const smelterOutChest1Pos = [-3367, 81, -3294]
const smelterOutChest2Pos = [-3368, 80, -3295]
const smelterOutChest3Pos = [-3365, 80, -3294]
const smelterFurnacePos = [-3367, 80, -3294]
const storageChestPos = [-3364, 80, -3296]

// Maybe increase this if the server is more laggy than usual
const lagTicks = 10


// Don't touch anything below

const BOT_NAME = "AutoBottleBot"
const ABORT_MANUALLY = "Player has pressed the abort key."

const SANDS = ["minecraft:sand", "minecraft:red_sand", "minecraft:soul_sand"]
const STICK = "minecraft:stick"
const GLASS = "minecraft:glass"
const BOTTLE = "minecraft:glass_bottle"

p = Player.getPlayer()
inv = "" // This needs to be a global scope variable
botMode = "setup"
terminateReason = ""

firstTimeSmelting = true
firstTimeCompacting = true
isStillSmelting = true
emptyGlassCounter = 0

Chat.say("/afk")


// Always start by grabbing and holding the stick
// The stick must be either in the compactor chest or already on you
openChest(compactorChestPos)
inv = Player.openInventory()
search = inv.findItem(STICK)
if (search.length > 0 && search[0] < 54) {
    // This takes into account the case where the stick is already on you
    // (if it's in the compactor then the slot is 0-53, otherwise 54-89)
    inv.quick(search[0])
}
inv.close()
Client.waitTick()
inv = Player.openInventory()
grabItem([STICK], "stick")
inv.close()
Client.waitTick()


while (botMode != "terminate") {
    Client.waitTick()
    checkManualAbort()

    if (botMode == "setup") {
        // Reset the run's memory
        firstTimeSmelting = true
        firstTimeCompacting = true
        isStillSmelting = true
        emptyGlassCounter = 0

        // Open storage chest
        openChest(storageChestPos)

        inv = Player.openInventory()

        // Deposit all compacted bottles
        depositAll([BOTTLE], true)

        // Take one CS of sand and two stacks of crates
        csOfSandWithdrawn = 0
        stacksOfCratesWithdrawn = 0
        for (i = 0; i <= 53; i++) {
            if (
                csOfSandWithdrawn == 0
                && SANDS.includes(inv.getSlot(i).getItemId())
                && inv.getSlot(i).getCount() == 64
                && inv.getSlot(i).getLore().length > 0
                && inv.getSlot(i).getLore()[0].getString() == "Compacted Item"
            ) {
                inv.quick(i)
                csOfSandWithdrawn++
            }
            if (
                stacksOfCratesWithdrawn < 2
                && ["minecraft:chest"].includes(inv.getSlot(i).getItemId())
                && inv.getSlot(i).getCount() == 64
                && inv.getSlot(i).getLore().length > 0
                && inv.getSlot(i).getLore()[0].getString() == "Crate"
            ) {
                inv.quick(i)
                stacksOfCratesWithdrawn++
            }
        }

        if (csOfSandWithdrawn == 0) {
            terminateReason = "there is no sand to turn into bottles"
            botMode = "terminate"
        }
        else if (stacksOfCratesWithdrawn < 2) {
            terminateReason = "not enough crates in storage chest"
            botMode = "terminate"
        }
        else {
            botMode = "decompact"
        }

        inv.close()
        Client.waitTick()
    }
    else if (botMode == "decompact") {
        // Open compactor chest
        openChest(compactorChestPos)

        // Put in all the compacted sand and crates
        inv = Player.openInventory()
        depositAll(SANDS, true)
        depositAllCrates()
        inv.close()
        Client.waitTick()

        // Set compactor to "decompact"
        setCompactor(1)

        // Run factory
        runCompactor()

        botMode = "smelt"
    }
    else if (botMode == "smelt") {
        // Open compactor chest
        openChest(compactorChestPos)

        // Take all decompacted sand from the compactor chest
        inv = Player.openInventory()
        withdrawAll(SANDS, false)

        // If inventory has any decompacted sand, smelt it
        if (hasAnyItem(SANDS, false, [54, 89])) {
            inv.close()
            Client.waitTick()

            // Open smelter's input chest
            openChest(smelterInChestPos)
            // Put in all the decompacted sand
            inv = Player.openInventory()
            depositAll(SANDS, false)
            inv.close()
            Client.waitTick()

            // The first time you deposit sand, run the smelter factory
            // (Assumes the smelter will autodetect the recipe)
            if (firstTimeSmelting) {
                runSmelter()
                firstTimeSmelting = false
            }

            // Reopen compactor chest
            openChest(compactorChestPos)
            inv = Player.openInventory()
        }

        // If compactor no longer has any sand, start compacting bottles
        if (!hasAnyItem(SANDS, true, [0, 53]) && !hasAnyItem(SANDS, false, [0, 53])) {
            botMode = "compact"
        }
        inv.close()
        Client.waitTick()
    }
    else if (botMode == "compact") {
        // Withdraw glass from the smelter
        if (isStillSmelting) {
            // Open each output chest and grab all the glass
            // in each chest until inventory is full
            withdrawAllGlass([
                smelterOutChest1Pos,
                smelterOutChest2Pos,
                smelterOutChest3Pos,
            ])
        }

        // Check if we have enough glass to make bottles
        stacksOfGlass = 0
        inv = Player.openInventory()
        for (i = 9; i <= 44; i++) {
            if (
                [GLASS].includes(inv.getSlot(i).getItemId())
                && inv.getSlot(i).getCount() == 64
                && inv.getSlot(i).getLore().length == 0
            ) {
                stacksOfGlass++
                if (stacksOfGlass == 3) {
                    break
                }
            }
        }
        inv.close()
        Client.waitTick()

        // Check if the smelter is still smelting
        if (isStillSmelting) {
            if (stacksOfGlass >= 3) {
                emptyGlassCounter = 0
            }
            else {
                emptyGlassCounter++
            }
            if (emptyGlassCounter >= 2) {
                isStillSmelting = false
            }
        }

        // Craft all the glass in your inventory into bottles
        if (stacksOfGlass >= 3) {
            openCraftingTable(compactorTablePos)
            craftBottles()
        }

        // Check if we have bottles
        inv = Player.openInventory()
        hasBottles = hasAnyItem([BOTTLE], false, [9, 44])
        inv.close()
        Client.waitTick()


        if (hasBottles) {
            // Deposit uncompacted bottles into compactor
            openChest(compactorChestPos)
            inv = Player.openInventory()
            depositStacks([BOTTLE], false, 5)
            inv.close()
            Client.waitTick()

            // The very first time you deposit bottles, run the compactor
            if (firstTimeCompacting) {
                // Set compactor to "compact"
                setCompactor(0)
                // Run factory
                runCompactor()
                firstTimeCompacting = false
            }

            // Wait for compactor to do its thing
            for (i = 0; i < 100; i++) {
                Client.waitTick()

                checkManualAbort()
                if (botMode == "terminate") {
                    break
                }
            }
        }
        else if (!isStillSmelting && stacksOfGlass < 3) {
            // Wait for the compactor to compact all the bottles
            openChest(compactorChestPos)
            inv = Player.openInventory()

            stillHasBottles = true
            while (true) {
                // Withdraw all compacted bottles from compactor chest
                withdrawAll([BOTTLE], true)
                stillHasBottles = hasAnyItem([BOTTLE], false, [0, 53])

                if (!stillHasBottles) {
                    botLog("1 CS of sand done!")
                    botMode = "setup"
                    break
                }

                // (Allow user to abort while this is ongoing)
                checkManualAbort()
                if (botMode == "terminate") {
                    break
                }

                Client.waitTick()
            }

            inv.close()
            Client.waitTick()
        }
    }
}

KeyBind.keyBind("key.attack", false)
KeyBind.keyBind("key.use", false)

if (terminateReason == ABORT_MANUALLY)
{
    botLog("Bot manually terminated")
}
else
{
    botLog("Bot terminated: " + terminateReason)
}

Chat.say("/afk")
World.playSound("entity.ghast.scream", 100, 0)


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

// Input should be an array with 3 elements, x y z
function lookAtBlock(coords) {
    p.lookAt(coords[0]+0.5, coords[1]+0.5, coords[2]+0.5)
}

function grabItem(validItems, itemDescription) { 
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
            const hotbarSlotToUse = 5
            inv.swap(i, 36 + hotbarSlotToUse)
            inv.setSelectedHotbarSlotIndex(hotbarSlotToUse)
            return
        }
    }

    // If the code makes it to here, it means we failed to find a valid item
    terminateReason = "Could not find " + itemDescription + " in inventory"
    botMode = "terminate"
}

// validItems is an array with item IDs
function depositAll(validItems, isCompacted) {
    // Search your inventory and hotbar (slots 54 to 80 and 81 to 89)
    for (i = 54; i <= 89; i++) {
        if (
            validItems.includes(inv.getSlot(i).getItemId())
            && (
                (
                    isCompacted
                    && inv.getSlot(i).getLore().length > 0
                    && inv.getSlot(i).getLore()[0].getString() == "Compacted Item"
                ) || (
                    !isCompacted && inv.getSlot(i).getCount() == 64 && (
                        inv.getSlot(i).getLore().length == 0
                        || inv.getSlot(i).getLore()[0].getString() != "Compacted Item"
                    )
                )
            )
        ) {
            inv.quick(i)
        }
    }
}

// validItems is an array with item IDs
function depositStacks(validItems, isCompacted, numberOfStacks) {
    stacksDeposited = 0
    // Search your inventory and hotbar (slots 54 to 80 and 81 to 89)
    for (i = 54; i <= 89; i++) {
        if (
            validItems.includes(inv.getSlot(i).getItemId())
            && (
                (
                    isCompacted
                    && inv.getSlot(i).getLore().length > 0
                    && inv.getSlot(i).getLore()[0].getString() == "Compacted Item"
                ) || (
                    !isCompacted && inv.getSlot(i).getCount() == 64 && (
                        inv.getSlot(i).getLore().length == 0
                        || inv.getSlot(i).getLore()[0].getString() != "Compacted Item"
                    )
                )
            )
        ) {
            inv.quick(i)
            stacksDeposited++
            if (stacksDeposited >= numberOfStacks) {
                return
            }
        }
    }
}

function depositAllCrates() {
    // Search your inventory and hotbar (slots 54 to 80 and 81 to 89)
    for (i = 54; i <= 89; i++) {
        if (
            ["minecraft:chest"].includes(inv.getSlot(i).getItemId())
            && inv.getSlot(i).getCount() == 64
            && inv.getSlot(i).getLore().length > 0
            && inv.getSlot(i).getLore()[0].getString() == "Crate"
        ) {
            inv.quick(i)
        }
    }
}

// validItems is an array with item IDs
function withdrawAll(validItems, isCompacted) {
    // Search the double chest (slots 0 to 53)
    for (i = 0; i <= 53; i++) {
        if (
            validItems.includes(inv.getSlot(i).getItemId())
            && (
                (
                    isCompacted
                    && inv.getSlot(i).getLore().length > 0
                    && inv.getSlot(i).getLore()[0].getString() == "Compacted Item"
                ) || (
                    !isCompacted && inv.getSlot(i).getCount() == 64 && (
                        inv.getSlot(i).getLore().length == 0
                        || inv.getSlot(i).getLore()[0].getString() != "Compacted Item"
                    )
                )
            )
        ) {
            inv.quick(i)
        }
    }
}

// validItems is an array with item IDs
function withdrawStacks(validItems, numberOfStacks) {
    numberOfStacksWithdrawn = 0
    // Search the double chest (slots 0 to 53)
    for (i = 0; i <= 53; i++) {
        if (
            validItems.includes(inv.getSlot(i).getItemId())
            && inv.getSlot(i).getCount() == 64
            && inv.getSlot(i).getLore().length > 0
            && inv.getSlot(i).getLore()[0].getString() == "Compacted Item"
        ) {
            inv.quick(i)
            numberOfStacksWithdrawn++
            if (numberOfStacksWithdrawn >= numberOfStacks) {
                return
            }
        }
    }
}

// Returns true if your inventory has any of given validItems (an array of item IDs)
// otherwise returns false
// slotRange should be an array with 2 elements, the 1st slot to check and the last slot to check
function hasAnyItem(validItems, isCompacted, slotRange) {
    for (i = slotRange[0]; i <= slotRange[1]; i++) {
        if (
            validItems.includes(inv.getSlot(i).getItemId())
            && (
                (
                    isCompacted
                    && inv.getSlot(i).getLore().length > 0
                    && inv.getSlot(i).getLore()[0].getString() == "Compacted Item"
                ) || (
                    !isCompacted && inv.getSlot(i).getCount() == 64 && (
                        inv.getSlot(i).getLore().length == 0
                        || inv.getSlot(i).getLore()[0].getString() != "Compacted Item"
                    )
                )
            )
        ) {
            return true
        }
    }

    return false
}

// chestCoords should be an array with 3 elements, x y z
function openChest(chestCoords) {
    lookAtBlock(chestCoords)
    KeyBind.keyBind("key.use", true)
    Client.waitTick()
    KeyBind.keyBind("key.use", false)
    // Wait for the inventory to open (lag can delay this)
    Client.waitTick(lagTicks)
}

function punchBlock(blockPos) {
    lookAtBlock(blockPos)
    Client.waitTick()
    KeyBind.keyBind("key.attack", true)
    Client.waitTick()
    KeyBind.keyBind("key.attack", false)
    Client.waitTick()
}

// recipe: 0 for compact, 1 for decompact
function setCompactor(recipe) {
    punchBlock(compactorTablePos)
    Client.waitTick(lagTicks)
    inv = Player.openInventory()
    inv.click(recipe)
    inv.close()
    Client.waitTick()
}

function runCompactor() {
    punchBlock(compactorFurnacePos)
}

function runSmelter() {
    punchBlock(smelterFurnacePos)
}

function openCraftingTable(tablePos) {
    lookAtBlock(tablePos)
    KeyBind.keyBind("key.use", true)
    Client.waitTick()
    KeyBind.keyBind("key.use", false)
    Client.waitTick(lagTicks)
}

// Withdraws all glass in each chest in given list until inventory is full
function withdrawAllGlass(chestPosList) {
    // There is no chest to withdraw from? Then we're done
    if (chestPosList.length == 0) {
        return
    }

    // Withdraw all glass in the first chest
    openChest(chestPosList[0])
    inv = Player.openInventory()
    withdrawAll([GLASS], false)
    inv.close()
    Client.waitTick()

    // Inventory is full? Then we're done
    inv = Player.openInventory()
    if (inv.findFreeInventorySlot() == -1) {
        inv.close()
        Client.waitTick()
        return
    }
    inv.close()
    Client.waitTick()

    // Recursively withdraw from all the chests,
    // except the first one on the list, we already did that one
    chestPosList.shift()
    withdrawAllGlass(chestPosList)
}

// Assumes you're already in the crafting table menu
function craftBottles() {
    inv = Player.openInventory()
    
    // Dress up a list of every inventory slot containing a full stack of glass
    glassSlots = []
    slots = inv.getSlots('main', 'hotbar')
    for (slot of slots) {
        if (
            inv.getSlot(slot).getItemId() == GLASS
            && inv.getSlot(slot).getCount() == 64
        ) {
            glassSlots.push(slot)
        }
    }
    
    const BOTTLES_RECIPE = [1, 3, 5]
    for (let i = 0; i <= ((glassSlots.length / 3) - 1); i++) {
        for (let j = 0; j < 3; j++) {
            inv.swap(glassSlots[3*i + j], BOTTLES_RECIPE[j])
            Client.waitTick()
        }
        inv.quick(0)
        Client.waitTick()
    }

    inv.close()
    Client.waitTick()
}
