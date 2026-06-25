import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
	getTasks,
	getTask,
	createTask,
	updateTask,
	deleteTask,
} from '../api/taskApi';

const mockTask = {
	id: 1,
	title: 'Test',
	description: null,
	completed: false,
	createdAt: '2026-01-15T10:00:00Z',
	updatedAt: '2026-01-15T10:00:00Z',
};

// Petit utilitaire pour fabriquer une fausse réponse fetch
function mockFetch(response: { ok?: boolean; status?: number; jsonData?: unknown }) {
	vi.stubGlobal(
		'fetch',
		vi.fn().mockResolvedValue({
			ok: response.ok ?? true,
			status: response.status ?? 200,
			json: () => Promise.resolve(response.jsonData),
			text: () => Promise.resolve('error body'),
		})
	);
}

beforeEach(() => {
	vi.restoreAllMocks();
});

describe('taskApi', () => {
	it('getTasks returns array', async () => {
		mockFetch({ ok: true, jsonData: [mockTask] });

		const tasks = await getTasks();

		expect(tasks).toEqual([mockTask]);
		expect(fetch).toHaveBeenCalledWith('/api/tasks');
	});

	it('getTasks throws on HTTP error', async () => {
		mockFetch({ ok: false, status: 500 });

		await expect(getTasks()).rejects.toThrow('HTTP 500');
	});

	it('getTask returns a single task', async () => {
		mockFetch({ ok: true, jsonData: mockTask });

		const task = await getTask(1);

		expect(task).toEqual(mockTask);
		expect(fetch).toHaveBeenCalledWith('/api/tasks/1');
	});

	it('createTask sends a POST and returns the task', async () => {
		mockFetch({ ok: true, jsonData: mockTask });

		const task = await createTask({ title: 'Test' });

		expect(task).toEqual(mockTask);
		expect(fetch).toHaveBeenCalledWith(
			'/api/tasks',
			expect.objectContaining({ method: 'POST' })
		);
	});

	it('updateTask sends a PUT and returns the task', async () => {
		mockFetch({ ok: true, jsonData: { ...mockTask, completed: true } });

		const task = await updateTask(1, { completed: true });

		expect(task.completed).toBe(true);
		expect(fetch).toHaveBeenCalledWith(
			'/api/tasks/1',
			expect.objectContaining({ method: 'PUT' })
		);
	});

	it('deleteTask sends a DELETE', async () => {
		mockFetch({ ok: true });

		await expect(deleteTask(1)).resolves.toBeUndefined();
		expect(fetch).toHaveBeenCalledWith(
			'/api/tasks/1',
			expect.objectContaining({ method: 'DELETE' })
		);
	});

	it('deleteTask throws on HTTP error', async () => {
		mockFetch({ ok: false, status: 404 });

		await expect(deleteTask(1)).rejects.toThrow('HTTP 404');
	});
});
