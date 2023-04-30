import { Client, Events, GuildMember, GatewayIntentBits as Intent, MessageFlags, SlashCommandBuilder, VoiceBasedChannel } from "discord.js";
import { config as dotenv_config } from "dotenv";
import { readdirSync } from "node:fs";

import { CommandManager } from "./command_manager";
dotenv_config();

const options = {
	token: process.env.DISCORD_TOKEN as string
};

const client = new Client({ intents: [Intent.Guilds, Intent.GuildVoiceStates] });

let manager = new CommandManager();

client.on(Events.InteractionCreate, interaction => {
	if (!interaction.isChatInputCommand()) return;

	const command = manager.get_command_response(interaction.commandName);
	if (command !== undefined) {
		command(interaction);
	} else {
		console.error(`couldn't find command ${interaction.commandName}`)
	}
});

client.once(Events.ClientReady, async c => {
	console.log(`Logged in as ${c.user.tag}`);

	let commands = readdirSync(`${__dirname}/commands/`);
	for (const filename of commands) {
		const module = await import(`${__dirname}/commands/${filename}`);
		const register = module.register as (manager: CommandManager) => void;
		register(manager);
	}

	await manager.register_commands(c);
});

client.login(options.token);
