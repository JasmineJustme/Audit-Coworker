import { useState } from 'react';
import { Typography } from 'antd';
import { DownOutlined, RightOutlined } from '@ant-design/icons';

interface Props {
  reason?: string;
}

export default function ReasonCollapse({ reason }: Props) {
  const [expanded, setExpanded] = useState(false);

  if (!reason) return null;

  return (
    <div>
      <Typography.Link
        onClick={() => setExpanded(!expanded)}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
      >
        {expanded ? <DownOutlined /> : <RightOutlined />}
        查看理由
      </Typography.Link>
      {expanded && (
        <div
          style={{
            marginTop: 8,
            padding: 12,
            background: '#fafafa',
            borderRadius: 4,
            fontSize: 12,
          }}
        >
          <Typography.Text type="secondary">{reason}</Typography.Text>
        </div>
      )}
    </div>
  );
}
