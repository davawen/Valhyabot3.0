import { EmbedBuilder, GuildMember, SlashCommandBuilder } from "discord.js";
import ytdl from "ytdl-core";
import search from "yt-search";

import { CommandManager } from "../command_manager";
import { AudioPlayerStatus } from "@discordjs/voice";
import { queue_manager } from "../queue";

export function register(manager: CommandManager) {
	manager.add_command(
		new SlashCommandBuilder()
			.setName("play")
			.setDescription("Play's a youtube video audio in the user's channel")
			.addSubcommand(subcommand => subcommand
				.setName("url")
				.setDescription("add a video with a url or id")
				.addStringOption(option => option.setName("url").setDescription("the video's url").setRequired(true))
			)
			.addSubcommand(subcommand => subcommand
				.setName("search")
				.setDescription("search youtube videos")
				.addStringOption(option => option.setName("query").setDescription("youtube search term").setRequired(true))
			)
		,
		async interaction => {
			if (interaction.guild === null) return;

			let url: string;
			if (interaction.options.getSubcommand(true) == "url") {
				url = interaction.options.getString("url", true);
			} else {
				let query = interaction.options.getString("query", true);
				let result = await search(query);

				if (result.videos.length == 0) {
					await interaction.reply({ content: "No search result for the given query", ephemeral: true })
				}

				url = result.videos[0].url;
			}

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
