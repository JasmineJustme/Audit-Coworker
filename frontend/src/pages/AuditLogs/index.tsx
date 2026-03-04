import { useEffect, useState } from 'react';
import {
  Table,
  Select,
  DatePicker,
  Space,
  Button,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import { DownloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { getAuditLogs } from '@/api/auditLogs';
import { formatDate } from '@/utils/format';

const { RangePicker } = DatePicker;
const { Title } = Typography;

const ACTION_LABELS: Record<string, string> = {
  create: '新建',
  update: '修改',
  delete: '删除',
  toggle: '切换状态',
  test: '测试',
  import: '导入',
  export: '导出',
};

const RESOURCE_TYPE_OPTIONS = [
  { value: 'agent', label: 'Agent' },
  { value: 'workflow', label: 'Workflow' },
  { value: 'wagent', label: 'W-Agent' },
  { value: 'todo', label: '待办' },
  { value: 'datasource', label: '数据源' },
  { value: 'llm', label: 'LLM' },
  { value: 'schedule', label: '调度' },
  { value: 'notification', label: '通知' },
];

const ACTION_OPTIONS = Object.entries(ACTION_LABELS).map(([value, label]) => ({
  value,
  label,
}));

interface AuditLogItem {
  id: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  resource_name?: string;
  details?: Record<string, unknown>;
  ip_address?: string;
  user_id: string;
  created_at: string;
}

function exportToCsv(items: AuditLogItem[]) {
  const headers = ['时间', '操作', '资源类型', '资源名称', '用户', 'IP地址', '详情'];
  const rows = items.map((row) => {
    const actionText = ACTION_LABELS[row.action] ?? row.action;
    const details = row.details ? JSON.stringify(row.details) : '';
    return [
      formatDate(row.created_at),
      actionText,
      row.resource_type,
      row.resource_name ?? '',
      row.user_id,
      row.ip_address ?? '',
      details,
    ].map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',');
  });
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AuditLogsPage() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{
    items: AuditLogItem[];
    total: number;
    page: number;
    size: number;
    pages: number;
  }>({
    items: [],
    total: 0,
    page: 1,
    size: 20,
    pages: 0,
  });
  const [filters, setFilters] = useState<{
    action?: string;
    resource_type?: string;
    dateRange?: [string, string] | null;
  }>({});

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await getAuditLogs({
        page: data.page,
        size: data.size,
        action: filters.action || undefined,
        resource_type: filters.resource_type || undefined,
        start: filters.dateRange?.[0],
        end: filters.dateRange?.[1],
      });
      const body = (res as { data: { data?: typeof data } }).data;
      const payload = body?.data ?? body;
      if (payload && typeof payload === 'object' && 'items' in payload) {
        setData(payload as typeof data);
      }
    } catch {
      setData((d) => ({ ...d, items: [] }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [data.page, data.size, filters.action, filters.resource_type]);

  const handleFilterChange = (key: string, value: unknown) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setData((d) => ({ ...d, page: 1 }));
  };

  const handleDateRangeChange = (_: unknown, dateStrings: [string, string]) => {
    handleFilterChange('dateRange', dateStrings[0] && dateStrings[1] ? dateStrings : null);
  };

  const columns: ColumnsType<AuditLogItem> = [
    {
      title: '时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (v: string) => formatDate(v),
    },
    {
      title: '操作',
      dataIndex: 'action',
      key: 'action',
      width: 100,
      render: (v: string) => ACTION_LABELS[v] ?? v,
    },
    {
      title: '资源类型',
      dataIndex: 'resource_type',
      key: 'resource_type',
      width: 100,
    },
    {
      title: '资源名称',
      dataIndex: 'resource_name',
      key: 'resource_name',
      ellipsis: true,
    },
    {
      title: '用户',
      dataIndex: 'user_id',
      key: 'user_id',
      width: 120,
    },
    {
      title: 'IP地址',
      dataIndex: 'ip_address',
      key: 'ip_address',
      width: 140,
    },
    {
      title: '详情',
      key: 'details',
      width: 80,
      render: (_, record) =>
        record.details ? (
          <span style={{ color: '#1890ff', cursor: 'pointer' }}>查看</span>
        ) : (
          '-'
        ),
    },
  ];

  return (
    <div>
      <Title level={3} style={{ marginBottom: 16 }}>
        操作审计日志
      </Title>

      <Space wrap style={{ marginBottom: 16 }}>
        <Select
          placeholder="操作"
          allowClear
          style={{ width: 120 }}
          value={filters.action || undefined}
          onChange={(v) => handleFilterChange('action', v ?? undefined)}
          options={ACTION_OPTIONS}
        />
        <Select
          placeholder="资源类型"
          allowClear
          style={{ width: 120 }}
          value={filters.resource_type || undefined}
          onChange={(v) => handleFilterChange('resource_type', v ?? undefined)}
          options={RESOURCE_TYPE_OPTIONS}
        />
        <RangePicker
          onChange={handleDateRangeChange}
          value={
            filters.dateRange?.[0] && filters.dateRange?.[1]
              ? ([dayjs(filters.dateRange[0]), dayjs(filters.dateRange[1])] as [dayjs.Dayjs, dayjs.Dayjs])
              : null
          }
        />
        <Button icon={<DownloadOutlined />} onClick={() => exportToCsv(data.items)}>
          导出 CSV
        </Button>
      </Space>

      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={data.items}
        pagination={{
          current: data.page,
          pageSize: data.size,
          total: data.total,
          showSizeChanger: true,
          showTotal: (t) => `共 ${t} 条`,
          onChange: (page, size) =>
            setData((d) => ({ ...d, page: page ?? 1, size: size ?? 20 })),
        }}
        expandable={{
          expandedRowRender: (record) => (
            <pre style={{ margin: 0, fontSize: 12 }}>
              {JSON.stringify(record.details ?? {}, null, 2)}
            </pre>
          ),
          rowExpandable: (record) => !!record.details && Object.keys(record.details).length > 0,
        }}
      />
    </div>
  );
}
