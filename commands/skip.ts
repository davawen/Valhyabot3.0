import { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from "discord.js";
import { CommandManager } from "../command_manager";
import { queue_manager } from "../queue";

export function register(manager: CommandManager) {
	manager.add_command(
		new SlashCommandBuilder()
			.setName("skip")
			.setDescription("Skips to the next music in queue"),
		async interaction => {
			if (interaction.guild === null) return;

			let queue = queue_manager.get(interaction.guild);
			if (queue === null) {
				interaction.reply({ content: "No music in queue.", ephemeral: true });
				return;
			}

			queue.play();
			interaction.reply("Skipped a song.");
		}
	)

	manager.add_command(
		new SlashCommandBuilder()
			.setName("skip_to")
			.setDescription("Skips to a chosen music in queue"),
		async interaction => {
			if (interaction.guild === null) return;

			let queue = queue_manager.get(interaction.guild);
			if (queue === null) {
				interaction.reply("No music in queue.");
				return;
			}

			let list = new StringSelectMenuBuilder()
				.setCustomId('list')
				.setPlaceholder("Choose a song to skip to.")
				.addOptions(queue.songs.map(song => {
					return new StringSelectMenuOptionBuilder()
						.setLabel(song.info.videoDetails.title)
						.setDescription(`Lasts ${song.info.videoDetails.lengthSeconds} seconds.`)
						.setValue(song.unique_id);
				}));

			let cancel = new ButtonBuilder()
				.setCustomId('cancel')
				.setLabel("Cancel")
				.setStyle(ButtonStyle.Secondary);

			let rows = () => [
				new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(list),
				new ActionRowBuilder<ButtonBuilder>().addComponents(cancel)
			];

			const response = await interaction.reply({ components: rows() });

			try {
				let skip = await response.awaitMessageComponent({ time: 60000 });
				let update: string;
				if (skip.isStringSelectMenu()) {
					let value = skip.values[0];
					let idx = queue.songs.findIndex(song => song.unique_id == value);
					if (idx == -1) {
						update = `Music doesn't exist anymore.`;
					} else {
						queue.songs.splice(0, idx-1);
						let name = queue.songs[0].info.videoDetails.title;
						queue.play();
						update = `Skipped to **${name}**.`;
					}
				} else { // clicked button
					update = `Canceled skip.`;
				}

				list.setDisabled(true);
				cancel.setDisabled(true);
				skip.update({ content: update, components: rows() });
			} catch (e) { 
				list.setDisabled(true);
				cancel.setDisabled(true);
				response.edit({ content: `Skip timed out.`, components: rows() });
			}
		}
	)
}
