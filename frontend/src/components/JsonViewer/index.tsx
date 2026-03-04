import { useState } from 'react';
import { Button, Typography } from 'antd';

interface Props {
  data: unknown;
}

export default function JsonViewer({ data }: Props) {
  const [raw, setRaw] = useState(false);

  const jsonStr =
    typeof data === 'string' ? data : JSON.stringify(data ?? null, null, 2);

  if (raw) {
    return (
      <div>
        <Button type="link" size="small" onClick={() => setRaw(false)}>
          格式化
        </Button>
        <pre
          style={{
            margin: 0,
            padding: 12,
            background: '#f5f5f5',
            borderRadius: 4,
            overflow: 'auto',
            fontSize: 12,
          }}
        >
          {jsonStr}
        </pre>
      </div>
    );
  }

  let formattedContent: React.ReactNode;
  try {
    const parsed = typeof data === 'string' ? JSON.parse(data) : data;
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      formattedContent = (
        <dl style={{ margin: 0 }}>
          {Object.entries(parsed).map(([k, v]) => (
            <div key={k} style={{ marginBottom: 8 }}>
              <Typography.Text strong>{k}:</Typography.Text>{' '}
              {typeof v === 'object' && v !== null
                ? JSON.stringify(v)
                : String(v)}
            </div>
          ))}
        </dl>
      );
    } else {
      formattedContent = <pre style={{ margin: 0 }}>{jsonStr}</pre>;
    }
  } catch {
    formattedContent = <pre style={{ margin: 0 }}>{jsonStr}</pre>;
  }

  return (
    <div>
      <Button type="link" size="small" onClick={() => setRaw(true)}>
        原始 JSON
      </Button>
      <div
        style={{
          padding: 12,
          background: '#f5f5f5',
          borderRadius: 4,
          overflow: 'auto',
          fontSize: 12,
        }}
      >
        {formattedContent}
      </div>
    </div>
  );
}
