/**
 * Copyright (c) 2025 Bytedance, Inc. and its affiliates.
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState } from 'react';
import {
  MoreHorizontal,
  Trash2,
  History,
  Laptop,
  Compass,
  Edit3,
  Settings2,
} from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@renderer/components/ui/dropdown-menu';
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@renderer/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@renderer/components/ui/collapsible';
import { SessionItem } from '@renderer/db/session';
import { ShareOptions } from './share';

import { Operator } from '@main/store/types';
import { DeleteSessionDialog } from '@renderer/components/AlertDialog/delSessionDialog';
import { RenameSessionDialog } from '@renderer/components/AlertDialog/renameSessionDialog';
import { BatchManageDialog } from '@renderer/components/AlertDialog/batchManageDialog';

const getIcon = (operator: Operator, isActive: boolean) => {
  const isRemote =
    operator === Operator.RemoteComputer || operator === Operator.RemoteBrowser;
  const isComputer =
    operator === Operator.LocalComputer || operator === Operator.RemoteComputer;

  const MainIcon = isComputer ? Laptop : Compass;

  return (
    <div className="relative flex items-center gap-1">
      <MainIcon className="w-4 h-4" />
      <div
        className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full text-[6px] flex items-center justify-center font-bold leading-none bg-white border border-gray-500 ${isActive ? 'text-neutral-700 border-neutral-700' : 'text-neutral-500 border-neutral-500'}`}
      >
        {isRemote ? 'R' : 'L'}
      </div>
    </div>
  );
};

export function NavHistory({
  currentSessionId,
  history,
  onSessionClick,
  onSessionDelete,
  onSessionRename,
}: {
  currentSessionId: string;
  history: SessionItem[];
  onSessionClick: (id: string) => void;
  onSessionDelete: (id: string) => void;
  onSessionRename?: (id: string, newName: string) => void;
}) {
  const [isShareConfirmOpen, setIsShareConfirmOpen] = useState(false);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [isBatchManageOpen, setIsBatchManageOpen] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [selectedSessionName, setSelectedSessionName] = useState('');
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);
  const { setOpen, state } = useSidebar();

  const handleDelete = (id: string) => {
    setSelectedSessionId(id);
    setIsShareConfirmOpen(true);
  };

  const handleRename = (id: string, currentName: string) => {
    setSelectedSessionId(id);
    setSelectedSessionName(currentName);
    setIsRenameDialogOpen(true);
  };

  const handleRenameConfirm = (newName: string) => {
    if (onSessionRename && selectedSessionId) {
      onSessionRename(selectedSessionId, newName);
    }
    setIsRenameDialogOpen(false);
    setSelectedSessionId('');
    setSelectedSessionName('');
  };

  const handleDeleteConfirm = () => {
    if (selectedSessionId) {
      onSessionDelete(selectedSessionId);
    }
    setIsShareConfirmOpen(false);
    setSelectedSessionId('');
  };

  const handleBatchDelete = (sessionIds: string[]) => {
    sessionIds.forEach(id => onSessionDelete(id));
  };

  const handleHistory = () => {
    if (state === 'collapsed') {
      setOpen(true);
      setTimeout(() => {
        setIsHistoryOpen(true);
      }, 10);
    }
  };

  return (
    <>
      <SidebarGroup>
        <SidebarMenu className="items-center">
          <Collapsible
            key={'History'}
            asChild
            open={isHistoryOpen}
            onOpenChange={setIsHistoryOpen}
            className="group/collapsible"
          >
            <SidebarMenuItem className="w-full flex flex-col items-center">
              <div className="w-full flex items-center justify-between">
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    className="!pr-2 font-medium flex-1"
                    onClick={handleHistory}
                  >
                    <History strokeWidth={2} />
                    <span>最近对话</span>
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <button
                  className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                  onClick={() => setIsBatchManageOpen(true)}
                  title="管理对话记录"
                >
                  <Settings2 className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              <CollapsibleContent className="w-full">
                <SidebarMenuSub className="!mr-0 !pr-1">
                  {history.map((item) => (
                    <SidebarMenuSubItem key={item.id} className="group/item">
                      <SidebarMenuSubButton
                        className={`hover:bg-neutral-100 hover:text-neutral-600 py-5 cursor-pointer ${item.id === currentSessionId ? 'text-neutral-700 bg-white hover:bg-white' : 'text-neutral-500'}`}
                        onClick={() => onSessionClick(item.id)}
                      >
                        {getIcon(
                          item.meta.operator,
                          item.id === currentSessionId,
                        )}
                        <span className="max-w-38">{item.name}</span>
                      </SidebarMenuSubButton>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <SidebarMenuAction className="invisible group-hover/item:visible [&[data-state=open]]:visible mt-1">
                            <MoreHorizontal />
                            <span className="sr-only">More</span>
                          </SidebarMenuAction>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          className="rounded-lg"
                          side={'right'}
                          align={'start'}
                        >
                          <ShareOptions sessionId={item.id} />
                          <DropdownMenuItem
                            onClick={() => handleRename(item.id, item.name)}
                          >
                            <Edit3 />
                            <span>Rename</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-400 focus:bg-red-50 focus:text-red-500"
                            onClick={() => handleDelete(item.id)}
                          >
                            <Trash2 className="text-red-400" />
                            <span>Delete</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        </SidebarMenu>
      </SidebarGroup>
      <DeleteSessionDialog
        open={isShareConfirmOpen}
        onOpenChange={setIsShareConfirmOpen}
        onConfirm={handleDeleteConfirm}
      />
      <RenameSessionDialog
        open={isRenameDialogOpen}
        onOpenChange={setIsRenameDialogOpen}
        onConfirm={handleRenameConfirm}
        currentName={selectedSessionName}
      />
      <BatchManageDialog
        open={isBatchManageOpen}
        onOpenChange={setIsBatchManageOpen}
        history={history}
        onBatchDelete={handleBatchDelete}
      />
    </>
  );
}
