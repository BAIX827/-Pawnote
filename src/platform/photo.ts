import { t } from "../i18n/core";
import * as ImagePicker from "expo-image-picker";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
export async function choosePhoto(source: "library" | "camera" = "library"): Promise<string | undefined> {
  if (source === "camera") {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted)
      throw new Error(permission.canAskAgain
        ? "需要允许相机访问才能拍照，也可以从相册选择。"
        : "请在系统设置中允许相机访问，也可以从相册选择。");
  }
  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: ["images"],
    quality: 1,
    base64: false,
    exif: false,
  };
  const result = source === "camera"
    ? await ImagePicker.launchCameraAsync(options)
    : await ImagePicker.launchImageLibraryAsync(options);
  if (result.canceled) return;
  const image = result.assets[0];
  if ((image.fileSize ?? 0) > 25 * 1024 * 1024)
    throw new Error(t("请选择 25 MB 以内的照片。"));
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
    throw new Error(t("这张照片压缩后仍较大，请选择更小的图片。"));
  return `data:image/jpeg;base64,${saved.base64}`;
}
