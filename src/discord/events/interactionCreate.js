const { getLatestProfile } = require('../../../API/functions/getLatestProfile')
const { toFixed, addCommas } = require("../../contracts/helperFunctions");
const hypixelRebornAPI = require("../../contracts/API/HypixelRebornAPI");
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const getWeight = require('../../../API/stats/weight')
const { EmbedBuilder } = require("discord.js");
const config = require("../../../config.json");
const Logger = require("../.././Logger");
const fs = require("fs");

module.exports = {
  name: "interactionCreate",
  async execute(interaction) {
    if (interaction.isChatInputCommand()) {
      await interaction.deferReply({ ephemeral: false });

      const command = interaction.client.commands.get(interaction.commandName);

      if (command === undefined) return;

      try {
        Logger.discordMessage(`${interaction.user.username} - [${interaction.commandName}]`);

        bridgeChat = interaction.channelId;

        await command.execute(interaction);

      } catch (error) {
        console.log(error);
        await interaction.reply({
          content: "There was an error while executing this command!",
          ephemeral: true,
        });
      }
    }

    if (interaction.isButton()) {
      try {
        await interaction.deferReply({ ephemeral: true })

        // ? Apply Button
        if (interaction.customId.includes("guild.apply_button")) {
          const linked = JSON.parse(fs.readFileSync('data/discordLinked.json', 'utf8'));

          if (linked === undefined) throw new Error('No verification data found. Please contact an administrator.')

          const uuid = linked[interaction.user.id];

          if (uuid === undefined) throw new Error("You are no verified. Please verify using /verify.")

          const [player, profile] = await Promise.all([
            hypixelRebornAPI.getPlayer(uuid),
              getLatestProfile(uuid)
          ])

          const weight = (await getWeight(profile.profile)).senither.total;

          const bwLevel = player.stats.bedwars.level;
          const bwFKDR = player.stats.bedwars.finalKDRatio;

          const swLevel = player.stats.skywars.level/5;
          const swKDR = player.stats.skywars.KDRatio;
          
          const duelsWins = player.stats.duels.wins;
          const dWLR = player.stats.duels.WLRatio;

          let meetRequirements = false;

          if (weight > config.guildRequirement.requirements.senitherWeight) meetRequirements = true;

          if (bwLevel > config.guildRequirement.requirements.bedwarsStars) meetRequirements = true;
          if (bwLevel > config.guildRequirement.requirements.bedwarsStarsWithFKDR && bwFKDR > config.guildRequirement.requirements.bedwarsFKDR) meetRequirements = true;

          if (swLevel > config.guildRequirement.requirements.skywarsStars) meetRequirements = true;
          if (swLevel > config.guildRequirement.requirements.skywarsStarsWithKDR && swKDR > config.guildRequirement.requirements.skywarsStarsWithKDR) meetRequirements = true;

          if (duelsWins > config.guildRequirement.requirements.duelsWins) meetRequirements = true;
          if (duelsWins > config.guildRequirement.requirements.duelsWinsWithWLR && dWLR > config.guildRequirement.requirements.duelsWinsWithWLR) meetRequirements = true;

          if (meetRequirements === false) {
            const errorEmbed = new EmbedBuilder()
              .setColor(15548997)
              .setAuthor({ name: 'An Error has occurred!'})
              .setDescription(`You do not meet requirements.`)
              .setFooter({ text: `by DuckySoLucky#5181 | /help [command] for more information`, iconURL: 'https://imgur.com/tgwQJTX.png' });

            return interaction.followUp({ embeds: [errorEmbed] });
          } 

          const applicationEmbed = new EmbedBuilder()
            .setColor(2067276)
            .setAuthor({ name: 'Guild Application.'})
            .setDescription(`Guild Application has been successfully sent to guild staff.`)
            .setFooter({ text: `by DuckySoLucky#5181 | /help [command] for more information`, iconURL: 'https://imgur.com/tgwQJTX.png' });

          interaction.followUp({ embeds: [applicationEmbed] })

          const statsEmbed = new EmbedBuilder()
              .setColor(2067276)
              .setTitle(`${player.nickname} has requested to join the Guild!`)
              .setDescription(`**Hypixel Network Level**\n${player.level}\n`)
              .addFields(
                  { name: 'Bedwars Level', value: `${player.stats.bedwars.level}`, inline: true },
                  { name: 'Skywars Level', value: `${player.stats.skywars.level}`, inline: true },
                  { name: 'Duels Wins', value: `${player.stats.duels.wins}`, inline: true },
                  { name: 'Bedwars FKDR', value: `${player.stats.bedwars.finalKDRatio}`, inline: true },
                  { name: 'Skywars KDR', value: `${player.stats.skywars.KDRatio}`, inline: true },
                  { name: 'Duels WLR', value: `${player.stats.duels.KDRatio}`, inline: true },
                  { name: 'Senither Weight', value: `${addCommas(toFixed((weight), 2))}`, inline: true },
              )
              .setThumbnail(`https://www.mc-heads.net/avatar/${player.nickname}`) 
              .setFooter({ text: `by DuckySoLucky#5181 | /help [command] for more information`, iconURL: 'https://imgur.com/tgwQJTX.png' });

          client.channels.cache.get(config.channels.joinRequests).send({ embeds: [statsEmbed] })
        }
        
      } catch (error) {
        const errorEmbed = new EmbedBuilder()
          .setColor(15548997)
          .setAuthor({ name: 'An Error has occurred'})
          .setDescription(`\`\`\`${error.toString().replaceAll("[hypixel-api-reborn] ", "").replaceAll("Error: ", "")}\`\`\``)
          .setFooter({ text: `by DuckySoLucky#5181 | /help [command] for more information`, iconURL: 'https://imgur.com/tgwQJTX.png' });
          
        interaction.editReply({ embeds: [errorEmbed], ephemeral: true });
      }
    }
  },
};
