/* Automatically dig a rectangular area
(Heavily modified version of a script written by arthirob)
This script has been rewritten to specialize in digging terracotta in the mesa biome.

The hotbar should be: tool ; fillblock ; torches ; food ; chests ; gravityblock

The bot digs from south to north, then from west to east.

*/

// Hold this key to manually abort the bot
const abortKey = "tab";

const xWest = -3664; // The X coordinate of your starting point
const zSouth = -3010; // The Z coordinate of your starting point
const yStop = 8; // The y layer at which you want to stop
const North = 47; // The number of block you want to dig to the north of the startpoint
const East = 48; // The number of block you want to dig to the east of the startpoint
const storeMats = true;

const minimumDurability = 10; // The bot will stop if your tool has less durability than this
const lagTick = 6; // Add a little delay to compensate the lag. You can try to play with this one

const torchGridX = 6; //The x distance between your torches
const torchGridZ = 7; //The z distance between your torches
const foodType = "minecraft:cooked_porkchop"; // Change the food to be whatever you prefer to use !
const tool = "minecraft:diamond_pickaxe"; // The tool you'll be using
const blockHardness = 0.5; // 1.5 for stone like, 0.5 for dirt like, 3 for deepslate

// When disabled, the bot sneaks and makes sure to never fall down a hole.
// When enabled, the bot walks without sneaking, accepting the risk of falling down a hole.
const fastMode = true;

// The block you'll use to fill the holes under you
const solidBlock = "minecraft:terracotta"

// The block you'll use when going down a layer. Must have gravity (e.g. sand, gravel)
const gravityBlock = "minecraft:sand"

// Blocks that will be dropped (into chests if applicable)
const toDump = [
    "minecraft:terracotta",
    "minecraft:dirt",
    "minecraft:granite",
    "minecraft:diorite",
    "minecraft:andesite",
    "minecraft:stone",
    "minecraft:cobblestone",
    "minecraft:calcite",
    "minecraft:tuff",
    "minecraft:deepslate",
    "minecraft:cobbled_deepslate",
]


// JS macro stuff, don't touch
const p = Player.getPlayer();
const im = Player.getInteractionManager();
var inv = Player.openInventory();

// Don't touch those variables, they are used during the script to track execution
var currentX; //X at the start of the script
var currentZ; //Z at the start of the script
var currentY; //Y at the current layer
var dir; // 1 for north, 0 for south
var keepSolid;//The number of solid blocks stacks you want to keep
var oldDir; //Store the old direction when you need to modify the dir variable (at the end of a line)
var prevX ; //Allows to check if X changed
var prevY ; //Allows to check if Y changed
var prevZ ; //Allows to check if Z changed
var stuck ; //Check if you are stuck in a block
var stuckHit ;// If you are stuck on a block you need to break, make the breaktime higher each try
var breakTime = 0; //The break time for a regular block
const startTime = Date.now();


function abort(message) {
    KeyBind.keyBind("key.attack", false);
    KeyBind.keyBind("key.forward", false);
    KeyBind.keyBind("key.sneak", false);
    KeyBind.keyBind("key.use", false);
    KeyBind.keyBind("key.jump", false);
    throw("[QuarryBot] " + message);
}

function checkAbort() {
    if (KeyBind.getPressedKeys().contains("key.keyboard." + abortKey)) {
        abort("User pressed the abort key.");
    }
}

function checkFell() {
    if (p.getY() < currentY) {
        Chat.log("[QuarryBot] Bot fell, attempting to pillar back up...");
    }
    while (p.getY() < currentY) {
        botY = p.getY();
        KeyBind.keyBind("key.attack", false);
        KeyBind.keyBind("key.forward", false);
        KeyBind.keyBind("key.sneak", true);
        KeyBind.keyBind("key.jump", false);
        p.lookAt(Math.floor(p.getX()) + 0.5, p.getY(), Math.floor(p.getZ()) + 0.5);
        Client.waitTick();
        KeyBind.keyBind("key.jump", true);
        Client.waitTick(5);
        KeyBind.keyBind("key.jump", false);
        placeFill(1);
        Client.waitTick();
        inv.setSelectedHotbarSlotIndex(0);
        if (p.getY() == botY) {
            abort("Bot fell and failed to pillar back up")
        }
        checkAbort();
    }
}

