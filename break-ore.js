// Automaically break iron ore, gold ore and copper ore!

// Please note that currently it doesn't check for enchantments on pickaxes
// so make sure your inventory only has a Fortune III pickaxe.


// Feel free to change the key to manually stop the bot.
const abortKey = "tab"


// Don't touch anything below

p = Player.getPlayer()
mainSlot = 36
errorMessage = ""

main()

function main() {
    while (grabOre() && placeOre() && grabPick() && breakOre()) {
        if (KeyBind.getPressedKeys().contains("key.keyboard." + abortKey)) {
            Chat.log("[BreakOreBot] Aborted by user.")
            return
        }
    }

    Chat.log("[BreakOreBot] Finished. " + errorMessage)
}

function grabOre() {
    return grabItem(
        [
            "minecraft:deepslate_copper_ore",
            "minecraft:copper_ore",
            "minecraft:deepslate_gold_ore",
            "minecraft:gold_ore",
            "minecraft:deepslate_iron_ore",
            "minecraft:iron_ore",
        ], "ores"
    )
}

function placeOre() {
    p.lookAt(0,55)
    Client.waitTick()
    p.interact()
    Client.waitTick()
    return true
}

function grabPick() {
    return grabItem(["minecraft:diamond_pickaxe"], "pickaxe")
}

function breakOre() {
    p.lookAt(0,60)
    Client.waitTick()
    KeyBind.keyBind("key.attack", true)
    Client.waitTick(12)
    KeyBind.keyBind("key.attack", false)
    Client.waitTick()
    return true
}


function grabItem(validItems, itemDescription) { 
    inv = Player.openInventory()

    // Search hotbar (slots 36 to 44)
    for (i = 0; i < 9; i++) {
        if (validItems.includes(inv.getSlot(i + 36).getItemId())) {
            inv.setSelectedHotbarSlotIndex(i)
            return true
        }
    }

    // Search rest of inventory (slots 9 to 35)
    for (i = 9; i < 36; i++) {
        if (validItems.includes(inv.getSlot(i).getItemId())) {
            inv.setSelectedHotbarSlotIndex(i)
            inv.swap(i, mainSlot)
            return true
        }
    }

    // If the code makes it to here, it means we failed to find a valid item
    errorMessage = "Could not find " + itemDescription + " in inventory"
    return false
}
