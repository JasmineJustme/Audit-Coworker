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
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import {
  getWAgents,
  toggleWAgent,
  deleteWAgent,
  testWAgent,
} from '@/api/config';
import type { WAgent } from '@/types/wagent';
import type { PaginatedData } from '@/types/api';

const { Title } = Typography;

export default function ConfigWAgentsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PaginatedData<WAgent> | null>(null);

  const loadWAgents = async (page = 1, size = 20) => {
    setLoading(true);
    try {
      const res = await getWAgents({ page, size });
      const body = (res as { data: unknown }).data;
      const payload = (body as { data?: PaginatedData<WAgent> })?.data ?? body;
      setData((payload as PaginatedData<WAgent>) ?? null);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWAgents();
  }, []);

  const handleToggle = async (id: string) => {
    try {
      await toggleWAgent(id);
      message.success('状态已更新');
      loadWAgents();
    } catch {
      message.error('更新失败');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteWAgent(id);
      message.success('已删除');
      loadWAgents();
    } catch {
      message.error('删除失败');
    }
  };

  const handleTest = async (id: string) => {
    try {
      await testWAgent(id);
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
      render: (name: string, row: WAgent) => (
        <Button type="link" onClick={() => navigate(`/config/wagents/${row.id}`)}>
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
      title: '当前版本',
      dataIndex: 'current_version',
      key: 'current_version',
      width: 100,
      render: (v: number) => v ?? '-',
    },
    {
      title: '来源',
      dataIndex: 'source',
      key: 'source',
      width: 100,
      render: (v: string) => v || '-',
    },
    {
      title: '状态',
      dataIndex: 'is_enabled',
      key: 'is_enabled',
      width: 100,
      render: (enabled: boolean, row: WAgent) => (
        <Switch checked={enabled} onChange={() => handleToggle(row.id)} />
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
      title: '操作',
      key: 'actions',
      width: 240,
      render: (_: unknown, row: WAgent) => (
        <Space wrap>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => navigate(`/config/wagents/${row.id}`)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            icon={<HistoryOutlined />}
            onClick={() => navigate(`/config/wagents/${row.id}/versions`)}
          >
            版本
          </Button>
          <Button type="link" size="small" onClick={() => handleTest(row.id)}>
            测试
          </Button>
          <Popconfirm
            title="确定删除该 W-Agent？"
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
          W-Agent 管理
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/config/wagents/new')}
        >
          新建 W-Agent
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
          onChange: (page, pageSize) => loadWAgents(page, pageSize ?? 20),
        }}
      />
    </div>
  );
}
