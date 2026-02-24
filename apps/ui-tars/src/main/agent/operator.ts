/*
 * Copyright (c) 2025 Bytedance, Inc. and its affiliates.
 * SPDX-License-Identifier: Apache-2.0
 */
import { Key, keyboard } from '@computer-use/nut-js';
import {
  type ScreenshotOutput,
  type ExecuteParams,
  type ExecuteOutput,
} from '@ui-tars/sdk/core';
import { NutJSOperator } from '@ui-tars/operator-nut-js';
import { clipboard } from 'electron';
import { desktopCapturer } from 'electron';

import * as env from '@main/env';
import { logger } from '@main/logger';
import { sleep } from '@ui-tars/shared/utils';
import { getScreenSize } from '@main/utils/screen';

export class NutJSElectronOperator extends NutJSOperator {
  static MANUAL = {
    ACTION_SPACES: [
      `click(start_box='[x1, y1, x2, y2]')`,
      `left_double(start_box='[x1, y1, x2, y2]')`,
      `right_single(start_box='[x1, y1, x2, y2]')`,
      `drag(start_box='[x1, y1, x2, y2]', end_box='[x3, y3, x4, y4]')`,
      `hotkey(key='')`,
      `type(content='') #If you want to submit your input, use "\\n" at the end of \`content\`.`,
      `scroll(start_box='[x1, y1, x2, y2]', direction='down or up or right or left')`,
      `wait() #Sleep for 5s and take a screenshot to check for any changes.`,
      `finished()`,
      `call_user() # Submit the task and call the user when the task is unsolvable, or when you need the user's help.`,
    ],
  };

  public async screenshot(): Promise<ScreenshotOutput> {
    const {
      physicalSize,
      logicalSize,
      scaleFactor,
      id: primaryDisplayId,
    } = getScreenSize(); // Logical = Physical / scaleX

    logger.info(
      '[screenshot] [primaryDisplay]',
      'logicalSize:',
      logicalSize,
      'scaleFactor:',
      scaleFactor,
    );

    // 优化前的代码（已废弃）：
    // 问题：先让 Electron 缩小到逻辑分辨率（1500x1000），然后再放大回物理分辨率（3000x2000）
    // 这导致了两次不必要的缩放操作，严重影响性能且降低图片质量
    // const sources = await desktopCapturer.getSources({
    //   types: ['screen'],
    //   thumbnailSize: {
    //     width: Math.round(logicalSize.width),   // 1500 - 要求生成逻辑分辨率的缩略图
    //     height: Math.round(logicalSize.height), // 1000
    //   },
    // });
    // const screenshot = primarySource.thumbnail;
    // const resized = screenshot.resize({
    //   width: physicalSize.width,   // 3000 - 又放大回物理分辨率
    //   height: physicalSize.height, // 2000
    // });

    // 优化后的代码：直接使用物理分辨率，避免任何缩放操作
    // thumbnailSize 设置为物理分辨率（3000x2000），Electron 直接捕获原始尺寸
    // 这样可以：
    // 1. 省掉 Electron 内部的缩小操作
    // 2. 省掉代码中的放大操作
    // 3. 保持最佳图片质量
    // 4. 显著提升截图速度（预计提升 50-75%）
    const getSourcesStart = Date.now();
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: {
        width: physicalSize.width,   // 3000 - 直接要求物理分辨率
        height: physicalSize.height, // 2000
      },
    });
    const getSourcesTime = Date.now() - getSourcesStart;
    logger.info(`[screenshot] getSources time: ${getSourcesTime}ms`);

    const primarySource =
      sources.find(
        (source) => source.display_id === primaryDisplayId.toString(),
      ) || sources[0];

    if (!primarySource) {
      logger.error('[screenshot] Primary display source not found', {
        primaryDisplayId,
        availableSources: sources.map((s) => s.display_id),
      });
      // fallback to default screenshot
      return await super.screenshot();
    }

    const screenshot = primarySource.thumbnail;

    // 不再需要 resize 操作，直接使用原始截图
    // const resized = screenshot.resize({
    //   width: physicalSize.width,
    //   height: physicalSize.height,
    // });

    const encodeStart = Date.now();
    const base64 = screenshot.toJPEG(75).toString('base64');
    const encodeTime = Date.now() - encodeStart;
    logger.info(`[screenshot] JPEG encode time: ${encodeTime}ms`);

    return {
      base64,
      scaleFactor,
      width: logicalSize.width,   // 返回逻辑分辨率供 AI 模型使用
      height: logicalSize.height,
      mime: 'image/jpeg',
    };
  }

  async execute(params: ExecuteParams): Promise<ExecuteOutput> {
    const { action_type, action_inputs } = params.parsedPrediction;

    if (action_type === 'type' && env.isWindows && action_inputs?.content) {
      const content = action_inputs.content?.trim();

      logger.info('[device] type', content);
      const stripContent = content.replace(/\\n$/, '').replace(/\n$/, '');
      const originalClipboard = clipboard.readText();
      clipboard.writeText(stripContent);
      await keyboard.pressKey(Key.LeftControl, Key.V);
      await sleep(50);
      await keyboard.releaseKey(Key.LeftControl, Key.V);
      await sleep(50);
      clipboard.writeText(originalClipboard);
    } else {
      return await super.execute(params);
    }
  }
}
