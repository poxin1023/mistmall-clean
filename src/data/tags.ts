export type TagKey =
  | 'pod_v1'
  | 'disposable'
  | 'ilia_v5'
  | 'device_v1'
  | 'device_v6'
  | 'mohoo'
  | 'iqos'

export const TAGS: { key: TagKey; label: string; color: string }[] = [
  { key: 'pod_v1', label: '一代煙彈', color: '#2F80ED' },
  { key: 'disposable', label: '一次性拋棄式', color: '#EB5757' },
  { key: 'ilia_v5', label: '五代哩亞', color: '#27AE60' },
  { key: 'device_v1', label: '一代主機', color: '#9B51E0' },
  { key: 'device_v6', label: '六代主機', color: '#00A3FF' },
  { key: 'mohoo', label: '東京魔盒', color: '#F2994A' },
  { key: 'iqos', label: 'IQOS/加熱煙', color: '#F2C94C' }
]
