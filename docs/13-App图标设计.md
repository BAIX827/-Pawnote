# 爪记 App 图标

## 当前版本：中英文字形图标（2026-11-07）

用户确认采用带爪垫、铅笔与白色毛尖的圆润字形。默认中文版「爪记」使用主橘 #FF7A1A、米黄 #FFF3DF、白色毛尖、黄油黄 #FFD84D 铅笔和少量墨黑细节；英文版排作「Paw Note」。两版保留已确认示意图的质感和底板。

- 当前安装图标：`assets/pawnote-icon-final.png`，1024 × 1024 不透明 PNG。
- 英文独立文件：[`pawnote-icon-en-2026-11-07.png`](reference/图标历史/pawnote-icon-en-2026-11-07.png)，1024 × 1024 不透明 PNG。
- App、Web favicon、页面 BrandMark 与 Mac 打包共用默认中文资产，沿用现有配置路径。英文图标作为设计资产归档，设置页切换语言继续使用默认安装图标。
- 原始预览、生成提示词与处理方式见 [中英文字形图标生成记录](reference/中英文字形图标提示词-2026-11-07.md)。前一版橘色爪印保存在 [`pawnote-icon-orange-paw-2026-10-26.png`](reference/图标历史/pawnote-icon-orange-paw-2026-10-26.png)。
- Web 随 GitHub Pages 发布更新；Mac 版重新构建安装后更新；手机桌面图标随下一次原生构建安装更新。

## 历史版本：第一版橘色爪印贴纸放大版（2026-10-26）

用户要求与 App 页面的配色和风格统一，看过两版橘色候选后选择第一个，并要求爪印更大。最终使用第一版较粗的描边、较大趾垫和较长回钩，整体放大、减少橘色留白。主橘色满版背景、米黄填色、墨黑描边和短距离硬投影延续页面贴纸风格。

历史文件：`docs/reference/图标历史/pawnote-icon-orange-paw-2026-10-26.png`，1024 × 1024 PNG，不透明背景。该版曾用于 App、Web favicon 和 Mac，现由上方字形图标替换。

当时界面品牌栏通过 `src/components/BrandMark.tsx` 共用默认图标路径，桌面侧栏显示 44px、手机顶部显示 32px；本轮沿用该接入方式。

使用内置 imagegen 编辑第二版爪印，参考图是用户确认的融合最终版页面示意图；从两版橘色候选中选择第一版再整体放大。使用 sips 统一到 1024 × 1024，并检查 32、64 像素效果。此前较细描边的橘色候选 [`pawnote-icon-sticker.png`](reference/图标历史/pawnote-icon-sticker.png) 留作历史对照。完整提示词见 [橘色爪印贴纸生成记录](reference/图标贴纸提示词-2026-10-26.md)。

本次修改集中于页面视觉适配，先前公开图标筛查的范围与局限继续适用，见下方记录。

## 历史版本：黑白回旋爪印（2026-10-26）

用户要求重新设计爪子图标，尽量减少与市面产品雷同。延续白底黑色，四枚略有错落的实心趾垫配合一笔回旋的掌垫；掌垫的轮廓向内收成书写笔迹。原版日记横线与折角在新版本中收敛为同一条轮廓。

文件：[`pawnote-icon-signature.png`](reference/图标历史/pawnote-icon-signature.png)，1024 × 1024 PNG，不透明背景，现保留作历史对照。界面内的橘色 PawMark 继续用于导航及内容状态。

历史对照：[`pawnote-icon-outline.png`](reference/图标历史/pawnote-icon-outline.png)。新版由内置 imagegen 生成，再针对掌垫连笔进行一次编辑；使用 sips 统一到 1024 × 1024，另检查 32、64 和 180 像素效果。

## 公开图标初步对照

- [Rover 官方品牌资源](https://www.rover.com/blog/press/tab/media-resource/)：常规爪印与品牌文字的组合。
- [PetNote](https://appadvice.com/app/petnote-pet-health-care/1502371877)、[Every Wag](https://apps.apple.com/us/app/every-wag-dog-log-vet-care/id6747091313)：爪印与笔记本的组合，因此新版收起纸页与横线。
- [Animal Paw Swirl 模板](https://www.design.com/maker/logo/animal-paw-swirl-751453/details)、[Dog Paw Pottery](https://www.dogpawpottery.ca/)：爪印和回旋的结合已经存在。新版以四枚实心趾垫、单一开口掌垫和向内回收的短笔迹形成具体区别；仍存在同类视觉母题，全球唯一性需要额外检索。

公开图片检索仅是初步视觉筛查，未完成商标图形、应用商店全量图标或相似图像的正式查重。

## 生成提示词（内置 imagegen）

```text
Use case: logo-brand.
Asset type: final production app icon for 爪记 / Pawnote, a pet diary application. Design ONE striking, original monochrome paw emblem, square 1024 by 1024 image.
Primary request: redesign an unattractive generic paw with note lines into a compact sophisticated friendly bespoke brand symbol. Combine a paw and the gesture of writing in the actual geometry of the palm.
Design: four separate small solid black organic bean-like toe pads above one generously sized outlined palm. Give the four toes a carefully balanced, subtly asymmetric dancing rhythm: different lean angles and gently different sizes, two taller inner toes and two smaller outer toes, soft organic rounded contours. The lower palm is ONE confident thick black continuous rounded contour, roughly a soft triangular paw cushion, its lower-right outline flows inward into a short elegant handwritten curl ending as a single horizontal writing stroke INSIDE the palm. An open spiral-like return, roomy white counterspace. The curl and the outer palm are the SAME continuous stroke. Keep the curl very simple and legible. It should unmistakably read as a paw first, with a remembered personal handwritten mark as the distinctive second reading. Broad quiet curves, consistent optical weight, beautifully crafted negative space, gentle asymmetry, warmth.
Composition: centered optically, emblem fills about 68-72% width and height of the canvas, generous even white safe margin on all sides. Pure opaque white full-bleed square background and pure solid black symbol only, crisp vector-like edges. Smooth bold stroke that survives a 32px icon. Standalone finished emblem, single design.
Avoid: regular stock five-oval paw geometry, heart pad, map pin, literal notebook, folded page corner, stacked diary lines, pencil, speech bubble tail, letters, typography, words, borders, mockup, rounded square tile, drop shadows, gradient, gray, texture, rough brush, ultra thin lines. Do not copy any existing pet brand or app mark.
```

## 定向编辑提示词（以上一轮输出为输入）

```text
Use case: precise-object-edit / logo-brand. This image is the EDIT TARGET, a black and white pet diary app icon. Make ONE targeted geometric improvement to the palm. The palm's outer contour and the small handwritten inner curl must be ONE CONTINUOUS stroke: open the palm contour at its bottom-right, bend the right-hand outside stroke inward and leftward to form the existing short horizontal stroke and simple upward curl inside. Make a clear spacious WHITE channel between the outer bottom edge and the inward-returning stroke. The result is an open, handwritten, spiral paw pad like a single-storey handwritten lowercase g but reads as a paw, warm, minimal, bold. There must be absolutely no separate floating stroke inside a closed palm. Think one line drawing an outer rounded paw cushion then turning inward into its own small signature curl. Keep the four organic black toe pads, their layout and visual weight. Maintain pure flat black with pure opaque white background, no gray texture, no shadow. Make the outer palm slightly narrower and more compact, use a consistent bold rounded stroke weight. Center the entire emblem with 16% safe margin on all sides. Final standalone square 1024x1024 app icon, no presentation or text.
```