function checkDurability() {
    if (inv.getSlot(36).getDurability() < minimumDurability) {
        abort("Tool is about to break");
    }
}

function equip(item,slot) { // Equip an item in a certain slot
    list = inv.findItem(item);
    if (list.length==0) {
        throw("No more "+item)
    }
    inv.swapHotbar(list[0],slot);
    Client.waitTick();
}

function placeFill(i) { // Autofill the i slot
    item = inv.getSlot(36 + i).getItemID();
    inv.setSelectedHotbarSlotIndex(i);
    Client.waitTick();
    p.interact();
    Client.waitTick();
    if (inv.getSlot(36 + i).getCount() == 0) {
        // Slot i is empty
        list = inv.findItem(item);
        if (list.length == 0) {
            abort("Ran out of the item needed in slot " + i);
        }
        inv.swapHotbar(list[0], i);
        Client.waitTick();
    }
}

function lookAtCenter(x, z) {// Look at the center of a block
    p.lookAt(x+0.5,p.getY()+0.5, z+0.5);
}

function lookAtBlock(x, y, z) {// Look at the center of a block
    p.lookAt(x+0.5, y+0.5, z+0.5);
}

// Place a torch if it follows the torch grid
function placeTorch(x, z) {
    if (((x - xWest) % torchGridX == 0) && ((z - zSouth) % torchGridZ == 0)) {
        p.lookAt(x + 0.5, p.getY(), z + 0.5);
        placeFill(3);
        inv.setSelectedHotbarSlotIndex(0);  
    }
}

function walkTo(x, z)
{
    const ERROR_MARGIN = 0.1
    const SNEAK_MARGIN = 1.0
    x = Math.floor(x) + 0.5
    z = Math.floor(z) + 0.5
    fallbackSneakCounter = 0;

    do {
        KeyBind.keyBind("key.attack", false)
        KeyBind.keyBind("key.forward", true)
        distanceX = Math.abs(p.getX() - x)
        distanceZ = Math.abs(p.getZ() - z)
        isSneaking = distanceX <= SNEAK_MARGIN && distanceZ <= SNEAK_MARGIN
        fallbackSneakCounter++;
        if (fallbackSneakCounter >= 10) {
            isSneaking = false;
            fallbackSneakCounter = 0;
        }
        KeyBind.keyBind("key.sneak", isSneaking)
        p.lookAt(x, p.getY(), z)
        Client.waitTick();
        checkFell()
        checkAbort()
    } while (distanceX > ERROR_MARGIN || distanceZ > ERROR_MARGIN)
    KeyBind.keyBind("key.forward", false)
    KeyBind.keyBind("key.sneak", false)
}

function checkHaste() { //Function that return a bool if you have the haste debuff
    gotBuff = false;
    effectMap = p.getStatusEffects();
    for (let i=0;i<effectMap.length;i++) {
        if ((effectMap[i].getId()=="minecraft:haste")&&(effectMap[i].getStrength()==1)) {
            gotBuff=true;
        }
    }
    return gotBuff;
}

function dumpBlock() { //Throw the useless blocks, keep a few stacks of the item you need
    p.lookAt(xWest+East,p.getY()+1.5,zSouth-(North/2));
    Client.waitTick(3);
    keepSolid = 0;
    for (let i = 9; i < 45 ; i++) {
        if (toDump.includes(inv.getSlot(i).getItemID())){
            if ((inv.getSlot(i).getItemID()==solidBlock)) {
                if ((keepSolid>5)&&(i!=37)) {
                    inv.dropSlot(i,true)
                    Client.waitTick();
                } else {
                    keepSolid++;
                }
            } else {
                inv.dropSlot(i,true)
                Client.waitTick();
            }
        }
    }    
}

