const SCREENWIDTH = Hud.getWindowWidth() / Hud.getScaleFactor();
const SCREENHEIGHT = Hud.getWindowHeight() / Hud.getScaleFactor();

const DESTS = [
  { title: "(Reset)", command: "" },
  { title: "Fairhill", command: "! twilight fairhill" },
  { title: "Icenia", command: "! icenia" },
  { title: "Nether", command: "! cw portal" },
  { title: "Wholefoods", command: "! wf" },
  { title: "Cane Corp", command: "cane-corp" },
];
const BOTS = [
  { file: "wheat.js", title: "Wheat" },
  { file: "beetroot.js", title: "Benelux Beet" },
  { file: "spidereye.js", title: "Spider Eye" },
  { file: "tree-canecorp.js", title: "CaneCorp Tree" },
  { file: "turboclick.js", title: "TurboClick" },
  { file: "enchant.js", title: "Enchant" },
  { file: "autobottle.js", title: "AutoBottle" },
  { file: "planter.js", title: "Plant Seeds" },
];
const COMMANDS = [
  {
    title: "Toggle CTI",
    command: function () {
      Chat.say("/cti");
    },
  },
  {
    title: "six sevennn",
    command: function () {
      Chat.say("/groupc sixseven 67");
    },
  },
];

function addListBox(
  screen,
  x,
  y,
  width,
  height,
  title,
  list,
  buttonText,
  buttonCallback,
) {
  screen.addRect(x, y, x + width, y + height, 0xc, 200);
  screen.addText(title, x + 10, y + 5, 0xc666, true);
  for (i = 0; i < list.length; i++) {
    let element = list[i];
    screen.addButton(
      x + 10,
      y + 20 + 15 * i,
      80,
      12,
      buttonText(element),
      JavaWrapper.methodToJava(function () {
        buttonCallback(element);
      }),
    );
  }
}

const screen = Hud.createScreen("", false);
screen.setOnInit(
  JavaWrapper.methodToJava((s) => {
    let width = 115;
    let height = 100;
    let x = Math.round((SCREENWIDTH - width) * 0.5);
    let y = Math.round((SCREENHEIGHT - height) * 0.5);
    s.addRect(x, y, x + width, y + height, 0xa95ce8, 127);
    s.addText("Home GUI", x + 35, y + 32, 0xfffff, true);
    s.addText("Press Esc to close", x + 10, y + 60, 0xf0f0f0, true);

    addListBox(
      s,
      Math.round(SCREENWIDTH / 6 - 100 / 2) - 30,
      Math.round(SCREENHEIGHT / 2 - 100 / 2),
      100,
      100,
      "/dest",
      DESTS,
      function (data) {
        return data["title"];
      },
      function (data) {
        Chat.say(data["command"] != "" ? "/dest " + data["command"] : "/dest");
      },
    );

    addListBox(
      s,
      Math.round((SCREENWIDTH * 2) / 6 - 100 / 2) - 30,
      Math.round((SCREENHEIGHT - 100) * 0.5),
      100,
      100,
      "Bots",
      BOTS,
      function (data) {
        return data["title"];
      },
      function (data) {
        screen.close();
        JsMacros.runScript("./" + data["file"]);
      },
    );

    addListBox(
      s,
      Math.round((SCREENWIDTH * 4) / 6 - 100 / 2) + 30,
      Math.round((SCREENHEIGHT - 100) * 0.5),
      100,
      100,
      "Commands",
      COMMANDS,
      function (command) {
        return command["title"];
      },
      function (command) {
        command["command"]();
      },
    );
  }),
);
Hud.openScreen(screen);
