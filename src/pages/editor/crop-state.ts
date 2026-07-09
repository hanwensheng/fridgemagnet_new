/**
 * 裁剪状态共享内存存储
 *
 * 仅在当前小程序运行实例内有效，刷新页面/退出小程序自动清空。
 * 用于 editor ↔ crop 页面之间传递裁剪结果和编辑状态，
 * 不持久化到 Storage，避免跨会话残留。
 */
interface CropState {
  originalImageUrl: string;
  transform: Record<string, any>;
  imgW: number;
  imgH: number;
}

export interface CropResult {
  itemIndex: number;
  imageUrl?: string; // 预览图（花边框贴合）
  uploadUrl?: string; // 上传图（工作区实物比例）
  clear?: boolean;
}

const cropStateMap = new Map<number, CropState>();
let _cropResult: CropResult | null = null;

/** 获取指定 itemIndex 的裁剪编辑状态 */
export function getCropState(itemIndex: number): CropState | undefined {
  return cropStateMap.get(itemIndex);
}

/** 保存指定 itemIndex 的裁剪编辑状态 */
export function setCropState(itemIndex: number, state: CropState): void {
  cropStateMap.set(itemIndex, state);
}

/** 删除指定 itemIndex 的裁剪编辑状态 */
export function removeCropState(itemIndex: number): void {
  cropStateMap.delete(itemIndex);
}

/** 清空所有裁剪编辑状态 */
export function clearAllCropState(): void {
  cropStateMap.clear();
}

/** 获取裁剪结果（crop → editor 传递） */
export function getCropResult(): CropResult | null {
  return _cropResult;
}

/** 设置裁剪结果 */
export function setCropResult(result: CropResult | null): void {
  _cropResult = result;
}