function placeChest() {
    walkTo(xWest + 3, zSouth - 3);
    lookAtCenter(xWest, zSouth - 2);
    Client.waitTick();
    placeFill(4);
    lookAtCenter(xWest, zSouth - 3);
    placeFill(4);
    emptyBlock(xWest, zSouth - 2);
}

// Store the useless blocks, and keep a few stacks of the item you need
function emptyBlock(cornerX, cornerZ) {
    lookAtCenter(cornerX, cornerZ);
    Client.waitTick();
    p.interact();
    Client.waitTick(lagTick);
    inv = Player.openInventory();
    Client.waitTick(10);
    if (inv.getContainerTitle()=="Large Chest") {// You managed to open the chest
        keepSolid = 0;
        for (let i = 54; i <= 89 ; i++) {
            if (toDump.includes(inv.getSlot(i).getItemID())){
                if ((inv.getSlot(i).getItemID()==solidBlock)) {
                    if (keepSolid>5) {
                        inv.quick(i)
                        Client.waitTick();
                    } else {
                        keepSolid++;
                    }
                } else {
                    inv.quick(i)
                    Client.waitTick();
                }
            }
        }
    } else if (inv.getContainerTitle()=="Chest") {
        keepSolid = 0;
        for (let i = 27; i <= 62 ; i++) {
            if (toDump.includes(inv.getSlot(i).getItemID())){
                if ((inv.getSlot(i).getItemID()==solidBlock)) {
                    if (keepSolid>5) {
                        inv.quick(i)
                        Client.waitTick();
                    } else {
                        keepSolid++;
                    }
                } else {
                    inv.quick(i)
                    Client.waitTick();
                }
            }
        }
    } else {
        Chat.log("Chest could not be opened, skipping this one")
    }
    Client.waitTick(lagTick)
    inv.close();
    Client.waitTick(lagTick)
    inv = Player.openInventory();
}

// Automatically eats when in need
function eatCheck() {
    const minFoodLevel = 14
    if (p.getFoodLevel() >= minFoodLevel) {
        return
    }
    KeyBind.keyBind('key.right', false)
    KeyBind.keyBind("key.attack", false)
    Chat.log("[QuarryBot] Food level low, auto eating")
    grabFood()
    Client.waitTick(10)
    KeyBind.key("key.mouse.right",true)
    Client.waitTick(33)
    KeyBind.key("key.mouse.right",false)
    KeyBind.keyBind('key.right', true)
    KeyBind.keyBind("key.attack", true)
    grabTool()
}

function grabFood() {
    inv.setSelectedHotbarSlotIndex(2);
}

function grabTool() {
    inv.setSelectedHotbarSlotIndex(0);
}

