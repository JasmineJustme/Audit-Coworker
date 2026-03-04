import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Form,
  Card,
  Input,
  InputNumber,
  Switch,
  Button,
  Select,
  Table,
  Space,
  Modal,
  message,
  Typography,
} from 'antd';
import {
  ArrowLeftOutlined,
  PlusOutlined,
  DeleteOutlined,
  UpOutlined,
  DownOutlined,
} from '@ant-design/icons';
import {
  getWAgent,
  createWAgent,
  updateWAgent,
  getWorkflows,
} from '@/api/config';
import type { WAgent, WAgentStep, WAgentStepMapping } from '@/types/wagent';
import type { Workflow } from '@/types/workflow';
import type { PaginatedData } from '@/types/api';
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

export default function ConfigWAgentsEditorPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id && id !== 'new');
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [steps, setSteps] = useState<WAgentStep[]>([]);
  const [addStepModalOpen, setAddStepModalOpen] = useState(false);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>('');

  useEffect(() => {
    getWorkflows({ page: 1, size: 100 })
      .then((res) => {
        const body = (res as { data: unknown }).data;
        const payload = (body as { data?: PaginatedData<Workflow> })?.data ?? body;
        const items = (payload as PaginatedData<Workflow>)?.items ?? [];
        setWorkflows(items);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (isEdit && id) {
      getWAgent(id)
        .then((res) => {
          const body = (res as { data: unknown }).data;
          const wagent = (body as { data?: WAgent & { steps?: WAgentStep[] } })
            ?.data ?? body;
          if (wagent) {
            const wa = wagent as WAgent & { steps?: WAgentStep[] };
            form.setFieldsValue({
              name: wa.name,
              description: wa.description ?? '',
              capability_tags: wa.capability_tags ?? [],
              input_params: normalizeParams(wa.input_params),
              output_params: normalizeParams(wa.output_params),
              timeout_seconds: wa.timeout_seconds ?? 30,
              auto_execute: wa.auto_execute ?? false,
              confirm_before_exec: wa.confirm_before_exec ?? true,
            });
            setSteps(wa.steps ?? []);
          }
        })
        .catch(() => message.error('加载失败'));
    }
  }, [id, isEdit, form]);

  const handleAddStep = () => {
    if (!selectedWorkflowId) {
      message.warning('请选择 Workflow');
      return;
    }
    const wf = workflows.find((w) => w.id === selectedWorkflowId);
    const newStep: WAgentStep = {
      order: steps.length + 1,
      workflow_id: selectedWorkflowId,
      workflow_name: wf?.name ?? '',
      execution_mode: 'sequential',
      param_mapping: {},
    };
    setSteps([...steps, newStep]);
    setSelectedWorkflowId('');
    setAddStepModalOpen(false);
  };

  const handleRemoveStep = (index: number) => {
    const next = steps
      .filter((_, i) => i !== index)
      .map((s, i) => ({ ...s, order: i + 1 }));
    setSteps(next);
  };

  const handleMoveStep = (index: number, dir: 'up' | 'down') => {
    if (dir === 'up' && index === 0) return;
    if (dir === 'down' && index === steps.length - 1) return;
    const next = [...steps];
    const swap = dir === 'up' ? index - 1 : index + 1;
    [next[index], next[swap]] = [next[swap], next[index]];
    setSteps(next.map((s, i) => ({ ...s, order: i + 1 })));
  };

  const onFinish = async (values: Record<string, unknown>) => {
    setLoading(true);
    try {
      const payload = {
        name: values.name,
        description: values.description,
        capability_tags: values.capability_tags,
        input_params: values.input_params,
        output_params: values.output_params,
        timeout_seconds: values.timeout_seconds,
        auto_execute: values.auto_execute,
        confirm_before_exec: values.confirm_before_exec,
        steps: steps.map((s) => ({
          order: s.order,
          workflow_id: s.workflow_id,
          execution_mode: s.execution_mode,
          param_mapping: s.param_mapping,
        })),
      };
      if (isEdit && id) {
        await updateWAgent(id, payload);
        message.success('更新成功');
      } else {
        await createWAgent(payload);
        message.success('创建成功');
      }
      navigate('/config/wagents');
    } catch {
      message.error(isEdit ? '更新失败' : '创建失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 16,
        }}
      >
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/config/wagents')}
        >
          返回
        </Button>
        <Title level={3} style={{ margin: 0 }}>
          {isEdit ? '编辑 W-Agent' : '新建 W-Agent'}
        </Title>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          capability_tags: [],
          input_params: [],
          output_params: [],
          timeout_seconds: 30,
          auto_execute: false,
          confirm_before_exec: true,
        }}
      >
        <Card title="基础信息" style={{ marginBottom: 16 }}>
          <Form.Item
            name="name"
            label="名称"
            rules={[{ required: true, message: '请输入名称' }]}
          >
            <Input placeholder="W-Agent 名称" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={2} placeholder="描述" />
          </Form.Item>
          <Form.Item name="capability_tags" label="能力标签">
            <Select mode="tags" placeholder="输入后回车添加标签" />
          </Form.Item>
        </Card>

        <Card
          title="执行步骤"
          extra={
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={() => setAddStepModalOpen(true)}
            >
              添加步骤
            </Button>
          }
          style={{ marginBottom: 16 }}
        >
          <Table
            dataSource={steps}
            rowKey={(_, i) => String(i)}
            pagination={false}
            size="small"
            columns={[
              {
                title: '顺序',
                dataIndex: 'order',
                width: 60,
              },
              {
                title: 'Workflow',
                dataIndex: 'workflow_name',
                render: (v: string) => v || '-',
              },
              {
                title: '操作',
                width: 120,
                render: (_: unknown, __: WAgentStep, index: number) => (
                  <Space>
                    <Button
                      type="text"
                      size="small"
                      icon={<UpOutlined />}
                      disabled={index === 0}
                      onClick={() => handleMoveStep(index, 'up')}
                    />
                    <Button
                      type="text"
                      size="small"
                      icon={<DownOutlined />}
                      disabled={index === steps.length - 1}
                      onClick={() => handleMoveStep(index, 'down')}
                    />
                    <Button
                      type="link"
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() => handleRemoveStep(index)}
                    >
                      删除
                    </Button>
                  </Space>
                ),
              },
            ]}
            expandable={{
              expandedRowRender: (record) => {
                const mapping = record.param_mapping ?? {};
                const keys = Object.keys(mapping);
                return (
                  <div style={{ padding: 8 }}>
                    <Typography.Text type="secondary">
                      参数映射 (可扩展)
                    </Typography.Text>
                    {keys.length === 0 ? (
                      <div style={{ marginTop: 4, color: '#999' }}>
                        暂无参数映射
                      </div>
                    ) : (
                      <ul style={{ marginTop: 4, paddingLeft: 20 }}>
                        {keys.map((k) => (
                          <li key={k}>
                            {k}: source=
                            {(mapping[k] as WAgentStepMapping)?.source ?? '-'}
                            , fixed_value=
                            {(mapping[k] as WAgentStepMapping)?.fixed_value ??
                              '-'}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              },
            }}
          />
        </Card>

        <Card title="输入参数" style={{ marginBottom: 16 }}>
          <Form.Item name="input_params">
            <ParamTable showRequired />
          </Form.Item>
        </Card>

        <Card title="输出参数" style={{ marginBottom: 16 }}>
          <Form.Item name="output_params">
            <ParamTable showRequired={false} />
          </Form.Item>
        </Card>

        <Card title="执行配置" style={{ marginBottom: 16 }}>
          <Form.Item name="timeout_seconds" label="超时时间(秒)">
            <InputNumber min={1} max={300} style={{ width: 120 }} />
          </Form.Item>
          <Form.Item name="auto_execute" label="自动执行" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item
            name="confirm_before_exec"
            label="执行前确认"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Card>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            保存
          </Button>
          <Button
            style={{ marginLeft: 8 }}
            onClick={() => navigate('/config/wagents')}
          >
            取消
          </Button>
        </Form.Item>
      </Form>

      <Modal
        title="添加步骤"
        open={addStepModalOpen}
        onOk={handleAddStep}
        onCancel={() => {
          setAddStepModalOpen(false);
          setSelectedWorkflowId('');
        }}
      >
        <Select
          placeholder="选择 Workflow"
          style={{ width: '100%' }}
          value={selectedWorkflowId || undefined}
          onChange={setSelectedWorkflowId}
          options={workflows.map((w) => ({ value: w.id, label: w.name }))}
        />
      </Modal>
    </div>
  );
}
