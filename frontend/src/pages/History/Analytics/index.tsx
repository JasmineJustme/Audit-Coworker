import { useEffect, useState } from 'react';
import { Card, Col, DatePicker, Row, Skeleton, Typography } from 'antd';
import ReactECharts from 'echarts-for-react';
import dayjs from 'dayjs';
import { getAgentStats, getTaskStats, getLLMUsage } from '@/api/history';

const CHART_COLORS = ['#1677ff', '#52c41a', '#faad14', '#ff4d4f', '#722ed1', '#13c2c2'];

interface AgentStatItem {
  name?: string;
  count?: number;
  success_count?: number;
  success_rate?: number;
}

interface TaskStatItem {
  source?: string;
  count?: number;
}

interface LLMUsagePoint {
  date?: string;
  tokens?: number;
  [key: string]: unknown;
}

function extractData<T>(res: unknown): T | null {
  const body = (res as { data?: { data?: T } })?.data;
  if (!body || typeof body !== 'object') return null;
  return (body as { data?: T }).data ?? (body as T);
}

export default function HistoryAnalyticsPage() {
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(7, 'day'),
    dayjs(),
  ]);
  const [agentLoading, setAgentLoading] = useState(true);
  const [taskLoading, setTaskLoading] = useState(true);
  const [llmLoading, setLlmLoading] = useState(true);

  const [agentStats, setAgentStats] = useState<AgentStatItem[]>([]);
  const [taskStats, setTaskStats] = useState<TaskStatItem[]>([]);
  const [llmUsage, setLlmUsage] = useState<LLMUsagePoint[]>([]);

  useEffect(() => {
    const params = {
      start_time: dateRange[0]?.toISOString(),
      end_time: dateRange[1]?.toISOString(),
    };
    const load = async () => {
      setAgentLoading(true);
      try {
        const res = await getAgentStats(params);
        const data = extractData<{ items?: AgentStatItem[]; data?: AgentStatItem[] }>(res);
        const items = data?.items ?? data?.data ?? (Array.isArray(data) ? data : []);
        setAgentStats(Array.isArray(items) ? items : []);
      } catch {
        setAgentStats([]);
      } finally {
        setAgentLoading(false);
      }
    };
    load();
  }, [dateRange[0]?.valueOf(), dateRange[1]?.valueOf()]);

  useEffect(() => {
    const params = {
      start_time: dateRange[0]?.toISOString(),
      end_time: dateRange[1]?.toISOString(),
    };
    const load = async () => {
      setTaskLoading(true);
      try {
        const res = await getTaskStats(params);
        const data = extractData<{ items?: TaskStatItem[]; data?: TaskStatItem[] }>(res);
        const items = data?.items ?? data?.data ?? (Array.isArray(data) ? data : []);
        setTaskStats(Array.isArray(items) ? items : []);
      } catch {
        setTaskStats([]);
      } finally {
        setTaskLoading(false);
      }
    };
    load();
  }, [dateRange[0]?.valueOf(), dateRange[1]?.valueOf()]);

  useEffect(() => {
    const params = {
      start_time: dateRange[0]?.toISOString(),
      end_time: dateRange[1]?.toISOString(),
    };
    const load = async () => {
      setLlmLoading(true);
      try {
        const res = await getLLMUsage(params);
        const data = extractData<{ items?: LLMUsagePoint[]; data?: LLMUsagePoint[] }>(res);
        const items = data?.items ?? data?.data ?? (Array.isArray(data) ? data : []);
        setLlmUsage(Array.isArray(items) ? items : []);
      } catch {
        setLlmUsage([]);
      } finally {
        setLlmLoading(false);
      }
    };
    load();
  }, [dateRange[0]?.valueOf(), dateRange[1]?.valueOf()]);

  const agentBarOption = {
    color: CHART_COLORS,
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', top: 10, containLabel: true },
    xAxis: {
      type: 'category',
      data: agentStats.map((a) => a.name ?? ''),
      axisLabel: { rotate: 30 },
    },
    yAxis: { type: 'value', name: '调用次数' },
    series: [
      {
        name: '调用次数',
        type: 'bar',
        data: agentStats.map((a) => a.count ?? 0),
      },
    ],
  };

  const agentPieOption = {
    color: CHART_COLORS,
    tooltip: { trigger: 'item' },
    legend: { orient: 'vertical', left: 'left', top: 'center' },
    series: [
      {
        name: '成功率',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['60%', '50%'],
        data: agentStats.map((a) => ({
          name: a.name ?? '未知',
          value: a.success_rate ?? 0,
        })),
        emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.5)' } },
      },
    ],
  };

  const taskPieOption = {
    color: CHART_COLORS,
    tooltip: { trigger: 'item' },
    legend: { orient: 'vertical', left: 'left', top: 'center' },
    series: [
      {
        name: '任务来源',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['60%', '50%'],
        data: taskStats.map((t) => ({
          name: t.source ?? '未知',
          value: t.count ?? 0,
        })),
        emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.5)' } },
      },
    ],
  };

  const llmAreaOption = {
    color: CHART_COLORS,
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', top: 10, containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: llmUsage.map((p) => p.date ?? ''),
    },
    yAxis: { type: 'value', name: 'Token 消耗' },
    series: [
      {
        name: 'Token',
        type: 'line',
        smooth: true,
        areaStyle: {},
        data: llmUsage.map((p) => p.tokens ?? 0),
      },
    ],
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          数据分析
        </Typography.Title>
        <DatePicker.RangePicker
          value={dateRange}
          onChange={(dates) => {
            if (dates?.[0] && dates?.[1]) {
              setDateRange([dates[0], dates[1]]);
            }
          }}
        />
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="Agent 调用频次">
            {agentLoading ? (
              <Skeleton active paragraph={{ rows: 6 }} />
            ) : (
              <ReactECharts option={agentBarOption} style={{ height: 300 }} />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Agent 成功率">
            {agentLoading ? (
              <Skeleton active paragraph={{ rows: 6 }} />
            ) : (
              <ReactECharts option={agentPieOption} style={{ height: 300 }} />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="任务来源占比">
            {taskLoading ? (
              <Skeleton active paragraph={{ rows: 6 }} />
            ) : (
              <ReactECharts option={taskPieOption} style={{ height: 300 }} />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="LLM Token 消耗趋势">
            {llmLoading ? (
              <Skeleton active paragraph={{ rows: 6 }} />
            ) : (
              <ReactECharts option={llmAreaOption} style={{ height: 300 }} />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
