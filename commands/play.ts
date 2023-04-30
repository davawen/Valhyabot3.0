import { EmbedBuilder, GuildMember, SlashCommandBuilder } from "discord.js";
import ytdl from "ytdl-core";

import { CommandManager } from "../command_manager";
import { AudioPlayerStatus } from "@discordjs/voice";
import { queue_manager } from "../queue";

export function register(manager: CommandManager) {
	manager.add_command(
		new SlashCommandBuilder()
			.setName("play")
			.setDescription("Play's a youtube video audio in the user's channel")
			.addStringOption(option => option.setName("url").setDescription("the video's url").setRequired(true)),
		async interaction => {
			const url = interaction.options.getString("url") ?? "";

			if (interaction.guild === null) return;

			if (!ytdl.validateURL(url)) {
				await interaction.reply({ content: "Invalid url given.", ephemeral: true });
				return;
			}

			const member = interaction.member as GuildMember;
			if (member.voice.channelId === null) {
				await interaction.reply({ content: "User not in voice channel.", ephemeral: true });
				return;
			}

			await interaction.deferReply();

			let queue = queue_manager.get_or_create(member.guild, member.voice.channelId);

			const info = await queue.add_song(url);
			if (info === null) {
				interaction.editReply(`Inexisting video given.`);
				queue_manager.remove(member.guild.id);
				return;
			}

			let description = info.videoDetails.description;
			if (description !== null && description.length > 100) {
				description = description.substring(0, 100);
				description += "....";
			}
			const embed = new EmbedBuilder()
				.setAuthor({ name: info.videoDetails.author.name, iconURL: info.videoDetails.thumbnails[0].url, url: info.videoDetails.author.channel_url })
				.setTitle(info.videoDetails.title)
				.setURL(url)
				.setDescription(description)
				.setThumbnail(info.videoDetails.thumbnails[0].url);

			interaction.editReply({ content: `Added to queue.`, embeds: [embed] });
			if (queue.player.state.status == AudioPlayerStatus.Idle) {
				queue.play();
			}
		}
	);

}
