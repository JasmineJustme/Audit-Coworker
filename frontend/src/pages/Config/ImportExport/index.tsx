import { useState } from 'react';
import { Card, Button, Upload, message, Typography, Modal, Space } from 'antd';
import { DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import { exportConfig, previewImport, importConfig } from '@/api/config';

const { Title, Text } = Typography;

export default function ConfigImportExportPage() {
  const [previewData, setPreviewData] = useState<Record<string, unknown> | null>(
    null
  );
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);

  const handleExport = async () => {
    try {
      const res = await exportConfig();
      const body = (res as { data: unknown }).data;
      const data = (body as { data?: unknown })?.data ?? body;
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-coworker-config-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      message.success('导出成功');
    } catch {
      message.error('导出失败');
    }
  };

  const handlePreview = async () => {
    if (!importFile) {
      message.warning('请先选择文件');
      return;
    }
    setPreviewLoading(true);
    setPreviewModalOpen(true);
    setPreviewData(null);
    try {
      const res = await previewImport(importFile);
      const body = (res as { data: unknown }).data;
      const data = (body as { data?: Record<string, unknown> })?.data ?? body;
      setPreviewData(data as Record<string, unknown>);
    } catch {
      message.error('预览失败');
      setPreviewModalOpen(false);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!importFile) {
      message.warning('请先选择文件并预览');
      return;
    }
    setImportLoading(true);
    try {
      await importConfig(importFile);
      message.success('导入成功');
      setPreviewModalOpen(false);
      setPreviewData(null);
      setImportFile(null);
    } catch {
      message.error('导入失败');
    } finally {
      setImportLoading(false);
    }
  };

  return (
    <div>
      <Title level={3} style={{ marginBottom: 16 }}>
        配置导入/导出
      </Title>

      <Card title="导出配置" style={{ marginBottom: 16 }}>
        <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
          导出所有配置为 JSON 文件
        </Text>
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          onClick={handleExport}
        >
          导出所有配置
        </Button>
      </Card>

      <Card title="导入配置">
        <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
          上传 JSON 配置文件，预览后确认导入
        </Text>
        <Space>
          <Upload
            accept=".json"
            maxCount={1}
            fileList={
              importFile
                ? [
                    {
                      uid: '-1',
                      name: importFile.name,
                      status: 'done' as const,
                    },
                  ]
                : []
            }
            beforeUpload={(file) => {
              setImportFile(file);
              return false;
            }}
            onRemove={() => setImportFile(null)}
          >
            <Button icon={<UploadOutlined />}>选择文件</Button>
          </Upload>
          <Button onClick={handlePreview} disabled={!importFile}>
            预览
          </Button>
        </Space>
      </Card>

      <Modal
        title="导入预览"
        open={previewModalOpen}
        onCancel={() => {
          setPreviewModalOpen(false);
          setPreviewData(null);
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setPreviewModalOpen(false);
              setPreviewData(null);
            }}
          >
            取消
          </Button>,
          <Button
            key="import"
            type="primary"
            loading={importLoading}
            onClick={handleConfirmImport}
            disabled={!previewData}
          >
            确认导入
          </Button>,
        ]}
        width={640}
      >
        {previewLoading ? (
          <div style={{ padding: 24, textAlign: 'center' }}>加载中...</div>
        ) : previewData ? (
          <pre
            style={{
              maxHeight: 400,
              overflow: 'auto',
              fontSize: 12,
              background: '#f5f5f5',
              padding: 12,
              borderRadius: 4,
            }}
          >
            {JSON.stringify(previewData, null, 2)}
          </pre>
        ) : null}
      </Modal>
    </div>
  );
}