// Mine the block at this position and walk to it
function mineOne(x, z) {
    isDigging = true;
    digMode = "";
    const RECENTER_MARGIN = 0.15;
    checkDurability();

    if (dir == 1) {
        // Going north
        
        // Center the player on the row
        if (Math.abs(p.getX() - (x + 0.5)) > RECENTER_MARGIN) {
            walkTo(x, p.getZ());
        }

        if (p.getZ() >= zSouth) {
            digMode = "newrow";
        }
        if (fastMode) {
            if (p.getZ() <= zSouth - North + 1 + 4.67) {
                KeyBind.keyBind("key.attack", false);
                isDigging = false;
            }
            else if (p.getZ() <= zSouth - North + 1 + 5.67) {
                p.lookAt(180 * dir, 0);
                KeyBind.keyBind("key.attack", false);
                Client.waitTick();
                KeyBind.keyBind("key.attack", true);
                Time.sleep(120);
                KeyBind.keyBind("key.attack", false);
                p.lookAt(180 * dir, 10);
                Client.waitTick();
                KeyBind.keyBind("key.attack", true);
                Time.sleep(60);
                KeyBind.keyBind("key.attack", false);
                isDigging = false;
            }
        }
        else {
            if (p.getZ() <= zSouth - North + 1 + 1) {
                isDigging = false;
            }
            else if (p.getZ() <= zSouth - North + 1 + 5) {
                p.lookAt(180 * dir, 0);
                KeyBind.keyBind("key.attack", true);
                Time.sleep(60);
                KeyBind.keyBind("key.attack", false);
                isDigging = false;
            }
        }
    }
    else if (dir == 0.0) {
        // Going south

        // Center the player on the row
        if (Math.abs(p.getX() - (x + 0.5)) > RECENTER_MARGIN) {
            walkTo(x, p.getZ());
        }

        if (p.getZ() <= zSouth - North + 2) {
            digMode = "newrow";
        }
        if (fastMode) {
            if (p.getZ() >= zSouth - 3.67) {
                isDigging = false;
            }
            else if (p.getZ() >= zSouth - 4.67) {
                p.lookAt(180 * dir, 0);
                KeyBind.keyBind("key.attack", false);
                Client.waitTick();
                KeyBind.keyBind("key.attack", true);
                Time.sleep(120);
                KeyBind.keyBind("key.attack", false);
                p.lookAt(180 * dir, 10);
                Client.waitTick();
                KeyBind.keyBind("key.attack", true);
                Time.sleep(60);
                KeyBind.keyBind("key.attack", false);
                isDigging = false;
            }
        }
        else {
            if (p.getZ() >= zSouth - 0) {
                isDigging = false;
            }
            else if (p.getZ() >= zSouth - 4) {
                p.lookAt(180 * dir, 0);
                KeyBind.keyBind("key.attack", true);
                Time.sleep(60);
                KeyBind.keyBind("key.attack", false);
                isDigging = false;
            }
        }
    }
    else if (dir == -0.5) {
        // Going east
        digMode = "east";
    }
        
    if (digMode == "east") {
        // Center the player on the Z axis
        if (Math.abs(p.getZ() - (z + 0.5)) > RECENTER_MARGIN) {
            walkTo(p.getX(), z);
        }

        p.lookAt(180 * dir, 30);
        Client.waitTick(5);
        KeyBind.keyBind("key.attack", true);
        Client.waitTick(3);
        KeyBind.keyBind("key.attack", false);
        Client.waitTick();

        // Walk one block forward
        walkTo(p.getX() + 1, p.getZ());

        isDigging = false;
    }
    else if (digMode == "newrow") {
        // Center the player on the row
        if (Math.abs(p.getX() - (x + 0.5)) > RECENTER_MARGIN) {
            walkTo(x, p.getZ());
        }

        p.lookAt(180 * dir, 50);
        Client.waitTick();
        KeyBind.keyBind("key.attack", true);
        Time.sleep(60);
        KeyBind.keyBind("key.attack", false);
        p.lookAt(180 * dir, 26);
        Client.waitTick();
        KeyBind.keyBind("key.attack", true);
        Time.sleep(180);
        KeyBind.keyBind("key.attack", false);
        p.lookAt(180 * dir, 15);
        Client.waitTick();
        KeyBind.keyBind("key.attack", true);
        Time.sleep(120);
        KeyBind.keyBind("key.attack", false);
        p.lookAt(180 * dir, 10);
        Client.waitTick();
    }
    else {
        KeyBind.keyBind("key.sneak", !fastMode);
    }

    stuck = 0;
    stuckHit = 1; // Reinitialize the stuckHit counter
    while (p.distanceTo(x + 0.5, p.getY(), z + 0.5) > 0.2) {
        if (dir == 1 || dir == 0) {
            // Center the player on the row
            if (Math.abs(p.getX() - (x + 0.5)) > RECENTER_MARGIN) {
                walkTo(x, p.getZ());
            }
            // Leave the loop if we already passed the destination block
            if (
                (dir == 1 && p.getZ() < z + 0.5)
                || (dir == 0 && p.getZ() > z + 0.5)
            ) {
                break;
            }
        }
        else {
            // Center the player on the Z axis
            if (Math.abs(p.getZ() - (z + 0.5)) > RECENTER_MARGIN) {
                walkTo(p.getX(), z);
            }

            // Leave the loop if we already passed the destination block
            if (p.getX() > x + 0.5) {
                break;
            }
        }
        p.lookAt(180 * dir, 10);
        Client.waitTick();
        KeyBind.keyBind("key.forward", true);
        KeyBind.keyBind("key.attack", isDigging);

        prevZ = p.getZ();
        prevX = p.getX();
        Time.sleep(50);
        KeyBind.keyBind("key.attack", false);
        checkFell();
        checkAbort();
        if (p.distanceTo(prevX, p.getY(), prevZ) < 0.05) {
            // You are almost not moving
            stuck++;
            if (stuck == 10) {
                unstuck(x, z);
                stuckHit++;
                stuck = 0;
            }
        } else {
            stuck = 0;
        }
    }
    Client.waitTick();
    placeTorch(x, z);
}

