import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { TaskForm } from '../components/TaskForm';

describe('TaskForm', () => {
	it('renders the create form by default', () => {
		render(<TaskForm onSubmit={vi.fn()} />);
		expect(screen.getByText('Nouvelle tâche')).toBeInTheDocument();
		expect(screen.getByText('Ajouter')).toBeInTheDocument();
	});

	it('shows a validation error when submitting an empty title', async () => {
		const onSubmit = vi.fn();
		render(<TaskForm onSubmit={onSubmit} />);

		await userEvent.click(screen.getByText('Ajouter'));

		expect(screen.getByRole('alert')).toHaveTextContent('Le titre est requis');
		expect(onSubmit).not.toHaveBeenCalled();
	});

	it('submits the trimmed values and clears the fields in create mode', async () => {
		const onSubmit = vi.fn();
		render(<TaskForm onSubmit={onSubmit} />);

		const titleInput = screen.getByLabelText('Titre');
		await userEvent.type(titleInput, '  Ma tâche  ');
		await userEvent.type(screen.getByLabelText('Description'), 'Détails');
		await userEvent.click(screen.getByText('Ajouter'));

		expect(onSubmit).toHaveBeenCalledWith({
			title: 'Ma tâche',
			description: 'Détails',
		});
		// En mode create, le champ titre est réinitialisé
		expect(titleInput).toHaveValue('');
	});

	it('renders the edit mode with initial values and a cancel button', async () => {
		const onCancel = vi.fn();
		render(
			<TaskForm
				onSubmit={vi.fn()}
				onCancel={onCancel}
				mode="edit"
				initialValues={{ title: 'Existant' }}
			/>
		);

		expect(screen.getByText('Modifier la tâche')).toBeInTheDocument();
		expect(screen.getByLabelText('Titre')).toHaveValue('Existant');

		await userEvent.click(screen.getByText('Annuler'));
		expect(onCancel).toHaveBeenCalled();
	});
});
