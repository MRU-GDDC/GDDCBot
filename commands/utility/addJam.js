const {
  SlashCommandBuilder,
  GuildScheduledEventManager,
  GuildScheduledEventPrivacyLevel,
  GuildScheduledEventEntityType,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("addjam")
    .setDescription("Adds a jam to the schedule.")
    .addStringOption((option) =>
      option
        .setName("jam_name")
        .setDescription("The name of the jam.")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("jam_date")
        .setDescription("The date of the jam. Please put this in MM/DD/YYYY.")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("jam_start_time")
        .setDescription(
          "The starting time of the jam. Please put this in 24 hour time in MST."
        )
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("jam_duration")
        .setDescription("The total time of the jam in whole hours.")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("jam_link")
        .setDescription("The link to the jam.")
        .setRequired(true)
    ),
  async execute(interaction) {
    const jamName = interaction.options.getString("jam_name");
    const jamDate = interaction.options.getString("jam_date");
    const jamStartTime = interaction.options.getString("jam_start_time");
    const jamDuration = interaction.options.getInteger("jam_duration");
    const jamLink = interaction.options.getString("jam_link");

    // check if jam date is valid
    const dateRegex = new RegExp(
        "^(0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])[- /.](19|20)\\d\\d$"
      ),
      validDate = dateRegex.test(jamDate);

    if (!validDate) {
      await interaction.reply("Please enter a valid date.");
      return;
    }

    // check if date has passed
    const today = new Date(),
      jamDateArray = jamDate.split("/"),
      jamMonth = jamDateArray[0],
      jamDay = jamDateArray[1],
      jamYear = jamDateArray[2],
      jamDateObject = new Date(jamYear, jamMonth - 1, jamDay);

    jamDateObject.setHours(jamStartTime.split(":")[0]);
    jamDateObject.setMinutes(jamStartTime.split(":")[1]);

    if (jamDateObject < today) {
      await interaction.reply("Please enter a date that has not passed.");
      return;
    }

    // check if jam start time is valid
    const timeRegex = new RegExp("^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$"),
      validTime = timeRegex.test(jamStartTime);

    if (!validTime) {
      await interaction.reply("Please enter a valid time.");
      return;
    }

    // check if jam duration is valid
    if (jamDuration < 1) {
      await interaction.reply("Please enter a valid duration.");
      return;
    }

    const URL = require("url").URL;

    try {
      new URL(jamLink);
    } catch (error) {
      await interaction.reply("Please enter a valid URL.");
      return;
    }

    let jamEndingDateObject = new Date(jamDateObject);

    jamEndingDateObject.setHours(jamEndingDateObject.getHours() + jamDuration);

    let event = {
      name: jamName,
      scheduledStartTime: jamDateObject,
      scheduledEndTime: jamEndingDateObject,
      description:
        "A game jam is happening! This jam runs for " +
        jamDuration +
        " hours, and starts at " +
        MilitaryToStandard(jamStartTime) +
        " on " +
        jamDate +
        ".",
      privacyLevel: GuildScheduledEventPrivacyLevel.GuildOnly,
      entityType: GuildScheduledEventEntityType.External,
      entityMetadata: {
        location: jamLink,
      },
    };

    const guild = interaction.guild;
    const manager = new GuildScheduledEventManager(guild);

    manager.create(event);

    await interaction.reply(
      `Jam Name: ${jamName}\nJam Date: ${jamDate}\nJam Start Time: ${jamStartTime}\nJam Duration: ${jamDuration} Hours\nJam Link: ${jamLink}`
    );

    // send a message to #jam-announcements with the jam info
    const channel = guild.channels.cache.find(
        (channel) => channel.name === "jam-announcements"
      ),
      message = `A new jam has been added!\n\nJam Name: ${jamName}\nJam Date: ${jamDate}\nJam Start Time: ${jamStartTime}\nJam Duration: ${jamDuration} Hours\nJam Link: ${jamLink}\n\nA Discord event has also been created, so make sure to sign up there for further updates!`;

    const role = guild.roles.cache.find(
        (role) => role.name === "Jam Announcements"
      ),
      roleID = role.id;

    channel.send(`<@&${roleID}> ${message}`);
  },
};

function MilitaryToStandard(milTime) {
  var hours24 = parseInt(milTime.substring(0, 2));
  var hours = ((hours24 + 11) % 12) + 1;
  var amPm = hours24 > 11 ? "pm" : "am";
  var minutes = milTime.substring(2);

  return hours + "" + minutes + amPm;
}
