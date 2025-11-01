// =========================
// Utility: logging to screen


const logEl = document.getElementById("gameLog");

function logLine(message, cssClass = "") {
  const div = document.createElement("div");
  div.className = "log-line " + cssClass;
  div.textContent = message;
  logEl.appendChild(div);

  logEl.scrollTop = logEl.scrollHeight;
}

function logMultiline(message, cssClass = "") {
  const div = document.createElement("div");
  div.className = "log-line " + cssClass;
  div.textContent = message;
  logEl.appendChild(div);

  logEl.scrollTop = logEl.scrollHeight;
}

function logSeparator() {
  logLine("—".repeat(40), "log-system");
}


// =========================
// CLASSES

// Item
class Item {
  constructor(name, type, value) {
    this.name = name;   
    this.type = type;   
    this.value = value; 
  }
}
// Character
class Character {
  constructor(name, health, attackPower) {
    this.name = name;
    this.health = health;
    this.attackPower = attackPower;
    this.inventory = [];
  }

  attack(target) {
    const dmg = this.attackPower;
    logLine(`${this.name} attacks ${target.name} for ${dmg} damage!`, "log-warning");
    target.takeDamage(dmg);
  }

  takeDamage(amount) {
    this.health -= amount;
    if (this.health < 0) this.health = 0;
    logLine(
      `${this.name} takes ${amount} damage. Health is now ${this.health}.`,
      "log-error"
    );
  }

  pickUpItem(item) {
    this.inventory.push(item);
    logLine(`${this.name} picked up ${item.name}.`, "log-success");
  }

  viewInventory() {
    if (this.inventory.length === 0) {
      logLine(`${this.name}'s inventory is empty.`);
      return;
    }

    const lines = this.inventory
      .map((it, i) => `${i + 1}. ${it.name} (${it.type})`)
      .join("\n");

    logMultiline(`${this.name}'s Inventory:\n${lines}`, "log-system");
  }

  useItem(itemName) {
    const index = _.findIndex(this.inventory, (it) =>
      it.name.toLowerCase() === itemName.toLowerCase()
    );

    if (index === -1) {
      logLine(`You don't have "${itemName}".`, "log-error");
      return;
    }

    const item = this.inventory[index];

    if (item.type === "healing") {
      this.health += item.value;
      logLine(
        `${this.name} drinks ${item.name} and recovers ${item.value} energy! Health is now ${this.health}.`,
        "log-success"
      );
      this.inventory.splice(index, 1); // remove consumed healing item
    } else if (item.type === "weapon") {
      this.attackPower += item.value;
      logLine(
        `${this.name} equips ${item.name}. Attack power is now ${this.attackPower}.`,
        "log-success"
      );
      // weapon stays in inventory
    } else {
      logLine(`${item.name} can't be used right now.`, "log-error");
    }
  }

  isAlive() {
    return this.health > 0;
  }
}

// Location
class Location {
  constructor(name, description) {
    this.name = name;
    this.description = description;
    this.characters = [];
    this.items = [];
    this.connectedLocations = [];
  }

  connect(locationObj) {
    // links go both ways
    if (!this.connectedLocations.includes(locationObj)) {
      this.connectedLocations.push(locationObj);
    }
    if (!locationObj.connectedLocations.includes(this)) {
      locationObj.connectedLocations.push(this);
    }
  }

  enterLocation(player) {
    let message = `=== ${this.name} ===\n${this.description}\n`;

    // other people/creatures here (still alive)
    const others = this.characters.filter((c) => c !== player && c.isAlive());
    if (others.length > 0) {
      message += `\nYou see:\n`;
      others.forEach((c) => {
        message += ` - ${c.name} (HP: ${c.health})\n`;
      });
    }

    // items on floor
    if (this.items.length > 0) {
      message += `\nOn the desk / floor:\n`;
      this.items.forEach((it) => {
        message += ` - ${it.name} [${it.type}]\n`;
      });
    }

    // exits
    if (this.connectedLocations.length > 0) {
      message += `\nExits:\n`;
      this.connectedLocations.forEach((loc) => {
        message += ` - ${loc.name}\n`;
      });
    }

    logMultiline(message, "log-system");
  }

  searchLocation() {
    if (this.items.length === 0) {
      logLine("You search around but only find stress and crumbs.");
    } else {
      const itemNames = this.items.map((it) => it.name).join(", ");
      logLine(`You search the area and find: ${itemNames}`, "log-system");
    }
  }

  move(newLocationName, player) {
    const target = _.find(this.connectedLocations, (loc) => {
      return loc.name.toLowerCase() === newLocationName.toLowerCase();
    });

    if (!target) {
      logLine(`You can't go to "${newLocationName}" from here.`, "log-error");
      return this; // stay where you are
    }

    logLine(`You drag yourself to ${target.name}...`, "log-system");
    target.enterLocation(player);
    return target;
  }
}


// =========================
// WORLD SETUP (Caffeine Quest)

