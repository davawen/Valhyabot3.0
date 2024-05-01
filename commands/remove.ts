import { ActionRowBuilder, GuildMember, SlashCommandBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from "discord.js";

import { CommandManager } from "../command_manager";
import { queue_manager } from "../queue";

/// Takes a list of strings and joins them with commas and an "and":
///
/// [ "a", "b", "c" ] -> "a, b, and c"
function join_with_comma_and_and(elements: readonly string[]): string {
	if (elements.length == 0) return "";
	else if (elements.length == 1) return elements[0];
	else {
		let last = elements[elements.length - 1];
		return elements.slice(0, elements.length - 1).join(", ") + ", and " + last;
	}
}

export function register(manager: CommandManager) {
	manager.add_command(
		new SlashCommandBuilder()
			.setName("remove")
			.setDescription("Remove a music from the queue")
		,
		async interaction => {
			if (interaction.guild === null) return;

			const member = interaction.member as GuildMember;
			if (member.voice.channelId === null) {
				await interaction.reply({ content: "User not in voice channel.", ephemeral: true });
				return;
			}

			let queue = queue_manager.get(member.guild);
			if (queue == null || queue.songs.length == 0) {
				await interaction.reply({ content: "No music in queue", ephemeral: true });
				return;
			}

			await interaction.deferReply({ ephemeral: true });

			let songs = queue.songs;
			if (songs.length > 25) { // discord select components are limited to 25 entries
				songs = songs.slice(0, 25);
			}

			// Construct components
			const select = new StringSelectMenuBuilder()
				.setCustomId("songs")
				.setMinValues(0)
				.setMaxValues(songs.length)
				.addOptions(songs.map(song => new StringSelectMenuOptionBuilder()
					.setLabel(song.info.videoDetails.title.substring(0, 99))
					.setValue(song.unique_id)
				));

			const row = new ActionRowBuilder<StringSelectMenuBuilder>()
				.addComponents(select);

			const response = await interaction.editReply({
				content: "Choose the music to delete.",
				components: [row]
			});

			try {
				const confirmation = await response.awaitMessageComponent({ filter: () => true, time: 50000 });
				if (!confirmation.isStringSelectMenu()) return; // should never happen, makes the type system happy

				// Remove the selected musics from the real songs array
				let removed = [];
				let failed = 0;
				for (const value of confirmation.values) {
					const song_idx = queue.songs.findIndex(song => value == song.unique_id);
					if (song_idx == -1) {
						failed++;
						continue;
					}

					const [song] = queue.songs.splice(song_idx, 1);
					removed.push(song.info.videoDetails.title);
				}

				if (failed == 0) {
					await confirmation.update({ content: "Successfully removed all musics.", components: [] });
				} else {
					await confirmation.update({ content: `${failed} musics had already been removed or played.`, components: [] });
				}

				if (removed.length > 0) {
					await confirmation.followUp({
						content: `Removed ${join_with_comma_and_and(removed)}.`,
						ephemeral: false
					});
				}
			} catch (e) {
				select.setDisabled(true);
				const row = new ActionRowBuilder<StringSelectMenuBuilder>()
					.addComponents(select);

				await interaction.editReply({ content: "Timed out.", components: [row] });
			}
		}
	);

}
