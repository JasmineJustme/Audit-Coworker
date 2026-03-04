import { useEffect, useState } from 'react';
import {
  Card,
  Button,
  Space,
  Checkbox,
  Select,
  DatePicker,
  Typography,
  message,
  Empty,
} from 'antd';
import {
  getReviewPending,
  confirmReview,
  rejectReview,
  batchConfirmReview,
  batchRejectReview,
} from '@/api/todos';
import type { Todo } from '@/types/todo';
import SourceTag from '@/components/SourceTag';
import ReasonCollapse from '@/components/ReasonCollapse';
import { PRIORITY_MAP } from '@/constants/status';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const PRIORITY_OPTIONS = Object.entries(PRIORITY_MAP).map(([k, v]) => ({
  value: k,
  label: v.text,
}));

interface ReviewCardProps {
  todo: Todo;
  selected: boolean;
  onSelect: (checked: boolean) => void;
  onConfirm: () => void;
  onReject: () => void;
}

function ReviewCard({
  todo,
  selected,
  onSelect,
  onConfirm,
  onReject,
}: ReviewCardProps) {
  const [priority, setPriority] = useState(todo.priority);
  const [dueDate, setDueDate] = useState(todo.due_date ? dayjs(todo.due_date) : null);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await confirmReview(todo.id);
      message.success('已确认');
      onConfirm();
    } catch {
      message.error('确认失败');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmWithEdit = async () => {
    setLoading(true);
    try {
      await confirmReview(todo.id, {
        priority,
        due_date: dueDate?.toISOString(),
      });
      message.success('已修改并确认');
      onConfirm();
    } catch {
      message.error('操作失败');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    try {
      await rejectReview(todo.id);
      message.success('已拒绝');
      onReject();
    } catch {
      message.error('拒绝失败');
    } finally {
      setLoading(false);
    }
  };

  const isDuplicate = !!todo.duplicate_of;

  return (
    <Card
      size="small"
      style={{
        marginBottom: 12,
        borderColor: isDuplicate ? '#faad14' : undefined,
        backgroundColor: isDuplicate ? 'rgba(250, 173, 20, 0.08)' : undefined,
      }}
      extra={
        <Checkbox
          checked={selected}
          onChange={(e) => onSelect(e.target.checked)}
        />
      }
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
        <SourceTag source={todo.source} />
        <div style={{ flex: 1 }}>
          <Title level={5} style={{ margin: '0 0 4px 0' }}>
            {todo.title}
          </Title>
          {todo.description && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {todo.description}
            </Text>
          )}
        </div>
      </div>

      <Space wrap style={{ marginBottom: 8 }}>
        <span>优先级：</span>
        <Select
          size="small"
          value={priority}
          onChange={setPriority}
          options={PRIORITY_OPTIONS}
          style={{ width: 80 }}
        />
        <span>截止时间：</span>
        <DatePicker
          size="small"
          value={dueDate}
          onChange={setDueDate}
          showTime
          style={{ width: 180 }}
        />
      </Space>

      {todo.review_reason && (
        <div style={{ marginBottom: 12 }}>
          <ReasonCollapse reason={todo.review_reason} />
        </div>
      )}

      {isDuplicate && (
        <Text type="warning" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
          可能与已有任务重复
        </Text>
      )}

      <Space>
        <Button type="primary" size="small" onClick={handleConfirm} loading={loading}>
          确认
        </Button>
        <Button size="small" onClick={() => handleConfirmWithEdit()} loading={loading}>
          修改后确认
        </Button>
        <Button danger size="small" onClick={handleReject} loading={loading}>
          拒绝
        </Button>
      </Space>
    </Card>
  );
}

export default function TodosReviewPage() {
  const [items, setItems] = useState<Todo[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const loadPending = async () => {
    setLoading(true);
    try {
      const res = await getReviewPending();
      const body = (res as { data: { data?: Todo[] } }).data;
      const list = Array.isArray(body?.data) ? body.data : (Array.isArray(body) ? body : []);
      setItems(list);
      setSelectedIds([]);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPending();
  }, []);

  const handleBatchConfirm = async () => {
    if (selectedIds.length === 0) {
      message.warning('请选择要确认的项');
      return;
    }
    setLoading(true);
    try {
      await batchConfirmReview(selectedIds);
      message.success(`已批量确认 ${selectedIds.length} 条`);
      loadPending();
    } catch {
      message.error('批量确认失败');
    } finally {
      setLoading(false);
    }
  };

  const handleBatchReject = async () => {
    if (selectedIds.length === 0) {
      message.warning('请选择要拒绝的项');
      return;
    }
    setLoading(true);
    try {
      await batchRejectReview(selectedIds);
      message.success(`已批量拒绝 ${selectedIds.length} 条`);
      loadPending();
    } catch {
      message.error('批量拒绝失败');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id: string, checked: boolean) => {
    setSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((x) => x !== id)
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={3} style={{ margin: 0 }}>
          智能梳理确认
        </Title>
        {items.length > 0 && (
          <Space>
            <Button
              type="primary"
              onClick={handleBatchConfirm}
              loading={loading}
              disabled={selectedIds.length === 0}
            >
              批量确认
            </Button>
            <Button
              danger
              onClick={handleBatchReject}
              loading={loading}
              disabled={selectedIds.length === 0}
            >
              批量拒绝
            </Button>
          </Space>
        )}
      </div>

      {loading && items.length === 0 ? (
        <div style={{ padding: 48, textAlign: 'center' }}>
          <Text type="secondary">加载中...</Text>
        </div>
      ) : items.length === 0 ? (
        <Empty description="暂无待确认的梳理任务" />
      ) : (
        <div>
          {items.map((todo) => (
            <ReviewCard
              key={todo.id}
              todo={todo}
              selected={selectedIds.includes(todo.id)}
              onSelect={(checked) => toggleSelect(todo.id, checked)}
              onConfirm={loadPending}
              onReject={loadPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}
