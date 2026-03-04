import { useEffect, useState } from 'react';
import {
  Tabs,
  Card,
  Form,
  Select,
  Input,
  InputNumber,
  Slider,
  Button,
  message,
  Typography,
} from 'antd';
import {
  getLLMConfig,
  updateLLMConfig,
  testLLMConfig,
  getLLMUsage,
} from '@/api/config';

const { Title, Text } = Typography;

const PURPOSES = [
  { key: 'todo_analysis', label: '待办梳理 LLM' },
  { key: 'orchestration', label: '智能编排 LLM' },
  { key: 'scheduling', label: '智能调度 LLM' },
] as const;

const PROVIDER_OPTIONS = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'azure', label: 'Azure' },
  { value: 'deepseek', label: 'DeepSeek' },
  { value: 'qwen', label: 'Qwen' },
  { value: 'dify', label: 'Dify' },
  { value: 'custom', label: 'Custom' },
];

function LLMTab({
  purpose,
  label,
}: {
  purpose: string;
  label: string;
}) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [usage, setUsage] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    getLLMConfig(purpose)
      .then((res) => {
        const body = (res as { data: unknown }).data;
        const raw = (body as { data?: Record<string, unknown> })?.data ?? body;
        const config = raw as Record<string, unknown>;
        if (config && typeof config === 'object') {
          form.setFieldsValue({
            provider: config.provider ?? 'openai',
            model_name: config.model_name ?? '',
            api_endpoint: config.api_endpoint ?? '',
            api_key: config.api_key ?? '',
            temperature: config.temperature ?? 0.7,
            top_p: config.top_p ?? 0.9,
            max_tokens: config.max_tokens ?? 4096,
            prompt_template: config.prompt_template ?? '',
          });
        }
      })
      .catch(() => message.error('加载失败'));
  }, [purpose, form]);

  const loadUsage = () => {
    getLLMUsage(purpose)
      .then((res) => {
        const body = (res as { data: unknown }).data;
        const u = (body as { data?: Record<string, unknown> })?.data ?? body;
        setUsage(u as Record<string, unknown>);
      })
      .catch(() => setUsage(null));
  };

  const onFinish = async (values: Record<string, unknown>) => {
    setLoading(true);
    try {
      await updateLLMConfig(purpose, {
        provider: values.provider,
        model_name: values.model_name,
        api_endpoint: values.api_endpoint,
        api_key: values.api_key,
        temperature: values.temperature,
        top_p: values.top_p,
        max_tokens: values.max_tokens,
        prompt_template: values.prompt_template,
      });
      message.success('保存成功');
    } catch {
      message.error('保存失败');
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    try {
      await form.validateFields();
      await testLLMConfig(purpose);
      message.success('测试成功');
    } catch (e) {
      if (e && typeof e === 'object' && 'errorFields' in e) {
        message.error('请填写必填项');
      } else {
        message.error('测试失败');
      }
    }
  };

  return (
    <div>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          provider: 'openai',
          model_name: '',
          api_endpoint: '',
          api_key: '',
          temperature: 0.7,
          top_p: 0.9,
          max_tokens: 4096,
          prompt_template: '',
        }}
      >
        <Card title={`${label} 配置`} style={{ marginBottom: 16 }}>
          <Form.Item name="provider" label="Provider">
            <Select options={PROVIDER_OPTIONS} placeholder="选择 Provider" />
          </Form.Item>
          <Form.Item name="model_name" label="模型名称">
            <Input placeholder="如 gpt-4, gpt-3.5-turbo" />
          </Form.Item>
          <Form.Item name="api_endpoint" label="API Endpoint">
            <Input placeholder="https://api.openai.com/v1" />
          </Form.Item>
          <Form.Item name="api_key" label="API Key">
            <Input.Password placeholder="API Key" />
          </Form.Item>
          <Form.Item
            name="temperature"
            label="Temperature"
            extra="0-2, 步长 0.1"
          >
            <Slider min={0} max={2} step={0.1} />
          </Form.Item>
          <Form.Item name="top_p" label="Top P" extra="0-1">
            <Slider min={0} max={1} step={0.05} />
          </Form.Item>
          <Form.Item name="max_tokens" label="Max Tokens">
            <InputNumber min={1} max={128000} style={{ width: 120 }} />
          </Form.Item>
          <Form.Item name="prompt_template" label="Prompt 模板">
            <Input.TextArea rows={8} placeholder="输入 prompt 模板" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              保存
            </Button>
            <Button style={{ marginLeft: 8 }} onClick={handleTest}>
              测试
            </Button>
          </Form.Item>
        </Card>
      </Form>

      <Card title="使用统计" style={{ marginTop: 16 }}>
        <Button size="small" onClick={loadUsage} style={{ marginBottom: 8 }}>
          刷新统计
        </Button>
        {usage ? (
          <pre style={{ margin: 0, fontSize: 12 }}>
            {JSON.stringify(usage, null, 2)}
          </pre>
        ) : (
          <Text type="secondary">暂无使用数据</Text>
        )}
      </Card>
    </div>
  );
}

export default function ConfigLLMPage() {
  return (
    <div>
      <Title level={3} style={{ marginBottom: 16 }}>
        大模型配置
      </Title>
      <Tabs
        items={PURPOSES.map(({ key, label }) => ({
          key,
          label,
          children: <LLMTab purpose={key} label={label} />,
        }))}
      />
    </div>
  );
}
