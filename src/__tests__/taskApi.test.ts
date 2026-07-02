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

function mockFetchOnce(body: unknown, ok = true, status = 200) {
	vi.stubGlobal(
		'fetch',
		vi.fn().mockResolvedValue({
			ok,
			status,
			json: () => Promise.resolve(body),
			text: () => Promise.resolve(typeof body === 'string' ? body : JSON.stringify(body)),
		})
	);
}

beforeEach(() => {
	vi.restoreAllMocks();
});

describe('taskApi', () => {
	describe('getTasks', () => {
		it('retourne le tableau de tâches', async () => {
			mockFetchOnce([mockTask]);

			const tasks = await getTasks();

			expect(tasks).toEqual([mockTask]);
			expect(fetch).toHaveBeenCalledWith('/api/tasks');
		});

		it('lève une erreur si la réponse HTTP est en échec', async () => {
			mockFetchOnce('Internal error', false, 500);

			await expect(getTasks()).rejects.toThrow('HTTP 500');
		});
	});

	describe('getTask', () => {
		it('appelle le bon endpoint avec l’identifiant', async () => {
			mockFetchOnce(mockTask);

			const task = await getTask(1);

			expect(task).toEqual(mockTask);
			expect(fetch).toHaveBeenCalledWith('/api/tasks/1');
		});
	});

	describe('createTask', () => {
		it('envoie une requête POST avec le bon corps', async () => {
			mockFetchOnce(mockTask);

			const task = await createTask({ title: 'Test' });

			expect(task).toEqual(mockTask);
			expect(fetch).toHaveBeenCalledWith('/api/tasks', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ title: 'Test' }),
			});
		});

		it('propage l’erreur HTTP', async () => {
			mockFetchOnce('Bad request', false, 400);

			await expect(createTask({ title: '' })).rejects.toThrow('HTTP 400');
		});
	});

	describe('updateTask', () => {
		it('envoie une requête PUT avec le bon corps', async () => {
			const updated = { ...mockTask, completed: true };
			mockFetchOnce(updated);

			const task = await updateTask(1, { completed: true });

			expect(task).toEqual(updated);
			expect(fetch).toHaveBeenCalledWith('/api/tasks/1', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ completed: true }),
			});
		});
	});

	describe('deleteTask', () => {
		it('envoie une requête DELETE et se termine sans erreur', async () => {
			mockFetchOnce(null, true, 204);

			await expect(deleteTask(1)).resolves.toBeUndefined();
			expect(fetch).toHaveBeenCalledWith('/api/tasks/1', { method: 'DELETE' });
		});

		it('lève une erreur si la suppression échoue', async () => {
			mockFetchOnce('Not found', false, 404);

			await expect(deleteTask(999)).rejects.toThrow('HTTP 404');
		});
	});
});
