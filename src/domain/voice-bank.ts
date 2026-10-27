import type { Category } from "./types";
import type { Temper } from "./temper";

// The on-device voice bank, docs/13 v3 (2026-10-27): each temper keeps its edge and its own kind of
// silly beat, the way the funny pet accounts on 小红书 and Instagram talk. Lines stay about the kind of
// event only, so nothing the owner didn't write turns into something that happened. {self} is what the
// pet calls itself (咪 / 汪 / its name), {owner} what it calls its owner.
export interface VoiceSet {
  /** The pet's reaction to this kind of event: five each, so daily entries walk through them. */
  line: Record<Category, string[]>;
  /** A short post to friends: four each. */
  social: Record<Category, string[]>;
  closers: string[];
  /** This temper's silly beat, also lent to pets that list it as a second personality. */
  silly: string[];
}
export type VoiceBank = Record<Temper, VoiceSet>;

export const zh: VoiceBank = {
  cool: {
    line: {
      sleep: ["{self}睡觉不是因为困，是在养精蓄锐。准备干什么？不告诉{owner}。", "睡姿是{self}自己设计的。拍照可以，点评驳回。", "这一觉{self}睡得很有尊严。叫醒服务暂停营业。", "{owner}以为{self}在睡觉。其实是在闭眼思考，思考的内容是睡觉。", "关于今天睡了多久，{self}拒绝透露。保持神秘是一种礼貌。"],
      snack: ["味道还行。{self}说“还行”，已经是最高评价。", "{self}吃得很克制。剩下那一口，是留给{owner}的面子。", "这顿饭{self}批准了。份量问题另案处理。", "别看{self}。{self}没有很喜欢，只是碗刚好空了。", "{owner}负责准备，{self}负责验收。今日验收：通过。"],
      bath: ["关于今天被强行洗澡一事，{self}保留追诉权。", "洗是洗干净了。原不原谅，等毛干了再议。", "这个香味不是{self}的风格。三天之内恢复原状，请知悉。", "{self}配合了。配合不代表同意，这两件事请分开记录。", "湿着的时候请勿拍照，{self}的形象管理还没下班。"],
      chaos: ["不是{self}弄的。是它自己想换个位置，{self}只是在旁边。", "结果{owner}已经看到了。动机属于个人隐私。", "{self}不道歉。下次可以考虑换个地方，只是考虑。", "本次事件{self}不予解释。{owner}可以自行脑补，补对了也不承认。", "原来的布局不合理，{self}只是提了点修改意见。"],
      walk: ["外面还行，比家里差一点。别告诉别人。", "{self}同意出门，纯粹是给{owner}面子。", "外面的事{self}都看过了。没什么，就是看看。", "路线{self}记下了。下次谁带路，还要再议。", "{owner}说今天玩得很开心。开心的是{owner}，{self}只是陪同。"],
      other: ["这件事{self}参与了，但不打算承认。", "{owner}觉得有意思，{self}就勉强同意它有意思。", "小事一件，{self}已阅。", "看起来是巧合，其实都在{self}的安排里。", "记下来可以，别让{self}知道是谁记的。"],
    },
    social: {
      sleep: ["今日营业状态：睡。有事留言，不保证回。", "睡觉中，打扰请先预约。", "睡醒了。没有想谁。", "醒着的时候也挺忙，只是忙的事不方便说。"],
      snack: ["吃过了。评价：还行。这已经很高了。", "零食的事{self}有意见，意见是还要。", "别问好不好吃，碗已经空了。", "今日试吃报告：通过。份量：有待改进。"],
      bath: ["洗了。别问感受。", "干净了，脾气还湿着。", "香是香了，原谅还在审批。", "今日清洁已完成，围观者请自觉离开🙄"],
      chaos: ["现场{owner}已经看过了，{self}就不补充了。", "这件事，{self}保留解释权。", "不是{self}干的。就算是，也有原因。", "布局优化已完成，不用谢。"],
      walk: ["出去了一趟。评价：可以再去，但别是今天。", "外面看过了。下次叫{self}，考虑一下。", "陪{owner}出了趟门，辛苦的是{self}。", "外面风有点大，{self}的毛有点乱，别拍。"],
      other: ["今天有件事，算{self}同意它发生了。", "日常一条，看完请安静离开。", "发这个不是为了让谁夸。夸也可以。", "今日无事。有事也不说。"],
    },
    closers: ["今天的意见就这些。", "此事到此为止。", "别看了，{self}没在笑。"],
    silly: ["比什么时候说过在意了。", "本次不予追究。下次就不一定了。", "{self}才没生气。（其实有一点）"],
  },
  clingy: {
    line: {
      sleep: ["睡觉前最后一眼要看见{owner}，这样{self}才睡得香。", "{self}睡着了也在想{owner}。梦里是{owner}，醒来还是。", "睡醒第一件事，找{owner}。第二件事，再找一遍。", "{self}睡觉的时候耳朵是开着的，专门听{owner}的声音。", "{self}不懂为什么要分开睡，{self}只想挨着{owner}。"],
      snack: ["{owner}给的就是最好吃的。别人给的也好吃，但不一样。", "{self}吃饭的时候要看着{owner}。{owner}在，饭就香。", "吃完了！{self}把碗舔得很干净，是想让{owner}夸{self}。", "好吃的要和{owner}一起吃。{owner}不吃的话，{self}帮忙吃掉。", "这顿饭{self}很满足。还想要一个摸摸头当甜点。"],
      bath: ["洗澡好可怕，但{owner}在旁边，{self}就还能撑住。", "洗完了。湿湿的{self}不好看，先躲一下，等{owner}来找。", "{self}不喜欢洗澡，但喜欢洗完被{owner}夸香香。", "被毛巾裹住的那一下，{self}原谅了全世界，主要是原谅了{owner}。", "洗澡的时候{self}一直看着{owner}，这样就不怕了。"],
      chaos: ["{self}只是想让{owner}多看{self}一会儿。方法可能不太对。", "{owner}别生气好不好。{self}已经在旁边乖乖坐好了。", "{self}先认错，再要一个摸摸头。顺序可以反过来。", "{self}一个人有点无聊，就……就这样了。", "{self}知道错了。虽然不知道错在哪，但{owner}不开心，就是错了。"],
      walk: ["出门最好的地方是，{owner}一直在{self}旁边。", "外面好多好玩的，但{self}最喜欢的是回头就能看见{owner}。", "走一会儿就回头看看{owner}跟上没有。跟上了，{self}好开心。", "{self}去哪都可以，只要旁边是{owner}。", "出门玩了！和{owner}一起！这句话{self}可以说一百遍。"],
      other: ["今天也是和{owner}待在一起的一天。{self}很喜欢这样的一天。", "只要和{owner}有关，{self}都想记住。", "{owner}在的时候，今天就是好的一天。不在的时候，{self}在等。", "这件小事里有{owner}，所以它是大事。", "生活破破烂烂，{owner}缝缝补补。{self}负责在旁边陪着。"],
    },
    social: {
      sleep: ["睡觉也要挨着{owner}，这是{self}的规矩。", "{self}醒了！{owner}在吗！在！好的继续睡。", "梦里是{owner}，醒来还是{owner}，赚到了。", "今天睡得很好，因为旁边有熟悉的味道。"],
      snack: ["今天吃得很好！{owner}给的！", "好吃的要和{owner}一起，这样才算数。", "碗舔干净了，等{owner}来夸。", "吃饱了，想要摸摸头当甜点😭"],
      bath: ["洗完了，正在等{owner}抱抱。", "今天勇敢地洗了澡，奖励是{owner}夸{self}。", "湿湿的{self}不好看，等干了再看。", "洗澡好可怕，还好有{owner}。"],
      chaos: ["{owner}还生气吗？{self}已经乖乖坐好了。", "今天有点小状况，{self}先认错再说。", "{self}只是太想{owner}了，方法不太对😭", "大家帮{self}劝劝{owner}，{self}知道错了。"],
      walk: ["出门了！和{owner}一起！", "外面很好玩，{owner}更好。", "今天回头看了{owner}好多次，每次都在。", "{self}去哪都可以，只要{owner}在旁边。"],
      other: ["今天也是和{owner}待在一起的一天。", "这件小事，{owner}陪{self}一起过的。", "{owner}在的一天，就是好的一天。", "今天也很喜欢{owner}。明天也是。"],
    },
    closers: ["{self}在门口等{owner}。", "今天也想黏着{owner}。", "摸摸头就更好了。"],
    silly: ["说到底，{self}就是想黏着{owner}。别的不重要。", "{self}不懂这些，{self}只知道{owner}在就好。", "{self}没有时间概念，只知道{owner}在的时候就是好时候。"],
  },
  goofy: {
    line: {
      sleep: ["{self}睡了好久！醒来以后忘了自己为什么睡。那就再睡一下！", "睡觉好舒服！为什么之前没人告诉{self}睡觉这么舒服！", "{self}没有在睡觉，是在充电。充满了！要去干嘛来着？", "梦里吃了好多好吃的。醒来一看碗是空的。梦骗{self}！", "睡醒了！先伸个懒腰，再睡一会儿！"],
      snack: ["好吃！这是{self}这辈子吃过最好吃的一顿！（和昨天一样）", "吃完了！碗为什么空了？是谁吃的？哦，是{self}。", "{self}的饭碗好像卡住了，一直在加载。", "吃饭的时候{self}很认真，认真到忘了嚼。", "{self}没有长胖，是饭碗变小了。"],
      bath: ["洗澡！为什么！{self}想了很久没想明白。然后就洗完了。", "身上全是泡泡！{self}以为要出去玩！结果不是！", "洗完以后香香的，香到{self}自己追着自己闻。", "{self}不知道为什么要洗澡，但{owner}很高兴，那{self}也高兴！", "洗澡的时候{self}一直在甩水，这是在帮忙！"],
      chaos: ["{self}也不知道发生了什么！好吧，是{self}。", "{owner}好像生气了，但{self}觉得还挺好玩的。要再来一次吗？", "{self}只是想帮忙！帮着帮着就这样了！", "这个东西本来就想坏掉，{self}只是让它梦想成真。", "{self}知道错了！但不知道错在哪！先打个滚吧！"],
      walk: ["出门！出门！出门！这件事值得说三遍！", "外面什么都好玩！这个也好玩！那个也好玩！{self}忙不过来！", "回家了，但{self}的心还在外面跑。", "出去玩了！{self}现在满脑子都是：明天还去吗！", "出去玩好开心！开心到{self}忘了是去哪玩的！"],
      other: ["今天发生了一件事！细节不重要！开心最重要！", "{self}也不知道为什么，反正今天很开心！", "这件事{self}做得很认真！虽然不知道认真在哪里！", "{self}的脑子里今天只有这件事！还有吃饭！", "{owner}说这很好笑，{self}也笑了！{self}不知道在笑什么！"],
    },
    social: {
      sleep: ["睡醒了！又是元气满满！先睡个回笼觉！", "今天睡得超级好！好到不想醒！", "{self}在充电！请勿打扰！充满了会自己跑出来！", "睡觉好舒服！大家一定要试试！"],
      snack: ["今天的饭史上最好吃！（和昨天一样）", "碗空了！谁吃的！哦是{self}！", "{self}的饭碗正在加载中……", "大家有好吃的消息吗！优先告诉{self}！"],
      bath: ["洗澡了！香香的！自己追着自己闻！", "以为是去玩水，结果是洗澡！被骗了！但香香的！", "洗完了！大家快来闻闻！", "今天帮{owner}甩了好多水！不用谢！"],
      chaos: ["今天有点小状况！但很好玩！", "{self}只是想帮忙！", "不是故意的！是很开心的不故意！", "这个东西本来就想坏掉，{self}帮它实现了。"],
      walk: ["出门！出门！出门！", "心里还没玩够，明天的名额先占上！", "外面什么都好玩！{self}忙不过来！", "回家了，心还在外面跑。"],
      other: ["今天又是开心的一天！细节不重要！", "{self}今天干了一件事！大家觉得厉害吗！", "不知道为什么，反正很开心！", "今天的{self}也是脑袋空空，很幸福！"],
    },
    closers: ["开心！", "还有吗！", "{self}还想再来一次！"],
    silly: ["{self}没有长胖，是窝变小了。", "虽然{self}看不太懂，但{self}先盖个章！", "等一下，{self}刚才要说什么来着？"],
  },
  drama: {
    line: {
      sleep: ["{self}今天累坏了，累到只能睡觉。（今天什么都没干）", "请所有人放轻脚步，本大王正在进行一场重要的睡眠。", "醒来那一刻，{self}以为过了一百年。（其实没多久）", "这一觉是{self}应得的。为了它，{self}忍受了很久的清醒。", "{self}的睡眠被打扰了吗？没有。但{self}要提前抗议一下。"],
      snack: ["这一口，{self}等了一辈子。（从上一顿开始算）", "吃到的那一刻{self}差点哭出来。太好吃了，也太少了。", "{self}宣布，这是本年度最佳一餐。下一顿出来之前有效。", "{owner}只给了这么一点。{self}很伤心，但{self}吃完了。", "这顿饭来得太晚，{self}差点饿晕在地上。（没有）"],
      bath: ["今天，本大王经历了一场浩劫（洗澡）。", "{self}在水里写好了遗书。然后洗完了。遗书先收起来。", "这次洗澡的委屈，{self}要记一辈子。（记到下一顿饭）", "{self}现在很香，但{self}的心是湿的。", "{owner}说只是洗个澡。只是？？{self}的尊严也一起被冲走了。"],
      chaos: ["在{owner}眼里这是闯祸。在{self}眼里，这是一场艺术创作。", "{owner}的表情好可怕，{self}决定先晕倒一下。（没晕）", "真相只有{self}知道，{self}决定带进坟墓。（其实就是手滑）", "{self}是被冤枉的！证据？证据就是{self}的眼神！", "这件事要是拍成电视剧，能拍四十集。主角是{self}。"],
      walk: ["今天{self}走了好远好远。（在{owner}眼里没多远）", "外面的世界太精彩，{self}差点就不回来了。（回来了）", "出门是{self}今天的高光时刻，请大家记住这一天。", "{self}回家的时候，腿已经不是自己的了。（还是自己的）", "下次出门请提前三天通知{self}，{self}要准备造型。"],
      other: ["今天这一幕，{self}愿意称之为本周最佳。", "这件事要是拍成戏，{self}一定是主角。", "事情很小，但{self}的感受很大。", "全体注意，{self}有一件小事要宣布。宣布完了。", "这件事{self}会记很久的。（记到明天早上）"],
    },
    social: {
      sleep: ["本大王正在睡觉，全体静音。", "醒来以为过了一百年，其实没多久。", "今天累坏了。（什么都没干）", "为了这一觉，{self}清醒了很久。辛苦。"],
      snack: ["宣布：本年度最佳一餐。下一顿出来前有效。", "太好吃了，也太少了😭", "这顿饭来得太晚，{self}差点饿晕。（没有）", "吃完了，{self}的人生又圆满了一次。"],
      bath: ["今天经历了一场浩劫（洗澡）。", "香是香了，心是湿的。", "遗书已写好。洗完了，先收起来。", "这次的委屈要记一辈子。（记到下一顿）"],
      chaos: ["这不是闯祸，这是艺术。", "{self}是被冤枉的！证据是{self}的眼神！", "真相就是：手滑。别说出去。", "这件事能拍四十集，主角是{self}。"],
      walk: ["外面太精彩，{self}差点不回来了。（回来了）", "今天的高光时刻：出门。请记住这一天。", "下次出门请提前三天通知，{self}要准备造型。", "回家了，腿已经不是自己的了。（还是）"],
      other: ["今日剧情已更新，主角是{self}。", "本周名场面候选一件，请投票。", "事情很小，感受很大。", "全体注意，{self}宣布完了。"],
    },
    closers: ["掌声可以响起来了。", "本场演出到此结束。", "（其实也还好）"],
    silly: ["{self}写好的遗书，这次先收起来。", "{self}决定这辈子都不理{owner}了。（坚持了三秒）", "全剧终。（明天还有）"],
  },
  curious: {
    line: {
      sleep: ["{self}研究了一下，睡着以后时间会变快。明天再验证一次。", "人类为什么要在固定的地方睡？{self}哪里都能睡。", "实验结果：闭上眼睛，世界就不见了。睁开眼睛，又回来了。", "{self}在想，{owner}睡觉的时候会不会也在想{self}。先睡一觉再研究。", "睡前观察：困是从眼皮开始的。结论待补充。"],
      snack: ["为什么同一个碗，有时候有饭有时候没有？{self}还在找规律。", "{self}分析了一下这个味道。结论：还要再吃一次才能确定。", "{owner}的碗和{self}的碗，里面为什么不一样？{self}有理由怀疑。", "实验记录：吃完了，碗会空。重复验证中。", "{self}发现，饭香的时候{owner}会笑。这两件事一定有关系。"],
      bath: ["人类为什么喜欢把{self}弄湿再弄干？这个流程{self}看不懂。", "研究发现：洗完澡，{self}闻起来不像{self}了。那现在{self}是谁？", "水是从上面来的。下次要研究一下怎么关掉它。", "{owner}洗完以后一直闻{self}。原来人类的鼻子也会好奇。", "关于洗澡，{self}有十个问题。第一个是：为什么。"],
      chaos: ["{self}只是想知道，这个东西掉下去会怎么样。现在知道了。", "实验成功！虽然{owner}好像不这么认为。", "这不是捣乱，是采样。样本：一个。结论：会坏。", "{self}想研究一下它的结构，所以先把它拆开了。", "{owner}为什么生气？{self}只是完成了一个小实验。人类真难懂。"],
      walk: ["外面好多{self}没见过的东西，每一样都值得研究。", "{self}发现，外面的风和家里的风不一样。原因待查。", "人类走路为什么一定要走直线？{self}觉得不合理。", "出去一趟，问题比答案多。很好，明天有事做了。", "外面的世界很大，{self}今天只研究了一小块。"],
      other: ["这件事{self}观察过了，结论还在路上。", "人类好像很在意这件事。{self}不太懂，但记下来了。", "为什么会这样？{self}打算明天再研究一次。", "{self}今天又看不懂人类了。是好事。", "观察记录一条：{owner}笑了。原因不明。"],
    },
    social: {
      sleep: ["实验结果：闭眼世界就没了，睁眼又回来了。", "睡着以后时间会变快，有人研究过吗？", "人类为什么只在一个地方睡？不理解。", "睡前观察：困是从眼皮开始的。"],
      snack: ["同一个碗，有时有饭有时没有，规律是什么？", "这个味道需要再吃一次才能确定。", "为什么{owner}的碗和{self}的不一样？", "实验记录：吃完了碗会空。重复验证中。"],
      bath: ["洗完闻起来不像{self}了，那现在{self}是谁？", "关于洗澡，{self}有十个问题。第一个是为什么。", "人类为什么要把{self}弄湿再弄干？", "水是从上面来的。下次研究怎么关掉。"],
      chaos: ["这不是捣乱，是采样。", "实验成功。{owner}好像不这么认为。", "现在知道它掉下去会怎么样了。", "{owner}为什么生气？有懂人类的吗？"],
      walk: ["外面的风和家里的不一样，原因待查。", "出去一趟，问题比答案多。", "人类走路为什么要走直线？", "外面很大，今天只研究了一小块。"],
      other: ["今日观察一条，欢迎补充。", "新发现一件，原理暂时不明。", "今天又看不懂人类了。", "{owner}笑了，原因不明。"],
    },
    closers: ["有谁也好奇这个？", "结论明天公布。", "实验继续。"],
    silly: ["两脚兽的行为，{self}还在研究。是发生什么事了吗？", "这个问题困扰了{self}整整一分钟。", "{self}已经发帖求助了：两脚兽为什么要这样？"],
  },
  calm: {
    line: {
      sleep: ["今日工作：睡觉。完成度：超额。无其他补充。", "睡了。醒了。又睡了。以上。", "{self}对睡觉没有意见。对叫醒有意见。", "人生的意义是什么？{self}不知道，{self}先睡了。", "休息是{self}的本职工作，{self}一直很敬业。"],
      snack: ["吃了。味道正常，心情正常。", "饭点准时到岗，吃完准时下班。", "{self}吃饭不急。急也没用，碗就这么大。", "今日进食一次，状态稳定。", "好吃的{self}慢慢吃。不好吃的，也慢慢吃。"],
      bath: ["今日汇报：洗澡一次。情绪：稳定。毛：湿。", "洗就洗吧。{self}的命也是命，但{self}认了。", "洗澡这件事，{self}选择不挣扎。挣扎也要洗。", "洗完了。现在需要点时间，把毛晾干，也把心情晾干。", "流程走完了。下一项：躺着。"],
      chaos: ["事情已经这样了。{self}的态度是：嗯。", "{owner}有{owner}的看法，{self}有{self}的。双方暂不沟通。", "经过很短，{self}的解释更短：没有。", "东西坏了，{self}没坏。今天还算顺利。", "{self}没有乱来，{self}只是在做自己。"],
      walk: ["外出一次。外面一切正常。", "出去走了走。不快不慢，刚好。", "外面挺好，家里也挺好。{self}都可以。", "今日外勤已完成，可以下班了。", "出门的意义在于回家。{self}已回家。"],
      other: ["发生了。挺好。", "今天的事，{self}已知晓。", "不急，慢慢过。", "无事发生。有事也是小事。", "{self}的精神状态：良好。（真的）"],
    },
    social: {
      sleep: ["今日工作：睡觉。完成度：超额。", "睡了，醒了，又睡了。以上。", "休息是本职工作，一直很敬业。", "对睡觉无意见，对叫醒有意见。"],
      snack: ["吃了。味道正常。心情正常。", "饭点准时到岗。", "今日进食一次，状态稳定。", "吃饭不急，碗就这么大。"],
      bath: ["洗澡一次。情绪稳定。毛：湿。", "洗就洗吧，认了。", "不挣扎，挣扎也要洗。", "流程已走完。下一项：躺着。"],
      chaos: ["事情已经这样了。嗯。", "东西坏了，{self}没坏。", "双方暂不沟通。", "没有乱来，只是在做自己。"],
      walk: ["外勤一次，一切正常。", "不快不慢，刚好。", "出门的意义在于回家。已回家。", "外面挺好，家里也挺好。"],
      other: ["发生了。挺好。", "今日无事。", "小事，已阅。", "精神状态：良好。别问。"],
    },
    closers: ["以上。", "无其他补充。", "下班。"],
    silly: ["今日汇报完毕，申请带薪躺平。", "{self}的命也是命。今天也认了。", "精神状态：良好。别问。"],
  },
  shy: {
    line: {
      sleep: ["睡觉的时候最安全了。{self}缩成一小团，谁也找不到。", "{self}睡着了……其实没完全睡着，耳朵还在站岗。", "能安安静静睡一觉，{self}觉得今天很成功。", "睡醒的时候，熟悉的声音还在。{self}就放心了。", "{self}想再睡一会儿。外面的事，等{self}准备好再说。"],
      snack: ["{self}心里很想吃，身体先观察了一下。确认安全，才吃。", "吃饭的时候{self}很小声。好吃这件事，也小声说。", "这个……挺好吃的。{self}就悄悄说一下。", "{self}吃得很慢，要一边吃一边确认周围。", "吃完了。{self}想说谢谢，说出来的是很小的一声。"],
      bath: ["洗澡的时候{self}心里很乱，身体只想缩起来。", "洗完了，{self}要先躲一会儿。不是生气，是需要缓缓。", "{self}今天很勇敢，洗澡的时候只抖了一点点。（抖了很多）", "现在最想要一点安静。等{self}缓过来，{owner}可以再靠近一点。", "叫{self}的声音，{self}都听见了。只是身体还不太想动。"],
      chaos: ["{self}不是故意的……{self}也被吓到了。", "这件事……能不能小声说。{self}已经知道了。", "{self}本来只想看一眼。看着看着，就这样了。", "{owner}的声音一大，{self}就想躲起来。可以温柔一点吗。", "{self}心里很抱歉。身体先躲到安全的地方了。"],
      walk: ["外面好大。{self}心里很想看，腿有自己的想法。", "出门了。{self}紧紧跟着{owner}，这样就不怕了。", "今天在外面，{self}比上次勇敢了一点点。真的只有一点点。", "外面的声音好多。{self}一个一个地听，慢慢就习惯了。", "回到家，{self}心里松了一口气。外面很好，家里更好。"],
      other: ["……其实{self}有点在意这件事。", "{owner}记下来了，那{self}也悄悄记住。", "今天发生了一件小事，{self}想了很久。", "{self}心里很开心！不过表面上看不太出来。", "这件事{self}只敢小声说：还不错。"],
    },
    social: {
      sleep: ["缩成一小团睡了一觉，很安全。", "睡着了……耳朵还在站岗。", "安安静静睡了一觉，今天很成功。", "醒来声音还在，放心了。"],
      snack: ["这个……挺好吃的。小声说一下。", "确认安全以后才吃的。好吃。", "一边吃一边确认周围，吃完了。", "想说谢谢，说出来是很小的一声。"],
      bath: ["洗完了，先躲一会儿缓缓。", "只抖了一点点。（抖了很多）", "叫{self}的声音都听见了，只是身体还不想动。", "今天很勇敢，是比较小的那种勇敢。"],
      chaos: ["不是故意的……{self}也被吓到了。", "能小声说吗……已经知道了。", "本来只想看一眼的。", "心里很抱歉，身体先躲起来了。"],
      walk: ["心里想看，腿有自己的想法。", "跟紧{owner}就不怕了。", "比上次勇敢了一点点。真的只有一点点。", "外面很好，家里更好。"],
      other: ["小声发一条……今天还不错。", "鼓起勇气发一下今天。", "心里很开心，表面看不出来。", "想了很久，还是发一下吧。"],
    },
    closers: ["先让{self}想一会儿。", "小声说的话，也想被听见。", "……就这样。"],
    silly: ["{self}心里很开心！不过身体还在犹豫。", "心说好的，腿说不要。今天听腿的。", "{self}已经很勇敢了，是勇敢里比较小的那种。"],
  },
};

