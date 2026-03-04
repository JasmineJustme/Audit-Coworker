import { useEffect, useState } from 'react';
import {
  Row,
  Col,
  Card,
  Form,
  Input,
  Switch,
  Button,
  message,
  Typography,
} from 'antd';
import {
  getNotificationChannels,
  updateNotificationChannel,
  toggleNotificationChannel,
  testNotificationChannel,
} from '@/api/config';

const { Title } = Typography;

const CHANNELS = [
  { key: 'email_workflow', name: '邮件工作流' },
  { key: 'wechat_workflow', name: '微信工作流' },
] as const;

interface ChannelConfig {
  name?: string;
  dify_endpoint?: string;
  dify_api_key?: string;
  input_mapping?: Record<string, string>;
  is_enabled?: boolean;
}

function NotificationCard({
  channelKey,
  label,
  config,
  onUpdate,
  onToggle,
  onTest,
}: {
  channelKey: string;
  label: string;
  config: ChannelConfig;
  onUpdate: (
    channelKey: string,
    values: Record<string, unknown>
  ) => Promise<void>;
  onToggle: (channelKey: string) => Promise<void>;
  onTest: (channelKey: string) => Promise<void>;
}) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const mapping = config.input_mapping ?? {};
    form.setFieldsValue({
      name: config.name ?? label,
      dify_endpoint: config.dify_endpoint ?? '',
      dify_api_key: config.dify_api_key ?? '',
      input_mapping: JSON.stringify(mapping, null, 2),
    });
  }, [config, label, form]);

  const handleFinish = async (values: Record<string, unknown>) => {
    setLoading(true);
    try {
      let input_mapping: Record<string, string> = {};
      try {
        const raw = values.input_mapping as string;
        if (raw?.trim()) {
          input_mapping = JSON.parse(raw) as Record<string, string>;
        }
      } catch {
        message.error('input_mapping 必须是合法 JSON');
        setLoading(false);
        return;
      }
      await onUpdate(channelKey, {
        name: values.name,
        dify_endpoint: values.dify_endpoint,
        dify_api_key: values.dify_api_key,
        input_mapping,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      title={config.name ?? label}
      extra={
        <Switch
          checked={config.is_enabled ?? false}
          onChange={() => onToggle(channelKey)}
        />
      }
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{
          name: config.name ?? label,
          dify_endpoint: config.dify_endpoint ?? '',
          dify_api_key: config.dify_api_key ?? '',
          input_mapping: JSON.stringify(config.input_mapping ?? {}, null, 2),
        }}
      >
        <Form.Item name="name" label="名称">
          <Input placeholder="渠道名称" />
        </Form.Item>
        <Form.Item name="dify_endpoint" label="Dify Endpoint">
          <Input placeholder="https://api.dify.ai/v1" />
        </Form.Item>
        <Form.Item name="dify_api_key" label="Dify API Key">
          <Input.Password placeholder="API Key" />
        </Form.Item>
        <Form.Item
          name="input_mapping"
          label="Input Mapping (JSON)"
          extra="key-value 映射，JSON 格式"
        >
          <Input.TextArea rows={6} placeholder='{"key": "value"}' />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            保存
          </Button>
          <Button style={{ marginLeft: 8 }} onClick={() => onTest(channelKey)}>
            测试
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}

export default function ConfigNotificationsPage() {
  const [data, setData] = useState<Record<string, ChannelConfig>>({});

  const loadChannels = async () => {
    try {
      const res = await getNotificationChannels();
      const body = (res as { data: unknown }).data;
      const payload =
        (body as { data?: Record<string, ChannelConfig> })?.data ?? body;
      setData((payload as Record<string, ChannelConfig>) ?? {});
    } catch {
      setData({});
    }
  };

  useEffect(() => {
    loadChannels();
  }, []);

  const handleUpdate = async (
    channelKey: string,
    values: Record<string, unknown>
  ) => {
    await updateNotificationChannel(channelKey, values);
    message.success('保存成功');
    loadChannels();
  };

  const handleToggle = async (channelKey: string) => {
    try {
      await toggleNotificationChannel(channelKey);
      message.success('状态已更新');
      loadChannels();
    } catch {
      message.error('更新失败');
    }
  };

  const handleTest = async (channelKey: string) => {
    try {
      await testNotificationChannel(channelKey);
      message.success('测试成功');
    } catch {
      message.error('测试失败');
    }
  };

  return (
    <div>
      <Title level={3} style={{ marginBottom: 16 }}>
        提醒渠道配置
      </Title>
      <Row gutter={[16, 16]}>
        {CHANNELS.map(({ key, name }) => (
          <Col xs={24} md={12} key={key}>
            <NotificationCard
              channelKey={key}
              label={name}
              config={data[key] ?? {}}
              onUpdate={handleUpdate}
              onToggle={handleToggle}
              onTest={handleTest}
            />
          </Col>
        ))}
      </Row>
    </div>
  );
}
