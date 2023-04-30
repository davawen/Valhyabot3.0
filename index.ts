import { Client, Events, GuildMember, GatewayIntentBits as Intent, MessageFlags, SlashCommandBuilder, VoiceBasedChannel } from "discord.js";
import { VoiceConnectionStatus, createAudioPlayer, createAudioResource, joinVoiceChannel } from "@discordjs/voice";
import ytdl from "ytdl-core";

import { manager } from "./command_manager";

import { config as dotenv_config } from "dotenv";
dotenv_config();

const options = {
	token: process.env.DISCORD_TOKEN as string
};

const client = new Client({ intents: [Intent.Guilds, Intent.GuildVoiceStates] });

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

	manager.add_command(
		new SlashCommandBuilder().setName("ping").setDescription("ping"),
		interaction => {
			interaction.reply("pong");
		}
	);

	manager.add_command(
		new SlashCommandBuilder()
			.setName("play")
			.setDescription("Play's a youtube video audio in the user's channel")
			.addStringOption(option => option.setName("url").setDescription("the video's url").setRequired(true)),
		async interaction => {
			const url = interaction.options.getString("url") ?? "";

			if (interaction.guild === null) return;

			if (!ytdl.validateURL(url)) {
				await interaction.reply({ content: "Invalid url given", ephemeral: true });
				return;
			}

			const member = interaction.member as GuildMember;
			if (member.voice.channelId === null) {
				await interaction.reply({ content: "User not in voice channel", ephemeral: true });
				return;
			}

			await interaction.deferReply();

			let info: ytdl.videoInfo;
			try {
				info = await ytdl.getBasicInfo(url);
			} catch (e) {
				interaction.editReply(`Failed to get video: ${e}`);
				return;
			}
			interaction.editReply(`Playing ${info.videoDetails.title}!`);

			const video = ytdl(url, { filter: 'audioonly' });
			const resource = createAudioResource(video);

			const connection = joinVoiceChannel({
				adapterCreator: interaction.guild.voiceAdapterCreator,
				guildId: interaction.guild.id,
				channelId: member.voice.channelId
			});

			const player = createAudioPlayer();

			connection.on(VoiceConnectionStatus.Ready, (_old_state) => {
				console.log(resource);

				connection.subscribe(player);
				player.play(resource);

				video.on("close", () => {
					console.log("stopped playing");
					player.stop();
					connection.destroy();
				});
			});
		}
	);

	await manager.register_commands(c);
});

client.login(options.token);
