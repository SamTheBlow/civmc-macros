
const BOT_NAME = "SwitchNLBot"
const abortKey = "tab"
const switchKey = "z"

const glassHotbarSlot = 4
const stoneHotbarSlot = 5
const dirtHotbarSlot = 6
const namelayers = ["FH-farms", "FairhillCitizens"]
const namelayerSlot = [glassHotbarSlot, dirtHotbarSlot]
currentNlIndex = 0
terminate = false

botLog("Started")

inv = Player.openInventory()
inv.setSelectedHotbarSlotIndex(stoneHotbarSlot)
Client.waitTick()
Chat.say("/ctf " + namelayers[currentNlIndex])
inv.setSelectedHotbarSlotIndex(namelayerSlot[currentNlIndex])
Client.waitTick()
currentNlIndex++

KeyBind.keyBind("key.back", true)
KeyBind.keyBind("key.sneak", true)


while (!terminate) {
    Client.waitTick()
    lookAt(0, 80)
    if (KeyBind.getPressedKeys().contains("key.keyboard." + switchKey)) {
        inv = Player.openInventory()
        inv.setSelectedHotbarSlotIndex(stoneHotbarSlot)
        Client.waitTick(5)
        Chat.say("/ctf " + namelayers[currentNlIndex])
        Client.waitTick(5)
        inv.setSelectedHotbarSlotIndex(namelayerSlot[currentNlIndex])
        Client.waitTick()
        currentNlIndex++
        if (currentNlIndex >= namelayers.length) {
            currentNlIndex = 0
        }
        Client.waitTick(5)
    }
    checkManualAbort()
}

KeyBind.keyBind("key.back", false)
KeyBind.keyBind("key.sneak", false)

World.playSound("entity.ghast.scream", 100, 0)


function checkManualAbort() {
    if (KeyBind.getPressedKeys().contains("key.keyboard." + abortKey)) {
        botLog("Player has pressed abort key. Terminating.")
        terminate = true
    }
}

function botLog(message) {
    Chat.log("[" + BOT_NAME + "] " + message)
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
