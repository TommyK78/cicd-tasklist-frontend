import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { TaskItem } from '../components/TaskItem';
import type { Task } from '../types/task';

const task: Task = {
	id: 1,
	title: 'Ma tâche',
	description: 'Une description',
	completed: false,
	createdAt: '2026-01-15T10:00:00Z',
	updatedAt: '2026-01-15T10:00:00Z',
};

describe('TaskItem', () => {
	it('renders the task title and description', () => {
		render(
			<TaskItem task={task} onToggle={vi.fn()} onDelete={vi.fn()} onEdit={vi.fn()} />
		);
		expect(screen.getByText('Ma tâche')).toBeInTheDocument();
		expect(screen.getByText('Une description')).toBeInTheDocument();
	});

	it('calls onToggle when the checkbox is clicked', async () => {
		const onToggle = vi.fn();
		render(
			<TaskItem task={task} onToggle={onToggle} onDelete={vi.fn()} onEdit={vi.fn()} />
		);

		await userEvent.click(screen.getByRole('checkbox'));
		expect(onToggle).toHaveBeenCalledWith(1);
	});

	it('switches to edit mode and saves the changes', async () => {
		const onEdit = vi.fn();
		render(
			<TaskItem task={task} onToggle={vi.fn()} onDelete={vi.fn()} onEdit={onEdit} />
		);

		await userEvent.click(screen.getByLabelText('Modifier'));
		const input = screen.getByLabelText('Modifier le titre');
		await userEvent.clear(input);
		await userEvent.type(input, 'Titre modifié');
		await userEvent.click(screen.getByText('Enregistrer'));

		expect(onEdit).toHaveBeenCalledWith(1, {
			title: 'Titre modifié',
			description: 'Une description',
		});
	});

	it('cancels edit mode without saving', async () => {
		const onEdit = vi.fn();
		render(
			<TaskItem task={task} onToggle={vi.fn()} onDelete={vi.fn()} onEdit={onEdit} />
		);

		await userEvent.click(screen.getByLabelText('Modifier'));
		await userEvent.click(screen.getByText('Annuler'));

		expect(onEdit).not.toHaveBeenCalled();
		// On est revenu en mode lecture
		expect(screen.getByText('Ma tâche')).toBeInTheDocument();
	});

	it('requires a second click to confirm deletion', async () => {
		const onDelete = vi.fn();
		render(
			<TaskItem task={task} onToggle={vi.fn()} onDelete={onDelete} onEdit={vi.fn()} />
		);

		const deleteBtn = screen.getByLabelText('Supprimer');
		// 1er clic : demande confirmation, ne supprime pas
		await userEvent.click(deleteBtn);
		expect(onDelete).not.toHaveBeenCalled();
		// 2e clic : confirme la suppression
		await userEvent.click(deleteBtn);
		expect(onDelete).toHaveBeenCalledWith(1);
	});
});
