import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Button,
  Card,
  DatePicker,
  Input,
  Select,
  Space,
  Table,
  Typography,
  Drawer,
  message,
} from 'antd';
import { ExportOutlined, BarChartOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { saveAs } from 'file-saver';
import {
  getHistory,
  getHistoryDetail,
  exportHistory,
} from '@/api/history';
import StatusTag from '@/components/StatusTag';
import JsonViewer from '@/components/JsonViewer';
import { formatDate, formatDuration } from '@/utils/format';
import { ROUTES } from '@/constants/routes';
import { STATUS_TAG_MAP } from '@/constants/status';

const STATUS_OPTIONS = Object.entries(STATUS_TAG_MAP).map(([k, v]) => ({
  value: k,
  label: v.text,
}));

interface HistoryItem {
  id?: string;
  agent_name?: string;
  wagent_name?: string;
  status?: string;
  input_params?: Record<string, unknown> | string;
  output_result?: unknown;
  execution_log?: string;
  started_at?: string;
  duration_ms?: number;
  [key: string]: unknown;
}

function extractData<T>(res: unknown): T | null {
  const body = (res as { data?: { data?: T } })?.data;
  if (!body || typeof body !== 'object') return null;
  return (body as { data?: T }).data ?? (body as T);
}

function truncate(str: string, len: number) {
  if (!str || str.length <= len) return str ?? '-';
  return str.slice(0, len) + '...';
}

export default function HistoryPage() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{ items: HistoryItem[]; total: number; page: number; size: number }>({
    items: [],
    total: 0,
    page: 1,
    size: 20,
  });
  const [filters, setFilters] = useState<{
    start_time?: string;
    end_time?: string;
    keyword?: string;
    status?: string;
  }>({});
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [detailRecord, setDetailRecord] = useState<HistoryItem | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await getHistory({
        page: data.page,
        size: data.size,
        status: filters.status || undefined,
        start_time: filters.start_time,
        end_time: filters.end_time,
        keyword: filters.keyword,
      });
      const payload = extractData<{ items?: HistoryItem[]; total?: number; page?: number; size?: number }>(res);
      const items = payload?.items ?? [];
      const total = payload?.total ?? 0;
      const page = payload?.page ?? 1;
      const size = payload?.size ?? 20;
      setData({ items: Array.isArray(items) ? items : [], total, page, size });
    } catch {
      setData((d) => ({ ...d, items: [] }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [data.page, data.size, filters.status, filters.start_time, filters.end_time, filters.keyword]);

  const handleViewDetail = async (record: HistoryItem) => {
    setDetailRecord(record);
    setDetailDrawerOpen(true);
    if (!record.id) return;
    setDetailLoading(true);
    try {
      const res = await getHistoryDetail(record.id);
      const full = extractData<HistoryItem>(res);
      if (full) setDetailRecord(full);
    } catch {
      message.error('获取详情失败');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const res = await exportHistory({
        start_time: filters.start_time,
        end_time: filters.end_time,
      });
      const blob = (res as { data?: Blob }).data;
      if (blob instanceof Blob) {
        saveAs(blob, `history-export-${dayjs().format('YYYY-MM-DD-HHmm')}.xlsx`);
        message.success('导出成功');
      } else {
        message.error('导出失败');
      }
    } catch {
      message.error('导出失败');
    } finally {
      setExportLoading(false);
    }
  };

  const columns: ColumnsType<HistoryItem> = [
    {
      title: 'Agent/W-Agent名称',
      key: 'agent_name',
      render: (_, r) => r.wagent_name || r.agent_name || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (s: string) => (s ? <StatusTag status={s} /> : '-'),
    },
    {
      title: '输入参数',
      key: 'input_params',
      ellipsis: true,
      render: (_, r) => {
        const raw = typeof r.input_params === 'string' ? r.input_params : JSON.stringify(r.input_params ?? {});
        return truncate(raw, 50);
      },
    },
    {
      title: '开始时间',
      dataIndex: 'started_at',
      key: 'started_at',
      width: 160,
      render: (d: string) => formatDate(d),
    },
    {
      title: '耗时',
      dataIndex: 'duration_ms',
      key: 'duration_ms',
      width: 90,
      render: (ms: number) => formatDuration(ms),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Button type="link" size="small" onClick={() => handleViewDetail(record)}>
          查看详情
        </Button>
      ),
    },
  ];

  const expandedRowRender = (record: HistoryItem) => (
    <div style={{ padding: '8px 24px' }}>
      <Card size="small" title="输入参数" style={{ marginBottom: 12 }}>
        <JsonViewer data={record.input_params ?? {}} />
      </Card>
      <Card size="small" title="输出结果" style={{ marginBottom: 12 }}>
        <JsonViewer data={record.output_result ?? {}} />
      </Card>
      <Card size="small" title="执行日志">
        <pre
          style={{
            margin: 0,
            padding: 12,
            background: '#f5f5f5',
            borderRadius: 4,
            overflow: 'auto',
            fontSize: 12,
            maxHeight: 200,
          }}
        >
          {record.execution_log ?? '-'}
        </pre>
      </Card>
      <Typography.Text type="secondary">
        耗时: {formatDuration(record.duration_ms)}
      </Typography.Text>
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          执行历史
        </Typography.Title>
        <Space>
          <Link to={ROUTES.HISTORY_ANALYTICS}>
            <Button icon={<BarChartOutlined />}>数据分析</Button>
          </Link>
          <Button
            icon={<ExportOutlined />}
            onClick={handleExport}
            loading={exportLoading}
          >
            导出
          </Button>
        </Space>
      </div>

      <Space style={{ marginBottom: 16 }} wrap>
        <DatePicker.RangePicker
          placeholder={['开始时间', '结束时间']}
          showTime
          onChange={(dates) =>
            setFilters((f) => ({
              ...f,
              start_time: dates?.[0]?.toISOString(),
              end_time: dates?.[1]?.toISOString(),
            }))
          }
        />
        <Input.Search
          placeholder="Agent/W-Agent 名称"
          allowClear
          style={{ width: 200 }}
          onSearch={(v) => setFilters((f) => ({ ...f, keyword: v || undefined }))}
        />
        <Select
          placeholder="状态"
          allowClear
          style={{ width: 120 }}
          value={filters.status}
          onChange={(v) => setFilters((f) => ({ ...f, status: v }))}
          options={STATUS_OPTIONS}
        />
      </Space>

      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={data.items}
        expandable={{
          expandedRowRender,
          rowExpandable: () => true,
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
        title="执行详情"
        open={detailDrawerOpen}
        onClose={() => setDetailDrawerOpen(false)}
        width={560}
      >
        {detailLoading ? (
          <div>加载中...</div>
        ) : detailRecord ? (
          <div>
            <Card size="small" title="输入参数" style={{ marginBottom: 12 }}>
              <JsonViewer data={detailRecord.input_params ?? {}} />
            </Card>
            <Card size="small" title="输出结果" style={{ marginBottom: 12 }}>
              <JsonViewer data={detailRecord.output_result ?? {}} />
            </Card>
            <Card size="small" title="执行日志">
              <pre
                style={{
                  margin: 0,
                  padding: 12,
                  background: '#f5f5f5',
                  borderRadius: 4,
                  overflow: 'auto',
                  fontSize: 12,
                  maxHeight: 300,
                }}
              >
                {detailRecord.execution_log ?? '-'}
              </pre>
            </Card>
            <Typography.Text type="secondary">
              耗时: {formatDuration(detailRecord.duration_ms)}
            </Typography.Text>
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}
