import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TaskList } from '../components/TaskList';
import type { Task } from '../types/task';

const mockTasks: Task[] = [
	{
		id: 1,
		title: 'Première tâche',
		description: 'Description 1',
		completed: false,
		createdAt: '2026-01-15T10:00:00Z',
		updatedAt: '2026-01-15T10:00:00Z',
	},
	{
		id: 2,
		title: 'Deuxième tâche',
		description: null,
		completed: true,
		createdAt: '2026-01-16T10:00:00Z',
		updatedAt: '2026-01-16T10:00:00Z',
	},
];

function renderList(props: Partial<React.ComponentProps<typeof TaskList>> = {}) {
	return render(
		<TaskList
			tasks={props.tasks ?? []}
			loading={props.loading ?? false}
			error={props.error ?? null}
			onToggle={props.onToggle ?? vi.fn()}
			onDelete={props.onDelete ?? vi.fn()}
			onEdit={props.onEdit ?? vi.fn()}
		/>
	);
}

describe('TaskList', () => {
	it('affiche l’état de chargement', () => {
		renderList({ loading: true });
		expect(screen.getByTestId('loading')).toBeInTheDocument();
		expect(screen.getByText('Chargement des tâches...')).toBeInTheDocument();
	});

	it('affiche l’état d’erreur avec le message', () => {
		renderList({ error: 'Réseau indisponible' });
		expect(screen.getByTestId('error')).toBeInTheDocument();
		expect(screen.getByText(/Réseau indisponible/)).toBeInTheDocument();
	});

	it('affiche l’état vide quand il n’y a aucune tâche', () => {
		renderList({ tasks: [] });
		expect(screen.getByTestId('empty')).toBeInTheDocument();
		expect(screen.getByText('Aucune tâche')).toBeInTheDocument();
	});

	it('affiche la liste des tâches', () => {
		renderList({ tasks: mockTasks });
		expect(screen.getByTestId('task-list')).toBeInTheDocument();
		expect(screen.getByText('Première tâche')).toBeInTheDocument();
		expect(screen.getByText('Deuxième tâche')).toBeInTheDocument();
	});

	it('affiche le nombre total de tâches et de tâches terminées', () => {
		renderList({ tasks: mockTasks });
		expect(screen.getByText('2 tâches')).toBeInTheDocument();
		expect(screen.getByText('1 terminée')).toBeInTheDocument();
	});
});
