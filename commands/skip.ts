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
				.addOptions(queue.songs.map((song, index) => {
					return new StringSelectMenuOptionBuilder()
						.setLabel(song.videoDetails.title)
						.setDescription(`Lasts ${song.videoDetails.lengthSeconds} seconds.`)
						.setValue(index.toString());
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

			list.setDisabled(true);
			cancel.setDisabled(true);
			try {
				let skip = await response.awaitMessageComponent({ time: 60000 });
				let update: string;
				if (skip.isStringSelectMenu()) {
					let value = parseInt(skip.values[0]);
					let name = queue.songs[value].videoDetails.title;

					for (let i = 0; i < value; i++) {
						queue.songs.shift();
					}
					queue.play();

					update = `Skipped to **${name}**.`;
				} else { // clicked button
					update = `Canceled skip.`;
				}

				skip.update({ content: update, components: rows() });
			} catch (e) { 
				response.edit({ content: `Skip timed out.`, components: rows() });
			}
		}
	)
}