// If you are stuck, you are either hitting a block, or on the edge of a block
function unstuck(x, z) {
    KeyBind.keyBind("key.attack", false);
    KeyBind.keyBind("key.forward", false);
    if ((dir==0)||(dir==1)) {
        var dist = (Math.abs(p.getZ()-0.5-z))
    } else {
        var dist = (Math.abs(p.getX()-0.5-x))
    }
    if (dist < 0.5) {
        // A hole is in the way
        p.lookAt((dir-1)*180,80);
        Client.waitTick(2);
        inv.setSelectedHotbarSlotIndex(1);
        Client.waitTick();
        placeFill(1);
        p.lookAt(dir*180,35);
        Client.waitTick();
        inv.setSelectedHotbarSlotIndex(0);
        
    } else {
        // A block is in the way
        lookAtBlock(x, p.getY(), z);
        Client.waitTick();
        KeyBind.keyBind("key.attack", true);
        Time.sleep(40);
        KeyBind.keyBind("key.attack", false);
    }
    KeyBind.keyBind("key.forward", true);
}

// Mine a line
function mineLine() {
    // Calculate the next block to break depending on the direction
    nextBlock = Math.floor(p.getZ()) + 1 - 2*dir;
    while ((nextBlock != zSouth) && (nextBlock != (zSouth + 1 - North))) {
        // Calculte the next block to break depending on the direction
        nextBlock = Math.floor(p.getZ()) + 1 - 2*dir;
        mineOne(Math.floor(p.getX()), nextBlock);
        checkFell();
        checkAbort();
    }
}

// Checks if the inventory is nearly full, and empties the inventory if so
function checkFullInventory() {
    inv = Player.openInventory();
    numberOfEmptySlots = 0;
    for (i = 9; i < 36; i++) {
        if (inv.getSlot(i).isEmpty()) {
            numberOfEmptySlots++;
            if (numberOfEmptySlots >= 5) {
                return;
            }
        }
    }

    // If we made it past the FOR loop it means our inventory needs to be emptied    
    if (storeMats) {
        placeChest();
    } else {
        dumpBlock();
    }
    // Equip the pickaxe again
    inv.setSelectedHotbarSlotIndex(0);
}

