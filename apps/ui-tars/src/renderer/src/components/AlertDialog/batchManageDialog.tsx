/**
 * Copyright (c) 2025 Bytedance, Inc. and its affiliates.
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
} from '@renderer/components/ui/dialog';
import { Button } from '@renderer/components/ui/button';
import { Checkbox } from '@renderer/components/ui/checkbox';
import { SessionItem } from '@renderer/db/session';

const formatDate = (timestamp: number) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  } else if (diffDays < 7) {
    return `${diffDays}天前`;
  } else {
    return date.toLocaleDateString('zh-CN', {
      month: '2-digit',
      day: '2-digit'
    });
  }
};

interface BatchManageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  history: SessionItem[];
  onBatchDelete: (sessionIds: string[]) => void;
}

export function BatchManageDialog({
  open,
  onOpenChange,
  history,
  onBatchDelete,
}: BatchManageDialogProps) {
  const [selectedSessions, setSelectedSessions] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedSessions(new Set(history.map(session => session.id)));
    } else {
      setSelectedSessions(new Set());
    }
  };

  const handleSelectSession = (sessionId: string, checked: boolean) => {
    const newSelected = new Set(selectedSessions);
    if (checked) {
      newSelected.add(sessionId);
    } else {
      newSelected.delete(sessionId);
    }
    setSelectedSessions(newSelected);
    setSelectAll(newSelected.size === history.length && history.length > 0);
  };

  const handleBatchDelete = () => {
    if (selectedSessions.size > 0) {
      onBatchDelete(Array.from(selectedSessions));
      setSelectedSessions(new Set());
      setSelectAll(false);
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    setSelectedSessions(new Set());
    setSelectAll(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[50vw] h-[60vh] p-0 gap-0 bg-white rounded-xl border-0 shadow-lg flex flex-col [&>button]:hidden">
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-lg font-medium text-gray-900">管理对话记录</h2>
        </div>

        {/* 对话列表 */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {history.map((session, index) => (
            <div
              key={session.id}
              className={`flex items-center px-6 py-2.5 hover:bg-gray-50 ${
                index !== history.length - 1 ? 'border-b border-gray-50' : ''
              }`}
            >
              <Checkbox
                checked={selectedSessions.has(session.id)}
                onCheckedChange={(checked) =>
                  handleSelectSession(session.id, checked as boolean)
                }
                className="mr-3 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate mb-0.5">
                  {session.name}
                </div>
                <div className="text-xs text-gray-500">
                  {formatDate(session.updatedAt)}
                </div>
              </div>
              <Trash2
                className="h-4 w-4 text-gray-300 hover:text-red-500 cursor-pointer ml-3 flex-shrink-0"
                onClick={() => handleSelectSession(session.id, !selectedSessions.has(session.id))}
              />
            </div>
          ))}

          {history.length === 0 && (
            <div className="text-center py-12 text-gray-500 text-sm">
              暂无对话记录
            </div>
          )}
        </div>

        {/* 底部操作栏 */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl flex-shrink-0">
          <div className="flex items-center">
            <Checkbox
              checked={selectAll}
              onCheckedChange={handleSelectAll}
              className="mr-2 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
            />
            <span className="text-sm text-gray-600">全选</span>
          </div>
          <div className="flex gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="text-gray-600 hover:text-gray-800 hover:bg-gray-200"
            >
              取消
            </Button>
            <Button
              size="sm"
              onClick={handleBatchDelete}
              disabled={selectedSessions.size === 0}
              className="bg-red-500 hover:bg-red-600 text-white disabled:bg-gray-300 disabled:text-gray-500"
            >
              删除对话
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
