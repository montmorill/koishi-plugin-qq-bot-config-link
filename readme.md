# koishi-plugin-get-qq-bot-transfer-link

<!-- [![npm](https://img.shields.io/npm/v/koishi-plugin-get-qq-bot-transfer-link?style=flat-square)](https://www.npmjs.com/package/koishi-plugin-get-qq-bot-transfer-link) -->

利用napcat获取官bot的uid，然后获取本群的 开放官bot的全量和主动的配置链接，然后手机qq打开就可以配置了

## code
```typescript
import { Context, Schema } from 'koishi'

export const name = 'get-qq-bot-transfer-link'

export interface Config { }

export const Config: Schema<Config> = Schema.object({})

export function apply(ctx: Context, config: Config) {
  // write your plugin here
  // 请使用napcat调用这个接口, adapter-onebot
  ctx.command('napcat-getuser [userId:string]')
    .action(async ({ session }, userId) => {
      // const user = await session.bot.getUser(targetUserId, session.channelId);
      const user = await session?.bot.internal._request('get_stranger_info', { user_id: userId });
      await session?.send(`用户信息：${JSON.stringify(user)}`)
    })

  ctx.command('qqbot-url <userId:string>')
    //userId是qq官bot的qq号
    .action(async ({ session }, userId) => {
      const groupCode = session?.guildId;
      const botInfo = await session?.bot.internal._request('get_stranger_info', { user_id: userId });
      const botUid = botInfo?.data?.uid || '';

      const jsonObj = {
        page_name: "ai_group_service_agreement_pop_page",
        groupCode: Number(groupCode),
        botUin: Number(userId),
        botUid: botUid,
        screen: 1,
      };

      const encoded = encodeURIComponent(JSON.stringify(jsonObj));
      const url = `https://club.vip.qq.com/transfer?open_kuikly_info=${encoded}`;

      await session?.send(`官Bot全量主动配置链接（安卓和iOSQQ 9.2.90及以上版本可用。iOS也可以直接去设置里配置）：\n${url}`);
    })

}

```

## result
![1.png](doc/preview-image/1.png)
![2.png](doc/preview-image/2.png)
![3.png](doc/preview-image/3.png)