// Items
// healing item = cold coffee you chug, gives energy (health)
// weapon item = motivational mug, boosts attackPower
// quest item = sacred espresso shot, ends the suffering
const coldCoffee = new Item("Cold Coffee", "healing", 10);
const motivationalMug = new Item("Motivational Mug", "weapon", 2);
const sacredEspresso = new Item("Sacred Espresso Shot", "quest", 0);

// Characters
// player = tired dev
// intern = harmless NPC
// salesGuy = mid-boss
// espressoDemon = final boss guarding espresso
const player = new Character("Exhausted Dev", 25, 4);
const intern = new Character("Intern (Unpaid)", 15, 0);
const salesGuy = new Character("Bitter Sales Guy", 16, 3);
const espressoDemon = new Character("Espresso Demon", 28, 6);

// Locations
const openOffice = new Location(
  "Open Office",
  "Rows of desks. Monitors glow. Air smells like burnout and energy drink gum."
);

const breakRoom = new Location(
  "Break Room",
  "Microwave smells haunted. The coffee pot is mostly sadness and burnt hopes."
);

const serverRoom = new Location(
  "Server Room",
  "Cold air, humming servers, and... the Sacred Espresso Machine, guarded by an unholy presence."
);

// connections
openOffice.connect(breakRoom);
breakRoom.connect(serverRoom);

// populate locations
openOffice.characters.push(player, intern);
openOffice.items.push(coldCoffee);

breakRoom.characters.push(salesGuy);
breakRoom.items.push(motivationalMug);

serverRoom.characters.push(espressoDemon);
serverRoom.items.push(sacredEspresso);

// track current location
let currentLocation = openOffice;

// game state
let gameOver = false;


// =========================
// GAMEPLAY LOGIC

function showHelp() {
  logMultiline(
    "Commands:\n" +
    "- look\n" +
    "- search\n" +
    "- move [location name]\n" +
    "- pickup [item name]\n" +
    "- inventory\n" +
    "- use [item name]\n" +
    "- attack [target name]\n" +
    "- talk [character name]\n" +
    "- help\n" +
    "- quit",
    "log-system"
  );
}

function pickupItem(itemName) {
  const index = _.findIndex(currentLocation.items, (it) =>
    it.name.toLowerCase() === itemName.toLowerCase()
  );

  if (index === -1) {
    logLine(`There is no "${itemName}" here.`, "log-error");
    return;
  }

  const item = currentLocation.items.splice(index, 1)[0];
  player.pickUpItem(item);
  checkForWin(null);
}

function attackTarget(targetName) {
  const enemy = _.find(currentLocation.characters, (c) => {
    return (
      c !== player &&
      c.isAlive() &&
      c.name.toLowerCase() === targetName.toLowerCase()
    );
  });

  if (!enemy) {
    logLine(`No target "${targetName}" to attack here.`, "log-error");
    return;
  }

  // player strikes
  player.attack(enemy);

  if (!enemy.isAlive()) {
    logLine(`${enemy.name} is defeated!`, "log-success");
    checkForWin(enemy);
    return;
  }

  // enemy counter-strikes
  enemy.attack(player);

  if (!player.isAlive()) {
    logLine("Your vision fades... You pass out under your desk.", "log-error");
    endGame();
  }
}

function talkTo(name) {
  // find a living character here with that name, not player
  const npc = _.find(currentLocation.characters, (c) => {
    return (
      c !== player &&
      c.isAlive() &&
      c.name.toLowerCase() === name.toLowerCase()
    );
  });

  if (!npc) {
    logLine(`No one named "${name}" is here to talk to.`, "log-error");
    return;
  }

  if (npc === intern) {
    logMultiline(
      'Intern whispers:\n' +
      '"I heard rumors... In the Server Room... A forbidden espresso shot...' +
      ' They say it can raise the dead, or at least middle management."',
      "log-system"
    );
    return;
  }

  if (npc === salesGuy) {
    logLine(
      "Bitter Sales Guy rants about quotas for 47 minutes. You lose the will to live.",
      "log-warning"
    );
    return;
  }

  if (npc === espressoDemon) {
    logLine(
      "The Espresso Demon hisses, steam blasting from its nostrils. 'NO FREE REFILLS.'",
      "log-warning"
    );
    return;
  }

  logLine(`${npc.name} has nothing useful to say right now.`);
}

function checkForWin(defeatedEnemy) {
  // Win 1: Defeat Espresso Demon
  if (defeatedEnemy === espressoDemon) {
    logMultiline(
      "With the Espresso Demon defeated, the Sacred Machine is yours.\n" +
      "You brew a perfect shot. You feel ALIVE.\n" +
      "YOU WIN (and you might make it to lunch).",
      "log-success"
    );
    endGame();
    return;
  }

  // Win 2: You pick up Sacred Espresso Shot
  const hasEspresso = _.some(player.inventory, (it) => it === sacredEspresso);
  if (hasEspresso) {
    logMultiline(
      "You cradle the Sacred Espresso Shot.\n" +
      "Warmth returns to your soul. Emails suddenly feel ignorable.\n" +
      "YOU WIN.",
      "log-success"
    );
    endGame();
  }
}

