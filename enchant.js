// Automatically enchant tools!
// You need to have chests and an enchanting table in your reach.

// To stop the bot manually, hold this key
const abortKey = "tab";

// The coords of the chest containing your unenchanted tools
const inputX = -3365;
const inputZ = -3305;
// The coords of the chest where your emeralds and lapis are
const emeraldX = -3363;
const emeraldZ = -3305;
// The coords of your enchantment table
const enchantingX = -3362;
const enchantingZ = -3299;
// The coords of the chest where you'll put the enchanted tools
const outputX = -3365;
const outputZ = -3305;

const lagTick = 5;
//The number of tools you want to enchant per round
const toolPerRound = 30;


// Don't touch anything below

const p = Player.getPlayer();

function lookAtCenter(x, z) { // Look at the center of a block
    p.lookAt(x+0.5, p.getY()+0.5, z+0.5)
}

function checkAbort() {
    if (KeyBind.getPressedKeys().contains("key.keyboard." + abortKey)) {
        abort("Stopped the bot manually.")
    }
}

function abort(message) {
    World.playSound("entity.elder_guardian.curse", 200);
    Chat.log(message)
    throw("")
}

// Check if you are in front of enchanting table
inv = Player.openInventory();

function equip(item,slot) { // Equip an item in a certain slot
    inv = Player.openInventory();
    list = inv.findItem(item);
    if (list.length==0) {
        abort("No more mats");
    }
    inv.swapHotbar(list[0],slot);
    Client.waitTick(lagTick);
}

function equipLapis(){ // Equip lapis on the second slot, but have at least two stacks
    inv = Player.openInventory();
    list = inv.findItem("minecraft:lapis_lazuli");
    slot = 0;
    for (let i=0;i<list.length;i++){
        if(inv.getSlot(list[i]).getCount()>=3) {
            slot = list[i];
            break;
        }
    }
    if (slot==0) {
        abort("No more lapis.");
    } else {
        inv.swapHotbar(slot,1);
    }
}

function countTools() { // Returns the number of tools that are ready to be enchanted
    inv = Player.openInventory();
    slots = inv.getSlots('main', 'hotbar');
    tools = 0;
    for (slot of slots) {
        if (inv.getSlot(slot).isDamageable() && (!inv.getSlot(slot).isEnchanted())) {
            tools++
        }
    }
    return tools
}

function takeTools() {
    checkAbort()
    tools = countTools()
    lookAtCenter(inputX,inputZ)
    Client.waitTick()
    p.interact()
    Client.waitTick(lagTick)
    inv = Player.openInventory()
    slots = inv.getSlots('container')
    for (slot of slots) {
        if (
            inv.getSlot(slot).isDamageable()
            && (!inv.getSlot(slot).isEnchanted())
            && (tools < toolPerRound)
        ) {
            tools++
            inv.quick(slot)
            Client.waitTick()
        }
    }
    inv.close()
    Client.waitTick(lagTick)
    if (tools == 0) {
        abort("Ran out of tools to enchant.")
    }
}

function eatEmeralds() {
    inv.setSelectedHotbarSlotIndex(0)
    equip("minecraft:emerald", 0)
    p.lookAt(0, 90)
    Client.waitTick(lagTick)
    for (let i = 0; i < 16; i++) {
        checkAbort()
        if (inv.getSlot(36).isEmpty()) {
            equip("minecraft:emerald", 0)
        }
        p.interact()
        Client.waitTick(lagTick)
    }
    // Because you can't open the enchantment table while holding an emerald
    inv.setSelectedHotbarSlotIndex(1)
}

function enchantATool(){
    checkAbort()
    eatEmeralds()
    lookAtCenter(enchantingX, enchantingZ)
    Client.waitTick(lagTick)
    p.interact()
    Client.waitTick(lagTick)
    inv = Player.openInventory()
    Client.waitTick(lagTick)
    
    toolSlot = 0
    lapisSlot = 0
    slots = inv.getSlots('main','hotbar')
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
        abort("Could not find a tool in inventory.")
    }
    if (lapisSlot == 0) {
        abort("Could not get lapis slot with at least 3 lapis.")
    }

    inv.quick(toolSlot)
    Client.waitTick()    
    inv.quick(lapisSlot)
    Client.waitTick(lagTick)
    inv.doEnchant(2)
    Client.waitTick(lagTick)
    inv.close()
}

function enchantAllTool(){
    numberOfTool = countTools()
    for (let i=0;i<numberOfTool;i++) {
        refillConsumable()
        enchantATool()
    }
}

function refillConsumable(){
    minimumEmeralds = 16
    minimumLapis = 3

    checkAbort()
    inv = Player.openInventory()
    Client.waitTick()
    emeraldCount = inv.getItemCount().get("minecraft:emerald")
    lapisCount = inv.getItemCount().get("minecraft:lapis_lazuli")
    if (emeraldCount < minimumEmeralds || lapisCount < minimumLapis) {
        lookAtCenter(emeraldX,emeraldZ)
        Client.waitTick(lagTick)
        p.interact()
        Client.waitTick(lagTick)
        inv = Player.openInventory()
        while (emeraldCount < minimumEmeralds) {
            search = inv.findItem("minecraft:emerald")
            if (search.length == 0) {
                abort("Ran out of emeralds.")
            }
            emeraldCount += inv.getSlot(search[0]).getCount()
            inv.quick(search[0])
            Client.waitTick()
        }
        while (lapisCount < minimumLapis) {
            search = inv.findItem("minecraft:lapis_lazuli")
            if (search.length == 0) {
                abort("Ran out of lapis.")
            }
            lapisCount += inv.getSlot(search[0]).getCount()
            inv.quick(search[0])
            Client.waitTick()
        }
    }
    inv.close()
    Client.waitTick(lagTick)
}

function emptyTool(){
    checkAbort();
    lookAtCenter(outputX,outputZ);
    Client.waitTick();
    p.interact();
    Client.waitTick(lagTick);
    inv = Player.openInventory();
    slots = inv.getSlots('main','hotbar');
    for (slot of slots) {
        if (inv.getSlot(slot).isDamageable() && inv.getSlot(slot).isEnchanted()) {
            inv.quick(slot);
            Client.waitTick();
        }
    }
    inv.close();
    Client.waitTick(lagTick);
}

while (true) {
    takeTools()
    enchantAllTool()
    emptyTool()
}
