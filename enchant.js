/* Automatically enchants tools!

You need to have chests and an enchanting table in your reach.

Note: this script is prone to crashing when the server's tps gets too low.

*/

// To stop the bot manually, hold this key
const abortKey = "tab"

// The coords of the chest containing your unenchanted tools
const inputX = -3368
const inputZ = -3302
// The coords of the chest where your emeralds and lapis are
const emeraldX = -3363
const emeraldZ = -3305
// The coords of your enchantment table
const enchantingX = -3362
const enchantingZ = -3299
// The coords of the chest where you'll put the enchanted tools
const outputX = -3365
const outputZ = -3305

const lagTick = 5
//The number of tools you want to enchant per round
const toolPerRound = 30


// Don't touch anything below

const p = Player.getPlayer()
terminateReason = ""

while (terminateReason == "") {
    takeTools()

    checkAbort()
    if (terminateReason != "") { break }
    
    enchantTools()

    checkAbort()
    if (terminateReason != "") { break }

    storeTools()

    checkAbort()
}

Chat.log("Bot terminated. Reason: " + terminateReason)
World.playSound("entity.elder_guardian.curse", 200)


function checkAbort() {
    if (KeyBind.getPressedKeys().contains("key.keyboard." + abortKey)) {
        terminateReason = "pressed abort key."
    }
}

// Returns the number of tools that can be enchanted
function countTools() {
    inv = Player.openInventory()
    slots = inv.getSlots("main", "hotbar")
    tools = 0
    for (slot of slots) {
        if (inv.getSlot(slot).isDamageable() && (!inv.getSlot(slot).isEnchanted())) {
            tools++
        }
    }
    return tools
}

function takeTools() {
    tools = countTools()

    if (tools >= toolPerRound) {
        return
    }

    lookAtCenter(inputX, inputZ)
    Client.waitTick()
    p.interact()
    Client.waitTick(lagTick)
    inv = Player.openInventory()
    slots = inv.getSlots("container")
    for (slot of slots) {
        if (
            inv.getSlot(slot).isDamageable()
            && (!inv.getSlot(slot).isEnchanted())
        ) {
            tools++
            inv.quick(slot)
            Client.waitTick()
            if (tools >= toolPerRound) {
                break
            }
        }
    }
    inv.close()
    Client.waitTick(lagTick)

    if (tools == 0) {
        terminateReason = "ran out of tools to enchant."
    }
}

function enchantTools() {
    numberOfTools = countTools()
    for (let i = 0; i < numberOfTools; i++) {
        refillConsumables()

        checkAbort()
        if (terminateReason != "") { return }

        enchantOneTool()

        checkAbort()
        if (terminateReason != "") { return }
    }
}

function refillConsumables() {
    minimumEmeralds = 16
    minimumLapis = 3

    inv = Player.openInventory()
    Client.waitTick()
    emeraldCount = inv.getItemCount().get("minecraft:emerald")
    lapisCount = inv.getItemCount().get("minecraft:lapis_lazuli")
    if (emeraldCount < minimumEmeralds || lapisCount < minimumLapis) {
        lookAtCenter(emeraldX, emeraldZ)
        Client.waitTick(lagTick)
        p.interact()
        Client.waitTick(lagTick)
        inv = Player.openInventory()
        while (emeraldCount < minimumEmeralds) {
            search = inv.findItem("minecraft:emerald")
            if (search.length == 0) {
                terminateReason = "ran out of emeralds."
                return
            }
            emeraldCount += inv.getSlot(search[0]).getCount()
            inv.quick(search[0])
            Client.waitTick()
        }
        while (lapisCount < minimumLapis) {
            search = inv.findItem("minecraft:lapis_lazuli")
            if (search.length == 0) {
                terminateReason = "ran out of lapis."
                return
            }
            lapisCount += inv.getSlot(search[0]).getCount()
            inv.quick(search[0])
            Client.waitTick()
        }
    }
    inv.close()
    Client.waitTick(lagTick)
}

function enchantOneTool() {
    eatEmeralds()
    if (terminateReason != "") { return }

    // Because you can't open the enchantment table while holding an emerald
    inv.setSelectedHotbarSlotIndex(1)

    lookAtCenter(enchantingX, enchantingZ)
    Client.waitTick(lagTick)
    p.interact()
    Client.waitTick(lagTick)
    inv = Player.openInventory()
    Client.waitTick(lagTick)
    
    toolSlot = 0
    lapisSlot = 0
    slots = inv.getSlots('main', 'hotbar')
    for (slot of slots) {
        if (inv.getSlot(slot).isDamageable() && !inv.getSlot(slot).isEnchanted()) {
            toolSlot = slot
        }
        if (
            inv.getSlot(slot).getItemId() == "minecraft:lapis_lazuli"
            && inv.getSlot(slot).getCount() >= 3
        ) {
            lapisSlot = slot
        }
    }
    if (toolSlot == 0) {
        terminateReason = "could not find any tool in your inventory."
        return
    }
    if (lapisSlot == 0) {
        terminateReason = "could not find any slot with at least 3 lapis."
        return
    }

    inv.quick(toolSlot)
    Client.waitTick()    
    inv.quick(lapisSlot)
    Client.waitTick(lagTick)
    inv.doEnchant(2)
    Client.waitTick(lagTick)
    inv.close()
}

function eatEmeralds() {
    if (p.getXPLevel() >= 30) {
        return
    }

    inv.setSelectedHotbarSlotIndex(0)

    grabEmeralds()
    if (terminateReason != "") { return }

    p.lookAt(0, 90)
    Client.waitTick(lagTick)
    for (let i = 0; i < 16; i++) {
        checkAbort()
        if (terminateReason != "") { return }

        if (inv.getSlot(36).isEmpty()) {
            grabEmeralds()
            if (terminateReason != "") { return }
        }
        p.interact()
        Client.waitTick(lagTick)
        
        if (p.getXPLevel() >= 30) {
            return
        }
    }
}

function grabEmeralds() {
    inv = Player.openInventory()
    list = inv.findItem("minecraft:emerald")
    if (list.length == 0) {
        terminateReason = "could not find emeralds in your inventory."
        return
    }
    inv.swapHotbar(list[0], 0)
    Client.waitTick(lagTick)
}

function storeTools() {
    lookAtCenter(outputX, outputZ)
    Client.waitTick()
    p.interact()
    Client.waitTick(lagTick)
    inv = Player.openInventory()
    slots = inv.getSlots("main", "hotbar")
    for (slot of slots) {
        if (inv.getSlot(slot).isDamageable() && inv.getSlot(slot).isEnchanted()) {
            inv.quick(slot)
            Client.waitTick()
        }
    }
    inv.close()
    Client.waitTick(lagTick)
}

// Makes you look at the center of a block
function lookAtCenter(x, z) {
    p.lookAt(x + 0.5, p.getY() + 0.5, z + 0.5)
}
