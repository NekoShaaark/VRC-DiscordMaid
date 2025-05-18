import { readFile, writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const configPath = join(__dirname, '../config.json');

/**
 * Reads the config.json file and returns the parsed object.
 */
export async function getConfig() {
  const configData = await readFile(configPath, 'utf8');
  return JSON.parse(configData);
}

/**
 * Saves the provided config object back to config.json.
 * @param {Object} config - The config object to save.
 */
export async function saveConfig(config) {
  await writeFile(configPath, JSON.stringify(config, null, 2), 'utf8');
}

/**
 * Updates a single key-value pair in config.json.
 * @param {string} key - The key to update.
 * @param {*} value - The new value.
 */
export async function updateConfig(key, value) {
  const config = await getConfig();
  config[key] = value;
  await saveConfig(config);
}