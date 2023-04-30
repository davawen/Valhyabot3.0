import { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } from "discord.js";
import { CommandManager } from "../command_manager";

export function register(manager: CommandManager) {
	manager.add_command(
		new SlashCommandBuilder()
			.setName("update")
			.setDescription("Updates every second"),
		async interaction => {
			const stop_button = new ButtonBuilder()
				.setCustomId('stop')
				.setLabel("Stop")
				.setStyle(ButtonStyle.Primary);

			const row = new ActionRowBuilder<ButtonBuilder>()
				.addComponents(stop_button);

			let seconds = 0;

			await interaction.deferReply();

			// const collectorFilter = (i: any) => i.user.id === interaction.user.id;

			while (true) {
				const response = await interaction.editReply({ 
					content: `Started ${seconds}s ago`,
					components: [row]
				});

				try {
					const confirmation = await response.awaitMessageComponent({ time: 1000 });
					await confirmation.update(`Ended after ${seconds}s.`);
					break; 
				} catch (e) {
					// failed to get interaction
					seconds++;
				}
			}
		}
	);
}
