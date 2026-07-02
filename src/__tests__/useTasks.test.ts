import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTasks } from '../hooks/useTasks';
import * as taskApi from '../api/taskApi';
import type { Task } from '../types/task';

// On mock la couche API pour tester la logique d'état du hook sans réseau.
vi.mock('../api/taskApi');

const mockedApi = vi.mocked(taskApi);

const task1: Task = {
	id: 1,
	title: 'Tâche 1',
	description: null,
	completed: false,
	createdAt: '2026-01-15T10:00:00Z',
	updatedAt: '2026-01-15T10:00:00Z',
};

describe('useTasks', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockedApi.getTasks.mockResolvedValue([task1]);
	});

	it('charge les tâches au montage', async () => {
		const { result } = renderHook(() => useTasks());

		await waitFor(() => expect(result.current.loading).toBe(false));
		expect(result.current.tasks).toEqual([task1]);
		expect(result.current.error).toBeNull();
	});

	it('gère une erreur de chargement', async () => {
		mockedApi.getTasks.mockRejectedValueOnce(new Error('Réseau KO'));
		const { result } = renderHook(() => useTasks());

		await waitFor(() => expect(result.current.loading).toBe(false));
		expect(result.current.error).toBe('Réseau KO');
	});

	it('ajoute une tâche en tête de liste', async () => {
		const task2: Task = { ...task1, id: 2, title: 'Tâche 2' };
		mockedApi.createTask.mockResolvedValue(task2);
		const { result } = renderHook(() => useTasks());
		await waitFor(() => expect(result.current.loading).toBe(false));

		await act(async () => {
			await result.current.addTask({ title: 'Tâche 2' });
		});

		expect(result.current.tasks[0]).toEqual(task2);
		expect(result.current.tasks).toHaveLength(2);
	});

	it('met à jour une tâche existante', async () => {
		const updated = { ...task1, completed: true };
		mockedApi.updateTask.mockResolvedValue(updated);
		const { result } = renderHook(() => useTasks());
		await waitFor(() => expect(result.current.loading).toBe(false));

		await act(async () => {
			await result.current.editTask(1, { completed: true });
		});

		expect(result.current.tasks[0].completed).toBe(true);
	});

	it('supprime une tâche', async () => {
		mockedApi.deleteTask.mockResolvedValue(undefined);
		const { result } = renderHook(() => useTasks());
		await waitFor(() => expect(result.current.loading).toBe(false));

		await act(async () => {
			await result.current.removeTask(1);
		});

		expect(result.current.tasks).toHaveLength(0);
	});

	it('bascule l’état "terminé" d’une tâche', async () => {
		const updated = { ...task1, completed: true };
		mockedApi.updateTask.mockResolvedValue(updated);
		const { result } = renderHook(() => useTasks());
		await waitFor(() => expect(result.current.loading).toBe(false));

		await act(async () => {
			await result.current.toggleComplete(1);
		});

		expect(mockedApi.updateTask).toHaveBeenCalledWith(1, { completed: true });
		expect(result.current.tasks[0].completed).toBe(true);
	});
});
