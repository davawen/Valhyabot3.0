import { AudioPlayer, AudioPlayerStatus, AudioResource, VoiceConnectionStatus, createAudioPlayer, createAudioResource, getVoiceConnection, joinVoiceChannel } from "@discordjs/voice";
import { Guild } from "discord.js";
import ytdl from "ytdl-core";
import { randomUUID } from "crypto"

export type Song = {
	info: ytdl.videoInfo,
	/// This ID is unique to every song added, even if they are from the same music
	unique_id: string
}

export class Queue {
	guild: Guild;
	player: AudioPlayer;
	resource: AudioResource | null;
	current_song: Song | null;

	songs: Song[];
	destroyed: boolean;

	constructor(guild: Guild, voice_channel: string) {
		this.guild = guild;
		this.player = createAudioPlayer();
		this.resource = null;
		this.current_song = null;
		this.songs = [];
		this.destroyed = false;

		const connection = joinVoiceChannel({
			adapterCreator: guild.voiceAdapterCreator,
			guildId: guild.id,
			channelId: voice_channel
		});

		connection.on(VoiceConnectionStatus.Ready, (_old_state) => {
			connection.subscribe(this.player);
		});

		this.player.on(AudioPlayerStatus.Idle, (old_state) => {
			if (old_state.status === AudioPlayerStatus.Playing) {
				this.play();
			}
		});

		this.player.on("error", (error) => {
			console.log(error);
		})
	}

	play() {
		this.current_song = this.get_next();
		if (this.current_song === null) { // stop player
			queue_manager.remove(this.guild.id);
			return;
		}

		const stream = ytdl.downloadFromInfo(this.current_song.info, { 
			dlChunkSize: 100000,
			filter: 'audioonly', quality: "highestaudio",
		});
		this.resource = createAudioResource(stream);
		this.player.play(this.resource);
	}

	pause() {
	}

	unpause() {
	}

	/**
	 * @param url - Valid url of a youtube video
	 * @returns The video info if it is an existing youtube video, otherwise null
	 */
	async add_song(url: string): Promise<ytdl.videoInfo | null> {
		try {
			let info = await ytdl.getInfo(url);
			this.songs.push({
				info: info,
				unique_id: randomUUID()
			});

			return info;
		} catch (e) {
			return null;
		}
	}

	/// Returns the next song to play (first in queue) or null if the queue is empty
	get_next(): Song | null {
		return this.songs.shift() ?? null;
	}

	is_empty(): boolean {
		return this.songs.length === 0;
	}

	destroy() {
		getVoiceConnection(this.guild.id)?.destroy();
		this.player.stop();
		this.destroyed = true;
	}
}

export class QueueManager {
	map: Map<string, Queue>;

	constructor() {
		this.map = new Map();
	}

	get_or_create(guild: Guild, voice_channel: string): Queue {
		let queue = this.map.get(guild.id);
		if (queue !== undefined) return queue;

		let new_queue = new Queue(guild, voice_channel);
		this.map.set(guild.id, new_queue);
		return new_queue;
	}

	get(guild: Guild): Queue | null {
		return this.map.get(guild.id) ?? null;
	}

	remove(guild_id: string) {
		this.map.get(guild_id)?.destroy();
		this.map.delete(guild_id);
	}
}

/// Maps a guild's id to its queue
export let queue_manager = new QueueManager();
