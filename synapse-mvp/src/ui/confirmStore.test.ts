import { describe, expect, it, beforeEach } from 'vitest';
import { confirmDestructive, useAppSettings } from '../settings/settingsStore';
import {
  requestConfirm,
  resetConfirmStoreForTests,
  useConfirmStore,
} from './confirmStore';

describe('in-app confirm', () => {
  beforeEach(() => {
    resetConfirmStoreForTests();
  });

  it('resolves true when confirmed', async () => {
    const pending = requestConfirm({
      title: 'Delete this connection?',
      body: 'This cannot be undone.',
    });
    expect(useConfirmStore.getState().current?.title).toBe('Delete this connection?');
    useConfirmStore.getState().close(true);
    await expect(pending).resolves.toBe(true);
    expect(useConfirmStore.getState().current).toBeNull();
  });

  it('resolves false when cancelled, including a replaced request', async () => {
    const first = requestConfirm({ title: 'First', body: 'One' });
    const second = requestConfirm({ title: 'Second', body: 'Two' });
    await expect(first).resolves.toBe(false);
    useConfirmStore.getState().close(false);
    await expect(second).resolves.toBe(false);
  });
});

describe('confirmDestructive', () => {
  beforeEach(() => {
    resetConfirmStoreForTests();
  });

  it('skips the dialog when the setting is off', async () => {
    useAppSettings.getState().updateGeneral({ confirmDestructive: false });
    await expect(confirmDestructive('This removes the line.')).resolves.toBe(true);
    expect(useConfirmStore.getState().current).toBeNull();
  });

  it('opens the in-app dialog when the setting is on', async () => {
    useAppSettings.getState().updateGeneral({ confirmDestructive: true });
    const pending = confirmDestructive('This removes the line.', {
      title: 'Delete this connection?',
    });
    expect(useConfirmStore.getState().current?.title).toBe('Delete this connection?');
    expect(useConfirmStore.getState().current?.body).toBe('This removes the line.');
    useConfirmStore.getState().close(true);
    await expect(pending).resolves.toBe(true);
  });
});
