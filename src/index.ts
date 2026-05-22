import type { Context } from 'koishi'
import { h, Schema } from 'koishi'

export const name = 'qq-bot-config-link'

/**
 * 📋 插件配置项接口
 */
export interface Config {
  /** 📝 是否在 QQ 官方平台使用 Markdown 格式发送消息 */
  useMarkdown: boolean
  /** 🔗 是否在消息末尾添加一个跳转链接按钮 */
  addJumpButton: boolean
  /** 🆔 官Bot 的默认 botUin（QQ号），作为参数兜底值 */
  defaultBotUin: string
  /** 🔑 官Bot 的默认 botUid，作为参数兜底值 */
  defaultBotUid: string
  /** 👥 默认群号 groupCode，作为参数兜底值 */
  defaultGroupCode: string
  /** 📋 是否在消息中显示 uin / uid / groupCode */
  showBotInfo: boolean
  /** 🖼️ 是否在消息中附带操作提示图片 */
  showImage: boolean
  /** 🖼️ 操作提示图片的 URL */
  imageUrl: string
}

export const Config: Schema<Config> = Schema.object({
  /**
   * 📝 useMarkdown — Markdown 开关
   * - true  → 发送 Markdown 富文本消息（支持链接高亮、排版更美观）✨
   * - false → 发送纯文本消息（最简兼容模式）📄
   * 💡 非 QQ 官方平台时自动降级为纯文本，不受此配置影响。
   */
  useMarkdown: Schema.boolean().default(true).description('📝 在QQ官方平台使用Markdown按钮格式发送配置链接（而非贼长的纯文本链接）✨'),

  /**
   * 🔗 addJumpButton — 跳转按钮开关
   * - true  → 消息底部挂载一个「🌐 打开配置链接」按钮，点击一键跳转 🚀
   * - false → 不添加按钮，仅展示文字链接 📄
   * 💡 开启后自动启用 Markdown 模式（按钮依赖 msg_type: 2）。
   */
  addJumpButton: Schema.boolean().default(true).description('🔗 在QQ官方Bot平台的消息末尾添加一个跳转链接按钮，点击直接打开配置页 🚀'),

  /**
   * 🆔 defaultBotUin — 默认 Bot UIN
   * 当指令未传 --botuin 时使用此值。
   * 留空且未传参时会报错 ⚠️
   */
  defaultBotUin: Schema.string().description('🆔 默认 Bot UIN'),

  /**
   * 🔑 defaultBotUid — 默认 Bot UID
   * 当指令未传 --botuid 时使用此值。
   * 留空且未传参时会报错 ⚠️
   */
  defaultBotUid: Schema.string().description('🔑 默认 Bot UID'),

  /**
   * 👥 defaultGroupCode — 默认群号
   * 当指令未传 --groupcode 时使用此值。
   * 留空则使用当前会话群号兜底。
   */
  defaultGroupCode: Schema.string().description('👥 默认 QQ 群号'),

  /**
   * 📋 showBotInfo — 显示 Uin/Uid/GroupCode 信息
   * - true  → 在返回消息中附加上 uin / uid / groupCode 信息 📊
   * - false → 不显示，仅输出链接 🔗
   */
  showBotInfo: Schema.boolean().default(false).description('📋 在返回消息中显示当前使用的 botUin / botUid / groupCode 信息'),

  /**
   * 🖼️ showImage — 操作提示图片开关
   * - true  → 在链接/按钮上方附带操作提示图片 🖼️
   * - false → 不显示图片
   */
  showImage: Schema.boolean().default(true).description('🖼️ 在消息中附带操作提示图片'),

  /**
   * 🖼️ imageUrl — 操作提示图片 URL
   * 当 showImage 为 true 时使用此 URL 显示图片。
   */
  imageUrl: Schema.string()
    .default('https://gitee.com/vincent-zyu/koishi-plugin-get-qq-bot-transfer-link/releases/download/%E6%93%8D%E4%BD%9C%E6%8F%90%E7%A4%BA.png/%E6%93%8D%E4%BD%9C%E6%8F%90%E7%A4%BA.png')
    .role('link')
    .description('🖼️ 操作提示图片的 URL'),
})

export function apply(ctx: Context, config: Config) {
  ctx.command('napcat-getuser [userId:string]', '请在napcat使用这个指令(其他的onebot实现不知道能不能用捏)')
    .action(async ({ session }, userId) => {
      if (session?.platform !== 'onebot')
        return `${h.quote(session?.messageId)}❌ 仅支持 onebot 平台使用此指令`
      const user = await session?.bot.internal._request('get_stranger_info', { user_id: userId })
      await session?.send(`${h.quote(session?.messageId)}用户信息：${JSON.stringify(user)}`)
    })

  ctx.command('qqbot-url <groupId:string>', '传参是官bot的QQ号')
    .option('uin', '-u <uin:string> 官Bot的QQ号')
    .option('uid', '-i <uid:string> 官Bot的UID')
    .option('group', '-g <group:string> 群号')
    .action(async ({ session, options = {} }, groupId) => {
      // 优先级: option > config > 报错
      const botUin = options.uin || config.defaultBotUin
      const botUid = options.uid || config.defaultBotUid || session?.bot.selfId
      const groupCode = options.group || config.defaultGroupCode || groupId || session?.guildId

      if (!botUin)
        return '❌ 缺少 botUin（机器人 UIN），请通过 --uin 传入或配置 defaultBotUin'
      if (!botUid)
        return '❌ 缺少 botUid（机器人 UID），请通过 --uid 传入或配置 defaultBotUid'
      if (!groupCode || !/^\d+$/.test(groupCode))
        return '❌ 缺少 groupCode（QQ 群号），请通过 --group 传入或配置 defaultGroupCode'

      const url = `https://club.vip.qq.com/transfer?open_kuikly_info=${encodeURIComponent(JSON.stringify({
        page_name: 'ai_group_service_agreement_pop_page',
        groupCode: Number(groupCode),
        botUin: Number(botUin),
        botUid,
        screen: 1,
      }))}`

      const availability = '安卓和iOS QQ 9.2.90及以上版本可用。iOS也可以直接去设置里配置。'
      const image = config.showImage ? h.image(config.imageUrl) : ''
      const botInfo = !config.showBotInfo ? '' : session?.platform === 'qq'
        ? [
            '| 字段 | 值 |',
            '|---|---|',
            `| 🆔 botUin | ${botUin} |`,
            `| 🔑 botUid | ${botUid} |`,
            `| 👥 groupCode | ${groupCode} |`,
          ].join('\n')
        : [
            `🆔 botUin：${botUin}`,
            `🔑 botUid：${botUid}`,
            `👥 groupCode：${groupCode}`,
          ].join('\n')

      if (session?.platform === 'qq' && (config.useMarkdown || config.addJumpButton)) {
        return [
          h('markdown', [
            `## 🔗 官Bot全量主动配置链接`,
            botInfo,
            `点击下方按钮打开配置页面。`,
            `> ${availability}`,
            image,
          ].filter(Boolean).join('\n\n')),
          ...config.addJumpButton ? [h('button', {
            render_data: { label: '🌐 打开配置链接', style: 1 },
            action: {
              type: 0,
              permission: { type: 2 },
              data: url,
              unsupport_tips: '请更新QQ版本后使用',
            },
          })] : [],
        ]
      }
      return [
        botInfo,
        `全量主动配置链接（${availability}）：`,
        image,
        url,
      ]
    })
}
