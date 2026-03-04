import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  Button,
  Space,
  Switch,
  Popconfirm,
  message,
  Typography,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import {
  getWorkflows,
  toggleWorkflow,
  deleteWorkflow,
  testWorkflow,
} from '@/api/config';
import type { Workflow } from '@/types/workflow';
import type { PaginatedData } from '@/types/api';

const { Title } = Typography;

export default function ConfigWorkflowsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PaginatedData<Workflow> | null>(null);

  const loadWorkflows = async (page = 1, size = 20) => {
    setLoading(true);
    try {
      const res = await getWorkflows({ page, size });
      const body = (res as { data: unknown }).data;
      const payload = (body as { data?: PaginatedData<Workflow> })?.data ?? body;
      setData((payload as PaginatedData<Workflow>) ?? null);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkflows();
  }, []);

  const handleToggle = async (id: string) => {
    try {
      await toggleWorkflow(id);
      message.success('状态已更新');
      loadWorkflows();
    } catch {
      message.error('更新失败');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteWorkflow(id);
      message.success('已删除');
      loadWorkflows();
    } catch {
      message.error('删除失败');
    }
  };

  const handleTest = async (id: string) => {
    try {
      await testWorkflow(id);
      message.success('连接测试成功');
    } catch {
      message.error('连接测试失败');
    }
  };

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, row: Workflow) => (
        <Button type="link" onClick={() => navigate(`/config/workflows/${row.id}`)}>
          {name}
        </Button>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (v: string) => v || '-',
    },
    {
      title: '能力标签',
      dataIndex: 'capability_tags',
      key: 'capability_tags',
      render: (tags: string[]) => (tags?.length ? tags.join(', ') : '-'),
    },
    {
      title: '状态',
      dataIndex: 'is_enabled',
      key: 'is_enabled',
      width: 100,
      render: (enabled: boolean, row: Workflow) => (
        <Switch checked={enabled} onChange={() => handleToggle(row.id)} />
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 180,
      render: (_: unknown, row: Workflow) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => navigate(`/config/workflows/${row.id}`)}
          >
            编辑
          </Button>
          <Button type="link" size="small" onClick={() => handleTest(row.id)}>
            测试
          </Button>
          <Popconfirm
            title="确定删除该 Workflow？"
            onConfirm={() => handleDelete(row.id)}
          >
            <Button type="link" danger size="small" icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <Title level={3} style={{ margin: 0 }}>
          Workflow 管理
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/config/workflows/new')}
        >
          新建 Workflow
        </Button>
      </div>
      <Table
        loading={loading}
        dataSource={data?.items ?? []}
        columns={columns}
        rowKey="id"
        pagination={{
          total: data?.total ?? 0,
          pageSize: data?.size ?? 20,
          current: data?.page ?? 1,
          showSizeChanger: true,
          showTotal: (t) => `共 ${t} 条`,
          onChange: (page, pageSize) => loadWorkflows(page, pageSize ?? 20),
        }}
      />
    </div>
  );
}
