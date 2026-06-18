const util = require("./blow-utils.js");

twoSlotMode = false;

const hoeSlot = 4;
const seedsSlot = 5;

util.setBotName("TurboClickBot");
util.setMainLoop(loop);
util.startMainLoop();

function loop() {
  if (!twoSlotMode) {
    util.player.interact();
    return;
  }
  inv = Player.openInventory();
  util.grabItem(["minecraft:wheat_seeds"], "seeds", seedsSlot);
  inv.swap(35+seedsSlot, 45)
  util.grabItem(["minecraft:stone_hoe"], "hoe", hoeSlot);
  inv.setSelectedHotbarSlotIndex(hoeSlot - 1);
  util.player.interact();
  inv.close();
}
