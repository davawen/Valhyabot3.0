import { ButtonBuilder, SlashCommandBuilder } from "discord.js";
import { CommandManager } from "../command_manager";
import { queue_manager } from "../queue";

export function register(manager: CommandManager) {
	manager.add_command(
		new SlashCommandBuilder()
			.setName("skip")
			.setDescription("Skip one or multiple musics"),
		interaction => {
			if (interaction.guild === null) return;

			let queue = queue_manager.get(interaction.guild);
			if (queue === null) {
				interaction.reply("No music in queue.");
				return;
			}
		}
	)
}
