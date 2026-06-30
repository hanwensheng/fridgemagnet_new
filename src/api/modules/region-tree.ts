import { CHINA_REGION_DATA } from '@/api/modules/china-region-data';
import type { CascaderOption } from '@nutui/nutui-react-taro';

interface FlatItem {
  code: string;
  name: string;
  parentCode: string;
}

function toFlatList(data: Record<string, [string, string]>): FlatItem[] {
  return Object.entries(data).map(([code, [name, parentCode]]) => ({
    code,
    name,
    parentCode,
  }));
}

export function buildRegionTree(): CascaderOption[] {
  const flat = toFlatList(CHINA_REGION_DATA);
  const map = new Map<string, CascaderOption & { _children: CascaderOption[] }>();
  const roots: CascaderOption[] = [];

  for (const item of flat) {
    map.set(item.code, {
      value: item.name,
      text: item.name,
      _children: [],
    });
  }

  for (const item of flat) {
    const node = map.get(item.code)!;
    const parent = map.get(item.parentCode);
    if (parent) {
      parent._children.push(node);
    } else {
      roots.push(node);
    }
  }

  function attachChildren(node: CascaderOption & { _children: CascaderOption[] }): CascaderOption {
    if (node._children.length > 0) {
      node.children = node._children.map(attachChildren);
    }
    delete (node as any)._children;
    return node;
  }

  const result = (roots as (CascaderOption & { _children: CascaderOption[] })[]).map(
    attachChildren,
  );

  return result.length === 1 && result[0].value === '中国' && result[0].children
    ? result[0].children
    : result;
}
