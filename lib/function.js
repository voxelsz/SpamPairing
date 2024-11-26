const fs = require("fs").promises;
const path = require("path");
const session = require("express-session")

const dataFilePath = path.join(__dirname, "./database/database.json");

const readDataFile = async () => {
  try {
    const rawData = await fs.readFile(dataFilePath, "utf8");
    return JSON.parse(rawData);
  } catch (error) {
    if (error.code === "ENOENT") {
      console.log("File not found. Initializing an empty file.");
      await writeDataFile({}); // Create an empty JSON object if file doesn't exist
      return {}; // Return empty object
    }
    console.error("Error reading data file:", error.message);
    throw new Error("Failed to read data file");
  }
};

const writeDataFile = async (data) => {
  try {
    await fs.writeFile(dataFilePath, JSON.stringify(data, null, 2), "utf8");
  } catch (error) {
    console.error("Error writing to data file:", error.message);
    throw new Error("Failed to write data file");
  }
};

const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.isLoggedIn) {
    next();
  } else {
    res.redirect("/login");
  }
};

module.exports = { readDataFile, isAuthenticated, writeDataFile };
