import { Tag } from 'antd';
import { STATUS_TAG_MAP } from '@/constants/status';

interface Props {
  status: string;
}

export default function StatusTag({ status }: Props) {
  const config = STATUS_TAG_MAP[status] || { color: 'default', text: status };
  return <Tag color={config.color}>{config.text}</Tag>;
}
