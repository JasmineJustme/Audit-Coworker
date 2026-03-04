import { useEffect, useState } from 'react';
import {
  Row,
  Col,
  Card,
  Form,
  Input,
  Switch,
  Button,
  Modal,
  Popconfirm,
  message,
  Typography,
  Empty,
} from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import {
  getDataSources,
  createDataSource,
  updateDataSource,
  toggleDataSource,
  testDataSource,
  syncDataSource,
  deleteDataSource,
} from '@/api/config';
import ParamTable, { type ParamDefinition } from '@/components/ParamTable';

const { Title } = Typography;

const normalizeParams = (
  arr?: {
    name?: string;
    type?: string;
    required?: boolean;
    default?: string | null;
    description?: string | null;
  }[]
): ParamDefinition[] => {
  if (!Array.isArray(arr)) return [];
  return arr.map((p) => ({
    name: p.name ?? '',
    type: p.type ?? 'string',
    required: p.required ?? false,
    default: p.default ?? '',
    description: p.description ?? '',
  }));
};

interface DataSourceItem {
  id: string;
  type: string;
  name?: string;
  dify_endpoint?: string;
  dify_api_key?: string;
  input_params?: ParamDefinition[];
  output_params?: ParamDefinition[];
  is_enabled?: boolean;
}

function DataSourceCard({
  ds,
  onUpdate,
  onToggle,
  onTest,
  onSync,
  onDelete,
}: {
  ds: DataSourceItem;
  onUpdate: (dsType: string, values: Record<string, unknown>) => Promise<void>;
  onToggle: (dsType: string) => Promise<void>;
  onTest: (dsType: string) => Promise<void>;
  onSync: (dsType: string) => Promise<void>;
  onDelete: (dsType: string) => Promise<void>;
}) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    form.setFieldsValue({
      name: ds.name ?? ds.type,
      dify_endpoint: ds.dify_endpoint ?? '',
      dify_api_key: ds.dify_api_key ?? '',
      input_params: normalizeParams(ds.input_params),
      output_params: normalizeParams(ds.output_params),
    });
  }, [ds, form]);

  const handleFinish = async (values: Record<string, unknown>) => {
    setLoading(true);
    try {
      await onUpdate(ds.type, values);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      title={ds.name ?? ds.type}
      extra={
        <Switch
          checked={ds.is_enabled ?? false}
          onChange={() => onToggle(ds.type)}
        />
      }
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{
          name: ds.name ?? ds.type,
          dify_endpoint: ds.dify_endpoint ?? '',
          dify_api_key: ds.dify_api_key ?? '',
          input_params: normalizeParams(ds.input_params),
          output_params: normalizeParams(ds.output_params),
        }}
      >
        <Form.Item name="name" label="名称">
          <Input placeholder="数据源名称" />
        </Form.Item>
        <Form.Item name="dify_endpoint" label="Endpoint">
          <Input placeholder="API 地址" />
        </Form.Item>
        <Form.Item name="dify_api_key" label="API Key">
          <Input.Password placeholder="API Key" />
        </Form.Item>
        <Form.Item name="input_params" label="输入参数">
          <ParamTable showRequired />
        </Form.Item>
        <Form.Item name="output_params" label="输出参数">
          <ParamTable showRequired={false} />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            保存
          </Button>
          <Button style={{ marginLeft: 8 }} onClick={() => onTest(ds.type)}>
            测试
          </Button>
          <Button style={{ marginLeft: 8 }} onClick={() => onSync(ds.type)}>
            手动同步
          </Button>
          <Popconfirm
            title="确定删除该数据源？"
            onConfirm={() => onDelete(ds.type)}
          >
            <Button
              danger
              type="link"
              style={{ marginLeft: 8 }}
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Form.Item>
      </Form>
    </Card>
  );
}

export default function ConfigDataSourcesPage() {
  const [dataSources, setDataSources] = useState<DataSourceItem[]>([]);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm] = Form.useForm();
  const [creating, setCreating] = useState(false);

  const loadDataSources = async () => {
    try {
      const res = await getDataSources();
      const body = (res as { data: unknown }).data;
      const payload = (body as { data?: DataSourceItem[] })?.data ?? body;
      setDataSources(Array.isArray(payload) ? payload : []);
    } catch {
      setDataSources([]);
    }
  };

  useEffect(() => {
    loadDataSources();
  }, []);

  const handleCreate = async () => {
    try {
      const values = await createForm.validateFields();
      setCreating(true);
      await createDataSource({
        type: values.type,
        name: values.name,
      });
      message.success('数据源创建成功');
      setCreateModalOpen(false);
      createForm.resetFields();
      loadDataSources();
    } catch (e: unknown) {
      if (e && typeof e === 'object' && 'errorFields' in e) return;
      message.error('创建失败');
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async (
    dsType: string,
    values: Record<string, unknown>
  ) => {
    await updateDataSource(dsType, {
      name: values.name,
      dify_endpoint: values.dify_endpoint,
      dify_api_key: values.dify_api_key,
      input_params: values.input_params,
      output_params: values.output_params,
    });
    message.success('保存成功');
    loadDataSources();
  };

  const handleToggle = async (dsType: string) => {
    try {
      await toggleDataSource(dsType);
      message.success('状态已更新');
      loadDataSources();
    } catch {
      message.error('更新失败');
    }
  };

  const handleTest = async (dsType: string) => {
    try {
      await testDataSource(dsType);
      message.success('连接测试成功');
    } catch {
      message.error('连接测试失败');
    }
  };

  const handleSync = async (dsType: string) => {
    try {
      await syncDataSource(dsType);
      message.success('手动同步已触发');
    } catch {
      message.error('同步失败');
    }
  };

  const handleDelete = async (dsType: string) => {
    try {
      await deleteDataSource(dsType);
      message.success('已删除');
      loadDataSources();
    } catch {
      message.error('删除失败');
    }
  };

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <Title level={3} style={{ margin: 0 }}>
          数据源配置
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setCreateModalOpen(true)}
        >
          添加数据源
        </Button>
      </div>

      {dataSources.length === 0 ? (
        <Empty description="暂无数据源，请点击「添加数据源」创建">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateModalOpen(true)}
          >
            添加数据源
          </Button>
        </Empty>
      ) : (
        <Row gutter={[16, 16]}>
          {dataSources.map((ds) => (
            <Col xs={24} lg={8} key={ds.id}>
              <DataSourceCard
                ds={ds}
                onUpdate={handleUpdate}
                onToggle={handleToggle}
                onTest={handleTest}
                onSync={handleSync}
                onDelete={handleDelete}
              />
            </Col>
          ))}
        </Row>
      )}

      <Modal
        title="添加数据源"
        open={createModalOpen}
        onCancel={() => {
          setCreateModalOpen(false);
          createForm.resetFields();
        }}
        onOk={handleCreate}
        confirmLoading={creating}
        okText="创建"
        cancelText="取消"
      >
        <Form form={createForm} layout="vertical">
          <Form.Item
            name="type"
            label="类型标识"
            rules={[
              { required: true, message: '请输入类型标识' },
              {
                pattern: /^[a-z][a-z0-9_]*$/,
                message: '仅支持小写字母、数字和下划线，需以字母开头',
              },
            ]}
            extra="唯一标识，如 email、erp_data、contract_review"
          >
            <Input placeholder="如 email" />
          </Form.Item>
          <Form.Item
            name="name"
            label="显示名称"
            rules={[{ required: true, message: '请输入显示名称' }]}
          >
            <Input placeholder="如 邮件数据源" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
