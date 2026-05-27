abortKey = "tab"
terminate = false
p = Player.getPlayer()

twoSlotMode = false
slot = 4

loop()

function loop() {
    while (!terminate) {
        if (twoSlotMode) {
            inv = Player.openInventory()
            inv.setSelectedHotbarSlotIndex(slot)
            if (slot == 5) {
                slot = 4
            }
            else {
                slot = 5
            }
            p.interact()
            inv.close()
        }
        else {
            p.interact()
        }
        Client.waitTick()
        checkManualAbort()
    }
}

function checkManualAbort() {
    if (KeyBind.getPressedKeys().contains("key.keyboard." + abortKey)) {
        Chat.log("[TurboClickBot] Player has pressed abort key. Terminating.")
        terminate = true
    }
}
