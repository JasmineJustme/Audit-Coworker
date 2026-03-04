import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Table,
  Button,
  Space,
  Popconfirm,
  message,
  Typography,
} from 'antd';
import { ArrowLeftOutlined, EyeOutlined, RollbackOutlined } from '@ant-design/icons';
import {
  getWAgentVersions,
  rollbackWAgent,
} from '@/api/config';
import type { WAgentVersion } from '@/types/wagent';

const { Title } = Typography;

export default function ConfigWAgentsVersionsPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [versions, setVersions] = useState<WAgentVersion[]>([]);

  const loadVersions = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await getWAgentVersions(id);
      const body = (res as { data: unknown }).data;
      const data = (body as { data?: WAgentVersion[] })?.data ?? body;
      setVersions(Array.isArray(data) ? data : []);
    } catch {
      setVersions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVersions();
  }, [id]);

  const handleRollback = async (versionId: string) => {
    if (!id) return;
    try {
      await rollbackWAgent(id, versionId);
      message.success('回滚成功');
      loadVersions();
      navigate(`/config/wagents/${id}`);
    } catch {
      message.error('回滚失败');
    }
  };

  const columns = [
    {
      title: '版本号',
      dataIndex: 'version',
      key: 'version',
      width: 100,
      render: (v: number) => `v${v}`,
    },
    {
      title: '变更说明',
      dataIndex: 'change_note',
      key: 'change_note',
      ellipsis: true,
      render: (v: string) => v || '-',
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (v: string) => (v ? new Date(v).toLocaleString() : '-'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 160,
      render: (_: unknown, row: WAgentVersion) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => {
              // View version detail - could open modal or navigate
              message.info(`版本 v${row.version} 详情`);
            }}
          >
            查看
          </Button>
          <Popconfirm
            title="确定回滚到此版本？"
            onConfirm={() => handleRollback(row.id)}
          >
            <Button
              type="link"
              size="small"
              icon={<RollbackOutlined />}
            >
              回滚
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
          alignItems: 'center',
          gap: 8,
          marginBottom: 16,
        }}
      >
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(`/config/wagents/${id}`)}
        >
          返回
        </Button>
        <Title level={3} style={{ margin: 0 }}>
          W-Agent 版本历史
        </Title>
      </div>
      <Table
        loading={loading}
        dataSource={versions}
        columns={columns}
        rowKey="id"
        pagination={false}
      />
    </div>
  );
}
