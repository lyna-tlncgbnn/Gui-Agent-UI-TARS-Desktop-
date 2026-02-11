/**
 * Copyright (c) 2025 Bytedance, Inc. and its affiliates.
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Send } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@renderer/components/ui/card';
import { Button } from '@renderer/components/ui/button';
import { Textarea } from '@renderer/components/ui/textarea';

import { Operator } from '@main/store/types';
import { useSession } from '../../hooks/useSession';
import {
  checkVLMSettings,
  LocalSettingsDialog,
} from '@renderer/components/Settings/local';

import computerUseImg from '@resources/home_img/computer_use.png?url';
import browserUseImg from '@resources/home_img/browser_use.png?url';
import { sleep } from '@ui-tars/shared/utils';

import { FreeTrialDialog } from '../../components/AlertDialog/freeTrialDialog';
import { DragArea } from '../../components/Common/drag';

const Home = () => {
  const navigate = useNavigate();
  const { createSession } = useSession();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 新增状态
  const [instruction, setInstruction] = useState('');
  const [operatorType, setOperatorType] = useState<Operator>(Operator.LocalComputer);

  const [localConfig, setLocalConfig] = useState({
    open: false,
    operator: Operator.LocalComputer,
  });
  const [remoteConfig, setRemoteConfig] = useState({
    open: false,
    operator: Operator.RemoteComputer,
  });

  // 自动聚焦输入框
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const toRemoteComputer = async (value: 'free' | 'paid') => {
    console.log('toRemoteComputer', value);
    const session = await createSession('New Session', {
      operator: Operator.RemoteComputer,
      isFree: value === 'free',
    });

    if (value === 'free') {
      navigate('/free-remote', {
        state: {
          operator: Operator.RemoteComputer,
          sessionId: session?.id,
          isFree: true,
          from: 'home',
        },
      });

      return;
    }

    navigate('/paid-remote', {
      state: {
        operator: Operator.RemoteComputer,
        sessionId: session?.id,
        isFree: false,
        from: 'home',
      },
    });
  };

  const toRemoteBrowser = async (value: 'free' | 'paid') => {
    console.log('toRemoteBrowser', value);

    const session = await createSession('New Session', {
      operator: Operator.RemoteBrowser,
      isFree: value === 'free',
    });

    if (value === 'free') {
      navigate('/free-remote', {
        state: {
          operator: Operator.RemoteBrowser,
          sessionId: session?.id,
          isFree: true,
          from: 'home',
        },
      });
      return;
    }

    navigate('/paid-remote', {
      state: {
        operator: Operator.RemoteBrowser,
        sessionId: session?.id,
        isFree: false,
        from: 'home',
      },
    });
  };

  /** local click logic start */
  const toLocal = async (operator: Operator, initialInstruction?: string) => {
    const session = await createSession('New Session', {
      operator: operator,
    });

    navigate('/local', {
      state: {
        operator: operator,
        sessionId: session?.id,
        from: 'home',
        initialInstruction: initialInstruction, // 传递初始指令
      },
    });
  };

  const handleExecute = async () => {
    if (!instruction.trim()) {
      return;
    }

    const hasVLM = await checkVLMSettings();

    if (hasVLM) {
      toLocal(operatorType, instruction);
    } else {
      setLocalConfig({ open: true, operator: operatorType });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.nativeEvent.isComposing) {
      return;
    }

    // Enter to submit (without Shift)
    if (e.key === 'Enter' && !e.shiftKey && instruction.trim()) {
      e.preventDefault();
      handleExecute();
    }
  };

  const handleFreeDialogComfirm = async () => {
    if (remoteConfig.operator === Operator.RemoteBrowser) {
      toRemoteBrowser('free');
    } else {
      toRemoteComputer('free');
    }
  };

  const handleRemoteDialogClose = (status: boolean) => {
    setRemoteConfig({ open: status, operator: remoteConfig.operator });
  };

  const handleLocalSettingsSubmit = async () => {
    setLocalConfig({ open: false, operator: localConfig.operator });

    await sleep(200);

    await toLocal(localConfig.operator, instruction);
  };

  const handleLocalSettingsClose = () => {
    setLocalConfig({ open: false, operator: localConfig.operator });
  };
  /** local click logic end */

  return (
    <div className="w-full h-full flex flex-col">
      <DragArea></DragArea>
      <div className="w-full h-full flex flex-col items-center justify-center px-8">
        {/* 标题 */}
        <h1 className="text-2xl font-semibold mb-8">
          欢迎使用 GUI-Agent
        </h1>

        {/* 功能说明卡片 */}
        <div className="flex gap-6 mb-8">
          <Card className="w-[350px] py-4">
            <CardHeader className="px-5 pb-3">
              <CardTitle className="text-lg">Computer Operator</CardTitle>
              <CardDescription className="text-sm">
                 让 AI 帮助您在本地电脑上自动化执行任务，从打开execel到整理文件.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-5">
              <img
                src={computerUseImg}
                alt="Computer Operator"
                className="w-full h-full aspect-video object-fill rounded-lg"
              />
            </CardContent>
          </Card>

          <Card className="w-[350px] py-4">
            <CardHeader className="px-5 pb-3">
              <CardTitle className="text-lg">Browser Operator</CardTitle>
              <CardDescription className="text-sm">
                让 AI 帮助您自动化执行浏览器任务，从页面导航到填写表单.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-5">
              <img
                src={browserUseImg}
                alt="Browser Operator"
                className="w-full h-full aspect-video object-fill rounded-lg"
              />
            </CardContent>
          </Card>
        </div>

        {/* 输入区域 */}
        <div className="w-[730px] flex flex-col gap-3">
          {/* 输入框 */}
          <div className="relative border rounded-2xl bg-white shadow-sm hover:shadow-md transition-shadow">
            <Textarea
              ref={textareaRef}
              placeholder="What can I do for you today?"
              className="min-h-[56px] max-h-[200px] border-0 rounded-2xl resize-none px-4 py-4 pr-14 focus-visible:ring-0 focus-visible:ring-offset-0 leading-relaxed"
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              style={{
                height: 'auto',
                overflow: 'hidden',
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = target.scrollHeight + 'px';
              }}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Button
                size="icon"
                className="h-8 w-8 rounded-lg"
                onClick={handleExecute}
                disabled={!instruction.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* 操作类型选择 - Tab 风格 */}
          <div className="flex items-center gap-2 px-1">
            <button
              onClick={() => setOperatorType(Operator.LocalComputer)}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                ${
                  operatorType === Operator.LocalComputer
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-secondary/50 text-secondary-foreground hover:bg-secondary'
                }
              `}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              Local Computer
            </button>
            <button
              onClick={() => setOperatorType(Operator.LocalBrowser)}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                ${
                  operatorType === Operator.LocalBrowser
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-secondary/50 text-secondary-foreground hover:bg-secondary'
                }
              `}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                />
              </svg>
              Local Browser
            </button>
          </div>
        </div>

        <LocalSettingsDialog
          isOpen={localConfig.open}
          onSubmit={handleLocalSettingsSubmit}
          onClose={handleLocalSettingsClose}
        />
        <FreeTrialDialog
          open={remoteConfig.open}
          onOpenChange={handleRemoteDialogClose}
          onConfirm={handleFreeDialogComfirm}
        />
      </div>
      <DragArea></DragArea>
    </div>
  );
};

export default Home;
