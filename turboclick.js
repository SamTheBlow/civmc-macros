const util = require("./blow-utils.js");

twoSlotMode = true;

const hoeSlot = 4;
const seedsSlot = 5;
currentSlot = hoeSlot;

util.setMainLoop(loop);
util.startMainLoop();

function loop() {
  if (!twoSlotMode) {
    util.player.interact();
    return;
  }
  inv = Player.openInventory();
  if (currentSlot == seedsSlot) {
    util.grabItem(["minecraft:wheat_seeds"], "seeds", currentSlot);
    inv.setSelectedHotbarSlotIndex(currentSlot - 1);
    currentSlot = hoeSlot;
  } else {
    util.grabItem(["minecraft:stone_hoe"], "hoe", currentSlot);
    inv.setSelectedHotbarSlotIndex(currentSlot - 1);
    currentSlot = seedsSlot;
  }
  util.player.interact();
  inv.close();
}
