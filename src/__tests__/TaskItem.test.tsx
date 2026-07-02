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
	it('affiche le titre et la description de la tâche', () => {
		render(<TaskItem task={task} onToggle={vi.fn()} onDelete={vi.fn()} onEdit={vi.fn()} />);
		expect(screen.getByText('Ma tâche')).toBeInTheDocument();
		expect(screen.getByText('Une description')).toBeInTheDocument();
	});

	it('appelle onToggle au clic sur la case à cocher', async () => {
		const user = userEvent.setup();
		const onToggle = vi.fn();
		render(<TaskItem task={task} onToggle={onToggle} onDelete={vi.fn()} onEdit={vi.fn()} />);

		await user.click(screen.getByRole('checkbox'));
		expect(onToggle).toHaveBeenCalledWith(1);
	});

	it('passe en mode édition et enregistre les modifications', async () => {
		const user = userEvent.setup();
		const onEdit = vi.fn();
		render(<TaskItem task={task} onToggle={vi.fn()} onDelete={vi.fn()} onEdit={onEdit} />);

		await user.click(screen.getByRole('button', { name: 'Modifier' }));
		const input = screen.getByLabelText('Modifier le titre');
		await user.clear(input);
		await user.type(input, 'Titre modifié');
		await user.click(screen.getByRole('button', { name: 'Enregistrer' }));

		expect(onEdit).toHaveBeenCalledWith(1, {
			title: 'Titre modifié',
			description: 'Une description',
		});
	});

	it('demande une confirmation avant de supprimer (double clic)', async () => {
		const user = userEvent.setup();
		const onDelete = vi.fn();
		render(<TaskItem task={task} onToggle={vi.fn()} onDelete={onDelete} onEdit={vi.fn()} />);

		const deleteBtn = screen.getByRole('button', { name: 'Supprimer' });
		// Premier clic : demande de confirmation, pas de suppression.
		await user.click(deleteBtn);
		expect(onDelete).not.toHaveBeenCalled();
		// Second clic : suppression confirmée.
		await user.click(deleteBtn);
		expect(onDelete).toHaveBeenCalledWith(1);
	});
});
