import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from '../App';

const tasks = [
	{
		id: 1,
		title: 'Tâche A',
		description: null,
		completed: true,
		createdAt: '2026-01-15T10:00:00Z',
		updatedAt: '2026-01-15T10:00:00Z',
	},
	{
		id: 2,
		title: 'Tâche B',
		description: null,
		completed: false,
		createdAt: '2026-01-16T10:00:00Z',
		updatedAt: '2026-01-16T10:00:00Z',
	},
];

beforeEach(() => {
	vi.restoreAllMocks();
	vi.stubGlobal(
		'fetch',
		vi.fn().mockResolvedValue({
			ok: true,
			status: 200,
			json: () => Promise.resolve(tasks),
			text: () => Promise.resolve(''),
		})
	);
});

describe('App', () => {
	it('renders the header and the loaded tasks', async () => {
		render(<App />);

		expect(screen.getByText('Mes Tâches')).toBeInTheDocument();

		// Les tâches chargées apparaissent
		await waitFor(() =>
			expect(screen.getByText('Tâche A')).toBeInTheDocument()
		);

		// L'en-tête de stats s'affiche dès qu'il y a des tâches
		expect(screen.getByText('Total')).toBeInTheDocument();
		expect(screen.getByText('Terminées')).toBeInTheDocument();
	});
});
