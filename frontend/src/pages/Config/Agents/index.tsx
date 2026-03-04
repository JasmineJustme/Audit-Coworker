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
import { getAgents, toggleAgent, deleteAgent, testAgent } from '@/api/config';
import type { Agent } from '@/types/agent';
import type { PaginatedData } from '@/types/api';

const { Title } = Typography;

export default function ConfigAgentsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PaginatedData<Agent> | null>(null);

  const loadAgents = async (page = 1, size = 20) => {
    setLoading(true);
    try {
      const res = await getAgents({ page, size });
      const body = (res as { data: unknown }).data;
      const payload = (body as { data?: PaginatedData<Agent> })?.data ?? body;
      setData((payload as PaginatedData<Agent>) ?? null);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAgents();
  }, []);

  const handleToggle = async (id: string) => {
    try {
      await toggleAgent(id);
      message.success('状态已更新');
      loadAgents();
    } catch {
      message.error('更新失败');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAgent(id);
      message.success('已删除');
      loadAgents();
    } catch {
      message.error('删除失败');
    }
  };

  const handleTest = async (id: string) => {
    try {
      await testAgent(id);
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
      render: (name: string, row: Agent) => (
        <Button type="link" onClick={() => navigate(`/config/agents/${row.id}`)}>
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
      render: (tags: string[]) =>
        tags?.length ? tags.join(', ') : '-',
    },
    {
      title: '状态',
      dataIndex: 'is_enabled',
      key: 'is_enabled',
      width: 100,
      render: (enabled: boolean, row: Agent) => (
        <Switch
          checked={enabled}
          onChange={() => handleToggle(row.id)}
        />
      ),
    },
    {
      title: '调用次数',
      dataIndex: 'call_count',
      key: 'call_count',
      width: 100,
      render: (v: number) => v ?? 0,
    },
    {
      title: '成功率',
      key: 'success_rate',
      width: 100,
      render: (_: unknown, row: Agent) => {
        const total = row.call_count ?? 0;
        const success = row.success_count ?? 0;
        if (total === 0) return '-';
        return `${Math.round((success / total) * 100)}%`;
      },
    },
    {
      title: '操作',
      key: 'actions',
      width: 180,
      render: (_: unknown, row: Agent) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => navigate(`/config/agents/${row.id}`)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => handleTest(row.id)}
          >
            测试
          </Button>
          <Popconfirm
            title="确定删除该 Agent？"
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
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>
          Agent 管理
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/config/agents/new')}
        >
          新建 Agent
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
          onChange: (page, pageSize) => loadAgents(page, pageSize ?? 20),
        }}
      />
    </div>
  );
}
