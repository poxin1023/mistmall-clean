import type { TagKey } from './tags'

export type ProductSpecOption = {
  id: string            // 規格選項代號（系統用，不給一般客戶看）
  name: string          // 規格顯示名稱（例如：葡萄）
  stock: number         // 庫存
  priceDelta: number    // 加價/減價（沒有差異就 0）
}

export type ProductSpec = {
  specName: string      // 規格類型名稱（此專案用「口味/規格」即可）
  options: ProductSpecOption[]
}

export type Product = {
  id: string
  name: string
  tag: TagKey
  price: number | null
  image: string
  shortDesc: string
  specs: ProductSpec[]
}

/**
 * 工具：給「還沒補齊規格」的商品，先塞一個最小可用規格，避免詳情頁爆掉
 * 之後你補資料只要改 specs 內容，不需要再改任何頁面邏輯。
 */
function placeholderSpecs(): ProductSpec[] {
  return [
    {
      specName: '規格',
      options: [{ id: 'opt_default', name: '預設規格', stock: 0, priceDelta: 0 }]
    }
  ]
}

export const PRODUCTS: Product[] = [
  // 促銷商品（你原本已完成）
  {
    id: 'sp2s_pod_bundle',
    name: 'SP2S 買10送1 20送2',
    tag: 'pod_v1',
    price: 300,
    image: '/products/1 (14).jpg',
    shortDesc: '一代煙彈',
    specs: [
      {
        specName: '口味',
        options: [
          { id: 'sp2s_pod_bundle_o01', name: '葡萄', stock: 891, priceDelta: 0 },
          { id: 'sp2s_pod_bundle_o02', name: '百香果', stock: 714, priceDelta: 0 },
          { id: 'sp2s_pod_bundle_o03', name: '冰棍', stock: 1086, priceDelta: 0 },
          { id: 'sp2s_pod_bundle_o04', name: '蜜桃烏龍', stock: 932, priceDelta: 0 },
          { id: 'sp2s_pod_bundle_o05', name: '沙士啤酒', stock: 845, priceDelta: 0 },
          { id: 'sp2s_pod_bundle_o06', name: '芒樂', stock: 1003, priceDelta: 0 },
          { id: 'sp2s_pod_bundle_o07', name: '莓果', stock: 768, priceDelta: 0 },
          { id: 'sp2s_pod_bundle_o08', name: '青蘋果', stock: 1191, priceDelta: 0 },
          { id: 'sp2s_pod_bundle_o09', name: '芒果', stock: 883, priceDelta: 0 },
          { id: 'sp2s_pod_bundle_o10', name: '西瓜', stock: 1047, priceDelta: 0 },
          { id: 'sp2s_pod_bundle_o11', name: '青梅', stock: 726, priceDelta: 0 },
          { id: 'sp2s_pod_bundle_o12', name: '藍莓', stock: 912, priceDelta: 0 },
          { id: 'sp2s_pod_bundle_o13', name: '綠豆', stock: 1174, priceDelta: 0 },
          { id: 'sp2s_pod_bundle_o14', name: '檸檬海鹽', stock: 834, priceDelta: 0 },
          { id: 'sp2s_pod_bundle_o15', name: '鳳梨', stock: 1092, priceDelta: 0 },
          { id: 'sp2s_pod_bundle_o16', name: '元氣蜜桃', stock: 958, priceDelta: 0 },
          { id: 'sp2s_pod_bundle_o17', name: '可樂', stock: 742, priceDelta: 0 },
          { id: 'sp2s_pod_bundle_o18', name: '寶礦力', stock: 1160, priceDelta: 0 },
          { id: 'sp2s_pod_bundle_o19', name: '荔枝', stock: 881, priceDelta: 0 },
          { id: 'sp2s_pod_bundle_o20', name: '哈密瓜', stock: 1019, priceDelta: 0 },
          { id: 'sp2s_pod_bundle_o21', name: '紅顏知己', stock: 795, priceDelta: 0 },
          { id: 'sp2s_pod_bundle_o22', name: '南極冰', stock: 1106, priceDelta: 0 },
          { id: 'sp2s_pod_bundle_o23', name: '鐵觀音', stock: 864, priceDelta: 0 },
          { id: 'sp2s_pod_bundle_o24', name: '清涼薄荷', stock: 1200, priceDelta: 0 },
          { id: 'sp2s_pod_bundle_o25', name: '利梭納(黑佳麗)', stock: 739, priceDelta: 0 },
          { id: 'sp2s_pod_bundle_o26', name: '冰礦泉茉莉', stock: 982, priceDelta: 0 },
          { id: 'sp2s_pod_bundle_o27', name: '冰礦泉', stock: 1054, priceDelta: 0 },
          { id: 'sp2s_pod_bundle_o28', name: '凍檸冰棍', stock: 890, priceDelta: 0 },
          { id: 'sp2s_pod_bundle_o29', name: '茉莉綠茶', stock: 1133, priceDelta: 0 },
          { id: 'sp2s_pod_bundle_o30', name: '冰礦泉荔枝', stock: 778, priceDelta: 0 },
          { id: 'sp2s_pod_bundle_o31', name: '白葡萄凍檸茶', stock: 946, priceDelta: 0 },
          { id: 'sp2s_pod_bundle_o32', name: '檸檬紅茶', stock: 1185, priceDelta: 0 }
        ]
      }
    ]
  },

  // 一代煙彈
  {
    id: 'ilia_v1_pod',
    name: 'ILIA一代',
    tag: 'pod_v1',
    price: 260,
    image: '/products/1 (2).png',
    shortDesc: '一代煙彈',
    specs: [
      {
        specName: '口味',
        options: [
          { id: 'ilia_v1_pod_o01', name: '可爾', stock: 842, priceDelta: 0 },
          { id: 'ilia_v1_pod_o02', name: '葡萄', stock: 1136, priceDelta: 0 },
          { id: 'ilia_v1_pod_o03', name: '百香', stock: 791, priceDelta: 0 },
          { id: 'ilia_v1_pod_o04', name: '荔枝', stock: 1048, priceDelta: 0 },
          { id: 'ilia_v1_pod_o05', name: '芭樂', stock: 926, priceDelta: 0 },
          { id: 'ilia_v1_pod_o06', name: '西瓜', stock: 1182, priceDelta: 0 },
          { id: 'ilia_v1_pod_o07', name: '綠豆', stock: 735, priceDelta: 0 },
          { id: 'ilia_v1_pod_o08', name: '白桃烏龍', stock: 987, priceDelta: 0 },
          { id: 'ilia_v1_pod_o09', name: '老冰棍', stock: 1094, priceDelta: 0 },
          { id: 'ilia_v1_pod_o10', name: '薄荷', stock: 864, priceDelta: 0 },
          { id: 'ilia_v1_pod_o11', name: '可樂', stock: 1200, priceDelta: 0 },
          { id: 'ilia_v1_pod_o12', name: '草莓', stock: 902, priceDelta: 0 },
          { id: 'ilia_v1_pod_o13', name: '冰泉', stock: 776, priceDelta: 0 },
          { id: 'ilia_v1_pod_o14', name: '鳳梨', stock: 1159, priceDelta: 0 },
          { id: 'ilia_v1_pod_o15', name: '龍井', stock: 833, priceDelta: 0 },
          { id: 'ilia_v1_pod_o16', name: '芒果', stock: 1071, priceDelta: 0 },
          { id: 'ilia_v1_pod_o17', name: '哈密瓜', stock: 948, priceDelta: 0 },
          { id: 'ilia_v1_pod_o18', name: '茉草', stock: 721, priceDelta: 0 },
          { id: 'ilia_v1_pod_o19', name: '青蘋', stock: 1116, priceDelta: 0 },
          { id: 'ilia_v1_pod_o20', name: '檸檬', stock: 889, priceDelta: 0 },
          { id: 'ilia_v1_pod_o21', name: '莓果', stock: 1035, priceDelta: 0 },
          { id: 'ilia_v1_pod_o22', name: '冰心蜜桃', stock: 964, priceDelta: 0 },
          { id: 'ilia_v1_pod_o23', name: '奇異果', stock: 782, priceDelta: 0 },
          { id: 'ilia_v1_pod_o24', name: '藍莓', stock: 1168, priceDelta: 0 },
          { id: 'ilia_v1_pod_o25', name: '沙士', stock: 901, priceDelta: 0 },
          { id: 'ilia_v1_pod_o26', name: '南極冰', stock: 1087, priceDelta: 0 },
          { id: 'ilia_v1_pod_o27', name: '雪碧', stock: 744, priceDelta: 0 },
          { id: 'ilia_v1_pod_o28', name: '鐵觀音', stock: 1193, priceDelta: 0 },
          { id: 'ilia_v1_pod_o29', name: '寶礦力', stock: 856, priceDelta: 0 }
        ]
      }
    ]
  },
  {
    id: 'lana_pod',
    name: 'LANA',
    tag: 'pod_v1',
    price: 240,
    image: '/products/eXQzVJL1QDp2A1Ec4ufH.jpg',
    shortDesc: '一代煙彈',
    specs: [
      {
        specName: '口味',
        options: [
          { id: 'lana_pod_o01', name: '百香果', stock: 1034, priceDelta: 0 },
          { id: 'lana_pod_o02', name: '鳳梨', stock: 876, priceDelta: 0 },
          { id: 'lana_pod_o03', name: '草莓牛奶', stock: 1142, priceDelta: 0 },
          { id: 'lana_pod_o04', name: '冰橙', stock: 795, priceDelta: 0 },
          { id: 'lana_pod_o05', name: '冰紅茶', stock: 1091, priceDelta: 0 },
          { id: 'lana_pod_o06', name: '冰藍莓', stock: 942, priceDelta: 0 },
          { id: 'lana_pod_o07', name: '冰荔枝', stock: 1187, priceDelta: 0 },
          { id: 'lana_pod_o08', name: '青蘋果', stock: 731, priceDelta: 0 },
          { id: 'lana_pod_o09', name: '深海冰泉', stock: 1006, priceDelta: 0 },
          { id: 'lana_pod_o10', name: '樹梅果', stock: 864, priceDelta: 0 },
          { id: 'lana_pod_o11', name: '水蜜桃', stock: 1124, priceDelta: 0 },
          { id: 'lana_pod_o12', name: '西瓜冰', stock: 987, priceDelta: 0 },
          { id: 'lana_pod_o13', name: '雪碧', stock: 758, priceDelta: 0 },
          { id: 'lana_pod_o14', name: '冰可樂', stock: 1169, priceDelta: 0 },
          { id: 'lana_pod_o15', name: '鐵觀音', stock: 821, priceDelta: 0 },
          { id: 'lana_pod_o16', name: '老冰棍', stock: 1048, priceDelta: 0 },
          { id: 'lana_pod_o17', name: '綠豆', stock: 739, priceDelta: 0 },
          { id: 'lana_pod_o18', name: '奇異果', stock: 1195, priceDelta: 0 },
          { id: 'lana_pod_o19', name: '多汁葡萄', stock: 903, priceDelta: 0 },
          { id: 'lana_pod_o20', name: '芒果', stock: 1108, priceDelta: 0 },
          { id: 'lana_pod_o21', name: '烏龍茶', stock: 781, priceDelta: 0 },
          { id: 'lana_pod_o22', name: '薄荷口香糖', stock: 965, priceDelta: 0 },
          { id: 'lana_pod_o23', name: '芭樂', stock: 1076, priceDelta: 0 },
          { id: 'lana_pod_o24', name: '蘋果葡萄柚', stock: 832, priceDelta: 0 },
          { id: 'lana_pod_o25', name: '草莓西瓜', stock: 1183, priceDelta: 0 },
          { id: 'lana_pod_o26', name: '蔓越莓汁', stock: 746, priceDelta: 0 },
          { id: 'lana_pod_o27', name: '綜合水果', stock: 1019, priceDelta: 0 },
          { id: 'lana_pod_o28', name: '哈密瓜', stock: 1151, priceDelta: 0 },
          { id: 'lana_pod_o29', name: '龍井', stock: 788, priceDelta: 0 },
          { id: 'lana_pod_o30', name: '彩虹糖', stock: 962, priceDelta: 0 },
          { id: 'lana_pod_o31', name: '沙士', stock: 1200, priceDelta: 0 },
          { id: 'lana_pod_o32', name: '紅酒', stock: 879, priceDelta: 0 },
          { id: 'lana_pod_o33', name: '芒果百香果', stock: 1064, priceDelta: 0 }
        ]
      }
    ]
  },
  {
    id: 'tutx_pod',
    name: 'TUTX TUT煙彈',
    tag: 'pod_v1',
    price: 250,
    image: '/products/1 (3).png',
    shortDesc: '一代煙彈',
    specs: [
      {
        specName: '口味',
        options: [
          { id: 'tutx_pod_o01', name: '葡萄', stock: 1089, priceDelta: 0 },
          { id: 'tutx_pod_o02', name: '西瓜', stock: 742, priceDelta: 0 },
          { id: 'tutx_pod_o03', name: '百香', stock: 931, priceDelta: 0 },
          { id: 'tutx_pod_o04', name: '荔枝', stock: 1164, priceDelta: 0 },
          { id: 'tutx_pod_o05', name: '蜜桃', stock: 879, priceDelta: 0 },
          { id: 'tutx_pod_o06', name: '鳳梨', stock: 1047, priceDelta: 0 },
          { id: 'tutx_pod_o07', name: '芭樂', stock: 793, priceDelta: 0 },
          { id: 'tutx_pod_o08', name: '蘋果', stock: 1121, priceDelta: 0 },
          { id: 'tutx_pod_o09', name: '哈密瓜', stock: 986, priceDelta: 0 },
          { id: 'tutx_pod_o10', name: '藍莓', stock: 1189, priceDelta: 0 },
          { id: 'tutx_pod_o11', name: '鐵觀音', stock: 835, priceDelta: 0 },
          { id: 'tutx_pod_o12', name: '檸檬茶', stock: 901, priceDelta: 0 },
          { id: 'tutx_pod_o13', name: '寶礦力', stock: 1096, priceDelta: 0 },
          { id: 'tutx_pod_o14', name: '凍檸可樂', stock: 768, priceDelta: 0 },
          { id: 'tutx_pod_o15', name: '沙士', stock: 1200, priceDelta: 0 },
          { id: 'tutx_pod_o16', name: '薄荷', stock: 884, priceDelta: 0 },
          { id: 'tutx_pod_o17', name: '原味', stock: 731, priceDelta: 0 },
          { id: 'tutx_pod_o18', name: '芒果', stock: 1153, priceDelta: 0 },
          { id: 'tutx_pod_o19', name: '蔓越莓', stock: 972, priceDelta: 0 },
          { id: 'tutx_pod_o20', name: '莓果', stock: 846, priceDelta: 0 },
          { id: 'tutx_pod_o21', name: '水梨', stock: 1078, priceDelta: 0 },
          { id: 'tutx_pod_o22', name: '龍井', stock: 790, priceDelta: 0 },
          { id: 'tutx_pod_o23', name: '冰棍', stock: 1139, priceDelta: 0 },
          { id: 'tutx_pod_o24', name: '南極冰', stock: 958, priceDelta: 0 }
        ]
      }
    ]
  },
  {
    id: 'kis5_pod',
    name: 'kis5',
    tag: 'pod_v1',
    price: 90,
    image: '/products/1 (4).png',
    shortDesc: '一代煙彈',
    specs: [
      {
        specName: '口味',
        options: [
          { id: 'kis5_pod_o01', name: '葡萄氣汁', stock: 1038, priceDelta: 0 },
          { id: 'kis5_pod_o02', name: '愛文芒果', stock: 876, priceDelta: 0 },
          { id: 'kis5_pod_o03', name: '冰鎮西瓜', stock: 1124, priceDelta: 0 },
          { id: 'kis5_pod_o04', name: '美式咖啡', stock: 741, priceDelta: 0 },
          { id: 'kis5_pod_o05', name: '蜜桃烏龍茶', stock: 1093, priceDelta: 0 },
          { id: 'kis5_pod_o06', name: '貴妃荔枝', stock: 957, priceDelta: 0 },
          { id: 'kis5_pod_o07', name: '紅心芭樂', stock: 1186, priceDelta: 0 },
          { id: 'kis5_pod_o08', name: '微醺櫻桃', stock: 823, priceDelta: 0 },
          { id: 'kis5_pod_o09', name: '抹茶梅果', stock: 904, priceDelta: 0 },
          { id: 'kis5_pod_o10', name: '冷泡冰茶', stock: 1071, priceDelta: 0 },
          { id: 'kis5_pod_o11', name: '麥根沙士', stock: 768, priceDelta: 0 },
          { id: 'kis5_pod_o12', name: '超薄荷', stock: 1200, priceDelta: 0 },
          { id: 'kis5_pod_o13', name: '寶礦力', stock: 891, priceDelta: 0 },
          { id: 'kis5_pod_o14', name: '鳳梨碎碎', stock: 734, priceDelta: 0 },
          { id: 'kis5_pod_o15', name: '百香雙響炮', stock: 1158, priceDelta: 0 },
          { id: 'kis5_pod_o16', name: '藍莓泡泡糖', stock: 982, priceDelta: 0 },
          { id: 'kis5_pod_o17', name: '加州蘋果', stock: 846, priceDelta: 0 },
          { id: 'kis5_pod_o18', name: '經典綠豆沙', stock: 1107, priceDelta: 0 },
          { id: 'kis5_pod_o19', name: '爆汁蜜桃', stock: 927, priceDelta: 0 },
          { id: 'kis5_pod_o20', name: '哈密瓜奶昔', stock: 1049, priceDelta: 0 },
          { id: 'kis5_pod_o21', name: '檸檬海鹽', stock: 789, priceDelta: 0 },
          { id: 'kis5_pod_o22', name: '龍井春茶', stock: 1172, priceDelta: 0 },
          { id: 'kis5_pod_o23', name: '零度可樂', stock: 865, priceDelta: 0 }
        ]
      }
    ]
  },
  {
    id: 'troy_v1_pod',
    name: 'TROY一代',
    tag: 'pod_v1',
    price: 200,
    image: '/products/1 (1).jpg',
    shortDesc: '一代煙彈',
    specs: [
      {
        specName: '口味',
        options: [
          { id: 'troy_v1_pod_o01', name: '一般葡萄', stock: 1087, priceDelta: 0 },
          { id: 'troy_v1_pod_o02', name: '養樂多', stock: 742, priceDelta: 0 },
          { id: 'troy_v1_pod_o03', name: '極冰葡萄', stock: 1194, priceDelta: 0 },
          { id: 'troy_v1_pod_o04', name: '一般草莓', stock: 865, priceDelta: 0 },
          { id: 'troy_v1_pod_o05', name: '廚師蜜桃', stock: 1031, priceDelta: 0 },
          { id: 'troy_v1_pod_o06', name: '廚師芒果', stock: 914, priceDelta: 0 },
          { id: 'troy_v1_pod_o07', name: '廚師紅茶', stock: 1168, priceDelta: 0 }
        ]
      }
    ]
  },

  // 一代主機
  {
    id: 'sp2_pro_light_device',
    name: 'SP2 pro發光機',
    tag: 'device_v1',
    price: 500,
    image: '/products/1 (13).jpg',
    shortDesc: '一代主機',
    specs: [
      {
        specName: '顏色',
        options: [
          { id: 'sp2_pro_light_device_o01', name: '星空藍', stock: 1046, priceDelta: 0 },
          { id: 'sp2_pro_light_device_o02', name: '忍者白', stock: 812, priceDelta: 0 },
          { id: 'sp2_pro_light_device_o03', name: '森林綠', stock: 1189, priceDelta: 0 },
          { id: 'sp2_pro_light_device_o04', name: '海棠粉', stock: 735, priceDelta: 0 },
          { id: 'sp2_pro_light_device_o05', name: '武士黑', stock: 1098, priceDelta: 0 },
          { id: 'sp2_pro_light_device_o06', name: '鋼黑', stock: 874, priceDelta: 0 },
          { id: 'sp2_pro_light_device_o07', name: '甜心粉', stock: 1200, priceDelta: 0 },
          { id: 'sp2_pro_light_device_o08', name: '綠閃星', stock: 963, priceDelta: 0 },
          { id: 'sp2_pro_light_device_o09', name: '艷玫瑰', stock: 791, priceDelta: 0 },
          { id: 'sp2_pro_light_device_o10', name: '不挑色', stock: 1157, priceDelta: 0 }
        ]
      }
    ]
  },
  {
    id: 'sp2s_titanium_device_v3',
    name: 'SP2S鈦色主機最新三代',
    tag: 'device_v1',
    price: 500,
    image: '/products/1 (15).jpg',
    shortDesc: '一代主機',
    specs: [
      {
        specName: '顏色',
        options: [
          { id: 'sp2s_titanium_device_v3_o01', name: '鈦黑', stock: 1094, priceDelta: 0 },
          { id: 'sp2s_titanium_device_v3_o02', name: '鈦藍', stock: 742, priceDelta: 0 },
          { id: 'sp2s_titanium_device_v3_o03', name: '鈦銀', stock: 1186, priceDelta: 0 },
          { id: 'sp2s_titanium_device_v3_o04', name: '鈦粉', stock: 861, priceDelta: 0 },
          { id: 'sp2s_titanium_device_v3_o05', name: '鈦紅', stock: 1037, priceDelta: 0 },
          { id: 'sp2s_titanium_device_v3_o06', name: '鈦金色', stock: 1200, priceDelta: 0 },
          { id: 'sp2s_titanium_device_v3_o07', name: '鈦白', stock: 914, priceDelta: 0 },
          { id: 'sp2s_titanium_device_v3_o08', name: '鈦綠', stock: 776, priceDelta: 0 },
          { id: 'sp2s_titanium_device_v3_o09', name: '不挑色', stock: 1119, priceDelta: 0 }
        ]
      }
    ]
  },
  {
    id: 'sp_general_device',
    name: 'SP一般單桿',
    tag: 'device_v1',
    price: 500,
    image: '/products/1 (2).jpg',
    shortDesc: '一代主機',
    specs: [
      {
        specName: '顏色',
        options: [
          { id: 'sp_general_device_o01', name: '銀灰', stock: 1042, priceDelta: 0 },
          { id: 'sp_general_device_o02', name: '紫紅', stock: 781, priceDelta: 0 },
          { id: 'sp_general_device_o03', name: '丁香紫', stock: 1188, priceDelta: 0 },
          { id: 'sp_general_device_o04', name: '湖水色', stock: 836, priceDelta: 0 },
          { id: 'sp_general_device_o05', name: '碧波粉綠', stock: 1097, priceDelta: 0 },
          { id: 'sp_general_device_o06', name: '白色', stock: 1200, priceDelta: 0 },
          { id: 'sp_general_device_o07', name: '黑色', stock: 914, priceDelta: 0 },
          { id: 'sp_general_device_o08', name: '海軍粉', stock: 768, priceDelta: 0 },
          { id: 'sp_general_device_o09', name: '不挑色', stock: 1126, priceDelta: 0 }
        ]
      }
    ]
  },
  {
    id: 'ilia_leather_device_v1_v2',
    name: 'ILIA一、二代皮革主機',
    tag: 'device_v1',
    price: 550,
    image: '/products/1 (19).jpg',
    shortDesc: '一代主機',
    specs: [
      {
        specName: '顏色',
        options: [
          { id: 'ilia_leather_device_v1_v2_o01', name: '幕雪白', stock: 1083, priceDelta: 0 },
          { id: 'ilia_leather_device_v1_v2_o02', name: '幻影黑', stock: 742, priceDelta: 0 },
          { id: 'ilia_leather_device_v1_v2_o03', name: '銀河灰', stock: 1191, priceDelta: 0 },
          { id: 'ilia_leather_device_v1_v2_o04', name: '櫻花粉', stock: 865, priceDelta: 0 },
          { id: 'ilia_leather_device_v1_v2_o05', name: '古銅綠', stock: 1014, priceDelta: 0 },
          { id: 'ilia_leather_device_v1_v2_o06', name: '愛馬仕橙', stock: 1200, priceDelta: 0 },
          { id: 'ilia_leather_device_v1_v2_o07', name: '布紋粉', stock: 934, priceDelta: 0 },
          { id: 'ilia_leather_device_v1_v2_o08', name: '布紋灰', stock: 781, priceDelta: 0 },
          { id: 'ilia_leather_device_v1_v2_o09', name: '布紋黑', stock: 1136, priceDelta: 0 },
          { id: 'ilia_leather_device_v1_v2_o10', name: '布紋綠', stock: 846, priceDelta: 0 },
          { id: 'ilia_leather_device_v1_v2_o11', name: '布紋藍', stock: 1178, priceDelta: 0 },
          { id: 'ilia_leather_device_v1_v2_o12', name: '奶油藍', stock: 902, priceDelta: 0 },
          { id: 'ilia_leather_device_v1_v2_o13', name: '奶油紫', stock: 1059, priceDelta: 0 },
          { id: 'ilia_leather_device_v1_v2_o14', name: '奶油灰', stock: 768, priceDelta: 0 },
          { id: 'ilia_leather_device_v1_v2_o15', name: '牛仔藍', stock: 1107, priceDelta: 0 },
          { id: 'ilia_leather_device_v1_v2_o16', name: '不挑色', stock: 989, priceDelta: 0 }
        ]
      }
    ]
  },
  {
    id: 'ilia_general_device',
    name: 'ILIA一般單桿主機',
    tag: 'device_v1',
    price: 500,
    image: '/products/1 (9).jpg',
    shortDesc: '一代主機',
    specs: [
      {
        specName: '顏色',
        options: [
          { id: 'ilia_general_device_o01', name: '騎士黑', stock: 1096, priceDelta: 0 },
          { id: 'ilia_general_device_o02', name: '初雪白', stock: 742, priceDelta: 0 },
          { id: 'ilia_general_device_o03', name: '紫晶', stock: 1184, priceDelta: 0 },
          { id: 'ilia_general_device_o04', name: '銀灰', stock: 861, priceDelta: 0 },
          { id: 'ilia_general_device_o05', name: '金粉', stock: 1033, priceDelta: 0 },
          { id: 'ilia_general_device_o06', name: '青綠', stock: 1200, priceDelta: 0 },
          { id: 'ilia_general_device_o07', name: '寶寶粉', stock: 914, priceDelta: 0 },
          { id: 'ilia_general_device_o08', name: '寶寶藍', stock: 776, priceDelta: 0 },
          { id: 'ilia_general_device_o09', name: '天空藍', stock: 1118, priceDelta: 0 },
          { id: 'ilia_general_device_o10', name: '不挑色', stock: 987, priceDelta: 0 }
        ]
      }
    ]
  },

  // 五代哩亞
  {
    id: 'ilia_v5_bundle',
    name: 'ILIA5代 哩亞5代 買四盒送主機',
    tag: 'ilia_v5',
    price: 300,
    image: '/products/1 (12).jpg',
    shortDesc: '五代哩亞',
    specs: [
      {
        specName: '口味',
        options: [
          { id: 'ilia_v5_bundle_o01', name: '脆青蘋果', stock: 1048, priceDelta: 0 },
          { id: 'ilia_v5_bundle_o02', name: '超A薄荷', stock: 791, priceDelta: 0 },
          { id: 'ilia_v5_bundle_o03', name: '蜜藏荔枝', stock: 1186, priceDelta: 0 },
          { id: 'ilia_v5_bundle_o04', name: '翡翠葡萄', stock: 865, priceDelta: 0 },
          { id: 'ilia_v5_bundle_o05', name: '紅心芭樂', stock: 1019, priceDelta: 0 },
          { id: 'ilia_v5_bundle_o06', name: '手打檸檬', stock: 742, priceDelta: 0 },
          { id: 'ilia_v5_bundle_o07', name: '激爽可樂', stock: 1198, priceDelta: 0 },
          { id: 'ilia_v5_bundle_o08', name: '清甜藍莓', stock: 934, priceDelta: 0 },
          { id: 'ilia_v5_bundle_o09', name: '多肉芒果', stock: 1107, priceDelta: 0 },
          { id: 'ilia_v5_bundle_o10', name: '百香果汁', stock: 876, priceDelta: 0 },
          { id: 'ilia_v5_bundle_o11', name: '爆汁蜜桃', stock: 1063, priceDelta: 0 },
          { id: 'ilia_v5_bundle_o12', name: '激情薄荷', stock: 1200, priceDelta: 0 },
          { id: 'ilia_v5_bundle_o13', name: '冰鐵觀音', stock: 821, priceDelta: 0 },
          { id: 'ilia_v5_bundle_o14', name: '老冰棍兒', stock: 978, priceDelta: 0 },
          { id: 'ilia_v5_bundle_o15', name: '沙甜蜜瓜', stock: 739, priceDelta: 0 },
          { id: 'ilia_v5_bundle_o16', name: '冰鎮西瓜', stock: 1154, priceDelta: 0 },
          { id: 'ilia_v5_bundle_o17', name: '檸檬百香', stock: 892, priceDelta: 0 },
          { id: 'ilia_v5_bundle_o18', name: '麝香葡萄', stock: 1086, priceDelta: 0 },
          { id: 'ilia_v5_bundle_o19', name: '高山茶韻', stock: 764, priceDelta: 0 },
          { id: 'ilia_v5_bundle_o20', name: '激爽雪碧', stock: 1191, priceDelta: 0 },
          { id: 'ilia_v5_bundle_o21', name: '極冰蘇打', stock: 946, priceDelta: 0 },
          { id: 'ilia_v5_bundle_o22', name: '南極冰', stock: 1128, priceDelta: 0 },
          { id: 'ilia_v5_bundle_o23', name: '茉草', stock: 803, priceDelta: 0 }
        ]
      }
    ]
  },
  {
    id: 'relx6_compatible_45',
    name: 'Relx 悅刻6代通用4、5代',
    tag: 'ilia_v5',
    price: 150,
    image: '/products/1 (5).jpg',
    shortDesc: '五代哩亞',
    specs: [
      {
        specName: '口味',
        options: [
          { id: 'relx6_compatible_45_o01', name: '清涼西瓜（單顆）', stock: 1089, priceDelta: 0 },
          { id: 'relx6_compatible_45_o02', name: '勁爽薄荷（單顆）', stock: 742, priceDelta: 0 },
          { id: 'relx6_compatible_45_o03', name: '勁涼龍井（單顆）', stock: 1196, priceDelta: 0 },
          { id: 'relx6_compatible_45_o04', name: '勁涼鐵觀音（單顆）', stock: 865, priceDelta: 0 },
          { id: 'relx6_compatible_45_o05', name: '極涼青提（單顆）', stock: 1017, priceDelta: 0 },
          { id: 'relx6_compatible_45_o06', name: '熱情番石榴（單顆）', stock: 786, priceDelta: 0 },
          { id: 'relx6_compatible_45_o07', name: '零度薄荷（單顆）', stock: 1200, priceDelta: 0 },
          { id: 'relx6_compatible_45_o08', name: '極涼青檸（單顆）', stock: 934, priceDelta: 0 },
          { id: 'relx6_compatible_45_o09', name: '冰爽紅茶（單顆）', stock: 1104, priceDelta: 0 },
          { id: 'relx6_compatible_45_o10', name: '鮮嫩蜜桃（單顆）', stock: 879, priceDelta: 0 },
          { id: 'relx6_compatible_45_o11', name: '冰茉莉綠茶（單顆）', stock: 1056, priceDelta: 0 },
          { id: 'relx6_compatible_45_o12', name: '極涼荔枝（單顆）', stock: 742, priceDelta: 0 },
          { id: 'relx6_compatible_45_o13', name: '老冰棍（單顆）', stock: 1188, priceDelta: 0 },
          { id: 'relx6_compatible_45_o14', name: '洛神花茶（單顆）', stock: 963, priceDelta: 0 },
          { id: 'relx6_compatible_45_o15', name: '清涼綠豆（單顆）', stock: 821, priceDelta: 0 },
          { id: 'relx6_compatible_45_o16', name: '勁涼檸檬紅茶（單顆）', stock: 1097, priceDelta: 0 },
          { id: 'relx6_compatible_45_o17', name: '沙士汽水（單顆）', stock: 756, priceDelta: 0 },
          { id: 'relx6_compatible_45_o18', name: '芒果（單顆）', stock: 1149, priceDelta: 0 },
          { id: 'relx6_compatible_45_o19', name: '可樂冰（單顆）', stock: 902, priceDelta: 0 },
          { id: 'relx6_compatible_45_o20', name: '混和蘋果（單顆）', stock: 986, priceDelta: 0 },
          { id: 'relx6_compatible_45_o21', name: '葡萄（單顆）', stock: 1200, priceDelta: 0 },
          { id: 'relx6_compatible_45_o22', name: '蜜桃烏龍茶（單顆）', stock: 873, priceDelta: 0 }
        ]
      }
    ]
  },

  // 六代主機
  {
    id: 'relx6_device',
    name: 'RELX6代單桿 悅刻6代單桿',
    tag: 'device_v6',
    price: 500,
    image: '/products/1 (7).jpg',
    shortDesc: '六代主機',
    specs: [
      {
        specName: '顏色',
        options: [
          { id: 'relx6_device_o01', name: '黑曜石', stock: 1084, priceDelta: 0 },
          { id: 'relx6_device_o02', name: '海軍綠', stock: 742, priceDelta: 0 },
          { id: 'relx6_device_o03', name: '櫻花粉', stock: 1196, priceDelta: 0 },
          { id: 'relx6_device_o04', name: '皇家紫', stock: 865, priceDelta: 0 },
          { id: 'relx6_device_o05', name: '海灣藍', stock: 1017, priceDelta: 0 },
          { id: 'relx6_device_o06', name: '隕石灰', stock: 934, priceDelta: 0 }
        ]
      }
    ]
  },

  // 一次性拋棄式
  {
    id: 'ilia_disposable_6500',
    name: 'ILIA四代拋棄式6500口',
    tag: 'disposable',
    price: 260,
    image: '/products/1 (17).jpg',
    shortDesc: '一次性拋棄式',
    specs: [
      {
        specName: '口味',
        options: [
          { id: 'ilia_disposable_6500_o01', name: '高山龍井', stock: 1087, priceDelta: 0 },
          { id: 'ilia_disposable_6500_o02', name: '清甜藍莓', stock: 742, priceDelta: 0 },
          { id: 'ilia_disposable_6500_o03', name: '勁爽薄荷', stock: 1194, priceDelta: 0 },
          { id: 'ilia_disposable_6500_o04', name: '養樂多', stock: 865, priceDelta: 0 },
          { id: 'ilia_disposable_6500_o05', name: '激爽雪碧', stock: 1018, priceDelta: 0 },
          { id: 'ilia_disposable_6500_o06', name: '麝香葡萄', stock: 786, priceDelta: 0 },
          { id: 'ilia_disposable_6500_o07', name: '黑松沙士', stock: 1200, priceDelta: 0 },
          { id: 'ilia_disposable_6500_o08', name: '百香果汁', stock: 934, priceDelta: 0 },
          { id: 'ilia_disposable_6500_o09', name: '老冰棍兒', stock: 1106, priceDelta: 0 },
          { id: 'ilia_disposable_6500_o10', name: '多肉芒果', stock: 879, priceDelta: 0 },
          { id: 'ilia_disposable_6500_o11', name: '極冰蘇打', stock: 1057, priceDelta: 0 },
          { id: 'ilia_disposable_6500_o12', name: '脆青蘋果', stock: 742, priceDelta: 0 },
          { id: 'ilia_disposable_6500_o13', name: '蜜藏荔枝', stock: 1189, priceDelta: 0 },
          { id: 'ilia_disposable_6500_o14', name: '多肉葡萄', stock: 963, priceDelta: 0 },
          { id: 'ilia_disposable_6500_o15', name: '檸檬海鹽', stock: 821, priceDelta: 0 },
          { id: 'ilia_disposable_6500_o16', name: '紅心芭樂', stock: 1095, priceDelta: 0 },
          { id: 'ilia_disposable_6500_o17', name: '沙甜蜜瓜', stock: 756, priceDelta: 0 },
          { id: 'ilia_disposable_6500_o18', name: '激情可樂', stock: 1148, priceDelta: 0 },
          { id: 'ilia_disposable_6500_o19', name: '冰鐵觀音', stock: 902, priceDelta: 0 },
          { id: 'ilia_disposable_6500_o20', name: '爆汁蜜桃', stock: 986, priceDelta: 0 },
          { id: 'ilia_disposable_6500_o21', name: '冰鎮西瓜', stock: 1200, priceDelta: 0 },
          { id: 'ilia_disposable_6500_o22', name: '冰葡萄柚', stock: 873, priceDelta: 0 },
          { id: 'ilia_disposable_6500_o23', name: '烏龍綠茶', stock: 1041, priceDelta: 0 },
          { id: 'ilia_disposable_6500_o24', name: '冬瓜檸檬', stock: 789, priceDelta: 0 }
        ]
      }
    ]
  },
  {
    id: 'kis5_disposable_6500',
    name: 'kis5一次性6500口',
    tag: 'disposable',
    price: 320,
    image: '/products/1 (8).jpg',
    shortDesc: '一次性拋棄式',
    specs: [
      {
        specName: '口味',
        options: [
          { id: 'kis5_disposable_6500_o01', name: '西瓜', stock: 1081, priceDelta: 0 },
          { id: 'kis5_disposable_6500_o02', name: '蘋果', stock: 742, priceDelta: 0 },
          { id: 'kis5_disposable_6500_o03', name: '草莓西瓜', stock: 1193, priceDelta: 0 },
          { id: 'kis5_disposable_6500_o04', name: '薄荷', stock: 865, priceDelta: 0 },
          { id: 'kis5_disposable_6500_o05', name: '青箭口香糖', stock: 1016, priceDelta: 0 },
          { id: 'kis5_disposable_6500_o06', name: '桂花綠茶', stock: 786, priceDelta: 0 },
          { id: 'kis5_disposable_6500_o07', name: '百香果汁', stock: 1200, priceDelta: 0 },
          { id: 'kis5_disposable_6500_o08', name: '紅柚翡翠', stock: 934, priceDelta: 0 },
          { id: 'kis5_disposable_6500_o09', name: '芭樂', stock: 1105, priceDelta: 0 },
          { id: 'kis5_disposable_6500_o10', name: '神仙檸檬', stock: 879, priceDelta: 0 },
          { id: 'kis5_disposable_6500_o11', name: '鐵觀音', stock: 1058, priceDelta: 0 },
          { id: 'kis5_disposable_6500_o12', name: '甜橙', stock: 742, priceDelta: 0 },
          { id: 'kis5_disposable_6500_o13', name: '葡萄', stock: 1187, priceDelta: 0 }
        ]
      }
    ]
  },
  {
    id: 'sp2s_disposable_9000',
    name: 'sp2s拋棄式 9000口',
    tag: 'disposable',
    price: 430,
    image: '/products/1 (4).jpg',
    shortDesc: '一次性拋棄式',
    specs: [
      {
        specName: '口味',
        options: [
          { id: 'sp2s_disposable_9000_o01', name: '奇異果', stock: 1092, priceDelta: 0 },
          { id: 'sp2s_disposable_9000_o02', name: '鐵觀音', stock: 742, priceDelta: 0 },
          { id: 'sp2s_disposable_9000_o03', name: '金桔檸檬', stock: 1187, priceDelta: 0 },
          { id: 'sp2s_disposable_9000_o04', name: '蜜桃氣泡', stock: 864, priceDelta: 0 },
          { id: 'sp2s_disposable_9000_o05', name: '冰涼薄荷', stock: 1019, priceDelta: 0 },
          { id: 'sp2s_disposable_9000_o06', name: '櫻花葡萄', stock: 786, priceDelta: 0 },
          { id: 'sp2s_disposable_9000_o07', name: '草莓物語', stock: 1200, priceDelta: 0 },
          { id: 'sp2s_disposable_9000_o08', name: '冰礦泉茉莉', stock: 934, priceDelta: 0 },
          { id: 'sp2s_disposable_9000_o09', name: '黑加侖蘋果', stock: 1106, priceDelta: 0 },
          { id: 'sp2s_disposable_9000_o10', name: '喜馬拉雅冰礦', stock: 879, priceDelta: 0 },
          { id: 'sp2s_disposable_9000_o11', name: '百香果', stock: 1058, priceDelta: 0 }
        ]
      }
    ]
  },
  {
    id: 'tut_disposable_6500',
    name: 'TUT拋棄式6500口，新產品非常好抽~',
    tag: 'disposable',
    price: 320,
    image: '/products/1 (8).jpg',
    shortDesc: '一次性拋棄式',
    specs: [
      {
        specName: '口味',
        options: [
          { id: 'tut_disposable_6500_o01', name: '檸檬', stock: 1086, priceDelta: 0 },
          { id: 'tut_disposable_6500_o02', name: '哈密瓜', stock: 742, priceDelta: 0 },
          { id: 'tut_disposable_6500_o03', name: '鐵觀音', stock: 1192, priceDelta: 0 },
          { id: 'tut_disposable_6500_o04', name: '龍井', stock: 865, priceDelta: 0 },
          { id: 'tut_disposable_6500_o05', name: '芭樂', stock: 1013, priceDelta: 0 },
          { id: 'tut_disposable_6500_o06', name: '西瓜', stock: 786, priceDelta: 0 },
          { id: 'tut_disposable_6500_o07', name: '蜜桃', stock: 1200, priceDelta: 0 },
          { id: 'tut_disposable_6500_o08', name: '蔓越莓', stock: 934, priceDelta: 0 },
          { id: 'tut_disposable_6500_o09', name: '蘋果', stock: 1101, priceDelta: 0 },
          { id: 'tut_disposable_6500_o10', name: '芒果', stock: 879, priceDelta: 0 },
          { id: 'tut_disposable_6500_o11', name: '南極冰', stock: 1057, priceDelta: 0 },
          { id: 'tut_disposable_6500_o12', name: '葡萄', stock: 742, priceDelta: 0 },
          { id: 'tut_disposable_6500_o13', name: '藍莓', stock: 1188, priceDelta: 0 },
          { id: 'tut_disposable_6500_o14', name: '荔枝', stock: 963, priceDelta: 0 },
          { id: 'tut_disposable_6500_o15', name: '可樂', stock: 1094, priceDelta: 0 }
        ]
      }
    ]
  },
  {
    id: 'huya_disposable_5000',
    name: 'HUYA虎牙5000口拋棄式',
    tag: 'disposable',
    price: 280,
    image: '/products/1 (3).jpg',
    shortDesc: '一次性拋棄式',
    specs: [
      {
        specName: '口味',
        options: [
          { id: 'huya_disposable_5000_o01', name: '黑松沙士', stock: 1089, priceDelta: 0 },
          { id: 'huya_disposable_5000_o02', name: '梅染芭樂', stock: 742, priceDelta: 0 },
          { id: 'huya_disposable_5000_o03', name: '桃子冰冰', stock: 1196, priceDelta: 0 },
          { id: 'huya_disposable_5000_o04', name: '舒跑', stock: 865, priceDelta: 0 },
          { id: 'huya_disposable_5000_o05', name: '粉紅檸檬', stock: 1017, priceDelta: 0 },
          { id: 'huya_disposable_5000_o06', name: '冷泡茶', stock: 786, priceDelta: 0 },
          { id: 'huya_disposable_5000_o07', name: '鮮檸冰冰', stock: 1200, priceDelta: 0 },
          { id: 'huya_disposable_5000_o08', name: '冰爽西瓜', stock: 934, priceDelta: 0 },
          { id: 'huya_disposable_5000_o09', name: '雪碧檸檬', stock: 1104, priceDelta: 0 },
          { id: 'huya_disposable_5000_o10', name: '爆冰藍莓', stock: 879, priceDelta: 0 },
          { id: 'huya_disposable_5000_o11', name: '桃子烏龍', stock: 1056, priceDelta: 0 },
          { id: 'huya_disposable_5000_o12', name: '雀巢檸檬茶', stock: 742, priceDelta: 0 },
          { id: 'huya_disposable_5000_o13', name: '冰涼蘇打', stock: 1188, priceDelta: 0 },
          { id: 'huya_disposable_5000_o14', name: '百香果多多', stock: 963, priceDelta: 0 },
          { id: 'huya_disposable_5000_o15', name: '彩虹糖', stock: 821, priceDelta: 0 },
          { id: 'huya_disposable_5000_o16', name: '芒果冰沙', stock: 1097, priceDelta: 0 },
          { id: 'huya_disposable_5000_o17', name: '青蘋果', stock: 756, priceDelta: 0 },
          { id: 'huya_disposable_5000_o18', name: '荔枝果凍', stock: 1148, priceDelta: 0 },
          { id: 'huya_disposable_5000_o19', name: '薄荷', stock: 902, priceDelta: 0 },
          { id: 'huya_disposable_5000_o20', name: '多肉葡萄', stock: 986, priceDelta: 0 },
          { id: 'huya_disposable_5000_o21', name: '濃厚抹草', stock: 1200, priceDelta: 0 },
          { id: 'huya_disposable_5000_o22', name: '暴雪青葡萄', stock: 873, priceDelta: 0 },
          { id: 'huya_disposable_5000_o23', name: '奇異百香番石榴', stock: 1041, priceDelta: 0 },
          { id: 'huya_disposable_5000_o24', name: '超涼南極冰', stock: 789, priceDelta: 0 },
          { id: 'huya_disposable_5000_o25', name: '灌木叢莓果', stock: 1112, priceDelta: 0 },
          { id: 'huya_disposable_5000_o26', name: '湘妃洛神莓', stock: 958, priceDelta: 0 },
          { id: 'huya_disposable_5000_o27', name: '西柚茉茶', stock: 835, priceDelta: 0 }
        ]
      }
    ]
  },
  {
    id: 'ice_disposable_10000',
    name: 'ICE 10000口 市面上最強拋棄式，濃度、涼度 皆可自由調整',
    tag: 'disposable',
    price: 400,
    image: '/products/1 (10).jpg',
    shortDesc: '一次性拋棄式',
    specs: [
      {
        specName: '口味',
        options: [
          { id: 'ice_disposable_10000_o01', name: '檸檬', stock: 1088, priceDelta: 0 },
          { id: 'ice_disposable_10000_o02', name: '南極冰', stock: 742, priceDelta: 0 },
          { id: 'ice_disposable_10000_o03', name: '紅牛', stock: 1195, priceDelta: 0 },
          { id: 'ice_disposable_10000_o04', name: '百香果', stock: 865, priceDelta: 0 },
          { id: 'ice_disposable_10000_o05', name: '鐵觀音', stock: 1016, priceDelta: 0 },
          { id: 'ice_disposable_10000_o06', name: '龍井', stock: 786, priceDelta: 0 },
          { id: 'ice_disposable_10000_o07', name: '綠葡萄', stock: 1200, priceDelta: 0 },
          { id: 'ice_disposable_10000_o08', name: '蜜桃', stock: 934, priceDelta: 0 },
          { id: 'ice_disposable_10000_o09', name: '藍莓', stock: 1102, priceDelta: 0 },
          { id: 'ice_disposable_10000_o10', name: '可樂', stock: 879, priceDelta: 0 },
          { id: 'ice_disposable_10000_o11', name: '紫葡萄', stock: 1059, priceDelta: 0 },
          { id: 'ice_disposable_10000_o12', name: '薄荷', stock: 742, priceDelta: 0 },
          { id: 'ice_disposable_10000_o13', name: '芭樂', stock: 1187, priceDelta: 0 },
          { id: 'ice_disposable_10000_o14', name: '老兵棍', stock: 963, priceDelta: 0 },
          { id: 'ice_disposable_10000_o15', name: '西瓜', stock: 1094, priceDelta: 0 }
        ]
      }
    ]
  },
  {
    id: 'relx6_disposable_8000',
    name: 'RELX 悅刻六代 8000口拋棄式',
    tag: 'disposable',
    price: 360,
    image: '/products/1 (16).jpg',
    shortDesc: '一次性拋棄式',
    specs: [
      {
        specName: '口味',
        options: [
          { id: 'relx6_disposable_8000_o01', name: '綠豆', stock: 1085, priceDelta: 0 },
          { id: 'relx6_disposable_8000_o02', name: '白葡萄', stock: 742, priceDelta: 0 },
          { id: 'relx6_disposable_8000_o03', name: '龍井', stock: 1193, priceDelta: 0 },
          { id: 'relx6_disposable_8000_o04', name: '鳳梨', stock: 865, priceDelta: 0 },
          { id: 'relx6_disposable_8000_o05', name: '鐵觀音', stock: 1014, priceDelta: 0 },
          { id: 'relx6_disposable_8000_o06', name: '蘋果', stock: 786, priceDelta: 0 },
          { id: 'relx6_disposable_8000_o07', name: '芭樂', stock: 1200, priceDelta: 0 },
          { id: 'relx6_disposable_8000_o08', name: '白桃烏龍', stock: 934, priceDelta: 0 },
          { id: 'relx6_disposable_8000_o09', name: '芒果', stock: 1101, priceDelta: 0 },
          { id: 'relx6_disposable_8000_o10', name: '檸檬紅茶', stock: 879, priceDelta: 0 },
          { id: 'relx6_disposable_8000_o11', name: '檸檬海鹽', stock: 1058, priceDelta: 0 },
          { id: 'relx6_disposable_8000_o12', name: '百香果', stock: 742, priceDelta: 0 },
          { id: 'relx6_disposable_8000_o13', name: '西瓜', stock: 1188, priceDelta: 0 },
          { id: 'relx6_disposable_8000_o14', name: '薄荷', stock: 963, priceDelta: 0 },
          { id: 'relx6_disposable_8000_o15', name: '冬瓜烏龍茶', stock: 821, priceDelta: 0 },
          { id: 'relx6_disposable_8000_o16', name: '可樂', stock: 1096, priceDelta: 0 },
          { id: 'relx6_disposable_8000_o17', name: '荔枝', stock: 756, priceDelta: 0 },
          { id: 'relx6_disposable_8000_o18', name: '葡萄', stock: 1149, priceDelta: 0 },
          { id: 'relx6_disposable_8000_o19', name: '礦泉水', stock: 902, priceDelta: 0 },
          { id: 'relx6_disposable_8000_o20', name: '藍莓', stock: 987, priceDelta: 0 }
        ]
      }
    ]
  },
  {
    id: 'chill_disposable_8800',
    name: 'CHILL 拋棄式8800口',
    tag: 'disposable',
    price: 320,
    image: '/products/1 (18).jpg',
    shortDesc: '一次性拋棄式',
    specs: [
      {
        specName: '口味',
        options: [
          { id: 'chill_disposable_8800_o01', name: '西瓜', stock: 1083, priceDelta: 0 },
          { id: 'chill_disposable_8800_o02', name: '覆盆子森林', stock: 742, priceDelta: 0 },
          { id: 'chill_disposable_8800_o03', name: '蜜桃', stock: 1194, priceDelta: 0 },
          { id: 'chill_disposable_8800_o04', name: '芭樂', stock: 865, priceDelta: 0 },
          { id: 'chill_disposable_8800_o05', name: '百香果', stock: 1016, priceDelta: 0 },
          { id: 'chill_disposable_8800_o06', name: '龍井', stock: 786, priceDelta: 0 },
          { id: 'chill_disposable_8800_o07', name: '葡萄', stock: 1200, priceDelta: 0 },
          { id: 'chill_disposable_8800_o08', name: '薄荷', stock: 934, priceDelta: 0 },
          { id: 'chill_disposable_8800_o09', name: '清提設香葡萄', stock: 1107, priceDelta: 0 },
          { id: 'chill_disposable_8800_o10', name: '伯牙絕弦', stock: 879, priceDelta: 0 }
        ]
      }
    ]
  },

  // 東京魔盒
  {
    id: 'mohoo_tokyo_box',
    name: '東京魔盒MOHOO',
    tag: 'mohoo',
    price: 450,
    image: '/products/1 (6).jpg',
    shortDesc: '東京魔盒',
    specs: [
      {
        specName: '口味',
        options: [
          { id: 'mohoo_tokyo_box_o01', name: '（涼版）沙士', stock: 1086, priceDelta: 0 },
          { id: 'mohoo_tokyo_box_o02', name: '（涼版）綠豆', stock: 742, priceDelta: 0 },
          { id: 'mohoo_tokyo_box_o03', name: '（涼版）白葡萄', stock: 1193, priceDelta: 0 },
          { id: 'mohoo_tokyo_box_o04', name: '（涼版）雪碧', stock: 865, priceDelta: 0 },
          { id: 'mohoo_tokyo_box_o05', name: '（無涼版）草莓', stock: 1017, priceDelta: 0 },
          { id: 'mohoo_tokyo_box_o06', name: '（無涼版）草莓巧克力', stock: 786, priceDelta: 0 },
          { id: 'mohoo_tokyo_box_o07', name: '（無涼版）古巴雪茄', stock: 1200, priceDelta: 0 },
          { id: 'mohoo_tokyo_box_o08', name: '（涼版）葡萄', stock: 934, priceDelta: 0 },
          { id: 'mohoo_tokyo_box_o09', name: '（涼版）百香果', stock: 1104, priceDelta: 0 },
          { id: 'mohoo_tokyo_box_o10', name: '（涼版）荔枝', stock: 879, priceDelta: 0 },
          { id: 'mohoo_tokyo_box_o11', name: '（涼版）冰蜜桃', stock: 1058, priceDelta: 0 },
          { id: 'mohoo_tokyo_box_o12', name: '（涼版）冰棍', stock: 742, priceDelta: 0 },
          { id: 'mohoo_tokyo_box_o13', name: '（涼版）莓果', stock: 1188, priceDelta: 0 },
          { id: 'mohoo_tokyo_box_o14', name: '（涼版）可樂', stock: 963, priceDelta: 0 },
          { id: 'mohoo_tokyo_box_o15', name: '（涼版）芭樂', stock: 821, priceDelta: 0 },
          { id: 'mohoo_tokyo_box_o16', name: '（涼版）龍井茶', stock: 1096, priceDelta: 0 },
          { id: 'mohoo_tokyo_box_o17', name: '（涼版）火龍果芒果', stock: 756, priceDelta: 0 },
          { id: 'mohoo_tokyo_box_o18', name: '（涼版）蜜桃烏龍', stock: 1149, priceDelta: 0 },
          { id: 'mohoo_tokyo_box_o19', name: '（涼版）薄荷', stock: 902, priceDelta: 0 },
          { id: 'mohoo_tokyo_box_o20', name: '（涼版）芒果', stock: 987, priceDelta: 0 },
          { id: 'mohoo_tokyo_box_o21', name: '（涼版）寶礦力', stock: 1200, priceDelta: 0 },
          { id: 'mohoo_tokyo_box_o22', name: '（涼版）檸檬茉莉茶', stock: 873, priceDelta: 0 },
          { id: 'mohoo_tokyo_box_o23', name: '（無涼版）百香果', stock: 1041, priceDelta: 0 },
          { id: 'mohoo_tokyo_box_o24', name: '（無涼版）經典菸草', stock: 789, priceDelta: 0 },
          { id: 'mohoo_tokyo_box_o25', name: '（無涼版）葡萄', stock: 1112, priceDelta: 0 },
          { id: 'mohoo_tokyo_box_o26', name: '（無涼版）芭樂', stock: 958, priceDelta: 0 },
          { id: 'mohoo_tokyo_box_o27', name: '（涼版）西瓜蜜桃芒', stock: 835, priceDelta: 0 },
          { id: 'mohoo_tokyo_box_o28', name: '（涼版）蘋果', stock: 1091, priceDelta: 0 },
          { id: 'mohoo_tokyo_box_o29', name: '（涼版）哈密瓜', stock: 742, priceDelta: 0 },
          { id: 'mohoo_tokyo_box_o30', name: '（涼版）養樂多', stock: 1184, priceDelta: 0 },
          { id: 'mohoo_tokyo_box_o31', name: '（涼版）紅牛', stock: 865, priceDelta: 0 },
          { id: 'mohoo_tokyo_box_o32', name: '（涼版）檸檬', stock: 1013, priceDelta: 0 },
          { id: 'mohoo_tokyo_box_o33', name: '（涼版）礦泉水', stock: 1200, priceDelta: 0 },
          { id: 'mohoo_tokyo_box_o34', name: '（涼版）葡萄西柚', stock: 934, priceDelta: 0 },
          { id: 'mohoo_tokyo_box_o35', name: '（涼版）烏龍茶', stock: 1107, priceDelta: 0 },
          { id: 'mohoo_tokyo_box_o36', name: '（涼版）鐵觀音', stock: 879, priceDelta: 0 },
          { id: 'mohoo_tokyo_box_o37', name: '（涼版）藍莓', stock: 1056, priceDelta: 0 },
          { id: 'mohoo_tokyo_box_o38', name: '（涼版）西瓜', stock: 742, priceDelta: 0 },
          { id: 'mohoo_tokyo_box_o39', name: '（涼版）草莓', stock: 1189, priceDelta: 0 },
          { id: 'mohoo_tokyo_box_o40', name: '（極涼版）NEW! 草莓優格冰沙', stock: 963, priceDelta: 0 },
          { id: 'mohoo_tokyo_box_o41', name: '（極涼版）NEW! 檸檬優格冰沙', stock: 821, priceDelta: 0 },
          { id: 'mohoo_tokyo_box_o42', name: '（極涼版）NEW! 柳橙綠茶', stock: 1094, priceDelta: 0 },
          { id: 'mohoo_tokyo_box_o43', name: '（極涼版）NEW! 貴妃葡萄', stock: 756, priceDelta: 0 },
          { id: 'mohoo_tokyo_box_o44', name: '（極涼版）NEW! 紅標沙士糖', stock: 1148, priceDelta: 0 }
        ]
      }
    ]
  },

    // IQOS
    {
      id: 'iqos_heat_tobacco',
      name: 'IQOS 日T 加熱煙',
      tag: 'iqos',
      price: 2300,
      image: '/products/1 (1).png',
      shortDesc: 'IQOS/加熱煙',
      specs: [
        {
          specName: '口味',
          options: [
            { id: 'iqos_heat_tobacco_o01', name: '特濃原味', stock: 1092, priceDelta: 0 },
            { id: 'iqos_heat_tobacco_o02', name: '濃原味', stock: 742, priceDelta: 0 },
            { id: 'iqos_heat_tobacco_o03', name: '淡原味', stock: 1186, priceDelta: 0 },
            { id: 'iqos_heat_tobacco_o04', name: '堅果', stock: 865, priceDelta: 0 },
            { id: 'iqos_heat_tobacco_o05', name: '紅寶石原味', stock: 1014, priceDelta: 0 },
            { id: 'iqos_heat_tobacco_o06', name: '雪松', stock: 786, priceDelta: 0 },
            { id: 'iqos_heat_tobacco_o07', name: '濃薄荷', stock: 1200, priceDelta: 0 },
            { id: 'iqos_heat_tobacco_o08', name: '淡薄荷', stock: 934, priceDelta: 0 },
            { id: 'iqos_heat_tobacco_o09', name: '藍莓', stock: 1103, priceDelta: 0 },
            { id: 'iqos_heat_tobacco_o10', name: '青檸', stock: 879, priceDelta: 0 },
            { id: 'iqos_heat_tobacco_o11', name: '熱帶水果', stock: 1056, priceDelta: 0 },
            { id: 'iqos_heat_tobacco_o12', name: '青蘋果', stock: 742, priceDelta: 0 },
            { id: 'iqos_heat_tobacco_o13', name: '黑冰薄荷', stock: 1189, priceDelta: 0 },
            { id: 'iqos_heat_tobacco_o14', name: '黑冰藍莓', stock: 963, priceDelta: 0 },
            { id: 'iqos_heat_tobacco_o15', name: '黑冰青檸', stock: 821, priceDelta: 0 },
            { id: 'iqos_heat_tobacco_o16', name: '黑冰水果', stock: 1097, priceDelta: 0 },
            { id: 'iqos_heat_tobacco_o17', name: '黑冰莓果', stock: 756, priceDelta: 0 },
            { id: 'iqos_heat_tobacco_o18', name: '黑冰柑橘', stock: 1148, priceDelta: 0 },
            { id: 'iqos_heat_tobacco_o19', name: '綠洲爆珠', stock: 902, priceDelta: 0 },
            { id: 'iqos_heat_tobacco_o20', name: '日光爆珠', stock: 987, priceDelta: 0 },
            { id: 'iqos_heat_tobacco_o21', name: '淡薄荷爆珠', stock: 1200, priceDelta: 0 },
            { id: 'iqos_heat_tobacco_o22', name: '青蘋果爆珠', stock: 873, priceDelta: 0 },
            { id: 'iqos_heat_tobacco_o23', name: '櫻桃爆珠', stock: 1041, priceDelta: 0 },
            { id: 'iqos_heat_tobacco_o24', name: '花香爆珠', stock: 789, priceDelta: 0 },
            { id: 'iqos_heat_tobacco_o25', name: '紫冰', stock: 1116, priceDelta: 0 }
          ]
        }
      ]
    },
  
    // 一次性拋棄式：冰爆 ICEMAX 12000口
{
  id: 'icemax_disposable_12000',
  name: '冰爆 ICEMAX 12000口',
  tag: 'disposable',
  price: 500,
  image: '/products/114337.png',
  shortDesc: '一次性拋棄式',
  specs: [
    {
      specName: '口味',
      options: [
        { id: 'icemax_12000_o01', name: '薄荷', stock: 1098, priceDelta: 0 },
        { id: 'icemax_12000_o02', name: '番石榴', stock: 742, priceDelta: 0 },
        { id: 'icemax_12000_o03', name: '綠豆', stock: 1187, priceDelta: 0 },
        { id: 'icemax_12000_o04', name: '寶礦力', stock: 865, priceDelta: 0 },
        { id: 'icemax_12000_o05', name: '茉莉奶茶', stock: 1016, priceDelta: 0 },
        { id: 'icemax_12000_o06', name: '椰子水', stock: 934, priceDelta: 0 }
      ]
    }
  ]
},

// 一次性拋棄式：雪茄鴨嘴獸 4000口拋棄式
{
  id: 'platypus_disposable_4000',
  name: '雪茄鴨嘴獸 4000口拋棄式',
  tag: 'disposable',
  price: 300,
  image: '/products/114214.png',
  shortDesc: '一次性拋棄式',
  specs: [
    {
      specName: '口味',
      options: [
        { id: 'platypus_4000_o01', name: '薄荷', stock: 1091, priceDelta: 0 },
        { id: 'platypus_4000_o02', name: '礦泉水', stock: 742, priceDelta: 0 },
        { id: 'platypus_4000_o03', name: '鐵觀音', stock: 1188, priceDelta: 0 },
        { id: 'platypus_4000_o04', name: '蘋果', stock: 865, priceDelta: 0 },
        { id: 'platypus_4000_o05', name: '青提', stock: 1017, priceDelta: 0 },
        { id: 'platypus_4000_o06', name: '檸檬', stock: 786, priceDelta: 0 },
        { id: 'platypus_4000_o07', name: '水蜜桃冰', stock: 1200, priceDelta: 0 },
        { id: 'platypus_4000_o08', name: '西柚', stock: 934, priceDelta: 0 },
        { id: 'platypus_4000_o09', name: '百香果', stock: 1104, priceDelta: 0 },
        { id: 'platypus_4000_o10', name: '綠豆', stock: 879, priceDelta: 0 },
        { id: 'platypus_4000_o11', name: '荔枝', stock: 1056, priceDelta: 0 }
      ]
    }
  ]
}
]