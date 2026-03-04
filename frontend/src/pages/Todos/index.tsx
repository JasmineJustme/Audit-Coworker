import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Table,
  Space,
  Select,
  DatePicker,
  Drawer,
  Form,
  Input,
  message,
  Popconfirm,
  Tag,
  Typography,
} from 'antd';
import { PlusOutlined, UploadOutlined, SendOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import {
  getTodos,
  createTodo,
  deleteTodo,
} from '@/api/todos';
import { submitOrchestration } from '@/api/orchestration';
import type { Todo } from '@/types/todo';
import PriorityTag from '@/components/PriorityTag';
import SourceTag from '@/components/SourceTag';
import { formatDate } from '@/utils/format';
import { parseExcelFile } from '@/utils/excel';
import { ROUTES } from '@/constants/routes';
import { TODO_STATUS_MAP, PRIORITY_MAP, SOURCE_MAP } from '@/constants/status';

const { Title } = Typography;

const STATUS_OPTIONS = Object.entries(TODO_STATUS_MAP).map(([k, v]) => ({
  value: k,
  label: v.text,
}));
const PRIORITY_OPTIONS = Object.entries(PRIORITY_MAP).map(([k, v]) => ({
  value: k,
  label: v.text,
}));
const SOURCE_OPTIONS = Object.entries(SOURCE_MAP).map(([k, v]) => ({
  value: k,
  label: v.text,
}));

export default function TodosPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [data, setData] = useState<{ items: Todo[]; total: number; page: number; size: number; pages: number }>({
    items: [],
    total: 0,
    page: 1,
    size: 20,
    pages: 0,
  });
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [filters, setFilters] = useState<{
    status?: string;
    priority?: string;
    source?: string;
    dateRange?: [string, string] | null;
  }>({});
  const [form] = Form.useForm();

  const loadTodos = async () => {
    setLoading(true);
    try {
      const res = await getTodos({
        page: data.page,
        size: data.size,
        status: filters.status || undefined,
        priority: filters.priority || undefined,
        source: filters.source || undefined,
      });
      const body = (res as { data: { data?: typeof data } }).data;
      const payload = body?.data ?? body;
      if (payload && typeof payload === 'object' && 'items' in payload) {
        setData({
          items: payload.items ?? [],
          total: payload.total ?? 0,
          page: payload.page ?? 1,
          size: payload.size ?? 20,
          pages: payload.pages ?? 0,
        });
      }
    } catch {
      setData((d) => ({ ...d, items: [] }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTodos();
  }, [data.page, data.size, filters.status, filters.priority, filters.source]);

  const handleCreate = async (values: Record<string, unknown>) => {
    try {
      await createTodo({
        title: values.title,
        description: values.description,
        priority: values.priority ?? 'medium',
        due_date: values.due_date ? (values.due_date as { toISOString?: () => string })?.toISOString?.() : undefined,
        tags: Array.isArray(values.tags) ? values.tags : [],
        project: values.project as string | undefined,
      });
      message.success('创建成功');
      setDrawerOpen(false);
      form.resetFields();
      loadTodos();
    } catch {
      message.error('创建失败');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTodo(id);
      message.success('已删除');
      loadTodos();
    } catch {
      message.error('删除失败');
    }
  };

  const handleBatchImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      setImportLoading(true);
      try {
        const rows = await parseExcelFile(file);
        const toCreate = rows
          .filter((r: Record<string, unknown>) => r['标题'] || r['title'])
          .map((r: Record<string, unknown>) => ({
            title: String(r['标题'] ?? r['title'] ?? ''),
            description: r['描述'] || r['description'] ? String(r['描述'] ?? r['description']) : undefined,
            priority: (r['优先级'] ?? r['priority'] ?? 'medium') as string,
            project: r['项目'] || r['project'] ? String(r['项目'] ?? r['project']) : undefined,
            tags: typeof r['标签'] === 'string' ? (r['标签'] as string).split(/[,，]/).map((s) => s.trim()).filter(Boolean) : [],
          }));
        let imported = 0;
        for (const item of toCreate) {
          try {
            await createTodo(item);
            imported++;
          } catch {
            // skip failed
          }
        }
        message.success(`成功导入 ${imported} 条`);
        loadTodos();
      } catch (err) {
        message.error('导入失败');
      } finally {
        setImportLoading(false);
      }
    };
    input.click();
  };

  const [submitting, setSubmitting] = useState(false);

  const handleSubmitToOrchestration = async () => {
    if (selectedRowKeys.length === 0) return;
    setSubmitting(true);
    try {
      const res = await submitOrchestration({ todo_ids: selectedRowKeys });
      const body = (res as { data: { data?: { orch_id?: string; status?: string; error?: string } } }).data;
      const result = body?.data ?? body;
      if (result?.error) {
        message.error(`编排提交失败: ${result.error}`);
      } else {
        message.success(`已提交 ${selectedRowKeys.length} 个任务到编排`);
        setSelectedRowKeys([]);
        navigate(ROUTES.ORCHESTRATION);
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } }; message?: string };
      const detail = err?.response?.data?.detail || err?.message || '提交失败';
      message.error(`编排提交失败: ${detail}`);
    } finally {
      setSubmitting(false);
    }
  };

  const columns: ColumnsType<Todo> = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (text: string) => <span title={text}>{text}</span>,
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 90,
      render: (p: string) => <PriorityTag priority={p} />,
    },
    {
      title: '来源',
      dataIndex: 'source',
      key: 'source',
      width: 90,
      render: (s: string) => <SourceTag source={s} />,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (s: string) => {
        const cfg = TODO_STATUS_MAP[s] || { color: 'default', text: s };
        return <Tag color={cfg.color}>{cfg.text}</Tag>;
      },
    },
    {
      title: '截止时间',
      dataIndex: 'due_date',
      key: 'due_date',
      width: 140,
      render: (d: string) => formatDate(d),
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      width: 120,
      render: (tags: string[]) =>
        Array.isArray(tags) ? tags.slice(0, 3).join(', ') : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Popconfirm
          title="确定删除？"
          onConfirm={() => handleDelete(record.id)}
        >
          <Button type="link" danger size="small">
            删除
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>
          待办任务
        </Title>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setDrawerOpen(true)}>
            新建待办
          </Button>
          <Button icon={<UploadOutlined />} onClick={handleBatchImport} loading={importLoading}>
            批量导入
          </Button>
          <Button
            icon={<SendOutlined />}
            disabled={selectedRowKeys.length === 0}
            loading={submitting}
            onClick={handleSubmitToOrchestration}
          >
            提交到编排 {selectedRowKeys.length > 0 ? `(${selectedRowKeys.length})` : ''}
          </Button>
          <Space>
            <span>列表</span>
            <Button disabled>看板</Button>
          </Space>
        </Space>
      </div>

      <Space style={{ marginBottom: 16 }} wrap>
        <Select
          placeholder="状态"
          allowClear
          style={{ width: 120 }}
          value={filters.status}
          onChange={(v) => setFilters((f) => ({ ...f, status: v }))}
          options={STATUS_OPTIONS}
        />
        <Select
          placeholder="优先级"
          allowClear
          style={{ width: 120 }}
          value={filters.priority}
          onChange={(v) => setFilters((f) => ({ ...f, priority: v }))}
          options={PRIORITY_OPTIONS}
        />
        <Select
          placeholder="来源"
          allowClear
          style={{ width: 120 }}
          value={filters.source}
          onChange={(v) => setFilters((f) => ({ ...f, source: v }))}
          options={SOURCE_OPTIONS}
        />
        <DatePicker.RangePicker
          placeholder={['开始日期', '结束日期']}
          onChange={(dates) =>
            setFilters((f) => ({
              ...f,
              dateRange: dates
                ? [dates[0]?.toISOString() ?? '', dates[1]?.toISOString() ?? '']
                : null,
            }))
          }
        />
      </Space>

      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={data.items}
        rowSelection={{
          selectedRowKeys,
          onChange: (keys) => setSelectedRowKeys(keys as string[]),
        }}
        pagination={{
          current: data.page,
          pageSize: data.size,
          total: data.total,
          showSizeChanger: true,
          showTotal: (t) => `共 ${t} 条`,
          onChange: (p, s) => setData((d) => ({ ...d, page: p, size: s ?? 20 })),
        }}
      />

      <Drawer
        title="新建待办"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={480}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreate}
          initialValues={{ priority: 'medium' }}
        >
          <Form.Item name="title" label="标题" rules={[{ required: true }]}>
            <Input placeholder="请输入标题" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} placeholder="请输入描述" />
          </Form.Item>
          <Form.Item name="priority" label="优先级">
            <Select options={PRIORITY_OPTIONS} />
          </Form.Item>
          <Form.Item name="due_date" label="截止时间">
            <DatePicker style={{ width: '100%' }} showTime />
          </Form.Item>
          <Form.Item name="tags" label="标签">
            <Select mode="tags" placeholder="输入后回车添加" />
          </Form.Item>
          <Form.Item name="project" label="项目">
            <Input placeholder="项目名称" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                创建
              </Button>
              <Button onClick={() => setDrawerOpen(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}
