const { getLatestProfile } = require('../../../API/functions/getLatestProfile');
const hypixelRebornAPI = require('../../contracts/API/HypixelRebornAPI');
const getWeight = require('../../../API/stats/weight');
const config = require ('../../../config.json');
const { EmbedBuilder } = require("discord.js");
const fs = require('fs');

module.exports = {
    name: 'roles',
    description: 'Update your current gamemode roles',
  
    execute: async (interaction) => {
        try {
            const linked = JSON.parse(fs.readFileSync('data/discordLinked.json', 'utf8'));

            if (linked === undefined) throw new Error('No verification data found. Please contact an administrator.')

            const uuid = linked[interaction.user.id];
  
            if (uuid === undefined) throw new Error("You are no verified. Please verify using /verify.")

            const [guild, player, profile] = await Promise.all([
                hypixelRebornAPI.getGuild("id", config.minecraft.guildID),
                hypixelRebornAPI.getPlayer(uuid),
                getLatestProfile(uuid),
            ])

            if (guild === undefined) throw new Error("Guild not found.")

            const playerIsInGuild = guild.members.find(member => member.uuid == uuid)

            if (playerIsInGuild) {
                ((await interaction.guild.members.fetch(interaction.user)).roles.add(interaction.guild.roles.cache.get(config.discord.guildMemberRole)))
            } else {
                if ((await interaction.guild.members.fetch(interaction.user)).roles.cache.has(interaction.guild.roles.cache.get(config.discord.guildMemberRole))) {
                    (await interaction.guild.members.fetch(interaction.user)).roles.remove(interaction.guild.roles.cache.get(config.discord.guildMemberRole))
                }
            }

            const weight = (await getWeight(profile.profile)).senither.total;

            const bwLevel = player.stats.bedwars.level;
            const bwFKDR = player.stats.bedwars.finalKDRatio;

            const swLevel = player.stats.skywars.level/5;
            const swKDR = player.stats.skywars.KDRatio;
            
            const duelsWins = player.stats.duels.wins;
            const dWLR = player.stats.duels.WLRatio;

            // ? Elite
            if (bwLevel >= 400 || bwLevel >= 300 && bwFKDR >= 5 || swLevel >= 25 || swLevel >= 20 && swKDR >= 4 || duelsWins >= 10000 || duelsWins >= 5000 && dWLR >= 4 || weight >= 69000) {
                (await interaction.guild.members.fetch(interaction.user)).roles.add(interaction.guild.roles.cache.get(config.discord.eliteRole));
            } 

            // ! Novice
            else if (bwLevel >= 200 || bwLevel >= 100 & bwFKDR >= 2 || swLevel >= 15 || swLevel >= 10 && swKDR >= 2 || duelsWins >= 2500 || duelsWins >= 1500 && dWLR >= 2 || weight >= 2500) {
                (await interaction.guild.members.fetch(interaction.user)).roles.add(interaction.guild.roles.cache.get(config.discord.noviceRole));
            }

            const bwLvLRoles = ["600314048617119757", "600313179452735498", "600313143398236191", "600311393316765697", "600311885971062784", "601086287285583872", "610930173675831336", "610930335135432879", "610929429635661846", "610929550674886686", "614848336649912342", "829979638495182868", "829980233365061653", "829980892897214484", "829981099248975873", "829981255609221131", "829981553563009034", "829981705548464128", "829981912847482900", "829982128296558623", "829982315831754823", "829982617369575495", "829982840472207440", "829983089539022890", "829983408628432896", "829983680126124053", "829984999948025899", "829985291678253086", "829985446943653898", "829985605144018965", "829983877300486184"];
            const swLvLRoles = ["732768990723702915", "732769728006717572", "732769252570038283", "732769874530533407", "732769930562502696", "732770029099024425", "732770104642764910", "732770168366956577", "732770222691319870", "732770273564033026", "732770336407552070"];
            const duelsRoles =  ["732773026273427476","732773083479408680","732773121425408063","732773215608504373","732773275070890004","732773326262632529","732773376841482260","732773463139418194"];
            const duelsWinsReqs = [100, 200, 500, 1000, 2000, 4000, 10000, 20000];

            // ? Bedwars

            for (const roleId of bwLvLRoles) {
                if ((await interaction.guild.members.fetch(interaction.user)).roles.cache.has(roleId)) (await interaction.guild.members.fetch(interaction.user)).roles.remove(interaction.guild.roles.cache.get(roleId));
            }

            for (const roleId of swLvLRoles) {
                if ((await interaction.guild.members.fetch(interaction.user)).roles.cache.has(roleId)) (await interaction.guild.members.fetch(interaction.user)).roles.remove(interaction.guild.roles.cache.get(roleId));
            }
            
            for (const roleId of duelsRoles) {
                if ((await interaction.guild.members.fetch(interaction.user)).roles.cache.has(roleId)) (await interaction.guild.members.fetch(interaction.user)).roles.remove(interaction.guild.roles.cache.get(roleId));
            }

            // ? Bedwars
            for (let i = bwLvLRoles.length - 1; i > 0; i--) {
                if (bwLevel < (i - 1) * 100) continue;

                await (await interaction.guild.members.fetch(interaction.user)).roles.add(interaction.guild.roles.cache.get(bwLvLRoles[i - 1]));
                break;
            }

            // ? Skywars
            for (let i = swLvLRoles.length; i > 0; i--) {
                if (swLevel < (i - 1) * 10) continue;

                (await interaction.guild.members.fetch(interaction.user)).roles.add(interaction.guild.roles.cache.get(swLvLRoles[i - 1]));
                break;
            }

            // ? Duels
            if (duelsWins >= 100) {
                for (let i = duelsRoles.length; i > 0; i--) {
                    if (duelsWins < duelsWinsReqs[i - 1]) continue;

                    (await interaction.guild.members.fetch(interaction.user)).roles.add(interaction.guild.roles.cache.get(duelsRoles[i - 1]));
                    break;
                }
            }

            const updateRole = new EmbedBuilder()
                .setColor(5763719)
                .setAuthor({ name: 'Successfully completed'})
                .setDescription(`Roles have been successfully updated!`)
                .setFooter({ text: `by DuckySoLucky#5181 | /help [command] for more information`, iconURL: 'https://imgur.com/tgwQJTX.png' });

            await interaction.editReply({ embeds: [ updateRole ] });

        } catch(error) {
            console.log(error)

            const errorEmbed = new EmbedBuilder()
                .setColor(15548997)
                .setAuthor({ name: 'An Error has occurred'})
                .setDescription(`\`\`\`${error.toString().replaceAll("[hypixel-api-reborn] ", "").replaceAll("Error: ", "")}\`\`\``)
                .setFooter({ text: `by DuckySoLucky#5181 | /help [command] for more information`, iconURL: 'https://imgur.com/tgwQJTX.png' });

            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },
  };
