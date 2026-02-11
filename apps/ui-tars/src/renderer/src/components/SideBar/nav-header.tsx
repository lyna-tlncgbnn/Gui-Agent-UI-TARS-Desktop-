/**
 * Copyright (c) 2025 Bytedance, Inc. and its affiliates.
 * SPDX-License-Identifier: Apache-2.0
 */
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarTrigger,
  useSidebar,
} from '@renderer/components/ui/sidebar';

import logoVector from '@resources/logo-vector.png?url';

export function UITarsHeader() {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  return (
    <SidebarMenu className="items-center">
      <div className="flex items-center justify-between w-full px-2 py-2">
        {/* Logo 区域 - 折叠时隐藏 */}
        {!isCollapsed && (
          <SidebarMenuButton className="flex-1 hover:bg-transparent p-0">
            <div className="flex items-center gap-2">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg">
                <img src={logoVector} alt="" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">UI-TARS</span>
                <span className="truncate text-xs pb-[1px]">Playground</span>
              </div>
            </div>
          </SidebarMenuButton>
        )}

        {/* 切换按钮 - 始终显示 */}
        <SidebarTrigger
          className={`
            h-8 w-8 shrink-0
            ${isCollapsed ? 'mx-auto' : 'ml-auto'}
          `}
        />
      </div>
    </SidebarMenu>
  );
}
