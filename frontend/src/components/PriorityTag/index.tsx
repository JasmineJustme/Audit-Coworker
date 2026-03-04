import { Tag } from 'antd';
import { PRIORITY_MAP } from '@/constants/status';

interface Props {
  priority: string;
}

export default function PriorityTag({ priority }: Props) {
  const config = PRIORITY_MAP[priority] || { color: '#8c8c8c', text: priority };
  return <Tag color={config.color}>{config.text}</Tag>;
}
