export type TagKey =
  | 'pod_v1'
  | 'disposable'
  | 'ilia_v5'
  | 'device_v1'
  | 'device_v6'
  | 'replaceable_device'
  | 'mohoo'
  | 'iqos'
  | 'owner_pick'
  | 'grinder_420'

export const TAGS: { key: TagKey; label: string; color: string }[] = [
  { key: 'pod_v1', label: '一代煙彈', color: '#2F80ED' },
  { key: 'disposable', label: '一次性拋棄式', color: '#EB5757' },
  { key: 'ilia_v5', label: '五代哩亞', color: '#27AE60' },
  { key: 'device_v1', label: '一代主機', color: '#9B51E0' },
  { key: 'device_v6', label: '六代主機', color: '#00A3FF' },
  { key: 'replaceable_device', label: '換彈式主機', color: '#EC4899' },
  { key: 'mohoo', label: '東京魔盒', color: '#F2994A' },
  { key: 'iqos', label: 'IQOS/加熱煙', color: '#F2C94C' },
  { key: 'owner_pick', label: '熱銷', color: '#EF4444' },
  { key: 'grinder_420', label: '研磨器420專家', color: '#10B981' }
]
