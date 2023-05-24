import { SlashCommandBuilder } from "discord.js";
import { CommandManager } from "../command_manager";
import { queue_manager } from "../queue";

export function register(manager: CommandManager) {
	manager.add_command(
		new SlashCommandBuilder()
			.setName("stop")
			.setDescription("Stops all musics and removes player from the voice channel"),
		async interaction => {
			if (interaction.guild === null) return;

			let queue = queue_manager.get(interaction.guild);
			if (queue === null) {
				interaction.reply({ content: "No music in queue.", ephemeral: true });
				return;
			}

			queue_manager.remove(queue.guild.id);
			interaction.reply("Stopped playing.");
		}
	)
}
