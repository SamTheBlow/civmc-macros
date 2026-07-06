//Zeal Craft Chests Script
/*

    Zeal Craft Chests Script on CivMC
    Written by Greltam 5/3/2024

*/
/*------------------------
   0.1 Player Requirements to Start
------------------------*/

//Directions: Start script with logs and/or planks in inventory
//Start script while looking at a crafting table
//Have at least 3 empty slots for when logs gets turned to planks.

/*-----------------------
   0.1 Player Requirements to Start End
-----------------------*/

/*------------------------
   1.1 Import Files Start
------------------------*/
const util = require("./blow-utils.js");
/*-----------------------
   1.1 Import Files End
-----------------------*/

/*------------------------
   1.2 Player Configurables Start
------------------------*/

util.setAbortKey("Tab");
util.setBotName("ChestCrafterBot");

/*-----------------------
   1.2 Player Configurables End
-----------------------*/

/*------------------------
   2 Global Variables Start
------------------------*/

currentLog = "";
currentPlank = "";

listOfAllPlanks = [
  "minecraft:oak_planks",
  "minecraft:spruce_planks",
  "minecraft:birch_planks",
  "minecraft:jungle_planks",
  "minecraft:acacia_planks",
  "minecraft:dark_oak_planks",
  "minecraft:mangrove_planks",
  "minecraft:cherry_planks",
  "minecraft:pale_oak_planks",
  "minecraft:crimson_planks",
  "minecraft:warped_planks",
];

listOfAllLogs = [
  "minecraft:oak_log",
  "minecraft:spruce_log",
  "minecraft:birch_log",
  "minecraft:jungle_log",
  "minecraft:acacia_log",
  "minecraft:dark_oak_log",
  "minecraft:mangrove_log",
  "minecraft:cherry_log",
  "minecraft:pale_oak_log",
  "minecraft:crimson_stem",
  "minecraft:warped_stem",
];

/*-----------------------
   2 Global Variables End
-----------------------*/

/*-------------------
   3 Functions Start
-------------------*/

function containsWood() {
  //Chat.log("Checking for wood.")
  for (let i = 0; i < listOfAllLogs.length; i++) {
    if (util.hasAnyItem(listOfAllLogs[i], false, [9, 44])) {
      //Chat.log(listOfAllLogs[i] + " found.")
      return true;
    }
  }
  for (let i = 0; i < listOfAllPlanks.length; i++) {
    if (util.hasAnyItem(listOfAllPlanks[i], false, [9, 44])) {
      //Chat.log(listOfAllPlanks[i] + " found.")
      return true;
    }
  }

  //Chat.log("No wood found.")
  return false;
}

function getCurrentLog() {
  for (let i = 0; i < listOfAllLogs.length; i++) {
    if (util.hasAnyItem(listOfAllLogs[i], false, [9, 44])) {
      //Chat.log(listOfAllLogs[i] + " found.")
      currentLog = listOfAllLogs[i];
      return;
    }
  }
}

function getCurrentPlank() {
  for (let i = 0; i < listOfAllPlanks.length; i++) {
    if (util.hasAnyItem(listOfAllPlanks[i], false, [9, 44])) {
      //Chat.log(listOfAllPlanks[i] + " found.")
      currentPlank = listOfAllPlanks[i];
      return;
    }
  }
}

/*-------------------
   3 Functions End
-------------------*/

/*-------------------
   4 Program Start
-------------------*/

util.setMainLoop(mainLoop);

if (!util.openCraftingTable()) {
  stopBot("Probably not facing a crafting table");
}

util.startMainLoop();

function mainLoop() {
  if (!containsWood()) {
    util.stopBot("Done!");
    return;
  }

  getCurrentLog();
  util.craftManually([[currentLog, 1]]);
  util.craftManually([[currentLog, 1]]);

  getCurrentPlank();
  util.craftManually([
    [currentPlank, 1],
    [currentPlank, 2],
    [currentPlank, 3],
    [currentPlank, 4],
    [currentPlank, 6],
    [currentPlank, 7],
    [currentPlank, 8],
    [currentPlank, 9],
  ]);
}

/*-------------------
   4 Program End
-------------------*/
