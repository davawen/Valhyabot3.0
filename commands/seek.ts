import { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } from "discord.js";
import { CommandManager } from "../command_manager";
import { queue_manager } from "../queue";
import { AudioPlayerStatus } from "@discordjs/voice";

export function register(manager: CommandManager) {
	manager.add_command(
		new SlashCommandBuilder()
			.setName("seek")
			.setDescription("Advance a video"),
		async interaction => {
			if (interaction.guild === null) return;

			let queue = queue_manager.get(interaction.guild);
			if (queue === null || queue.resource === null || queue.player.state.status === AudioPlayerStatus.Idle) {
				interaction.reply("No music in queue.");
				return;
			}

			const advance = new ButtonBuilder()
				.setCustomId('1s')
				.setLabel(">> +1s")
				.setStyle(ButtonStyle.Primary);

			const row = new ActionRowBuilder<ButtonBuilder>()
				.addComponents(advance);

			const response = await interaction.reply({ 
				components: [row]
			});

			while (!queue.destroyed) {
				try {
					const confirmation = await response.awaitMessageComponent({ filter: () => true, time: 50000 });

					let limit = 0;
					let start = queue.resource.playbackDuration;
					while (limit < 1000 && (queue.resource.readable || queue.resource.playbackDuration - start < 1000)) {
						queue.resource.read();
						limit++;
					}

					await confirmation.update(`Advanced by 1s.`);
				} catch (e) {
				}
			}
		}
	);
}
