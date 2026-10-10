import * as ImagePicker from "expo-image-picker";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
export async function choosePhoto(): Promise<string | undefined> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    quality: 1,
    base64: false,
  });
  if (result.canceled) return;
  const image = result.assets[0];
  if ((image.fileSize ?? 0) > 5 * 1024 * 1024)
    throw new Error("请选择 5 MB 以内的照片。");
  const context = ImageManipulator.manipulate(image.uri);
  if (image.width > 1000 || image.height > 1000)
    context.resize(
      image.width >= image.height ? { width: 1000 } : { height: 1000 },
    );
  const rendered = await context.renderAsync();
  const saved = await rendered.saveAsync({
    format: SaveFormat.JPEG,
    compress: 0.65,
    base64: true,
  });
  if (!saved.base64 || saved.base64.length > 930000)
    throw new Error("这张照片压缩后仍较大，请选择更小的图片。");
  return `data:image/jpeg;base64,${saved.base64}`;
}