//Easter Egg#1: Secret Command("coffee")
//Player types a command that is NOT listed in help, but if they guess it, something special happens.
function secretCaffeineBoost() {
  if (gameOver) {
    logLine("The ritual caffeine no longer responds to mortals.", "log-warning");
    return;
  }

  // buff player
  player.health += 20;
  player.attackPower += 3;

  logMultiline(
    "You whisper the forbidden word: 'coffee'.\n" +
      "A divine warmth floods your veins. Your eyelids stop twitching.\n" +
      "Max focus engaged. You feel UNSTOPPABLE.",
    "log-success"
  );

  logLine(
    `Health is now ${player.health}. Attack Power is now ${player.attackPower}.`,
    "log-success"
  );
}

//Easter Egg#2: Hidden dev stats("stats")
function showDebugStats() {
    const invList = player.inventory.length === 0 ? "(empty)" : player.inventory.map(it => `${it.name} [${it.type}]`).join(", ");

    logMultiline(
    "=== DEBUG STATS ===\n" +
    `Location: ${currentLocation.name}\n` +
    `Health: ${player.health}\n` +
    `Attack Power: ${player.attackPower}\n` +
    `Inventory: ${invList}\n` +
    `Game Over: ${gameOver}\n` +
    "(shh... you're not supposed to see this)",
    "log-warning"
  );
}

function endGame() {
  gameOver = true;
  disableInput();
  logSeparator();
  logLine("GAME OVER. Refresh the page to play again.", "log-system");
}

function handleCommand(rawInput) {
  if (gameOver) {
    logLine("The day is over. Go home. (Refresh to restart.)", "log-error");
    return;
  }

  const input = rawInput.trim();
  if (!input) return;

  logLine("> " + input, "log-input-echo");

  const parts = input.split(" ");
  const command = parts[0].toLowerCase();
  const arg = parts.slice(1).join(" ");

  switch (command) {
    case "help":
      showHelp();
      break;

    case "look":
      currentLocation.enterLocation(player);
      break;

    case "search":
      currentLocation.searchLocation();
      break;

    case "pickup":
    case "pick":
      if (!arg) {
        logLine("Pick up what?", "log-error");
      } else {
        pickupItem(arg);
      }
      break;

    case "inventory":
      player.viewInventory();
      break;

    case "use":
      if (!arg) {
        logLine("Use what?", "log-error");
      } else {
        player.useItem(arg);
      }
      break;

    case "attack":
      if (!arg) {
        logLine("Attack who?", "log-error");
      } else {
        attackTarget(arg);
      }
      break;

    case "talk":
      if (!arg) {
        logLine("Talk to who?", "log-error");
      } else {
        talkTo(arg);
      }
      break;

    case "move":
    case "go":
      if (!arg) {
        logLine("Move where?", "log-error");
      } else {
        const newLoc = currentLocation.move(arg, player);

        if (newLoc !== currentLocation) {
          currentLocation = newLoc;
          // make sure player is tracked in that location
          if (!currentLocation.characters.includes(player)) {
            currentLocation.characters.push(player);
          }
        }
      }
      break;
    
    case "coffee":
        secretCaffeineBoost();
        break;
    
    case "stats":
        showDebugStats();
        break;

    case "quit":
    case "exit":
      logLine(
        "You close the laptop. You accept your fate. You will answer emails tomorrow.",
        "log-warning"
      );
      endGame();
      break;

    default:
      logLine("I don't understand that command. Type 'help' for options.", "log-error");
      break;
  }

  if (!player.isAlive() && !gameOver) {
    logLine("You black out on the office carpet. HR gently rolls you under a desk.", "log-error");
    endGame();
  }
}


// =========================
// INPUT / STARTUP

const inputEl = document.getElementById("commandInput");
const btnEl = document.getElementById("runCommandBtn");

function disableInput() {
  inputEl.disabled = true;
  btnEl.disabled = true;
}

function intro() {
  logMultiline(
    "Welcome to Caffeine Quest.\n\n" +
    "You are an Exhausted Dev in an open office at 9:47 AM.\n" +
    "Your energy is critical.\n\n" +
    "Rumor says there's a Sacred Espresso Shot hidden deep in the Server Room,\n" +
    "guarded by an Espresso Demon and at least two angry managers.\n\n" +
    "Survive. Find caffeine. Avoid meetings.\n",
    "log-system"
  );

  currentLocation.enterLocation(player);
  showHelp();
}

btnEl.addEventListener("click", () => {
  const cmd = inputEl.value;
  inputEl.value = "";
  handleCommand(cmd);
  inputEl.focus();
});

inputEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    btnEl.click();
  }
});

// start the game
intro();
inputEl.focus();
