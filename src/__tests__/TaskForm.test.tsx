import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { TaskForm } from '../components/TaskForm';

describe('TaskForm', () => {
	it('affiche le titre "Nouvelle tâche" en mode création', () => {
		render(<TaskForm onSubmit={vi.fn()} />);
		expect(screen.getByText('Nouvelle tâche')).toBeInTheDocument();
	});

	it('affiche une erreur de validation si le titre est vide', async () => {
		const user = userEvent.setup();
		const onSubmit = vi.fn();
		render(<TaskForm onSubmit={onSubmit} />);

		await user.click(screen.getByRole('button', { name: 'Ajouter' }));

		expect(screen.getByRole('alert')).toHaveTextContent('Le titre est requis');
		expect(onSubmit).not.toHaveBeenCalled();
	});

	it('soumet le titre et la description nettoyés puis réinitialise le formulaire', async () => {
		const user = userEvent.setup();
		const onSubmit = vi.fn();
		render(<TaskForm onSubmit={onSubmit} />);

		const titleInput = screen.getByLabelText('Titre') as HTMLInputElement;
		const descInput = screen.getByLabelText('Description') as HTMLTextAreaElement;

		await user.type(titleInput, '  Ma tâche  ');
		await user.type(descInput, '  Ma description  ');
		await user.click(screen.getByRole('button', { name: 'Ajouter' }));

		expect(onSubmit).toHaveBeenCalledWith({
			title: 'Ma tâche',
			description: 'Ma description',
		});
		// En mode "create", le formulaire est réinitialisé après soumission.
		expect(titleInput.value).toBe('');
		expect(descInput.value).toBe('');
	});

	it('affiche le bouton "Modifier" et un bouton "Annuler" en mode édition', async () => {
		const user = userEvent.setup();
		const onCancel = vi.fn();
		render(
			<TaskForm
				mode="edit"
				onSubmit={vi.fn()}
				onCancel={onCancel}
				initialValues={{ title: 'Existant', description: 'Desc' }}
			/>
		);

		expect(screen.getByText('Modifier la tâche')).toBeInTheDocument();
		expect((screen.getByLabelText('Titre') as HTMLInputElement).value).toBe('Existant');

		await user.click(screen.getByRole('button', { name: 'Annuler' }));
		expect(onCancel).toHaveBeenCalled();
	});
});
