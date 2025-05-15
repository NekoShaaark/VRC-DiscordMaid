import { Events } from 'discord.js';

export const name = Events.ClientReady;
export const once = true;
export function execute(client) {
	console.log(`*yaaaawn* Can't I go back to sleep?`);
}