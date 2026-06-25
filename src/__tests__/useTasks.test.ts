import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// On mocke tout le module d'API
vi.mock('../api/taskApi', () => ({
	getTasks: vi.fn(),
	createTask: vi.fn(),
	updateTask: vi.fn(),
	deleteTask: vi.fn(),
}));

import * as taskApi from '../api/taskApi';
import { useTasks } from '../hooks/useTasks';

const mockTask = {
	id: 1,
	title: 'Test',
	description: null,
	completed: false,
	createdAt: '2026-01-15T10:00:00Z',
	updatedAt: '2026-01-15T10:00:00Z',
};

const mocked = vi.mocked(taskApi);

beforeEach(() => {
	vi.clearAllMocks();
});

describe('useTasks', () => {
	it('loads tasks on mount', async () => {
		mocked.getTasks.mockResolvedValue([mockTask]);

		const { result } = renderHook(() => useTasks());

		await waitFor(() => expect(result.current.loading).toBe(false));
		expect(result.current.tasks).toEqual([mockTask]);
		expect(result.current.error).toBeNull();
	});

	it('sets an error message when loading fails', async () => {
		mocked.getTasks.mockRejectedValue(new Error('Réseau KO'));

		const { result } = renderHook(() => useTasks());

		await waitFor(() => expect(result.current.loading).toBe(false));
		expect(result.current.error).toBe('Réseau KO');
	});

	it('adds a task at the top of the list', async () => {
		mocked.getTasks.mockResolvedValue([]);
		mocked.createTask.mockResolvedValue(mockTask);

		const { result } = renderHook(() => useTasks());
		await waitFor(() => expect(result.current.loading).toBe(false));

		await act(async () => {
			await result.current.addTask({ title: 'Test' });
		});

		expect(result.current.tasks).toEqual([mockTask]);
	});

	it('removes a task', async () => {
		mocked.getTasks.mockResolvedValue([mockTask]);
		mocked.deleteTask.mockResolvedValue(undefined);

		const { result } = renderHook(() => useTasks());
		await waitFor(() => expect(result.current.tasks).toHaveLength(1));

		await act(async () => {
			await result.current.removeTask(1);
		});

		expect(result.current.tasks).toHaveLength(0);
	});

	it('toggles completion of an existing task', async () => {
		mocked.getTasks.mockResolvedValue([mockTask]);
		mocked.updateTask.mockResolvedValue({ ...mockTask, completed: true });

		const { result } = renderHook(() => useTasks());
		await waitFor(() => expect(result.current.tasks).toHaveLength(1));

		await act(async () => {
			await result.current.toggleComplete(1);
		});

		expect(result.current.tasks[0].completed).toBe(true);
		expect(mocked.updateTask).toHaveBeenCalledWith(1, { completed: true });
	});

	it('does nothing when toggling a missing task', async () => {
		mocked.getTasks.mockResolvedValue([mockTask]);

		const { result } = renderHook(() => useTasks());
		await waitFor(() => expect(result.current.tasks).toHaveLength(1));

		await act(async () => {
			await result.current.toggleComplete(999);
		});

		expect(mocked.updateTask).not.toHaveBeenCalled();
	});
});