// Mine a full level
function mineLevel() {
    // 1 is north, 0 is south, -0.5 is east
    dir = 1;
    for (let i = Math.floor(p.getX()); i < xWest + East; i++) {
        mineLine();
        checkFullInventory();
        walkTo(i, zSouth - (North - 1) * dir);

        if (i == xWest + East - 1) {
            break;
        }

        oldDir = dir;
        dir = -0.5;
        // Mine a block to the east
        mineOne(i + 1, Math.floor(p.getZ()));
        dir = 1 - oldDir;
    }
    KeyBind.keyBind("key.sneak", false);
    KeyBind.keyBind("key.attack", false);
    KeyBind.keyBind("key.forward", false);
    eatCheck();
    inv.setSelectedHotbarSlotIndex(0);
}

// Go back to the starting position and go down two blocks
function downLevel2() {
    walkTo(xWest + 1, zSouth);
    prevY = p.getY();
    p.lookAt(xWest + 0.5, p.getY() - 1, zSouth + 0.5);
    KeyBind.keyBind("key.attack", true);
    Time.sleep(120);
    KeyBind.keyBind("key.attack", false);
    p.lookAt(90, 0);
    KeyBind.keyBind("key.forward", true);
    KeyBind.keyBind("key.sneak", true);
    Client.waitTick(10);
    KeyBind.keyBind("key.forward", false);
    Client.waitTick(2);
    p.lookAt(xWest + 1, p.getY() - 0.5, zSouth + 0.5);
    Client.waitTick(20);
    gravityBlockCount = inv.getSlot(41).getCount();
    placeFill(5);
    Client.waitTick(lagTick)
    while (gravityBlockCount != inv.getSlot(41).getCount()) {
        gravityBlockCount = inv.getSlot(41).getCount();
        placeFill(5);
        Client.waitTick(20);
    }
    walkTo(xWest, zSouth);
    currentY = p.getY();
    p.lookAt(0, 90);
    KeyBind.keyBind("key.attack", true);
    Client.waitTick(30);
    KeyBind.keyBind("key.attack", false);
    Client.waitTick(lagTick);
    KeyBind.keyBind("key.attack", true);
    Client.waitTick(30);
    KeyBind.keyBind("key.attack", false);
    Client.waitTick(10);
    inv.setSelectedHotbarSlotIndex(0);
    if (currentY - p.getY() != 2){
        Chat.log("[QuarryBot] Failed to go down two blocks, trying again");
        p.lookAt(-90, 0);
        KeyBind.keyBind("key.forward", true);
        KeyBind.keyBind("key.jump", true);
        Client.waitTick(5)
        KeyBind.keyBind("key.jump", false);
        Client.waitTick(15);
        downLevel2();
    } else {
        Chat.log("[QuarryBot] Starting new layer")
    }
    currentY = p.getY();
}


function mineAll() {
    while (p.getY() > yStop) {
        mineLevel();
        downLevel2();
    }
    mineLevel();
    walkTo(xWest, zSouth);
    const mineTime = Math.floor((Date.now() - startTime) / 1000);
    Chat.log(
        "[QuarryBot] Mining finished in "
        + (Math.floor(mineTime / 60)) +" minutes and "
        + (mineTime % 60) + " seconds."
    );
}

function init() {
    Client.grabMouse();
    inv.setSelectedHotbarSlotIndex(0);
    equip(tool, 0);
    equip(solidBlock, 1);
    equip(foodType, 2);
    equip("minecraft:torch", 3);
    if (storeMats) {
        equip("minecraft:chest", 4);
    } 
    equip(gravityBlock, 5);
}

function start() { //Allows to start back where you were. Finish the row, and place yourself at the start of the new row
    currentX = Math.floor(p.getX());
    currentZ = Math.floor(p.getZ());
    currentY = p.getY();
    //First check the position
    if ((xWest<=currentX)&&(currentX<=xWest+East)&&(zSouth-North<=currentZ)&&(currentZ<=zSouth)) { // Check if you are inside the farm
        init();
        mineAll();
    } else {
        Chat.log("You are not in the area, make sure you entered the good values in the variable");
    }
}

start();