const { 
    Client, 
    GatewayIntentBits, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    ChannelType, 
    PermissionFlagsBits, 
    EmbedBuilder 
} = require('discord.js');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.once('ready', () => {
    console.log(`تم تسجيل الدخول بنجاح باسم: ${client.user.tag}`);
});

// استقبال أمر /ticket-setup
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'ticket-setup') {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({ content: 'عذراً، يجب أن تمتلك صلاحية المسؤول (Administrator) لاستخدام هذا الأمر.', ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setTitle('🎫 نظام التكتات والدعم الفني')
            .setDescription('إذا كنت بحاجة إلى مساعدة أو لديك استفسار، يرجى الضغط على الزر أدناه لفتح تكت جديدة وسيقوم فريق الدعم بمساعدتك بأقرب وقت.')
            .setColor('#0099ff')
            .setFooter({ text: 'Discord Ticket System' });

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('create_ticket')
                    .setLabel('فتح تكت جديدة')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('🎫')
            );

        await interaction.channel.send({ embeds: [embed], components: [row] });
        await interaction.reply({ content: 'تم إرسال رسالة التكتات بنجاح!', ephemeral: true });
    }
});

// التعامل مع الأزرار (فتح وإغلاق التكت)
client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'create_ticket') {
        const guild = interaction.guild;
        const member = interaction.member;
        const supportRoleID = process.env.SUPPORT_ROLE_ID;

        // التحقق من عدم وجود تكت مفتوحة مسبقاً للعضو نفسه
        const existingChannel = guild.channels.cache.find(c => c.name === `ticket-${member.user.username.toLowerCase()}`);
        if (existingChannel) {
            return interaction.reply({ content: `لديك تكت مفتوحة بالفعل هنا: ${existingChannel}`, ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        try {
            // إنشاء قناة تكت جديدة
            const ticketChannel = await guild.channels.create({
                name: `ticket-${member.user.username}`,
                type: ChannelType.GuildText,
                permissionOverwrites: [
                    {
                        id: guild.id, // منع الجميع من الرؤية
                        deny: [PermissionFlagsBits.ViewChannel],
                    },
                    {
                        id: member.id, // السماح لصاحب التكت
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
                    },
                    {
                        id: supportRoleID, // السماح لفريق الدعم
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
                    },
                ],
            });

            const ticketEmbed = new EmbedBuilder()
                .setTitle(`تكت خاصة بـ ${member.user.tag}`)
                .setDescription('مرحباً بك! يرجى كتابة تفاصيل مشكلتك أو استفسارك وسيقوم فريق الدعم بالرد عليك قريباً.\n\nللإغلاق اضغط على الزر أدناه.')
                .setColor('#00ff00');

            const closeRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('close_ticket')
                        .setLabel('إغلاق التكت')
                        .setStyle(ButtonStyle.Danger)
                        .setEmoji('🔒')
                );

            await ticketChannel.send({ content: `${member} | <@&${supportRoleID}>`, embeds: [ticketEmbed], components: [closeRow] });
            await interaction.editReply({ content: `تم إنشاء التكت بنجاح! توجه إلى هنا: ${ticketChannel}` });

        } catch (error) {
            console.error(error);
            await interaction.editReply({ content: 'حدث خطأ أثناء إنشاء التكت، تأكد من صلاحيات البوت.' });
        }
    }

    if (interaction.customId === 'close_ticket') {
        const channel = interaction.channel;
        await interaction.reply({ content: 'جاري إغلاق وحذف التكت خلال 5 ثوانٍ...' });
        
        setTimeout(async () => {
            try {
                await channel.delete();
            } catch (error) {
                console.error('فشل حذف القناة:', error);
            }
        }, 5000);
    }
});

client.login(process.env.TOKEN);