import { ApplicationCommand, ChatInputCommandInteraction, Client, RESTPostAPIChatInputApplicationCommandsJSONBody, Routes, SlashCommandBuilder } from "discord.js";

type CommandJSON = RESTPostAPIChatInputApplicationCommandsJSONBody;
type InteractionResponse = (interaction: ChatInputCommandInteraction) => void;

export class CommandManager {
	/// Command name -> SlashCommandBuilder output
	private unregistered_commands: Map<string, CommandJSON>;
	/// Command name -> ApplicationCommand
	private registered_commands: Map<string, ApplicationCommand>;
	/// Commnad name -> Reply
	private funcs: Map<string, InteractionResponse>;

	constructor() {
		this.unregistered_commands = new Map();
		this.registered_commands = new Map();
		this.funcs = new Map();
	}

	add_command(builder: Pick<SlashCommandBuilder, "toJSON">, func: InteractionResponse) {
		const data = builder.toJSON();
		this.unregistered_commands.set(data.name, data);
		this.funcs.set(data.name, func);
	}

	async register_commands(client: Client) {
		const id = client.user?.id;
		if (id === undefined) throw new Error("unavailable user id");

		const unregistered = Array.from(this.unregistered_commands.values());
		const data = await client.rest.put(Routes.applicationCommands(id), {
			body: unregistered 
		}) as ApplicationCommand[] ;

		if (data.length !== unregistered.length) {
			console.error("not all commands were set");
		}

		for (let i = 0; i < data.length; i++) {
			this.registered_commands.set(data[i].name, data[i]);
			console.log(`LOG: registered command ${data[i].name}`);
		}

		this.unregistered_commands = new Map();
	}

	get_command_response(name: string): InteractionResponse | undefined {
		return this.funcs.get(name);
	}
}
