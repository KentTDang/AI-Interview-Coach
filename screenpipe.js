// screenpipe.js
const { pipe } = require("@screenpipe/js");

async function getSettings() {
  try {
    const settings = await pipe.settings.getAll();
    console.log(JSON.stringify(settings));
  } catch (error) {
    console.error("Error getting settings:", error);
    process.exit(1);
  }
}

async function updateSettings() {
  // Expect new settings as a JSON string passed as the second argument
  const newSettings = JSON.parse(process.argv[2] || '{}');
  try {
    await pipe.settings.update(newSettings);
    console.log("Settings updated successfully");
  } catch (error) {
    console.error("Error updating settings:", error);
    process.exit(1);
  }
}

// Run the appropriate function based on the command-line argument
const action = process.argv[2];
if (action === 'get') {
  getSettings();
} else if (action === 'update') {
  updateSettings();
} else {
  console.error("Please specify 'get' or 'update' as the first argument.");
  process.exit(1);
}