// English is written fresh, not translated (docs/13 §4): deadpan cats, lowercase earnest clingy pets,
// one CAPS burst for goofy and drama, flat reports for calm. The pet says "I"; no {self} here.
export const en: VoiceBank = {
  cool: {
    line: {
      sleep: ["I was not sleeping. I was conserving power for something {owner} doesn't need to know about.", "My sleeping position was designed by me. Photos are allowed. Feedback is not.", "That nap was conducted with dignity. Wake-up service is suspended.", "{owner} thinks I was asleep. I was thinking with my eyes closed. About sleeping.", "How long I slept is classified. Mystery is a form of good manners."],
      snack: ["It was fine. From me, \"fine\" is the highest rating available.", "I ate with restraint. The last bite was left out of respect for {owner}.", "Meal approved. Portion size will be handled as a separate matter.", "Don't look at me. I didn't love it. The bowl just happened to be empty.", "{owner} handles preparation. I handle inspection. Today: passed."],
      bath: ["Regarding today's forced bath, I reserve the right to take further action.", "Yes, I'm clean. Forgiveness will be reviewed once I'm dry.", "This scent is not my style. It will be corrected within three days.", "I cooperated. Cooperation is not consent. Please file these separately.", "No photos while I'm wet. Image management is still on duty."],
      chaos: ["I didn't do it. It wanted to be somewhere else. I was merely nearby.", "{owner} has seen the result. My motives are private.", "I won't apologise. Next time I may consider a different spot. May.", "I decline to explain. {owner} is free to guess. A correct guess will not be confirmed.", "The old layout was flawed. I offered some edits."],
      walk: ["Outside was acceptable. Slightly worse than home. Don't spread that around.", "I agreed to go out purely as a favour to {owner}.", "I've seen what's out there. Nothing special. I was just looking.", "I've memorised the route. Who leads next time is still under discussion.", "{owner} says it was a lovely outing. {owner} enjoyed it. I attended."],
      other: ["I was involved in this. I won't be admitting to it.", "{owner} finds this interesting, so I'll allow it to be interesting.", "Minor event. Noted.", "It looks like a coincidence. It was all part of my plan.", "You may write this down. Just don't tell me who wrote it."],
    },
    social: {
      sleep: ["Current status: asleep. Leave a message. No promises.", "Sleeping. Appointments required for disturbances.", "Woke up. Didn't miss anyone.", "I'm busy when I'm awake too. It's just not your business."],
      snack: ["Ate. Rating: fine. That's generous.", "I have notes on the snacks. The note is: more.", "Don't ask if it was good. The bowl is empty.", "Taste test: passed. Portion: needs work."],
      bath: ["Bathed. Don't ask.", "Clean fur. Damp mood.", "I smell nice. Forgiveness is pending approval.", "Cleaning complete. Spectators may leave 🙄"],
      chaos: ["{owner} has seen the scene. I have nothing to add.", "I reserve the right to explain this later. Or never.", "Wasn't me. And if it was, I had reasons.", "Layout improvements complete. You're welcome."],
      walk: ["Went out. Would go again. Not today.", "Seen the outdoors. Ask me again some time. I'll think about it.", "Took {owner} for an outing. Exhausting for me.", "It was windy. My fur is not camera-ready."],
      other: ["Something happened today. I allowed it.", "Daily update. Read quietly and move on.", "I'm not posting this for compliments. Compliments are accepted.", "Nothing happened today. If it did, I'm not saying."],
    },
    closers: ["That's all my comments for today.", "This matter is closed.", "Stop looking. I'm not smiling."],
    silly: ["When did I ever say I cared.", "No further action this time. Next time, who knows.", "I'm not upset. (A little.)"],
  },
  clingy: {
    line: {
      sleep: ["the last thing i want to see before sleep is {owner}. then i sleep the best.", "i was asleep and still thinking about {owner}. {owner} in the dream. {owner} when i woke up.", "first thing after waking up: find {owner}. second thing: find {owner} again.", "my ears stay on when i sleep. they're listening for {owner}.", "i don't understand sleeping apart. i just want to be next to {owner}."],
      snack: ["food from {owner} is the best food. other food is good too. but not the same.", "i like to see {owner} while i eat. food tastes better that way.", "finished! i licked the bowl clean so {owner} would say good job.", "good food is for sharing with {owner}. if {owner} doesn't want it, i'll help.", "i'm full and happy. a head pat for dessert would be perfect."],
      bath: ["baths are scary. but {owner} was there, so i could do it.", "bath's over. wet me isn't cute, so i'm hiding until {owner} comes to find me.", "i don't like baths. i like being told i smell nice after.", "the moment the towel went round me, i forgave everything. mostly {owner}.", "i kept my eyes on {owner} the whole bath. that made it less scary."],
      chaos: ["i just wanted {owner} to look at me a bit longer. wrong method maybe.", "please don't be cross, {owner}. i'm already sitting nicely.", "i'll say sorry first, then ask for a head pat. or the other way round.", "i got a bit bored. so. this happened.", "i know i did wrong. i don't know what. but {owner} isn't happy, so it was wrong."],
      walk: ["best part of going out: {owner} right there next to me.", "so much fun outside. my favourite part is turning round and seeing {owner}.", "every few steps i check {owner} is still there. still there. so happy.", "i'll go anywhere, as long as {owner} is next to me.", "went out!! with {owner}!! i could say that a hundred times."],
      other: ["another day with {owner}. my favourite kind of day.", "if it's about {owner}, i want to remember it.", "when {owner} is here, it's a good day. when {owner} isn't, i wait.", "{owner} was part of this, so it's a big deal.", "life is a bit of a mess. {owner} patches it up. i sit next to them while they do."],
    },
    social: {
      sleep: ["sleeping next to {owner}. house rule.", "i'm awake! is {owner} here? yes! ok back to sleep.", "{owner} in the dream and {owner} when i woke up. lucky.", "slept really well. the familiar smell helped."],
      snack: ["ate so well today! {owner} gave it to me!", "good food counts more with {owner} around.", "bowl licked clean. waiting for my good job.", "full. would like a head pat for dessert 🥺"],
      bath: ["bath done. waiting for a cuddle.", "i was brave in the bath. my reward is {owner} saying so.", "wet me isn't cute. please look later.", "baths are scary. good thing {owner} was there."],
      chaos: ["is {owner} still cross? i'm sitting nicely now.", "a small situation today. sorry first, details later.", "i just missed {owner} too much. wrong method 🥺", "can someone tell {owner} i'm sorry."],
      walk: ["went out! with {owner}!", "outside is fun. {owner} is better.", "checked {owner} was there a lot today. always there.", "anywhere is fine if {owner} is next to me."],
      other: ["another day with {owner}.", "{owner} was with me for this one.", "a day with {owner} is a good day.", "liked {owner} a lot today. tomorrow too."],
    },
    closers: ["i'll be by the door.", "sticking close to {owner} today.", "a head pat would make it better."],
    silly: ["at the end of the day i just want to be next to {owner}. that's it.", "i don't understand much. i understand that {owner} is here.", "i don't really know what time is. i know when {owner} is here, and that's the good time."],
  },
  goofy: {
    line: {
      sleep: ["Slept for AGES. Woke up and forgot why I was sleeping. So I slept a bit more.", "Sleep is amazing! Why did nobody tell me sleep is this amazing!", "I wasn't sleeping. I was charging. Fully charged! What was I going to do?", "Ate so much in my dream. Woke up. Bowl empty. The dream lied!", "Awake! Big stretch! Small nap!"],
      snack: ["Best meal of my LIFE. (Same as yesterday.)", "Finished! Why is the bowl empty? Who ate it? Oh. Me.", "My food bowl appears to be buffering.", "I ate so seriously that I forgot to chew.", "I haven't got bigger. The bowl has got smaller."],
      bath: ["Bath! WHY! I thought about it for ages. Then it was over.", "Bubbles everywhere! I thought we were playing! We were not!", "I smell so good I'm chasing my own smell.", "No idea why baths happen, but {owner} looked happy, so I'm happy!", "I shook water everywhere. That was me helping!"],
      chaos: ["I don't know what happened! Okay. It was me.", "{owner} looks cross, but honestly it was fun. Again?", "I was helping! Then the helping went like this!", "That thing wanted to break. I made its dream come true.", "I know I did something wrong! No idea what! Rolling over just in case!"],
      walk: ["OUT! OUT! OUT! Worth saying three times!", "Everything outside is fun! This! That! I can't keep up!", "We're home. My brain is still out there running.", "We went out! Now my whole brain is: again tomorrow?", "So much fun I forgot where we went!"],
      other: ["Something happened today! Details unimportant! Happy!", "Not sure why, but today was a great day!", "I did this very seriously! Not sure which part was serious!", "My brain had one thing in it today. This. Also dinner.", "{owner} said it was funny, so I laughed! No idea what at!"],
    },
    social: {
      sleep: ["Awake! Full of energy! Time for a second nap!", "Slept SO well. Too well to wake up.", "Charging. Do not disturb. Will come out when full.", "Sleep is great. Highly recommend."],
      snack: ["Best dinner in history. (Same as yesterday.)", "Bowl empty! Who did this! Oh, me!", "My bowl is loading...", "Any food news? Tell me first!"],
      bath: ["Bath! I smell amazing! Chasing my own smell!", "Thought it was playtime. It was bath time. Tricked! But I smell nice!", "All clean! Come and sniff!", "Helped {owner} by shaking water everywhere. No need to thank me."],
      chaos: ["Small situation today! Very fun though!", "I was only trying to help!", "Not on purpose! Very happily not on purpose!", "That thing wanted to break. I helped."],
      walk: ["OUT OUT OUT!", "Not done playing. Saving my spot for tomorrow!", "Everything outside is fun! Too much fun!", "Home now. Brain still outside."],
      other: ["Another happy day! Details unimportant!", "I did a thing today! Impressive, right?", "No idea why. Very happy.", "Head empty. Very content."],
    },
    closers: ["Happy!", "Is there more?", "Can we do it again?"],
    silly: ["I haven't got bigger. My bed has got smaller.", "I didn't understand it, but I approved it anyway!", "Hang on, what was I saying?"],
  },
  drama: {
    line: {
      sleep: ["Today exhausted me so much I could only sleep. (I did nothing today.)", "Everyone, quiet please. I am conducting a very important sleep.", "When I woke, I thought a hundred years had passed. (They had not.)", "I earned that sleep. I endured being awake for it.", "Was my sleep interrupted? No. I'm protesting in advance."],
      snack: ["I waited my whole life for this bite. (Since the last meal.)", "I almost cried when I tasted it. Too good. Too small.", "I declare this the best meal of the year. Valid until the next one.", "{owner} gave me THIS much. I was heartbroken. I finished it.", "Dinner was so late I nearly fainted on the floor. (I did not.)"],
      bath: ["Today I suffered (bath).", "I wrote my last words in the water. Then the bath ended. Filed for later.", "I will remember this injustice forever. (Until dinner.)", "I smell lovely. My heart is still wet.", "{owner} says it was \"just a bath\". JUST? My dignity went down the drain too."],
      chaos: ["To {owner}, this is a mess. To me, it is art.", "{owner}'s face was terrifying, so I decided to faint. (I didn't.)", "Only I know the truth, and I'll take it to my grave. (My paw slipped.)", "I've been framed! Evidence? Look at my eyes!", "This could be a forty-episode drama. I'm the lead."],
      walk: ["I went so, so far today. (Not far, according to {owner}.)", "The world outside was so dazzling I almost didn't come back. (I came back.)", "Going out was the highlight of my day. Please remember this date.", "By the time we got home, my legs were no longer mine. (Still mine.)", "Next outing, please give me three days' notice. I need to prepare a look."],
      other: ["I'd call this scene the best of the week.", "If this were a film, I would be the lead.", "Small event. Enormous feelings.", "Attention, everyone. I have a small announcement. That was it.", "I'll remember this for a long time. (Until breakfast.)"],
    },
    social: {
      sleep: ["Sleeping. Silence, please.", "Woke up thinking a century had passed. It had not.", "Exhausted today. (Did nothing.)", "Stayed awake ages to earn this nap. Hard life."],
      snack: ["Announcement: meal of the year. Valid until the next one.", "Too good. Too small 😭", "Dinner was so late I nearly fainted. (Didn't.)", "Ate. Life complete. Again."],
      bath: ["Today I suffered (bath).", "I smell nice. My heart is wet.", "Last words written. Bath over. Filed for later.", "Never forgetting this. (Until dinner.)"],
      chaos: ["Not a mess. Art.", "I've been framed! Look at my eyes!", "The truth: paw slipped. Tell no one.", "Forty-episode drama. Starring me."],
      walk: ["Outside was so dazzling I nearly didn't come back. (Came back.)", "Today's highlight: going out. Mark the date.", "Next time, three days' notice please. I need a look.", "Home. Legs no longer mine. (Still mine.)"],
      other: ["New episode out. I'm the lead.", "Scene of the week nominee. Vote now.", "Small thing. Big feelings.", "Attention, everyone. That's the announcement."],
    },
    closers: ["You may applaud now.", "That concludes tonight's performance.", "(It was fine, actually.)"],
    silly: ["My last words can go back in the drawer for now.", "I have decided never to speak to {owner} again. (Lasted three seconds.)", "The end. (More tomorrow.)"],
  },
  curious: {
    line: {
      sleep: ["Research suggests time goes faster while I'm asleep. Will retest tomorrow.", "Why do humans sleep in the same place every night? I can sleep anywhere.", "Result: close eyes, the world disappears. Open them, it's back. Remarkable.", "Does {owner} think about me while asleep? Will sleep on it first.", "Pre-sleep observation: sleepiness starts in the eyelids. More data needed."],
      snack: ["Why is the same bowl sometimes full and sometimes empty? Still looking for the pattern.", "I analysed the flavour. Conclusion: one more serving needed to be sure.", "Why is there different food in {owner}'s bowl? I have my suspicions.", "Log: when I finish, the bowl is empty. Repeating to confirm.", "When dinner smells good, {owner} smiles. These must be connected."],
      bath: ["Why do humans make me wet and then make me dry? I don't follow the process.", "Finding: after the bath I don't smell like me. So who am I now?", "The water came from above. Next time I'll work out how to switch it off.", "{owner} kept sniffing me afterwards. Human noses get curious too.", "I have ten questions about baths. The first is: why."],
      chaos: ["I just wanted to know what happens when it falls. Now I know.", "Experiment successful. {owner} seems to disagree.", "Not chaos. Sampling. Sample size: one. Finding: it breaks.", "I wanted to study how it was built, so I took it apart first.", "Why is {owner} cross? I only ran a small experiment. Humans are hard to read."],
      walk: ["So many things outside I'd never seen. Each one needs investigating.", "Outside wind is different from inside wind. Cause unknown.", "Why must humans walk in straight lines? Seems unnecessary.", "More questions than answers. Good. Tomorrow is booked.", "The outside is big. I covered a small part of it today."],
      other: ["I observed this. Conclusions pending.", "Humans seem to care about this a lot. I don't get it, but I've noted it.", "Why did this happen? I'll investigate again tomorrow.", "Couldn't understand humans again today. Exciting.", "Observation: {owner} laughed. Cause unknown."],
    },
    social: {
      sleep: ["Result: close eyes, world gone. Open eyes, world back.", "Does time speed up while you sleep? Has anyone studied this?", "Why do humans only sleep in one place?", "Sleepiness begins in the eyelids. Noted."],
      snack: ["Same bowl, sometimes full, sometimes empty. What's the pattern?", "Need one more serving to confirm the flavour.", "Why is {owner}'s bowl different from mine?", "Log: finished food, bowl empty. Repeating."],
      bath: ["I don't smell like me after the bath. Who am I now?", "Ten questions about baths. First one: why.", "Why make me wet just to make me dry?", "Water comes from above. Investigating the off switch."],
      chaos: ["Not chaos. Sampling.", "Experiment successful. {owner} disagrees.", "Now I know what happens when it falls.", "Why is {owner} cross? Any human experts here?"],
      walk: ["Outside wind is different. Cause unknown.", "Went out. Came back with more questions.", "Why do humans walk in straight lines?", "Big outside. Covered a small bit today."],
      other: ["One observation today. Additions welcome.", "New finding. Mechanism unclear.", "Didn't understand humans again today.", "{owner} laughed. Cause unknown."],
    },
    closers: ["Anyone else curious?", "Results tomorrow.", "Experiment continues."],
    silly: ["Still studying human behaviour. Did something happen?", "This question puzzled me for an entire minute.", "I've posted on the forum: why do humans do this?"],
  },
  calm: {
    line: {
      sleep: ["Today's task: sleep. Completion: above target. Nothing further.", "Slept. Woke. Slept again. End of report.", "No issues with sleeping. Some issues with waking.", "What is the meaning of life? Unclear. Sleeping first.", "Rest is my core duty. I take it very seriously."],
      snack: ["Ate. Taste normal. Mood normal.", "Clocked in at mealtime. Clocked out after.", "No rush eating. Rushing won't make the bowl bigger.", "One meal consumed. Status stable.", "Good food, I eat slowly. Average food, also slowly."],
      bath: ["Report: one bath. Mood: stable. Fur: wet.", "Fine. Bath. I've accepted it.", "I chose not to struggle. Struggling also ends in a bath.", "Done. Now drying the fur, and the mood.", "Procedure complete. Next item: lying down."],
      chaos: ["It is what it is. My position: hm.", "{owner} has a view. I have a view. Talks are suspended.", "The event was short. My explanation is shorter: none.", "The thing broke. I didn't. A decent day.", "I wasn't misbehaving. I was being myself."],
      walk: ["One outing. Everything outside normal.", "Went for a walk. Not fast, not slow. Fine.", "Outside is fine. Inside is fine. I'm fine either way.", "Field work complete. Clocking off.", "The point of going out is coming home. I am home."],
      other: ["It happened. Fine.", "Event acknowledged.", "No rush. One day at a time.", "Nothing happened. If it did, it was small.", "Mental state: good. (Really.)"],
    },
    social: {
      sleep: ["Task: sleep. Completion: above target.", "Slept, woke, slept. End of report.", "Rest is my core duty.", "No issues with sleep. Issues with waking."],
      snack: ["Ate. Normal taste. Normal mood.", "On time for meals.", "One meal. Status stable.", "No rush. The bowl is the size it is."],
      bath: ["One bath. Mood stable. Fur wet.", "Bath. Accepted.", "Didn't struggle. Would've been a bath anyway.", "Procedure done. Next: lying down."],
      chaos: ["It is what it is.", "The thing broke. I didn't.", "Talks suspended.", "Not misbehaving. Being myself."],
      walk: ["One outing. All normal.", "Not fast, not slow. Fine.", "Point of going out: coming home. Home.", "Outside fine. Inside fine."],
      other: ["It happened. Fine.", "Nothing today.", "Small thing. Noted.", "Mental state: good. Don't ask."],
    },
    closers: ["End of report.", "Nothing further to add.", "Clocking off."],
    silly: ["Report filed. Requesting paid lying-down leave.", "Accepted my fate again today.", "Mental state: good. Don't ask."],
  },
  shy: {
    line: {
      sleep: ["Sleep is the safest time. I curl into a small ball and nobody can find me.", "I was asleep... mostly. My ears stayed on guard.", "A quiet sleep. Today was a success.", "When I woke, the familiar sounds were still there. That helped.", "I'd like a bit more sleep. Outside things can wait until I'm ready."],
      snack: ["My heart wanted it. My body checked first. Safe. Then I ate.", "I eat quietly. I'll say it was good quietly too.", "It was... quite nice. Just saying that softly.", "I eat slowly, checking around between bites.", "Finished. I meant to say thank you. It came out as a very small sound."],
      bath: ["During the bath my heart was a mess and my body only wanted to be small.", "Bath's over. I need to hide for a bit. Not angry. Just recovering.", "I was very brave. I only shook a tiny bit. (I shook a lot.)", "I'd like some quiet now. When I'm ready, {owner} can come a bit closer.", "I heard {owner} calling. My body just didn't want to move yet."],
      chaos: ["I didn't mean it... it scared me too.", "Could we talk about this quietly. I already know.", "I only wanted to look. Then it went like this.", "When {owner}'s voice gets loud, I want to hide. Softer, please?", "I'm sorry inside. My body went somewhere safe first."],
      walk: ["Outside is very big. My heart wanted to look. My legs had other ideas.", "We went out. I stayed close to {owner}, so it wasn't scary.", "I was a tiny bit braver than last time. Really, only tiny.", "So many sounds outside. I listened to them one at a time.", "Home again. I let out a big breath. Outside is nice. Home is nicer."],
      other: ["...I actually care about this a little.", "{owner} wrote it down, so I'll quietly remember it too.", "A small thing happened. I thought about it for a long time.", "I'm very happy inside! It just doesn't show much.", "I'll only say this softly: it was nice."],
    },
    social: {
      sleep: ["Curled up small and slept. Safe.", "Asleep... ears still on guard.", "A quiet sleep. A successful day.", "Woke up, sounds still there. Relieved."],
      snack: ["It was... nice. Quietly saying so.", "Ate once it felt safe. Good.", "Checked around between bites. Finished.", "Tried to say thank you. Came out very small."],
      bath: ["Bath done. Hiding for a bit to recover.", "Only shook a tiny bit. (A lot.)", "Heard {owner} calling. Body not ready to move.", "Brave today. The smaller kind of brave."],
      chaos: ["Didn't mean it... it scared me too.", "Can we say it quietly... I know.", "Only wanted to look.", "Sorry inside. Body hid first."],
      walk: ["Heart wanted to look. Legs disagreed.", "Stayed close to {owner}. Not scary.", "A tiny bit braver than last time. Tiny.", "Outside is nice. Home is nicer."],
      other: ["Posting quietly... today was okay.", "Being brave and posting today.", "Happy inside. Doesn't show.", "Thought about it a long time. Posting anyway."],
    },
    closers: ["Let me think a moment.", "Quiet words want to be heard too.", "...that's all."],
    silly: ["My heart said yes. My legs said no. I listened to my legs.", "Very happy inside! My body is still deciding.", "I was brave. The small kind of brave."],
  },
};
