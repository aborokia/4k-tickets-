const { REST, Routes, SlashCommandBuilder } = require('discord.js');
require('dotenv').config();

const commands = [
    new SlashCommandBuilder()
        .setName('ticket-setup')
        .setDescription('إرسال رسالة إنشاء التكتات في القناة الحالية')
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
    try {
        console.log('جاري تحديث أوامر البوت (Slash Commands)...');
        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
            { body: commands },
        );
        console.log('تم تسجيل الأوامر بنجاح!');
    } catch (error) {
        console.error(error);
    }
})();